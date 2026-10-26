"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const bank=JSON.parse(fs.readFileSync("data/class-6-science.json","utf8"));
assert.equal(bank.length,12,"Class 6 Science pilot follows all 12 NCERT Curiosity chapters");
assert.equal(bank.reduce((sum,chapter)=>sum+chapter.questions.length,0),36,"pilot includes 3 MCQs per chapter");
const prompts=new Set();
for(const chapter of bank){
  assert.ok(chapter.title,"every chapter has a title");
  assert.ok(Array.isArray(chapter.questions)&&chapter.questions.length===3,"each pilot chapter has three questions");
  for(const question of chapter.questions){
    assert.ok(question.question&&question.explanation,"question and explanation are present");
    assert.equal(question.options.length,4,"each MCQ has four options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"answer index is valid");
    assert.ok(!prompts.has(question.question),"question prompts are unique");
    prompts.add(question.question);
  }
}
const catalog=JSON.parse(fs.readFileSync("data/classes.json","utf8"));
assert.deepEqual(catalog.classes.find(row=>row.classId==="6").subjects,["science"],"Class 6 is configured for Science only");
assert.deepEqual(catalog.classes.find(row=>row.classId==="10").subjects,["science","mathematics","english","social-science","hindi"],"Class 10 subjects remain unchanged");
const context={window:{}};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync("js/question-bank.js","utf8"),context,{filename:"js/question-bank.js"});
const normalized=context.window.C10QuestionBank.normalize(bank,"class-6-science");
const questions=normalized.flatMap(chapter=>chapter.questions);
assert.equal(questions.length,36);
assert.equal(new Set(questions.map(question=>question.questionKey)).size,36,"Class 6 question keys are unique");
for(const question of questions)assert.ok(question.options.includes(question.options[question.answer])&&question.explanation);
const engine=fs.readFileSync("js/quiz-engine.js","utf8");
assert.ok(engine.includes('classId === "6" && subject === "science" ? "class-6-science" : subject'),"Class 6 Science selects its own JSON bank");
assert.ok(engine.includes('sessionStorage.getItem("c10playground_static_student_v1")'),"quiz engine reads the same static student session as the navigation");
assert.ok(engine.includes('recordId:bankId'),"progress and attempts are isolated by class-specific bank");
assert.ok(engine.includes('fetch("./data/"+bankId+".json"'),"the shared engine loads the selected class bank");
console.log("Class 6 Science pilot passed: 12 chapters, 36 validated MCQs, class configuration and class-specific bank/progress routing.");
