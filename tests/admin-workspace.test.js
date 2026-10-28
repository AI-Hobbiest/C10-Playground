"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const read=path=>fs.readFileSync(path,"utf8");
const html=read("admin.html"),manager=read("js/admin-manager.js"),css=read("css/admin.css");
assert.ok(html.includes("Admin publishing:") && html.includes("trusted repository maintainer"),"GitHub repository permissions control publishing");
assert.ok(html.includes('id="centralStudentUsername"'),"admin can assign a distinct student username");
assert.ok(manager.includes("apiReady&&protectedTabs.has(name)&&!isAdminAuthenticated()"),"authoring and report tabs require an authenticated administrator");
for(const section of ["overview","banks","classes","knowledge","students","leaderboard","access","operations"])assert.ok(html.includes('data-tab="'+section+'"'),"missing Admin section "+section);
for(const item of ["id=\"bankSubject\"","id=\"questionList\"","id=\"imageFile\"","id=\"addClassBtn\"","id=\"resourceFile\"","id=\"studentBackups\"","id=\"exportReportBtn\"","id=\"leaderboardTable\""])assert.ok(html.includes(item),"missing Admin control "+item);
assert.ok(html.includes("data/student-accounts.json") && html.includes("not secure authentication"),"flat-file account limits are disclosed");
assert.ok(html.includes("staticAccountClass") && html.includes("updateStaticAccountClassBtn") && html.includes("students cannot edit their assigned class"),"flat-file account creation and admin-only class promotion controls exist");
assert.ok(manager.includes('username:$("centralStudentUsername").value.trim().toLowerCase()'),"student creation submits a username separately from the Student ID");
assert.ok(html.includes("Public-repository warning"),"public resource publication is called out");
assert.ok(css.includes("@media(max-width:600px)"),"Admin workspace is responsive");
new Function(manager);

class FakeClassList{
 constructor(){this.values=new Set();}
 add(value){this.values.add(value);}
 remove(value){this.values.delete(value);}
 contains(value){return this.values.has(value);}
 toggle(value,force){const on=force===undefined?!this.values.has(value):!!force;if(on)this.values.add(value);else this.values.delete(value);return on;}
}
class FakeElement{
 constructor(id=""){
  this.id=id;this.children=[];this.handlers={};this.classList=new FakeClassList();this.className="";
  this.dataset={};this.disabled=false;this.value="";this.textContent="";this.style={};this.files=[];
  this.attributes={};this._innerHTML="";this.download="";this.href="";this.type="";this.tagName="DIV";
 }
 set innerHTML(value){this._innerHTML=String(value);this.children=[];}
 get innerHTML(){return this._innerHTML;}
 get options(){return this.children;}
 appendChild(child){this.children.push(child);return child;}
 append(...children){children.forEach(child=>this.appendChild(child));}
 addEventListener(type,handler){(this.handlers[type]||(this.handlers[type]=[])).push(handler);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 remove(){this.removed=true;}
 focus(){this.focused=true;}
 click(){if(this.disabled)return;if(typeof this.onclick==="function")this.onclick({target:this});for(const h of this.handlers.click||[])h({target:this});}
 dispatch(type){for(const h of this.handlers[type]||[])h({target:this});}
}
const ids=[
"statQuestions","statClasses","statStudents","questionBankInventoryStatus","questionBankInventory","overviewStatus","centralStudentUsername","bankSubject","loadBankBtn","chooseBankBtn","bankFile","bankStatus","bankChapter","newChapterTitle","addChapterBtn","renameChapterBtn","deleteChapterBtn","questionList","newQuestionBtn","questionEditorTitle","qId","qDifficulty","qPrompt","qOption0","qOption1","qOption2","qOption3","qAnswer","qExplanation","imageFile","imagePath","imageAlt","imageCaption","addImageBtn","questionImageList","pendingAssets","saveQuestionBtn","exportBankBtn","deleteQuestionBtn","classId","classLabel","addClassBtn","exportClassesBtn","reloadClassesBtn","classesStatus","classesTable","resourceFile","resourceTitle","resourceType","resourceSubject","resourceChapter","resourcePath","resourceRights","addResourceBtn","exportManifestBtn","importManifestBtn","manifestFile","knowledgeStatus","pendingResources","knowledgeTable","studentBackups","clearStudentsBtn","exportReportBtn","studentStatus","studentsTable","leaderClass","leaderSubject","leaderboardStatus","leaderboardTable","exportLeaderboardBtn","profileEditorModal","closeProfileEditor","editStudentName","editStudentClass","editStudentSchool","editStudentCity","editStudentState","saveStudentProfileBtn","downloadStudentBackupBtn","studentEditStatus"
];
const elements={};ids.forEach(id=>elements[id]=new FakeElement(id));
elements.bankSubject.value="science";elements.bankChapter.value="0";
const tabButtons=["overview","banks","classes","knowledge","students","leaderboard","access","operations"].map(tab=>{const e=new FakeElement("tab-button-"+tab);e.dataset.tab=tab;return e;});
const panels=["overview","banks","classes","knowledge","students","leaderboard","access","operations"].map(tab=>{const e=new FakeElement("tab-"+tab);return e;});
const body=new FakeElement("body");
const document={
 body,
 getElementById:id=>elements[id]||(elements[id]=new FakeElement(id)),
 createElement:tag=>{const e=new FakeElement(tag);e.tagName=String(tag).toUpperCase();return e;},
 querySelectorAll:selector=>selector===".admin-tab-button"?tabButtons:selector===".admin-panel"?panels:[],
 addEventListener:()=>{}
};
const classes={schemaVersion:1,kind:"class-catalog",classes:[6,7,8,9,10,11,12].map(n=>({classId:String(n),label:"Class "+n,sortOrder:n,active:true}))};
const manifest={schemaVersion:1,kind:"knowledge-base-manifest",resources:[]};
const miniBank=[{chapter_no:1,title:"Mini Science",key:"mini-science",questions:[
{id:1,question:"Which is a gas?",options:["Ice","Water","Oxygen","Stone"],answer:2,explanation:"Oxygen is a gas."},
{id:2,question:"What is H2O?",options:["Oxygen","Water","Hydrogen","Salt"],answer:1,explanation:"H2O is water."}
]}];
const context={
 document,console,Date,Math,JSON,Object,Array,Number,String,RegExp,TypeError,Uint8Array,Map,Set,Promise,
 Blob,URL:{createObjectURL:blob=>{context.lastBlob=blob;return "blob:mock";},revokeObjectURL:()=>{}},
 setTimeout:()=>0,confirm:()=>true,prompt:(message,value)=>value,
 fetch:async url=>{
  const path=String(url).split("?")[0].split("/").pop();
  if(path==="classes.json")return {ok:true,json:async()=>classes};
  if(path==="knowledge-base.json")return {ok:true,json:async()=>manifest};
  if(path==="science.json")return {ok:true,json:async()=>miniBank};
  return {ok:false,status:404,json:async()=>({})};
 },
 window:{},URLSearchParams
};
context.globalThis=context;
vm.createContext(context);
for(const file of ["js/question-bank.js","js/profile-model.js"])vm.runInContext(read(file),context,{filename:file});
vm.runInContext(manager,context,{filename:"js/admin-manager.js"});
const delay=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
 await delay();await delay();
 assert.equal(elements.statQuestions.textContent,"2","published question summary counts actual bank records");
 assert.equal(elements.statClasses.textContent,"7","class catalogue loaded");
 assert.ok(elements.questionBankInventoryStatus.textContent.includes("2 questions counted across 1 available primary banks"),"question-bank inventory dynamically totals available JSON banks");
 assert.equal(elements.questionBankInventory.children[0].children[1].children.length,9,"inventory lists all eight supported bank files and a total row");
 assert.equal(elements.questionBankInventory.children[0].children[1].children[7].children[0].textContent,"Class 6 · Social Science","Class 6 Social Science appears in the Admin inventory");
 assert.ok(elements.questionList.children.length===2,"questions render in the Admin editor");

