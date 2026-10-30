"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class FakeClassList {
  constructor(){this.values=new Set();}
  add(value){this.values.add(value);}
  remove(value){this.values.delete(value);}
  contains(value){return this.values.has(value);}
  toggle(value,force){const should=force===undefined?!this.values.has(value):!!force;if(should)this.values.add(value);else this.values.delete(value);return should;}
}
class FakeElement {
  constructor(id=""){
    this.id=id;this.children=[];this.handlers={};this.classList=new FakeClassList();this.className="";
    this.dataset={};this.disabled=false;this.hidden=false;this.value=id==="length"?"10":id==="timerSetting"?"1200":"0";
    this._innerHTML="";this.textContent="";this.style={};this.attributes={};this.tagName="DIV";
  }
  set innerHTML(value){this._innerHTML=String(value);this.children=[];}
  get innerHTML(){return this._innerHTML;}
  appendChild(child){this.children.push(child);return child;}
  append(...children){children.forEach(child=>this.appendChild(child));}
  setAttribute(name,value){this.attributes[name]=String(value);}
  querySelectorAll(selector){if(selector==="button")return this.children.filter(child=>child.tagName==="BUTTON");return [];}
  addEventListener(type,handler){this.handlers[type]=handler;}
  scrollIntoView(options){this.scrollOptions=options;}
  click(){if(this.disabled)return;if(typeof this.onclick==="function")this.onclick({target:this});if(this.handlers.click)this.handlers.click({target:this});}
}
const subjectBank = [{
  chapter_no:1,title:"Mini Algebra",key:"mini-algebra",
  questions:[
    {id:1,question:"Two plus two equals?",options:["3","4","5","6"],answer:1,explanation:"Two plus two equals four.",difficulty:"Easy",images:[{src:"./data/images/mathematics/number-line.png",alt:"Number line from zero to four",caption:"Number line"}]},
    {id:2,question:"Three plus one equals?",options:["2","3","4","5"],answer:2,explanation:"Three plus one equals four.",difficulty:"Easy",images:[{src:"data:image/png;base64,iVBORw0KGgo=",alt:"A four-part diagram"}]}
  ]
}];

