(() => {
const SUBJECTS = {
  mathematics: { title:"Mathematics", icon:"📐", subtitle:"Reason it out, work step by step, and use each mistake to sharpen the method." },
  english: { title:"English", icon:"📚", subtitle:"Practise reading, grammar and original questions about the prescribed literature." },
  "social-science": { title:"Social Science", icon:"🌍", subtitle:"Connect historical evidence, geography, democratic ideas and economic choices." },
  hindi: { title:"Hindi · Course A / Course B", icon:"📝", subtitle:"Core grammar, comprehension, and starter literature practice. Choose the course that matches your school." }
};
const $ = id => document.getElementById(id);
const subject = new URLSearchParams(location.search).get("subject") || "mathematics";
const config = SUBJECTS[subject];
let chapters=[], mode="learn", session=[], index=0, picked=null, answers=[], lastMissed=[];
let store={missed:[],answered:0,correct:0,attempts:[]};
const storeKey="c10playground_v1_"+subject;
const safeParse = s => { try{return JSON.parse(s)}catch{return null} };
const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b };
const k = q => String(q.chapter_no)+":"+String(q.id);
function show(id){["welcome","session","results","review"].forEach(x=>$(x).classList.toggle("hide",x!==id))}
function setText(id,value){$(id).textContent=value}
function updateStats(){
 const total=store.answered,accuracy=total?Math.round(store.correct/total*100):0;
 setText("overallStat",accuracy+"%");
 setText("progressText",total+" answers recorded on this device · "+store.correct+" correct · "+store.missed.length+" questions in your retry list.");
}
function allQuestions(){return chapters.flatMap(c=>c.questions.map(q=>({...q,chapter_no:c.chapter_no,chapterTitle:c.title})))}
function save(){localStorage.setItem(storeKey,JSON.stringify(store));updateStats()}
function loadBank(data){
 chapters=data.map((c,i)=>({...c,chapter_no:c.chapter_no||i+1,questions:c.questions.map((q,j)=>{const pairs=q.options.map((text,index)=>({text,correct:index===q.answer}));for(let n=pairs.length-1;n>0;n--){const z=Math.floor(Math.random()*(n+1));[pairs[n],pairs[z]]=[pairs[z],pairs[n]];}return {...q,options:pairs.map(x=>x.text),answer:pairs.findIndex(x=>x.correct),id:q.id||j+1,chapter_no:c.chapter_no||i+1,chapterTitle:c.title};})}));
 $("chapter").innerHTML=chapters.map((c,i)=>'<option value="'+i+'">'+String(c.chapter_no).padStart(2,"0")+' · '+c.title+' ('+c.questions.length+')</option>').join("");
 const n=chapters.reduce((s,c)=>s+c.questions.length,0);
 setText("chapterTotal",chapters.length);setText("questionTotal",n);
 setText("subjectIcon",config.icon);setText("subjectTitle",config.title+" Practice");setText("subjectSubtitle",config.subtitle);
 document.title=config.title+" | C10-Playground";
 setText("modeHint",chapters[0].questions.length+" questions in this chapter. Learn mode shows explanations as you go.");
 updateStats();
}
function currentPool(){
 if(mode==="random")return shuffle(allQuestions());
 if(mode==="retry"){
   const chapter=chapters[+$("chapter").value];
   return shuffle(allQuestions().filter(q=>store.missed.includes(k(q))&&q.chapter_no===chapter.chapter_no));
 }
 return shuffle([...chapters[+$("chapter").value].questions]);
}
function start(){
 let pool=currentPool();
 if(mode==="retry"&&!pool.length){setText("modeHint","No missed questions in this chapter yet. Choose Learn mode or Mixed practice first.");return}
 const chosen=+$("length").value;
 if(chosen!==0)pool=pool.slice(0,Math.min(chosen,pool.length));
 if(!pool.length){setText("modeHint","No questions are available for this selection.");return}
 session=pool;index=0;picked=null;answers=[];show("session");renderQuestion();
}
function renderQuestion(){
 const q=session[index];picked=null;
 const c=chapters.find(c=>c.chapter_no===q.chapter_no);
 setText("chapterPill",mode==="random"?(c?c.title:q.chapterTitle):(c?c.title:q.chapterTitle));
 setText("numberPill","Question "+(index+1)+" / "+session.length);
 setText("difficultyPill",q.difficulty||"Practice");
 setText("questionText",q.question);
 $("progressBar").style.width=(index/session.length*100)+"%";
 $("options").innerHTML="";$("feedback").innerHTML="";
 q.options.forEach((text,i)=>{
   const b=document.createElement("button");b.className="opt";
   const letter=document.createElement("span");letter.className="letter";letter.textContent=String.fromCharCode(65+i);
   const label=document.createElement("span");label.textContent=text;b.append(letter,label);
   b.onclick=()=>choose(i);$("options").appendChild(b);
 });
 setText("sessionHint",mode==="test"?"Choose one answer. Feedback is held until the end.":"Choose one answer, then read the explanation.");
 $("nextBtn").disabled=true;$("nextBtn").textContent=index===session.length-1?"Finish session ✓":"Next question →";
 $("skipBtn").disabled=false;
}
function choose(i){
 if(picked!==null)return;
 picked=i;
 const q=session[index],correct=i===q.answer;
 const buttons=[...$("options").querySelectorAll("button")];
 buttons.forEach((b,j)=>{b.disabled=true;if(j===i)b.classList.add("selected");if(mode!=="test"){if(j===q.answer)b.classList.add("correct");if(j===i&&!correct)b.classList.add("wrong")}});
 $("nextBtn").disabled=false;
 answers[index]={question:q,selected:i,correct};
 const id=k(q);
 store.answered++;if(correct)store.correct++;
 store.missed=store.missed.filter(x=>x!==id);if(!correct)store.missed.push(id);
 store.missed=[...new Set(store.missed)];
 store.attempts.unshift({id,selected:i,correct,at:new Date().toISOString()});store.attempts=store.attempts.slice(0,500);save();
 if(mode==="test")setText("sessionHint","Answer saved for end-of-session review.");
 else {
  const box=document.createElement("div");box.className="feedback "+(correct?"good":"bad");
  const title=document.createElement("strong");title.textContent=correct?"Correct! ":"Not quite. ";
  const explanation=document.createElement("span");explanation.textContent=q.explanation||"Review the idea and try a similar question.";
  box.append(title,explanation);$("feedback").appendChild(box);
  setText("sessionHint",correct?"Nice work — explain why it is right to make it stick.":"Use the explanation, then try again later.");
 }
}
function skip(){
 if(picked!==null)return;
 const q=session[index];answers[index]={question:q,selected:null,correct:false,skipped:true};
 store.answered++;store.missed=[...new Set([...store.missed,k(q)])];save();next();
}
function next(){if(index<session.length-1){index++;renderQuestion()}else finish()}
function finish(){
 show("results");$("progressBar").style.width="100%";
 const right=answers.filter(a=>a&&a.correct).length,pct=Math.round(right/session.length*100);
 setText("scorePct",pct+"%");
 setText("resultTitle",pct>=85?"Excellent work!":pct>=65?"Good progress — keep going.":"A useful practice round.");
 setText("resultCopy","You answered "+right+" of "+session.length+" questions correctly. Review the explanations and retry the concepts that need another look.");
 $("resultStats").innerHTML="";
 [["Correct",right],["Needs review",session.length-right],["Session size",session.length],["Accuracy",pct+"%"]].forEach(([label,value])=>{const d=document.createElement("div");d.className="topic";const st=document.createElement("strong");st.textContent=label;const sp=document.createElement("span");sp.textContent=value;d.append(st,sp);$("resultStats").appendChild(d)});
 lastMissed=answers.filter(a=>!a||!a.correct).map(a=>a.question);
}
function showReview(){
 show("review");$("reviewList").innerHTML="";setText("reviewPill",answers.length+" questions");
 answers.forEach((a,i)=>{
  if(!a)return;
  const q=a.question,box=document.createElement("article");box.className="topic";
  const heading=document.createElement("strong");heading.textContent=(i+1)+". "+(q.chapterTitle||"Question")+" · "+(a.correct?"Correct":a.skipped?"Skipped":"Review");
  const question=document.createElement("p");question.textContent=q.question;
  const selected=document.createElement("p");selected.className="muted";selected.textContent="Your answer: "+(a.selected===null?"Skipped":q.options[a.selected]);
  const answer=document.createElement("p");answer.className="muted";answer.textContent="Correct answer: "+q.options[q.answer];
  const expl=document.createElement("p");expl.textContent=q.explanation||"";
  box.append(heading,question,selected,answer,expl);$("reviewList").appendChild(box);
 });
}
function reviewMissed(){
 const missed=allQuestions().filter(q=>store.missed.includes(k(q))&&q.chapter_no===chapters[+$("chapter").value].chapter_no);
 if(!missed.length){setText("modeHint","There are no missed questions in this chapter. Try a practice session first.");return}
 mode="retry";document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
 session=shuffle(missed);index=0;picked=null;answers=[];show("session");renderQuestion();
}
function retrySessionMissed(){
 const keys=new Set(lastMissed.map(k));session=shuffle(allQuestions().filter(q=>keys.has(k(q))));
 if(!session.length){setText("resultCopy","No missed questions from this round — try a new chapter or mixed practice.");return}
 index=0;picked=null;answers=[];mode="retry";show("session");renderQuestion();
}
function resetProgress(){
 if(!confirm("Clear this subject’s saved scores and missed questions from this browser?"))return;
 store={missed:[],answered:0,correct:0,attempts:[]};localStorage.removeItem(storeKey);updateStats();setText("modeHint","Progress reset on this device.");
}
function init(){
 if(!config){setText("status","Unknown subject link.");$("status").classList.remove("hide");return}
 const existing=safeParse(localStorage.getItem(storeKey));if(existing&&Array.isArray(existing.missed))store={...store,...existing};
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("active",x===b));setText("modeHint",({learn:"Learn mode explains each answer immediately.",test:"Test mode saves feedback until the end.",retry:"Retry questions previously answered incorrectly in the chosen chapter.",random:"Mixed practice draws questions across all chapters."})[mode])});
 $("startBtn").onclick=start;$("nextBtn").onclick=next;$("skipBtn").onclick=skip;$("reviewBtn").onclick=reviewMissed;$("clearBtn").onclick=resetProgress;$("againBtn").onclick=start;$("reviewAnswersBtn").onclick=showReview;$("backBtn").onclick=()=>show("welcome");$("retrySetBtn").onclick=retrySessionMissed;
 $("chapter").onchange=()=>{if(!chapters.length)return;const c=chapters[+$("chapter").value];setText("modeHint",c.questions.length+" questions available in this chapter; the session will use no more than this bank yet.")};
 fetch("./data/"+subject+".json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("Could not load question bank (HTTP "+r.status+").");return r.json()}).then(loadBank).catch(e=>{setText("status","Question bank could not load: "+e.message);$("status").classList.remove("hide")});
}
init();
})();