"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context={window:{},Date,Math,JSON,Object,Array,String,RegExp};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/profile-model.js","utf8"),context);
const model=context.window.C10ProfileModel;

assert.equal(model.statesAndUTs.filter(item=>item.type==="State").length,28);
assert.equal(model.statesAndUTs.filter(item=>item.type==="Union Territory").length,8);
assert.ok(model.statesAndUTs.some(item=>item.name==="Tamil Nadu"));
assert.ok(model.statesAndUTs.some(item=>item.name==="Delhi"));
assert.ok(!model.statesAndUTs.some(item=>item.name==="Dubai"));

const normalized=model.normalizeProfile({profileId:"12345678-aaaa-bbbb-cccc-123456789012",displayName:"Learner 01",school:"Example School",classLevel:"10",city:"Chennai",state:"Tamil Nadu"});
assert.equal(normalized.studentId,"C10-12345678");
assert.equal(normalized.classLevel,"10");
assert.equal(model.validateProfile(normalized),true);
assert.equal(model.validateProfile({...normalized,displayName:""}),false);
assert.equal(model.validateProfile({...normalized,state:"Dubai"}),false);
assert.equal(model.validateProfile({...normalized,classLevel:"5"}),false);

const backup={
 schemaVersion:1,kind:"c10-playground-backup",exportedAt:"2026-10-25T10:00:00.000Z",
 profile:normalized,
 subjectData:{
  mathematics:{progress:{missed:[],answered:2,correct:1,attempts:[]},ledger:{attempts:[],activeAttempt:null,answerRecords:[]}},
  english:{progress:{missed:[],answered:0,correct:0,attempts:[]},ledger:{attempts:[],activeAttempt:null,answerRecords:[]}},
  "social-science":{progress:{missed:[],answered:0,correct:0,attempts:[]},ledger:{attempts:[],activeAttempt:null,answerRecords:[]}},
  hindi:{progress:{missed:[],answered:0,correct:0,attempts:[]},ledger:{attempts:[],activeAttempt:null,answerRecords:[]}}
 }
};
assert.equal(model.isValidBackup(backup),true);
assert.equal(model.isValidBackup({...backup,kind:"wrong-kind"}),false);
assert.equal(model.isValidBackup({...backup,profile:{...normalized,school:""}}),false);

const schema=JSON.parse(fs.readFileSync("data/contracts/v1/student-profile.schema.json","utf8"));
for(const required of ["studentId","displayName","school","classLevel","city","state"])assert.ok(schema.required.includes(required));
assert.equal(schema.properties.classLevel.enum.length,7);
for(const name of ["school","city","state"])assert.ok(schema.properties[name]);

new Function(fs.readFileSync("js/profile-manager.js","utf8"));
const page=fs.readFileSync("profile.html","utf8");
assert.ok(page.includes('id="studentId"')&&page.includes('readonly'));
assert.ok(page.includes('id="backupFile"')&&page.includes('type="file"'));
assert.ok(!/type=["']email["']/.test(page));
assert.ok(!/name=["']dateOfBirth["']/.test(page));
assert.ok(!/name=["']section["']/.test(page));
console.log("Profile tests passed: generated Student ID, required profile fields, Indian 28-state/8-UT dropdown, validation, backup envelope checks, and no email/date-of-birth/section inputs.");
