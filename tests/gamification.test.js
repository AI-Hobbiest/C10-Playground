"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const context={window:{},Date,Math,Number,String,Array,Object,JSON};
context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync("js/gamification.js","utf8"),context);
const model=context.window.C10Gamification;
const now=new Date(2026,9,25,12,0,0);
const makeAttempt=(id,subject,daysAgo,score,max,status="submitted")=>{
 const date=new Date(now);date.setDate(date.getDate()-daysAgo);
 return {attemptId:id,subjectId:subject,startedAt:date.toISOString(),submittedAt:date.toISOString(),
  status,score,maxScore:max,correctCount:score,questionCount:max};
};
assert.equal(model.xpFor(makeAttempt("a","mathematics",0,8,10)),10+16+5);
assert.equal(model.xpFor(makeAttempt("b","mathematics",0,10,10)),10+20+5+10);
assert.equal(model.xpFor(makeAttempt("c","mathematics",0,2,10,"abandoned")),0);
assert.equal(model.levelFor(0).level,1);
assert.equal(model.levelFor(100).level,2);
assert.equal(model.levelFor(250).level,3);
assert.equal(model.levelFor(250).progressPercent,0);
assert.equal(model.levelFor(300).progressPercent,25);
assert.equal(model.levelFor(3000).maxLevel,true);

const attempts=[
 makeAttempt("a","mathematics",0,9,10),
 makeAttempt("b","english",1,10,10),
 makeAttempt("c","science",2,5,10)
];
const result=model.calculate(attempts,now);
assert.equal(result.attempts,3);
assert.ok(result.xp>0);
assert.equal(result.streak.current,3);
assert.equal(result.streak.best,3);
assert.equal(result.activeSubjects,3);
assert.equal(result.last10.length,3);
assert.equal(result.earnedBadges>=3,true);
assert.ok(result.badges.some(badge=>badge.id==="first-step"&&badge.earned));
assert.ok(result.subjectStats.some(item=>item.id==="mathematics"&&item.accuracy===90));
assert.equal(result.streak.last7.length,7);

const nav=fs.readFileSync("js/app-shell.js","utf8");
assert.ok(nav.includes("./dashboard.html"));
assert.ok(nav.includes("./dashboard.html#rewards"));
const css=fs.readFileSync("css/app-shell.css","utf8");
assert.ok(css.includes("@media(max-width:1100px)"),"tablet layouts switch to the compact navigation");
assert.ok(css.includes(".c10-sidebar a.c10-nav-link:visited"),"global anchor theme cannot reduce sidebar link contrast");
assert.ok(css.includes(".c10-sidebar.open"));
console.log("Gamification tests passed: XP calculations, level thresholds, streaks, subjects, badges, graph inputs and responsive navigation contracts.");
