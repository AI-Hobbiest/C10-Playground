(() => {
"use strict";
const SUBJECTS = {
  science: { title:"Science", icon:"🧪", subtitle:"Explore biology, chemistry and physics through concept checks, explanations and exam-style practice." },
  "science-sof": { title:"Science - SOF", icon:"🏆", subtitle:"Class 6 SOF National Science Olympiad (NSO) practice with original science and reasoning questions." },
  mathematics: { title:"Mathematics", icon:"📐", subtitle:"Reason it out, work step by step, and use each mistake to sharpen the method." },
  "mathematics-sof": { title:"Mathematics - SOF", icon:"🏆", subtitle:"Class 6 SOF International Mathematics Olympiad (IMO) practice with original reasoning-focused questions." },
  english: { title:"English", icon:"📚", subtitle:"Practise reading, grammar and original questions about the prescribed literature." },
  "english-sof": { title:"English - SOF", icon:"🏆", subtitle:"Class 6 SOF International English Olympiad (IEO) practice across vocabulary, grammar, reading and verbal ability." },
  "social-science": { title:"Social Science", icon:"🌍", subtitle:"Connect historical evidence, geography, democratic ideas and economic choices." },
  hindi: { title:"Hindi · Course A / Course B", icon:"📝", subtitle:"Core grammar, comprehension, and starter literature practice. Choose the course that matches your school." }
};
const $ = id => document.getElementById(id);
const subject = new URLSearchParams(location.search).get("subject") || "mathematics";
function readActiveStudent(){
  try{
    if(window.C10StudentAuth&&window.C10StudentAuth.currentUser){
      const student=window.C10StudentAuth.currentUser();
      if(student&&student.classId)return student;
    }
    const saved=JSON.parse(sessionStorage.getItem("c10playground_static_student_v1")||"null");
    return saved&&typeof saved.username==="string"?{username:saved.username,classId:String(saved.classId||"10")}:null;
  }catch(_){return null;}
}
const activeStudent = readActiveStudent();
const classId = String(activeStudent && activeStudent.classId || "10");
const bankId = classId === "10" ? subject : "class-" + classId + "-" + subject;
const CLASS_SUBJECTS = { "3":["mathematics"], "6":["science","science-sof","mathematics","mathematics-sof","english","english-sof","social-science"], "10":["science","mathematics","english","social-science","hindi"] };
const config = SUBJECTS[subject];
let chapters=[], mode="learn", session=[], index=0, picked=null, answers=[], lastMissed=[];
let currentAttempt=null, completedAttempt=null, clockHandle=null, ledger;
const emptyProgress = () => ({missed:[],answered:0,correct:0,attempts:[]});
const validProgress = value => !!value && Array.isArray(value.missed) &&
  Number.isFinite(value.answered) && Number.isFinite(value.correct) && Array.isArray(value.attempts);
const progressStore = window.C10Storage.createLocalStore({
  kind:"subject-progress", recordId:bankId, legacyKey:classId === "10" ? "c10playground_v1_"+subject : bankId,
  defaults:emptyProgress, validate:validProgress
});
let progress={...emptyProgress(),...progressStore.load()};
const emptyLedger = () => ({attempts:[],activeAttempt:null,answerRecords:[]});
const validLedger = value => !!value && Array.isArray(value.attempts) &&
  Array.isArray(value.answerRecords) && (value.activeAttempt===null || typeof value.activeAttempt==="object");
const ledgerStore = window.C10Storage.createLocalStore({
  kind:"test-attempt-ledger", recordId:bankId, defaults:emptyLedger, validate:validLedger
});
ledger={...emptyLedger(),...ledgerStore.load()};
const profileStore = window.C10Storage.createLocalStore({
  kind:"local-profile-identity", recordId:"default",
  defaults:()=>({profileId:""}), validate:value=>!!value && typeof value.profileId==="string"
});
let localProfile=profileStore.load();
if(!localProfile.profileId){localProfile.profileId=window.C10Storage.createId();profileStore.save(localProfile);}
const shuffle = array => {
  const copy=[...array];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
};
const keyFor = question => window.C10QuestionBank.keyFor(question,bankId);
const clone = value => JSON.parse(JSON.stringify(value));
function show(id){
  ["welcome","session","results","review"].forEach(name=>$(name).classList.toggle("hide",name!==id));
  const quizActive=["session","results","review"].includes(id),layout=$("practiceLayout");
  if(layout)layout.classList.toggle("quiz-active",quizActive);
  const dock=$("questionNavDock");if(dock)dock.classList.toggle("hide",id!=="session");
  if(id!=="session")closeQuestionNavigator();
  if(quizActive&&window.matchMedia&&window.matchMedia("(max-width: 760px)").matches){
    const panel=$("quizPanel");if(panel&&typeof panel.scrollIntoView==="function")panel.scrollIntoView({behavior:"smooth",block:"start"});
  }
}
function setText(id,value){$(id).textContent=String(value);}
function updateStats(){
  const total=progress.answered,accuracy=total?Math.round(progress.correct/total*100):0;
  setText("overallStat",accuracy+"%");
  setText("progressText",total+" answers recorded on this device · "+progress.correct+" correct · "+progress.missed.length+" questions in your retry list.");
}
function allQuestions(){return chapters.flatMap(chapter=>chapter.questions.map(question=>({...question,chapter_no:chapter.chapter_no,chapterTitle:chapter.title})));}
function selectedChapterIndexes(){const select=$("chapter");if(!select.options)return chapters.map((_,i)=>i);return Array.from(select.selectedOptions||[]).map(option=>Number(option.value)).filter(Number.isInteger);}
function selectedChapters(){return selectedChapterIndexes().map(i=>chapters[i]).filter(Boolean);}
function updateChapterPickerSummary(){
  const chosen=selectedChapterIndexes(),count=chosen.reduce((sum,i)=>sum+(chapters[i]?chapters[i].questions.length:0),0);
  const summary=$("chapterPickerSummary"),detail=$("chapterPickerCount");
  if(summary)summary.textContent=!chosen.length?"No chapters selected":chosen.length===chapters.length?"All chapters selected":chosen.length+" chapter"+(chosen.length===1?"":"s")+" selected";
  if(detail)detail.textContent=count+" question"+(count===1?"":"s")+" available";
}
function syncChapterPickerFromSelect(){
  const select=$("chapter");
  document.querySelectorAll("[data-chapter-index]").forEach(input=>{input.checked=Array.from(select.options).some(option=>Number(option.value)===Number(input.dataset.chapterIndex)&&option.selected);});
  updateChapterPickerSummary();
}
function escapeHtml(value){const node=document.createElement("span");node.textContent=String(value);return node.innerHTML;}
function renderChapterPicker(){
  const select=$("chapter"),container=$("chapterOptions");if(!container)return;
  container.innerHTML=chapters.map((chapter,i)=>`<label class='chapter-option'><input type='checkbox' data-chapter-index='${i}' checked><span class='chapter-option-copy'><span class='chapter-option-title'>${String(chapter.chapter_no).padStart(2,"0")} · ${escapeHtml(chapter.title)}</span><span class='chapter-option-meta'>${chapter.questions.length} questions</span></span></label>`).join("");
  container.querySelectorAll("[data-chapter-index]").forEach(input=>input.addEventListener("change",()=>{
    const index=Number(input.dataset.chapterIndex),option=Array.from(select.options).find(item=>Number(item.value)===index);if(option)option.selected=input.checked;
    updateChapterPickerSummary();const chosen=selectedChapters(),count=chosen.reduce((sum,item)=>sum+item.questions.length,0);
    setText("modeHint",count+" questions available across "+chosen.length+" selected chapter"+(chosen.length===1?"":"s")+".");
  }));updateChapterPickerSummary();
}
function saveProgress(){progressStore.save(progress);updateStats();}
function compactLedgerForStorage(value){
  const stored=clone(value);
  const active=stored.activeAttempt;
  if(active&&Array.isArray(active.questions)){
    active.questions=active.questions.map(question=>{
      const snapshot={...question};
      if(Array.isArray(snapshot.images)){
        snapshot.images=snapshot.images.map(image=>{
          if(image&&typeof image.src==="string"&&/^data:image\//i.test(image.src)){
            const {src,...metadata}=image;
            return {...metadata,sourceInQuestionBank:true};
          }
          return image;
        });
      }
      return snapshot;
    });
  }
  return stored;
}
function restoreQuestionBankImages(questions){
  const byKey=new Map(allQuestions().map(question=>[keyFor(question),question]));
  return questions.map(question=>{
    if(Array.isArray(question.images)&&question.images.some(image=>image&&image.sourceInQuestionBank===true)){
      const source=byKey.get(String(question.questionKey||keyFor(question)));
      if(source)question.images=clone(source.images||[]);
    }
    return question;
  });
}
function saveLedger(){ledgerStore.save(compactLedgerForStorage(ledger));}
function upsertAnswerRecord(record){
  const position=ledger.answerRecords.findIndex(item=>item.answerRecordId===record.answerRecordId);
  if(position>=0)ledger.answerRecords[position]=record;else ledger.answerRecords.push(record);
  if(ledger.answerRecords.length>5000)ledger.answerRecords=ledger.answerRecords.slice(-5000);
}
function remapLegacyQuestionRefs(){
  const remap=new Map();
  allQuestions().forEach(question=>{
    remap.set(String(question.chapter_no)+":"+String(question.legacyId),keyFor(question));
    remap.set(String(question.chapter_no)+":"+String(question.id),keyFor(question));
  });
  const mapRef=value=>remap.get(String(value))||value;
  const before=JSON.stringify({missed:progress.missed,attempts:progress.attempts});
  progress.missed=[...new Set(progress.missed.map(mapRef))];
  progress.attempts=progress.attempts.map(event=>({...event,id:mapRef(event.id),questionId:event.questionId||mapRef(event.id)}));
  if(before!==JSON.stringify({missed:progress.missed,attempts:progress.attempts}))saveProgress();
}
function loadBank(data){
  chapters=window.C10QuestionBank.normalize(data,bankId);
  remapLegacyQuestionRefs();
  $("chapter").innerHTML=chapters.map((chapter,i)=>'<option value="'+i+'" selected>'+String(chapter.chapter_no).padStart(2,"0")+' · '+chapter.title+' ('+chapter.questions.length+')</option>').join("");
  renderChapterPicker();
  const total=chapters.reduce((sum,chapter)=>sum+chapter.questions.length,0);
  setText("chapterTotal",chapters.length);setText("questionTotal",total);
  setText("subjectIcon",config.icon);setText("subjectTitle",config.title+(classId==="6"?" · Class 6":"")+" Practice");
  setText("subjectSubtitle",classId==="6"&&subject==="science"?"NCERT Curiosity · Class 6 Science. Build foundations through observation, everyday examples and clear explanations.":config.subtitle);
  if($("classEyebrow"))setText("classEyebrow",classId==="6"&&subject==="science"?"ExamGuru Quest · CBSE Class 6 · NCERT Curiosity":"ExamGuru Quest · CBSE Class "+classId);
  document.title=(classId==="6"&&subject==="science"?"Class 6 Science":config.title)+" | ExamGuru";
  setText("modeHint",chapters[0].questions.length+" questions in this chapter. Learn mode shows explanations as you go.");
  updateStats();
  if(ledger.activeAttempt && ledger.activeAttempt.status==="in-progress")restoreAttempt(ledger.activeAttempt);
}
function currentPool(){
  const chosen=selectedChapters();
  const selectedQuestions=chosen.flatMap(chapter=>chapter.questions);
  if(mode==="retry"){
    const chapterKeys=new Set(chosen.map(chapter=>String(chapter.chapter_no)));
    return shuffle(allQuestions().filter(question=>progress.missed.includes(keyFor(question))&&chapterKeys.has(String(question.chapter_no))));
  }
  return shuffle(selectedQuestions);
}
function prioritizeUnseenQuestions(pool, desiredCount){
  if(mode==="retry" || !Array.isArray(ledger.attempts) || !ledger.attempts.length)return shuffle(pool);
  const recentAttempts=ledger.attempts.filter(attempt=>attempt&&attempt.subjectId===subject&&Array.isArray(attempt.questionIds)).slice(0,3);
  if(!recentAttempts.length)return shuffle(pool);
  const seen=new Set(recentAttempts.flatMap(attempt=>attempt.questionIds.map(String)));
  const unseen=shuffle(pool.filter(question=>!seen.has(String(keyFor(question)))));
  const previouslySeen=shuffle(pool.filter(question=>seen.has(String(keyFor(question)))));
  const required=desiredCount===0?pool.length:Math.min(desiredCount,pool.length);
  return unseen.length>=required?unseen.concat(previouslySeen):unseen.concat(previouslySeen);
}
function boundedNumber(value,min,max,fallback){
  const number=Number(value);
  return Number.isFinite(number)?Math.max(min,Math.min(max,Math.round(number))):fallback;
}
function syncModeControls(){
  const overall=$("overallTimerSetting"),question=$("questionTimerSetting");
  const overallCustom=$("overallTimerCustom"),overallLabel=$("overallCustomLabel");
  const questionCustom=$("questionTimerCustom"),questionLabel=$("questionCustomLabel");
  const timed=mode==="timed";
  if(timed&&overall&&overall.value==="off"){overall.value="1200";overall.dataset.timedDefault="true";}
  else if(!timed&&overall&&overall.dataset.timedDefault==="true"){overall.value="off";overall.dataset.timedDefault="false";}
  if(overall){
    const off=overall.querySelector&&overall.querySelector('option[value="off"]');
    if(off)off.disabled=timed;
  }
  if(overallCustom)overallCustom.hidden=!overall||overall.value!=="custom";
  if(overallLabel)overallLabel.hidden=!overall||overall.value!=="custom";
  if(questionCustom)questionCustom.hidden=!question||question.value!=="custom";
  if(questionLabel)questionLabel.hidden=!question||question.value!=="custom";
  const controls=$("timingControls");if(controls&&timed)controls.open=true;
  const help=$("timingHelp");
  if(help)help.textContent=timed
    ?"Timed Exam requires an overall countdown. An optional question timer also locks each question when its own time expires."
    :"Overall and question timers are optional. A question clock starts when first opened and keeps running while you navigate away.";
}
function selectedTiming(){
  let overallChoice=$("overallTimerSetting").value;
  if(mode==="timed"&&overallChoice==="off"){overallChoice="1200";$("overallTimerSetting").value=overallChoice;}
  const overallTimeLimitSeconds=overallChoice==="off"?null:
    overallChoice==="custom"?boundedNumber($("overallTimerCustom").value,1,240,30)*60:Number(overallChoice);
  const questionChoice=$("questionTimerSetting").value;
  const questionTimeLimitSeconds=questionChoice==="off"?null:
    questionChoice==="custom"?boundedNumber($("questionTimerCustom").value,5,300,45):Number(questionChoice);
  return {overallTimeLimitSeconds,questionTimeLimitSeconds};
}
function ensureQuestionDeadline(questionIndex){
  if(!currentAttempt||!currentAttempt.questionTimeLimitSeconds)return;
  currentAttempt.questionDeadlines=currentAttempt.questionDeadlines||{};
  if(!currentAttempt.questionDeadlines[String(questionIndex)]){
    currentAttempt.questionDeadlines[String(questionIndex)]=new Date(Date.now()+currentAttempt.questionTimeLimitSeconds*1000).toISOString();
    persistCurrentAttempt();
  }
}
function questionRemaining(questionIndex){
  const deadline=currentAttempt&&currentAttempt.questionDeadlines&&currentAttempt.questionDeadlines[String(questionIndex)];
  return deadline?window.C10SessionModel.remainingSeconds(deadline,Date.now()):null;
}
function isQuestionExpired(questionIndex){
  const remaining=questionRemaining(questionIndex);
  return remaining!==null&&remaining===0;
}
function markTimedOutUnanswered(questionIndex){
  if(!currentAttempt||currentAttempt.answers[questionIndex])return;
  const question=session[questionIndex];
  const record=window.C10SessionModel.makeAnswerRecord({
    answerRecordId:window.C10Storage.createId(),attemptId:currentAttempt.attemptId,questionId:keyFor(question),
    selectedOptionId:null,selectedOptionText:null,correctOptionId:question.correctOptionId,
    correctOptionText:question.options[question.answer],status:"unanswered",answeredAt:null,timeSpentSeconds:0
  });
  currentAttempt.answers[questionIndex]=record;answers[questionIndex]=runtimeAnswer(record,question);
  upsertAnswerRecord(record);
  const id=keyFor(question);progress.missed=[...new Set([...(progress.missed||[]),id])];saveProgress();
}
function processQuestionTimeouts(){
  if(!currentAttempt||!currentAttempt.questionTimeLimitSeconds)return;
  let changed=false;
  currentAttempt.questionDeadlines=currentAttempt.questionDeadlines||{};
  for(let i=0;i<session.length;i++){
    if(isQuestionExpired(i)&&!currentAttempt.answers[i]){markTimedOutUnanswered(i);changed=true;}
  }
  if(changed)persistCurrentAttempt();
}
function questionIsMarked(questionIndex){
  return !!(currentAttempt&&Array.isArray(currentAttempt.markedQuestionIndexes)&&currentAttempt.markedQuestionIndexes.includes(questionIndex));
}
function updateQuestionNavigation(){
  if(!currentAttempt)return;
  const dock=$("questionNavDock");if(dock)dock.classList.remove("hide");
  const previous=$("mobilePreviousBtn"),nextButton=$("mobileNextBtn");
  if(previous)previous.disabled=index<=0;
  if(nextButton){nextButton.textContent=index===session.length-1?"Submit quiz":"Next →";nextButton.disabled=false;}
  const mark=$("markReviewBtn");
  if(mark){mark.setAttribute("aria-pressed",String(questionIsMarked(index)));mark.textContent=questionIsMarked(index)?"⚑ Marked for review":"⚑ Mark for review";}
}
function renderQuestionNavigator(){
  if(!currentAttempt)return;
  const grid=$("questionNavigatorGrid");if(!grid)return;
  grid.innerHTML="";
  const answeredCount=currentAttempt.answers.filter(record=>record&&record.status==="answered").length;
  const skippedCount=currentAttempt.answers.filter(record=>record&&record.status==="skipped").length;
  const markedCount=(currentAttempt.markedQuestionIndexes||[]).length;
  setText("navigatorSummary",answeredCount+" answered · "+skippedCount+" skipped · "+markedCount+" marked");
  session.forEach((question,i)=>{
    const button=document.createElement("button");button.type="button";button.className="question-nav-item";button.textContent=String(i+1);
    const expired=isQuestionExpired(i),record=currentAttempt.answers[i];
    if(record&&record.status==="answered")button.classList.add("answered");
    if(expired)button.classList.add("locked");
    if(i===index)button.classList.add("current");
    if(questionIsMarked(i))button.classList.add("marked");
    button.setAttribute("aria-label","Question "+(i+1)+(record&&record.status==="answered"?", answered":", not answered")+(expired?", time expired":"")+(questionIsMarked(i)?", marked for review":""));
    button.disabled=expired;
    button.onclick=()=>{moveToQuestion(i);closeQuestionNavigator();};grid.appendChild(button);
  });
}
function openQuestionNavigator(){
  if(!currentAttempt)return;
  processQuestionTimeouts();renderQuestionNavigator();$("questionNavigatorOverlay").classList.remove("hide");
  const close=$("closeQuestionNavigator");if(close&&typeof close.focus==="function")close.focus();
}
function closeQuestionNavigator(){
  const overlay=$("questionNavigatorOverlay");if(overlay)overlay.classList.add("hide");
}
function moveToQuestion(targetIndex){
  if(!currentAttempt||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=session.length)return;
  index=targetIndex;currentAttempt.currentIndex=index;currentAttempt.questionStartedAt=new Date().toISOString();
  ensureQuestionDeadline(index);processQuestionTimeouts();persistCurrentAttempt();renderQuestion();
}
function toggleQuestionMarked(){
  if(!currentAttempt)return;
  currentAttempt.markedQuestionIndexes=Array.isArray(currentAttempt.markedQuestionIndexes)?currentAttempt.markedQuestionIndexes:[];
  if(questionIsMarked(index))currentAttempt.markedQuestionIndexes=currentAttempt.markedQuestionIndexes.filter(value=>value!==index);
  else currentAttempt.markedQuestionIndexes.push(index);
  persistCurrentAttempt();updateQuestionNavigation();
  if(!$("questionNavigatorOverlay").classList.contains("hide"))renderQuestionNavigator();
}
function advanceAfterQuestionTimeout(expiredIndex){
  processQuestionTimeouts();
  const candidates=[];
  for(let step=1;step<session.length;step++){
    const candidate=(expiredIndex+step)%session.length;
    if(!isQuestionExpired(candidate))candidates.push(candidate);
  }
  const nextUnanswered=candidates.find(candidate=>!currentAttempt.answers[candidate]||currentAttempt.answers[candidate].status!=="answered");
  const nextIndex=nextUnanswered===undefined?candidates[0]:nextUnanswered;
  if(nextIndex===undefined){finish("submitted",false);return;}
  moveToQuestion(nextIndex);
}
function buildAttempt(questionPool){
  const timing=selectedTiming(),startedAt=new Date().toISOString();
  const chosen=selectedChapters();
  const chapterIds=chosen.map(chapter=>String(chapter.key||chapter.chapterKey||chapter.title));
  return {
    schemaVersion:1,kind:"test-attempt",attemptId:window.C10Storage.createId(),profileId:localProfile.profileId,
    subjectId:subject,
    subjectIds:[subject],
    mode:({learn:"learn",test:"test",retry:"practice",random:"mixed-practice",timed:"timed-exam"})[mode]||"learn",
    uiMode:mode,source:{type:mode==="random"?"subject-bank":chosen.length>1?"chapter-set":"chapter-bank",sourceId:mode==="random"?subject+"-all":chapterIds.join(","),subjectIds:[subject],chapterIds},
    questionBankVersion:"legacy-bank-v1",
    status:"in-progress",startedAt,submittedAt:null,durationSeconds:null,
    timeLimitSeconds:timing.overallTimeLimitSeconds,overallTimeLimitSeconds:timing.overallTimeLimitSeconds,
    timingMode:timing.overallTimeLimitSeconds===null?"elapsed":"countdown",
    deadlineAt:timing.overallTimeLimitSeconds===null?null:new Date(Date.now()+timing.overallTimeLimitSeconds*1000).toISOString(),
    questionTimeLimitSeconds:timing.questionTimeLimitSeconds,questionDeadlines:{},markedQuestionIndexes:[],
    score:null,maxScore:questionPool.length,correctCount:null,questionCount:questionPool.length,
    questionIds:questionPool.map(keyFor),answerRecordIds:[],questions:clone(questionPool),answers:Array(questionPool.length).fill(null),
    currentIndex:0,questionStartedAt:startedAt
  };
}
function persistCurrentAttempt(){
  if(!currentAttempt || currentAttempt.status!=="in-progress")return;
  currentAttempt.currentIndex=index;
  ledger.activeAttempt=currentAttempt;
  saveLedger();
}
function start(){
  if(!chapters.length)return;
  if(ledger.activeAttempt && ledger.activeAttempt.status==="in-progress"){
    setText("modeHint","You have a saved session in progress. It will resume automatically when this page loads.");return;
  }
  let pool=currentPool();
  if(mode==="retry"&&!pool.length){setText("modeHint","No missed questions in this chapter yet. Choose Learn mode or Mixed practice first.");return;}
  const chosen=+$("length").value;
  if(mode!=="retry")pool=prioritizeUnseenQuestions(pool,chosen);
  if(chosen!==0)pool=pool.slice(0,Math.min(chosen,pool.length));
  if(!pool.length){setText("modeHint","No questions are available for this selection.");return;}
  session=pool;index=0;picked=null;answers=Array(session.length).fill(null);
  currentAttempt=buildAttempt(session);completedAttempt=null;
  ledger.activeAttempt=currentAttempt;saveLedger();
  currentAttempt.questionStartedAt=new Date().toISOString();persistCurrentAttempt();
  show("session");renderQuestion();startClock();
}
function runtimeAnswer(record,question){
  if(!record)return null;
  const selected=record.selectedOptionId==null?null:question.optionIds.indexOf(record.selectedOptionId);
  return {question,selected,correct:record.isCorrect===true,skipped:record.status==="skipped",status:record.status,answeredAt:record.answeredAt,timeSpentSeconds:record.timeSpentSeconds||0,record};
}
function restoreAttempt(saved){
  try{
    if(!Array.isArray(saved.questions)||!saved.questions.length||!Array.isArray(saved.answers)||saved.answers.length!==saved.questions.length)throw new Error("Saved attempt shape is invalid.");
    saved.questions=restoreQuestionBankImages(clone(saved.questions));
    currentAttempt=saved;session=clone(saved.questions);answers=saved.answers.map((record,i)=>runtimeAnswer(record,session[i]));
    index=Math.max(0,Math.min(Number(saved.currentIndex)||0,session.length-1));
    mode=saved.uiMode||({ "mixed-practice":"random","timed-exam":"timed","practice":"retry" }[saved.mode]||saved.mode||"learn");
    document.querySelectorAll("[data-mode]").forEach(button=>button.classList.toggle("active",button.dataset.mode===mode));
    const overallLimit=saved.overallTimeLimitSeconds!==undefined?saved.overallTimeLimitSeconds:(saved.timingMode==="countdown"?saved.timeLimitSeconds:null);
    const overallPresets=["600","1200","1800","3600"];
    $("overallTimerSetting").value=overallLimit===null?"off":overallPresets.includes(String(overallLimit))?String(overallLimit):"custom";
    if(overallLimit!==null&&!overallPresets.includes(String(overallLimit)))$("overallTimerCustom").value=String(Math.round(Number(overallLimit)/60));
    const questionLimit=Number(saved.questionTimeLimitSeconds)||0,questionPresets=["15","30","45","60","90","120"];
    $("questionTimerSetting").value=!questionLimit?"off":questionPresets.includes(String(questionLimit))?String(questionLimit):"custom";
    if(questionLimit&&!questionPresets.includes(String(questionLimit)))$("questionTimerCustom").value=String(questionLimit);
    if(mode==="timed"&&$("overallTimerSetting").value==="off")$("overallTimerSetting").value="1200";
    syncModeControls();
    $("chapter").value=String(Math.max(0,chapters.findIndex(chapter=>chapter.chapterKey===session[index].chapterKey)));
    syncChapterPickerFromSelect();
    setText("status","Your saved session and answers have been restored.");$("status").classList.remove("hide");
    show("session");ensureQuestionDeadline(index);renderQuestion();startClock();
    if(saved.deadlineAt && window.C10SessionModel.remainingSeconds(saved.deadlineAt,Date.now())===0)finish("timed-out",false);
  }catch(error){
    ledger.activeAttempt=null;saveLedger();
    currentAttempt=null;setText("status","An older saved session could not be resumed. Your completed attempts remain saved.");$("status").classList.remove("hide");
  }
}
let imageViewerTrigger=null;
function openQuestionImage(image,trigger){
  const viewer=$("imageViewer"),viewerImage=$("imageViewerImage"),caption=$("imageViewerCaption");
  if(!viewer||!viewerImage||!caption)return;
  viewerImage.src=image.src;viewerImage.alt=image.alt;
  setText("imageViewerCaption",image.caption||image.alt);
  imageViewerTrigger=trigger||null;
  viewer.classList.remove("hide");
  const closeButton=$("imageViewerClose");
  if(closeButton&&typeof closeButton.focus==="function")closeButton.focus();
}
function closeQuestionImage(){
  const viewer=$("imageViewer");
  if(viewer)viewer.classList.add("hide");
  const trigger=imageViewerTrigger;imageViewerTrigger=null;
  if(trigger&&typeof trigger.focus==="function")trigger.focus();
}
function appendQuestionImages(container,question,className=""){
  container.innerHTML="";
  container.className="question-media"+(className?" "+className:"");
  const images=Array.isArray(question.images)?question.images:[];
  container.classList.toggle("hide",images.length===0);
  if(!images.length)return;
  images.forEach(imageData=>{
    const figure=document.createElement("figure");figure.className="question-figure";
    const trigger=document.createElement("button");trigger.type="button";trigger.className="question-image-trigger";
    trigger.setAttribute("aria-label","Enlarge image: "+imageData.alt);
    const image=document.createElement("img");image.className="question-image";
    image.src=imageData.src;image.alt=imageData.alt;image.decoding="async";
    trigger.appendChild(image);
    trigger.addEventListener("click",()=>openQuestionImage(imageData,trigger));
    figure.appendChild(trigger);
    if(imageData.caption){
      const caption=document.createElement("figcaption");caption.className="question-image-caption";caption.textContent=imageData.caption;
      figure.appendChild(caption);
    }
    container.appendChild(figure);
  });
}
function initQuestionImageViewer(){
  const viewer=$("imageViewer"),closeButton=$("imageViewerClose");
  if(closeButton)closeButton.onclick=closeQuestionImage;
  if(viewer)viewer.addEventListener("click",event=>{if(event.target===viewer)closeQuestionImage();});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&viewer&&!viewer.classList.contains("hide"))closeQuestionImage();
  });
}
function renderQuestion(){
  if(!currentAttempt||!session[index])return;
  ensureQuestionDeadline(index);processQuestionTimeouts();
  const question=session[index],previous=answers[index],locked=isQuestionExpired(index);
  picked=previous?(previous.status==="skipped"?-1:previous.selected):null;
  const chapter=chapters.find(item=>item.chapter_no===question.chapter_no);
  setText("chapterPill",chapter?chapter.title:question.chapterTitle);
  setText("numberPill","Question "+(index+1)+" / "+session.length);
  setText("difficultyPill",question.difficulty||"Practice");
  setText("questionText",question.question);
  appendQuestionImages($("questionMedia"),question);
  $("progressBar").style.width=(index/session.length*100)+"%";
  $("options").innerHTML="";$("feedback").innerHTML="";
  question.options.forEach((text,i)=>{
    const button=document.createElement("button");button.className="opt";
    const letter=document.createElement("span");letter.className="letter";letter.textContent=String.fromCharCode(65+i);
    const label=document.createElement("span");label.textContent=text;button.append(letter,label);
    if(previous&&i===previous.selected)button.classList.add("selected");
    if(previous&&mode!=="test"&&mode!=="timed"&&i===question.answer)button.classList.add("correct");
    if(previous&&mode!=="test"&&mode!=="timed"&&i===previous.selected&&!previous.correct)button.classList.add("wrong");
    button.disabled=locked;
    button.setAttribute("aria-pressed",String(!!previous&&i===previous.selected));
    button.onclick=()=>choose(i);
    $("options").appendChild(button);
  });
  if(locked){
    const box=document.createElement("div");box.className="feedback bad";
    const title=document.createElement("strong");title.textContent="Question time expired. ";
    const explanation=document.createElement("span");explanation.textContent=previous&&previous.status==="answered"?"Your saved answer is locked.":"This question is locked as unanswered.";
    box.append(title,explanation);$("feedback").appendChild(box);
  }else if(previous && mode!=="test"&&mode!=="timed"){
    const box=document.createElement("div");box.className="feedback "+(previous.correct?"good":"bad");
    const title=document.createElement("strong");title.textContent=previous.status==="skipped"?"Skipped. ":previous.correct?"Correct! ":"Not quite. ";
    const explanation=document.createElement("span");explanation.textContent=question.explanation||"Review the idea and try a similar question.";
    box.append(title,explanation);$("feedback").appendChild(box);
  }
  setText("sessionHint",locked?"This question's time has expired. You may review it, but the answer can no longer be changed.":mode==="test"||mode==="timed"?(previous?"Answer saved. You may change it until the question timer expires.":"Choose an answer. You can revisit it while the timer permits."):(previous?"Your answer is saved. Select another option to change it, or continue when ready.":"Choose one answer; you can change it before moving on."));
  $("nextBtn").disabled=false;$("nextBtn").textContent=index===session.length-1?"Submit session ✓":"Next question →";
  $("skipBtn").disabled=locked||picked!==null;$("submitBtn").textContent="Submit quiz";
  const questionTimer=$("questionTimerPill"),remaining=questionRemaining(index);
  if(questionTimer){
    questionTimer.classList.toggle("hide",remaining===null);
    if(remaining!==null)setText("questionTimerPill","QUESTION TIME  "+window.C10SessionModel.formatDuration(remaining));
    questionTimer.classList.toggle("timer-warning",remaining!==null&&remaining<=10&&remaining>5);
    questionTimer.classList.toggle("timer-danger",remaining!==null&&remaining<=5);
  }
  if(!currentAttempt.questionStartedAt){currentAttempt.questionStartedAt=new Date().toISOString();persistCurrentAttempt();}
  updateQuestionNavigation();
}
function recordSelectedAnswer(selected,status){
  const question=session[index],now=new Date().toISOString();
  const prior=currentAttempt.answers[index]||null;
  const timeSpent=(Number(prior&&prior.timeSpentSeconds)||0)+window.C10SessionModel.secondsBetween(currentAttempt.questionStartedAt||now,now);
  const answerRecord=window.C10SessionModel.makeAnswerRecord({
    answerRecordId:prior&&prior.answerRecordId||window.C10Storage.createId(),attemptId:currentAttempt.attemptId,questionId:keyFor(question),
    selectedOptionId:status==="answered"?question.optionIds[selected]:null,
    selectedOptionText:status==="answered"?question.options[selected]:null,
    correctOptionId:question.correctOptionId,correctOptionText:question.options[question.answer],
    status,answeredAt:status==="answered"?now:null,timeSpentSeconds:timeSpent
  });
  const correct=status==="answered"&&answerRecord.isCorrect===true;
  if(prior&&prior.status==="answered"){progress.answered=Math.max(0,progress.answered-1);if(prior.isCorrect===true)progress.correct=Math.max(0,progress.correct-1);}
  answers[index]={question,selected:status==="answered"?selected:null,correct,skipped:status==="skipped",status,answeredAt:now,timeSpentSeconds:timeSpent,record:answerRecord};
  currentAttempt.answers[index]=answerRecord;currentAttempt.questionStartedAt=null;
  picked=status==="skipped"?-1:selected;
  upsertAnswerRecord(answerRecord);
  const id=keyFor(question);
  if(status==="answered"){
    progress.answered++;
    if(correct){progress.correct++;progress.missed=progress.missed.filter(value=>value!==id);}
    else progress.missed=[...new Set([...progress.missed,id])];
  }else if(status==="skipped"){
    progress.missed=[...new Set([...progress.missed,id])];
  }
  progress.missed=[...new Set(progress.missed)];
  progress.attempts=progress.attempts.filter(event=>!(event.attemptId===currentAttempt.attemptId&&event.questionId===id));
  progress.attempts.unshift({id,questionId:id,attemptId:currentAttempt.attemptId,selected:status==="answered"?selected:null,correct,at:now,status});
  progress.attempts=progress.attempts.slice(0,500);
  saveProgress();persistCurrentAttempt();
}
function choose(optionIndex){
  if(!currentAttempt||currentAttempt.status!=="in-progress")return;
  if(isQuestionExpired(index)){renderQuestion();return;}
  if(!Number.isInteger(optionIndex)||optionIndex<0||optionIndex>=session[index].options.length)return;
  recordSelectedAnswer(optionIndex,"answered");
  const question=session[index],correct=answers[index].correct;
  [...$("options").querySelectorAll("button")].forEach((button,i)=>{
    button.classList.toggle("selected",i===optionIndex);
    button.classList.remove("correct","wrong");
    button.disabled=false;
    if(mode!=="test"&&mode!=="timed"){if(i===question.answer)button.classList.add("correct");if(i===optionIndex&&!correct)button.classList.add("wrong");}
  });
  $("nextBtn").disabled=false;
  if(mode==="test"||mode==="timed")setText("sessionHint","Answer saved. You can change it until you move to the next question.");
  else{
    $("feedback").innerHTML="";
    const box=document.createElement("div");box.className="feedback "+(correct?"good":"bad");
    const title=document.createElement("strong");title.textContent=correct?"Correct! ":"Not quite. ";
    const explanation=document.createElement("span");explanation.textContent=question.explanation||"Review the idea and try a similar question.";
    box.append(title,explanation);$("feedback").appendChild(box);
    setText("sessionHint","Your answer is saved. Select another option to change it, or continue when ready.");
  }
}
function skip(){
  if(picked!==null||!currentAttempt||isQuestionExpired(index))return;
  recordSelectedAnswer(null,"skipped");next();
}
function next(){
  if(!currentAttempt)return;
  if(index<session.length-1)moveToQuestion(index+1);
  else confirmSubmit();
}
function previousQuestion(){if(currentAttempt&&index>0)moveToQuestion(index-1);}
function confirmSubmit(){
  if(!currentAttempt)return;
  const unanswered=currentAttempt.answers.filter(record=>!record||record.status==="unanswered").length;
  const skipped=currentAttempt.answers.filter(record=>record&&record.status==="skipped").length;
  const marked=(currentAttempt.markedQuestionIndexes||[]).length,details=[];
  if(unanswered)details.push(unanswered+" unanswered");
  if(skipped)details.push(skipped+" skipped");
  if(marked)details.push(marked+" marked for review");
  finish("submitted",true,"Submit this quiz now?"+(details.length?" You still have "+details.join(" and ")+".":"")+" Your answers will be final.");
}
function stopClock(){if(clockHandle!==null){clearInterval(clockHandle);clockHandle=null;}}
function tickClock(){
  if(!currentAttempt||currentAttempt.status!=="in-progress"){stopClock();return;}
  processQuestionTimeouts();
  if(currentAttempt.deadlineAt){
    const remaining=window.C10SessionModel.remainingSeconds(currentAttempt.deadlineAt,Date.now());
    setText("timerPill","QUIZ TIME  "+window.C10SessionModel.formatDuration(remaining));
    $("timerPill").classList.remove("hide");$("timerPill").classList.toggle("timer-warning",remaining<=60);$("timerPill").classList.toggle("timer-danger",remaining<=15);
    if(remaining===0){finish("timed-out",false);return;}
  }else{
    const elapsed=window.C10SessionModel.secondsBetween(currentAttempt.startedAt,new Date().toISOString());
    setText("timerPill","ELAPSED  "+window.C10SessionModel.formatDuration(elapsed));
    $("timerPill").classList.remove("hide");$("timerPill").classList.remove("timer-warning","timer-danger");
  }
  const remaining=questionRemaining(index),questionPill=$("questionTimerPill");
  if(questionPill){
    questionPill.classList.toggle("hide",remaining===null);
    if(remaining!==null){
      setText("questionTimerPill","QUESTION TIME  "+window.C10SessionModel.formatDuration(remaining));
      questionPill.classList.toggle("timer-warning",remaining<=10&&remaining>5);
      questionPill.classList.toggle("timer-danger",remaining<=5);
      if(remaining===0){advanceAfterQuestionTimeout(index);return;}
    }
  }
  if(!$("questionNavigatorOverlay").classList.contains("hide"))renderQuestionNavigator();
}
function startClock(){stopClock();tickClock();clockHandle=setInterval(tickClock,1000);}
function finish(status="submitted",askConfirmation=false,confirmationMessage){
  if(!currentAttempt||currentAttempt.status!=="in-progress")return;
  if(askConfirmation&&!confirm(confirmationMessage||"Submit this session now? Unanswered questions will be marked unanswered."))return;
  stopClock();
  const now=new Date().toISOString();
  session.forEach((question,i)=>{
    if(currentAttempt.answers[i])return;
    currentAttempt.answers[i]=window.C10SessionModel.makeAnswerRecord({
      answerRecordId:window.C10Storage.createId(),attemptId:currentAttempt.attemptId,questionId:keyFor(question),
      selectedOptionId:null,selectedOptionText:null,correctOptionId:question.correctOptionId,
      correctOptionText:question.options[question.answer],status:"unanswered",answeredAt:null,timeSpentSeconds:0
    });
  });
  const summary=window.C10SessionModel.summarize(currentAttempt,{submittedAt:now,status});
  completedAttempt=summary.attempt;
  currentAttempt.answers.forEach(record=>upsertAnswerRecord(record));
  currentAttempt.status=status;currentAttempt.submittedAt=now;
  ledger.attempts.unshift(completedAttempt);ledger.attempts=ledger.attempts.slice(0,100);
  ledger.activeAttempt=null;
  saveLedger();
  answers=currentAttempt.answers.map((record,i)=>runtimeAnswer(record,session[i]));
  lastMissed=answers.filter(answer=>!answer||!answer.correct).map(answer=>answer.question);
  const cloudAttempt={
    ...completedAttempt,
    questions:session.map(question=>({id:question.id,questionKey:keyFor(question)})),
    answers:currentAttempt.answers
  };
  renderResults(summary);currentAttempt=null;show("results");
  if(window.C10Api&&window.C10Api.isConfigured()&&window.C10Api.isAuthenticated()){
    window.C10Api.currentUser().then(identity=>{
      if(!identity||!identity.user||identity.user.role!=="student")return null;
      if(identity.mustChangePassword||identity.user.mustChangePassword)throw new Error("Change your temporary password on the Profile page before syncing.");
      return window.C10Api.saveStudentAttempt(cloudAttempt);
    }).then(result=>{
      if(result&&$("resultCopy"))setText("resultCopy",$("resultCopy").textContent+" Synced to your central student account.");
    }).catch(error=>{
      if($("resultCopy"))setText("resultCopy",$("resultCopy").textContent+" Cloud sync failed ("+error.message+"). Your local result is still saved.");
    });
  }
}
function renderResults(summary){
  const result=summary.attempt;
  $("progressBar").style.width="100%";
  const pct=result.questionCount?Math.round(result.correctCount/result.questionCount*100):0;
  setText("scorePct",pct+"%");
  setText("resultTitle",result.status==="timed-out"?"Time is up":pct>=85?"Excellent work!":pct>=65?"Good progress — keep going.":"A useful practice round.");
  const statusLabel=result.status==="timed-out"?"Automatically submitted when time expired.":"Submitted and saved on this device.";
  setText("resultCopy","You answered "+result.correctCount+" of "+result.questionCount+" questions correctly. "+statusLabel+" Review the explanations and retry concepts that need another look.");
  $("resultStats").innerHTML="";
  [["Correct",result.correctCount],["Needs review",result.questionCount-result.correctCount],["Answered",result.answeredCount],["Skipped",result.skippedCount],["Unanswered",result.unansweredCount],["Duration",window.C10SessionModel.formatDuration(result.durationSeconds)]].forEach(([label,value])=>{
    const box=document.createElement("div");box.className="topic";
    const strong=document.createElement("strong");strong.textContent=label;
    const span=document.createElement("span");span.textContent=value;box.append(strong,span);$("resultStats").appendChild(box);
  });
}
function reportRows(){
  const result=completedAttempt||ledger.attempts[0]||{};
  return (answers||[]).map((answer,i)=>({
    question:i+1,chapter:answer.question.chapterTitle||"",prompt:answer.question.question,
    selected:answer.selected===null||answer.selected===undefined?"Unanswered":answer.question.options[answer.selected],
    correct:answer.question.options[answer.question.answer],
    outcome:answer.status==="unanswered"?"Unanswered":answer.status==="skipped"?"Skipped":answer.correct?"Correct":"Incorrect",
    explanation:answer.question.explanation||""
  }));
}
function downloadExcelXml(filename,rows){
  const escapeXml=value=>String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const xml='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table>'+rows.map(row=>'<Row>'+row.map(cell=>'<Cell><Data ss:Type="String">'+escapeXml(cell)+'</Data></Cell>').join("")+'</Row>').join("")+'</Table></Worksheet></Workbook>';
  const blob=new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function testReportMatrix(){
  const attempt=completedAttempt||{};
  const pct=attempt.questionCount?Math.round((attempt.correctCount||0)/attempt.questionCount*100):0;
  const rows=[["ExamGuru · Test report"],["Subject",config.title],["Class","Class "+classId],["Test mode",attempt.mode||mode],["Submitted",attempt.submittedAt||new Date().toISOString()],["Status",attempt.status||"submitted"],["Score",(attempt.correctCount||0)+" / "+(attempt.questionCount||0)],["Accuracy",pct+"%"],["Correct",attempt.correctCount||0],["Answered",attempt.answeredCount||0],["Skipped",attempt.skippedCount||0],["Unanswered",attempt.unansweredCount||0],["Duration",window.C10SessionModel.formatDuration(attempt.durationSeconds||0)],[],["No.","Chapter / Topic","Question","Student answer","Correct answer","Outcome","Explanation"]];
  reportRows().forEach(row=>rows.push([row.question,row.chapter,row.prompt,row.selected,row.correct,row.outcome,row.explanation]));
  return rows;
}
function downloadTestReportExcel(){downloadExcelXml("examguru-test-report-"+new Date().toISOString().slice(0,10)+".xls",testReportMatrix());}
function downloadTestReportPdf(){
  const rows=reportRows(),attempt=completedAttempt||{};
  const esc=value=>String(value==null?"":value).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  const html='<!doctype html><html><head><meta charset="utf-8"><title>ExamGuru test report</title><style>body{font:12px Arial,sans-serif;color:#211b48;margin:28px}h1{margin-bottom:4px}p{color:#555}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #d8d3ee;padding:7px;text-align:left;vertical-align:top}th{background:#efedff}tr{break-inside:avoid}@media print{body{margin:12mm}button{display:none}}</style></head><body><h1>ExamGuru · Test report</h1><p>'+esc(config.title)+' · Class '+esc(classId)+' · '+esc(new Date(attempt.submittedAt||Date.now()).toLocaleString())+'</p><h2>Score: '+esc(attempt.correctCount||0)+' / '+esc(attempt.questionCount||0)+' ('+(attempt.questionCount?Math.round((attempt.correctCount||0)/attempt.questionCount*100):0)+'%)</h2><p>Correct: '+esc(attempt.correctCount||0)+' · Answered: '+esc(attempt.answeredCount||0)+' · Skipped: '+esc(attempt.skippedCount||0)+' · Unanswered: '+esc(attempt.unansweredCount||0)+' · Duration: '+esc(window.C10SessionModel.formatDuration(attempt.durationSeconds||0))+'</p><table><thead><tr><th>No.</th><th>Chapter / Question</th><th>Student answer</th><th>Correct answer</th><th>Result / explanation</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+row.question+'</td><td><b>'+esc(row.chapter)+'</b><br>'+esc(row.prompt)+'</td><td>'+esc(row.selected)+'</td><td>'+esc(row.correct)+'</td><td><b>'+esc(row.outcome)+'</b><br>'+esc(row.explanation)+'</td></tr>').join("")+'</tbody></table><p>Conceptualised by JP Ganathe · ExamGuru</p><script>window.onload=()=>window.print()</script></body></html>';
  const win=window.open("","_blank");if(!win){setText("resultCopy","Your browser blocked the print window. Allow pop-ups for this site, then try PDF again.");return;}
  win.document.open();win.document.write(html);win.document.close();
}
function showReview(){
  show("review");$("reviewList").innerHTML="";setText("reviewPill",answers.length+" questions");
  answers.forEach((answer,i)=>{
    if(!answer)return;
    const question=answer.question,box=document.createElement("article");box.className="topic";
    const heading=document.createElement("strong");heading.textContent=(i+1)+". "+(question.chapterTitle||"Question")+" · "+(answer.status==="unanswered"?"Unanswered":answer.status==="skipped"?"Skipped":answer.correct?"Correct":"Review");
    const prompt=document.createElement("p");prompt.textContent=question.question;
    box.append(heading,prompt);
    if(Array.isArray(question.images)&&question.images.length){
      const media=document.createElement("div");appendQuestionImages(media,question,"question-review-media");box.appendChild(media);
    }
    const selected=document.createElement("p");selected.className="muted";selected.textContent="Your answer: "+(answer.selected===null?"—":question.options[answer.selected]);
    const correct=document.createElement("p");correct.className="muted";correct.textContent="Correct answer: "+question.options[question.answer];
    const explanation=document.createElement("p");explanation.textContent=question.explanation||"";
    box.append(selected,correct,explanation);$("reviewList").appendChild(box);
  });
}
function reviewMissed(){
  if(!chapters.length)return;
  const chapter=chapters[+$("chapter").value];
  const missed=allQuestions().filter(question=>progress.missed.includes(keyFor(question))&&question.chapter_no===chapter.chapter_no);
  if(!missed.length){setText("modeHint","There are no missed questions in this chapter. Try a practice session first.");return;}
  mode="retry";document.querySelectorAll("[data-mode]").forEach(button=>button.classList.toggle("active",button.dataset.mode===mode));
  $("overallTimerSetting").value="off";$("questionTimerSetting").value="off";syncModeControls();
  session=shuffle(missed);index=0;picked=null;answers=Array(session.length).fill(null);
  currentAttempt=buildAttempt(session);ledger.activeAttempt=currentAttempt;saveLedger();
  currentAttempt.questionStartedAt=new Date().toISOString();persistCurrentAttempt();show("session");renderQuestion();startClock();
}
function retrySessionMissed(){
  const keys=new Set(lastMissed.map(question=>keyFor(question)));
  session=shuffle(allQuestions().filter(question=>keys.has(keyFor(question))));
  if(!session.length){setText("resultCopy","No missed questions from this round — try a new chapter or mixed practice.");return;}
  mode="retry";$("overallTimerSetting").value="off";$("questionTimerSetting").value="off";syncModeControls();index=0;picked=null;answers=Array(session.length).fill(null);
  currentAttempt=buildAttempt(session);ledger.activeAttempt=currentAttempt;saveLedger();
  currentAttempt.questionStartedAt=new Date().toISOString();persistCurrentAttempt();show("session");renderQuestion();startClock();
}
function resetProgress(){
  if(!confirm("Clear this subject’s saved scores, missed questions, and test history from this browser?"))return;
  stopClock();progress=emptyProgress();ledger=emptyLedger();progressStore.clear();ledgerStore.clear();
  currentAttempt=null;completedAttempt=null;answers=[];session=[];updateStats();show("welcome");
  setText("modeHint","Progress and local test history cleared on this device.");
}
function init(){
  initQuestionImageViewer();
  if(!config){setText("status","Unknown subject link.");$("status").classList.remove("hide");return;}
  if(!(CLASS_SUBJECTS[classId]||[]).includes(subject)){setText("status","The selected subject bank is not published for Class "+classId+" yet.");$("status").classList.remove("hide");return;}
  syncModeControls();
  document.querySelectorAll("[data-mode]").forEach(button=>button.onclick=()=>{
    if(ledger.activeAttempt&&ledger.activeAttempt.status==="in-progress"){setText("modeHint","Finish or resume the saved session before changing mode.");return;}
    mode=button.dataset.mode;document.querySelectorAll("[data-mode]").forEach(item=>item.classList.toggle("active",item===button));syncModeControls();
    const hints={learn:"Learn mode explains each answer immediately.",test:"Test mode holds feedback until submission and saves answers as you go.",retry:"Retry questions previously answered incorrectly in the chosen chapter.",random:"Mixed practice draws questions across your selected chapters.",timed:"Timed exam holds feedback until submission and automatically submits when the countdown reaches zero."};
    setText("modeHint",hints[mode]);
    if(mode==="timed"&&$("overallTimerSetting").value==="off")$("overallTimerSetting").value="1200";
  });
  $("startBtn").onclick=start;$("nextBtn").onclick=next;$("skipBtn").onclick=skip;
  $("submitBtn").onclick=confirmSubmit;
  $("mobilePreviousBtn").onclick=previousQuestion;$("mobileNextBtn").onclick=()=>index===session.length-1?confirmSubmit():next();
  $("mobileNavigatorBtn").onclick=openQuestionNavigator;$("navigatorInlineBtn").onclick=openQuestionNavigator;
  $("closeQuestionNavigator").onclick=closeQuestionNavigator;$("questionNavigatorBackdrop").onclick=closeQuestionNavigator;
  $("navigatorReturnBtn").onclick=closeQuestionNavigator;$("navigatorSubmitBtn").onclick=()=>{closeQuestionNavigator();confirmSubmit();};
  $("markReviewBtn").onclick=toggleQuestionMarked;
  $("overallTimerSetting").onchange=()=>{$("overallTimerSetting").dataset.timedDefault="false";syncModeControls();};
  $("questionTimerSetting").onchange=syncModeControls;
  $("reviewBtn").onclick=reviewMissed;$("clearBtn").onclick=resetProgress;
  $("againBtn").onclick=start;$("reviewAnswersBtn").onclick=showReview;$("reportPdfBtn").onclick=downloadTestReportPdf;$("reportExcelBtn").onclick=downloadTestReportExcel;$("reviewPdfBtn").onclick=downloadTestReportPdf;$("reviewExcelBtn").onclick=downloadTestReportExcel;$("backBtn").onclick=()=>show("results");$("retrySetBtn").onclick=retrySessionMissed;
  $("chapter").onchange=()=>{if(!chapters.length)return;syncChapterPickerFromSelect();const chosen=selectedChapters();const count=chosen.reduce((sum,chapter)=>sum+chapter.questions.length,0);setText("modeHint",count+" questions available across "+chosen.length+" selected chapter(s).");};
  $("chapterPickerToggle").onclick=()=>{const panel=$("chapterPickerPanel"),open=panel.hidden;panel.hidden=!open;$("chapterPickerToggle").setAttribute("aria-expanded",String(open));};
  $("selectAllChapters").onclick=()=>{Array.from($("chapter").options).forEach(option=>option.selected=true);syncChapterPickerFromSelect();setText("modeHint","All "+chapters.length+" chapters selected.");};
  $("clearChapters").onclick=()=>{Array.from($("chapter").options).forEach(option=>option.selected=false);syncChapterPickerFromSelect();setText("modeHint","Choose at least one chapter to start practice.");};
  document.addEventListener("visibilitychange",()=>{if(document.hidden)persistCurrentAttempt();});
  window.addEventListener("pagehide",persistCurrentAttempt);
  fetch("./data/"+bankId+".json",{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Could not load question bank (HTTP "+response.status+").");return response.json();})
    .then(loadBank).catch(error=>{setText("status","Question bank could not load: "+error.message);$("status").classList.remove("hide");});
}
init();
})();