 // Add a question draft and export a JSON bank.
 elements.newQuestionBtn.click();
 elements.qId.value="science-extra-003";elements.qPrompt.value="Which star is closest to Earth?";
 elements.qOption0.value="Sirius";elements.qOption1.value="Sun";elements.qOption2.value="Vega";elements.qOption3.value="Polaris";
 elements.qAnswer.value="1";elements.qExplanation.value="The Sun is the closest star to Earth.";
 elements.saveQuestionBtn.click();
 assert.ok(elements.bankStatus.textContent.includes("draft"),"saving a question marks a local draft");
 elements.exportBankBtn.click();
 const exportedBank=JSON.parse(await context.lastBlob.text());
 assert.equal(exportedBank[0].questions.length,3);
 assert.equal(exportedBank[0].questions[2].question,"Which star is closest to Earth?");

 // Add a new class and make sure it is included in the export.
 elements.classId.value="5";elements.classLabel.value="Class 5";elements.addClassBtn.click();
 assert.ok(elements.classesStatus.textContent.includes("local draft"));
 elements.exportClassesBtn.click();
 const exportedClasses=JSON.parse(await context.lastBlob.text());
 assert.ok(exportedClasses.classes.some(item=>item.classId==="5"&&item.label==="Class 5"));

 // Add a resource record (the actual file is downloaded separately, never uploaded here).
 elements.resourceFile.files=[{name:"science-notes.pdf",type:"application/pdf",size:1200}];
 elements.resourceFile.dispatch("change");
 elements.resourceTitle.value="Science notes";elements.resourcePath.value="knowledge/science/science-notes.pdf";elements.resourceRights.value="Owned revision notes";
 elements.addResourceBtn.click();
 elements.exportManifestBtn.click();
 const exportedManifest=JSON.parse(await context.lastBlob.text());
 assert.equal(exportedManifest.resources.length,1);
 assert.equal(exportedManifest.resources[0].path,"knowledge/science/science-notes.pdf");

 console.log("Admin Workspace tests passed: sections/security notices, question-bank load/edit/export, class catalogue export and knowledge-base manifest export.");
})().catch(error=>{console.error(error);process.exitCode=1;});