function makeEnvironment(seed = new Map(), subject = "mathematics"){
  const values=new Map(seed);
  const ids=new FakeElement("mode-buttons");
  ids.children=[];
  ["learn","test","retry","random","timed"].forEach(mode=>{
    const button=new FakeElement("mode-"+mode);button.tagName="BUTTON";button.dataset.mode=mode;
    if(mode==="learn")button.classList.add("active");
    ids.children.push(button);
  });
  const elements={};
  const allIds=[
    "chapter","timerSetting","timingField","practiceLayout","quizPanel","length","chapterTotal","questionTotal","overallStat","progressText","modeHint",
    "status","welcome","session","results","review","subjectIcon","subjectTitle","subjectSubtitle","chapterPill",
    "numberPill","difficultyPill","timerPill","progressBar","questionText","options","feedback","sessionHint",
    "nextBtn","skipBtn","submitBtn","startBtn","reviewBtn","clearBtn","againBtn","reviewAnswersBtn","reportPdfBtn","reportExcelBtn","reviewPdfBtn","reviewExcelBtn","backBtn",
    "retrySetBtn","resultCopy","resultTitle","scorePct","resultStats","reviewPill","reviewList","questionMedia","imageViewer","imageViewerImage","imageViewerCaption","imageViewerClose"
  ];
  allIds.forEach(id=>elements[id]=new FakeElement(id));
  ["session","results","review","status","imageViewer","questionMedia"].forEach(id=>elements[id].classList.add("hide"));
  elements["nextBtn"].tagName="BUTTON";elements["skipBtn"].tagName="BUTTON";
  elements["submitBtn"].tagName="BUTTON";elements["startBtn"].tagName="BUTTON";
  elements["reviewBtn"].tagName="BUTTON";elements["clearBtn"].tagName="BUTTON";
  elements["againBtn"].tagName="BUTTON";elements["reviewAnswersBtn"].tagName="BUTTON";
  elements["backBtn"].tagName="BUTTON";elements["retrySetBtn"].tagName="BUTTON";
  const document={
    title:"",
    hidden:false,
    getElementById:id=>elements[id]||(elements[id]=new FakeElement(id)),
    createElement:tag=>{const element=new FakeElement();element.tagName=tag.toUpperCase();return element;},
    querySelectorAll:selector=>selector==="[data-mode]"?ids.children:[],
    addEventListener:()=>{}
  };
  const localStorage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
  let uuidCounter=0;
  const context={
    window:{addEventListener:()=>{},matchMedia:()=>({matches:true})},document,localStorage,console,Date,Math,JSON,Object,Array,Number,String,
    TypeError,Uint8Array,encodeURIComponent,URLSearchParams,
    location:{search:"?subject="+subject},
    crypto:{randomUUID:()=>("00000000-0000-4000-8000-"+String(++uuidCounter).padStart(12,"0"))},
    fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(subjectBank)}),
    setInterval:()=>1,clearInterval:()=>{},confirm:()=>true
  };
  context.globalThis=context;
  vm.createContext(context);
  for(const file of ["js/storage.js","js/question-bank.js","js/session-model.js","js/quiz-engine.js"]){
    vm.runInContext(fs.readFileSync(file,"utf8"),context,{filename:file});
  }
  return {context,values,elements,modeButtons:ids.children};
}
const delay=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
  const first=makeEnvironment();
  await delay();
  assert.equal(first.elements.chapterTotal.textContent,"1");
  first.elements.startBtn.click();
  assert.equal(first.elements.session.classList.contains("hide"),false);
  assert.equal(first.elements.practiceLayout.classList.contains("quiz-active"),true,"active practice switches to the focused quiz layout on mobile");
  assert.equal(first.elements.quizPanel.scrollOptions.behavior,"smooth","mobile start brings the question panel into view");
  assert.equal(first.elements.quizPanel.scrollOptions.block,"start");
  assert.equal(first.elements.timingField.hidden,true,"timing control is hidden in Learn mode");
  assert.equal(first.elements.questionMedia.children.length,1,"question illustration renders in practice");
  const firstFigure=first.elements.questionMedia.children[0];
  const zoomTrigger=firstFigure.children[0];
  zoomTrigger.click();
  assert.equal(first.elements.imageViewer.classList.contains("hide"),false,"diagram can be enlarged");
  assert.ok(first.elements.imageViewerImage.src,"viewer loads the selected diagram");
  first.elements.imageViewerClose.click();
  assert.equal(first.elements.imageViewer.classList.contains("hide"),true,"diagram viewer closes accessibly");
  first.elements.options.children[0].click();
  assert.equal(first.elements.options.children[0].disabled,false,"selected answer remains editable before moving on");
  first.elements.options.children[1].click();
  assert.equal(first.elements.options.children[1].classList.contains("selected"),true,"changed answer is highlighted");
  assert.equal(first.elements.options.children[0].classList.contains("selected"),false,"previous selection is cleared");
  assert.equal(first.elements.options.children[1].disabled,false,"answer options stay enabled until moving on");
  first.elements.nextBtn.click();
  const ledgerEntry=[...first.values.entries()].find(([key])=>key.includes("test-attempt-ledger")&&key.endsWith("mathematics"));
  assert.ok(ledgerEntry,"active attempt is saved after answering and moving forward");
  let wrapped=JSON.parse(ledgerEntry[1]);
  assert.equal(wrapped.data.activeAttempt.status,"in-progress");
  assert.equal(wrapped.data.activeAttempt.currentIndex,1);
  assert.ok(wrapped.data.activeAttempt.answers[0],"first answer autosaved");
  assert.ok(wrapped.data.activeAttempt.questions.some(question=>question.images&&question.images.some(image=>image.sourceInQuestionBank===true&&!image.src)),"embedded image data is not duplicated into the local session snapshot");
  const savedProfileId=wrapped.data.activeAttempt.profileId;

  const resumed=makeEnvironment(first.values);
  await delay();
  assert.equal(resumed.elements.session.classList.contains("hide"),false,"saved attempt resumes after reload");
  assert.equal(resumed.elements.numberPill.textContent,"Question 2 / 2");
  assert.equal(resumed.elements.options.children.length,4);
  assert.equal(resumed.elements.questionMedia.children.length,1,"diagram is restored from the question bank after refresh");
  assert.ok(resumed.elements.questionMedia.children[0].children[0].children[0].src,"restored diagram has its original source");
  resumed.elements.options.children[0].click();
  resumed.elements.nextBtn.click();
  assert.equal(resumed.elements.results.classList.contains("hide"),false,"last answer submits completed attempt");
  assert.ok(resumed.elements.resultCopy.textContent.includes("saved on this device"));
  const completedEntry=[...resumed.values.entries()].find(([key])=>key.includes("test-attempt-ledger")&&key.endsWith("mathematics"));
  wrapped=JSON.parse(completedEntry[1]);
  assert.equal(wrapped.data.activeAttempt,null);
  assert.equal(wrapped.data.attempts.length,1);
  assert.equal(wrapped.data.attempts[0].status,"submitted");
  assert.equal(wrapped.data.attempts[0].questionCount,2);
  assert.equal(wrapped.data.attempts[0].answeredCount,2);
  assert.equal(wrapped.data.answerRecords.length,2);
  assert.equal(wrapped.data.attempts[0].profileId,savedProfileId);
  assert.ok(Number.isInteger(wrapped.data.attempts[0].durationSeconds));
  resumed.elements.reviewAnswersBtn.click();
  assert.equal(resumed.elements.review.classList.contains("hide"),false,"answer review opens after test");
  assert.ok(resumed.elements.reviewList.children.some(item=>item.children.some(child=>String(child.className).includes("question-review-media"))),"question diagrams also render in answer review");
  assert.equal(typeof resumed.elements.reviewPdfBtn.onclick,"function","PDF download remains available inside answer review");
  assert.equal(typeof resumed.elements.reviewExcelBtn.onclick,"function","Excel download remains available inside answer review");
  resumed.elements.backBtn.click();
  assert.equal(resumed.elements.review.classList.contains("hide"),true,"back from review closes the review screen");
  assert.equal(resumed.elements.results.classList.contains("hide"),false,"back from review returns to the result screen, not the welcome screen");
  assert.equal(typeof resumed.elements.reportPdfBtn.onclick,"function","PDF download remains available after returning from review");
  assert.equal(typeof resumed.elements.reportExcelBtn.onclick,"function","Excel download remains available after returning from review");

  const timed=makeEnvironment();
  await delay();
  assert.equal(timed.elements.timingField.hidden,true,"timing control starts hidden for non-timed modes");
  timed.modeButtons.find(button=>button.dataset.mode==="timed").click();
  assert.equal(timed.elements.timingField.hidden,false,"duration control appears for Timed Exam");
  assert.equal(timed.elements.timerSetting.value,"1200","Timed Exam defaults to a 20-minute countdown");
  timed.modeButtons.find(button=>button.dataset.mode==="learn").click();
  assert.equal(timed.elements.timingField.hidden,true,"duration control hides again outside Timed Exam");
  timed.modeButtons.find(button=>button.dataset.mode==="timed").click();
  timed.elements.startBtn.click();
  const timedLedger=[...timed.values.entries()].find(([key])=>key.includes("test-attempt-ledger")&&key.endsWith("mathematics"));
  const timedWrapped=JSON.parse(timedLedger[1]);
  assert.equal(timedWrapped.data.activeAttempt.timingMode,"countdown","Timed Exam records a countdown");
  assert.equal(timedWrapped.data.activeAttempt.timeLimitSeconds,1200,"Timed Exam uses the selected duration");

  const science=makeEnvironment(new Map(),"science");
  await delay();
  assert.equal(science.elements.subjectTitle.textContent,"Science Practice","Science is registered in the common engine");
  science.elements.startBtn.click();
  const scienceLedger=[...science.values.entries()].find(([key])=>key.includes("test-attempt-ledger")&&key.endsWith("science"));
  assert.ok(scienceLedger,"Science sessions use the shared attempt ledger");
  const scienceWrapped=JSON.parse(scienceLedger[1]);
  assert.equal(scienceWrapped.data.activeAttempt.subjectId,"science");
  assert.equal(scienceWrapped.data.activeAttempt.status,"in-progress");
  console.log("Quiz integration tests passed: mobile question focus, timed-only duration control, answer autosave/recovery, completion, review-to-results navigation, PDF/Excel download access, Science registration and diagram rendering.");
})().catch(error=>{console.error(error);process.exitCode=1;});
