"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class FakeElement {
  constructor(id=""){this.id=id;this.value="";this.textContent="";this.children=[];this.handlers={};this.style={};this.dataset={};this.files=[];this._innerHTML="";this.download="";this.href="";}
  set innerHTML(value){this._innerHTML=String(value);this.children=[];}
  get innerHTML(){return this._innerHTML;}
  appendChild(child){this.children.push(child);return child;}
  append(...children){children.forEach(child=>this.appendChild(child));}
  addEventListener(event,handler){this.handlers[event]=handler;}
  click(){this.clicked=true;if(this.handlers.click)return this.handlers.click({target:this});}
  remove(){this.removed=true;}
}
const uuid="12345678-abcd-4abc-8abc-123456789012";
const seed=new Map();
seed.set("c10playground:store:v1:test-attempt-ledger:mathematics",JSON.stringify({
 schemaVersion:1,kind:"test-attempt-ledger",recordId:"mathematics",updatedAt:"2026-10-25T10:00:00.000Z",
 data:{activeAttempt:null,answerRecords:[],attempts:[{
  schemaVersion:1,kind:"test-attempt",attemptId:"attempt-1",profileId:uuid,subjectId:"mathematics",
  mode:"test",source:{type:"chapter-bank",sourceId:"real-numbers"},questionBankVersion:"1",
  status:"submitted",startedAt:"2026-10-25T10:00:00.000Z",submittedAt:"2026-10-25T10:10:00.000Z",
  durationSeconds:600,timeLimitSeconds:null,score:8,maxScore:10,correctCount:8,questionCount:10,
  answeredCount:10,skippedCount:0,unansweredCount:0,questionIds:[],answerRecordIds:[]
 }]}
}));

const elements={};
const getElementById=id=>elements[id]||(elements[id]=new FakeElement(id));
const body=new FakeElement("body");
const document={body,
  getElementById,
  createElement:tag=>{const e=new FakeElement(tag);e.tagName=String(tag).toUpperCase();return e;}
};
const localStorage={
 getItem:key=>seed.has(key)?seed.get(key):null,
 setItem:(key,value)=>seed.set(key,String(value)),
 removeItem:key=>seed.delete(key)
};
let downloadedBlob=null;
const URLMock={createObjectURL:blob=>{downloadedBlob=blob;return "blob:test-backup";},revokeObjectURL:()=>{}};
const context={
 window:{},document,localStorage,console,Date,Math,JSON,Object,Array,Number,String,RegExp,TypeError,Uint8Array,
 encodeURIComponent,crypto:{randomUUID:()=>uuid},Blob,URL:URLMock,setTimeout:()=>0,confirm:()=>true
};
context.globalThis=context;
vm.createContext(context);
for(const file of ["js/storage.js","js/profile-model.js","js/profile-manager.js"]){
 vm.runInContext(fs.readFileSync(file,"utf8"),context,{filename:file});
}
(async()=>{
 assert.equal(getElementById("studentId").value,"C10-12345678");
 assert.equal(getElementById("state").children.length,37,"placeholder plus 28 states and 8 UTs");
 assert.equal(getElementById("attemptCount").textContent,"1","existing completed attempt is shown");
 assert.equal(getElementById("averageScore").textContent,"80%");
 assert.equal(getElementById("totalTime").textContent,"00:10:00");

 getElementById("displayName").value="Learner One";
 getElementById("school").value="Sample School";
 getElementById("classLevel").value="10";
 getElementById("city").value="Chennai";
 getElementById("state").value="Tamil Nadu";
 await getElementById("profileForm").handlers.submit({preventDefault:()=>{}});
 assert.match(getElementById("pageStatus").textContent,/Profile saved on this device/);
 const profileEnvelope=JSON.parse(seed.get("c10playground:store:v1:local-profile-identity:default"));
 assert.equal(profileEnvelope.data.displayName,"Learner One");
 assert.equal(profileEnvelope.data.school,"Sample School");
 assert.equal(profileEnvelope.data.state,"Tamil Nadu");
 assert.equal(profileEnvelope.data.studentId,"C10-12345678");

 await getElementById("exportBtn").click();
 assert.ok(downloadedBlob,"JSON backup generates a downloadable Blob");
 const backup=JSON.parse(await downloadedBlob.text());
 assert.equal(backup.schemaVersion,1);
 assert.equal(backup.kind,"c10-playground-backup");
 assert.equal(backup.profile.displayName,"Learner One");
 assert.ok(backup.subjectData.mathematics.ledger.attempts.length===1);
 assert.ok(backup.subjectData.english.progress);

 const modified=JSON.parse(JSON.stringify(backup));
 modified.profile.displayName="Restored Learner";
 getElementById("backupFile").files=[{text:async()=>JSON.stringify(modified)}];
 await getElementById("backupFile").handlers.change({target:getElementById("backupFile")});
 const restored=JSON.parse(seed.get("c10playground:store:v1:local-profile-identity:default"));
 assert.equal(restored.data.displayName,"Restored Learner");
 assert.match(getElementById("pageStatus").textContent,/Backup imported successfully/);
 console.log("Profile page integration passed: generated ID, India state/UT list, history rendering, profile save, JSON export, backup import and restore.");
})().catch(error=>{console.error(error);process.exitCode=1;});
