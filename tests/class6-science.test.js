"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const bank=JSON.parse(fs.readFileSync("data/class-6-science.json","utf8"));
assert.equal(bank.length,12,"Class 6 Science follows all 12 NCERT Curiosity chapters");
assert.equal(bank.reduce((sum,chapter)=>sum+chapter.questions.length,0),1200,"Science bank includes 100 MCQs per chapter");
const prompts=new Set(),ids=new Set();
for(const chapter of bank){
  assert.ok(chapter.title,"every chapter has a title");
  assert.ok(Array.isArray(chapter.questions)&&chapter.questions.length===100,"each Science chapter has 100 questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"question ID, prompt and explanation are present");
    assert.ok(!ids.has(question.id),"question IDs are unique");
    ids.add(question.id);
    assert.equal(question.options.length,4,"each MCQ has four options");
    assert.equal(new Set(question.options).size,4,"each MCQ has four distinct options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"answer index is valid");
    assert.ok(!prompts.has(question.question),"question prompts are unique");
    prompts.add(question.question);
  }
}
const mathBank=JSON.parse(fs.readFileSync("data/class-6-mathematics.json","utf8"));
assert.equal(mathBank.length,10,"Class 6 Mathematics follows all 10 Ganita Prakash chapters");
assert.equal(mathBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),1000,"Mathematics bank includes 100 MCQs per chapter");
for(const chapter of mathBank){
  assert.ok(chapter.title,"every Mathematics chapter has a title");
  assert.equal(chapter.questions.length,100,"each Mathematics chapter has 100 questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"question ID, prompt and explanation are present");
    assert.equal(question.options.length,4,"each Mathematics MCQ has four options");
    assert.equal(new Set(question.options).size,4,"each Mathematics MCQ has four distinct options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"Mathematics answer index is valid");
  }
}
const catalog=JSON.parse(fs.readFileSync("data/classes.json","utf8"));
assert.deepEqual(catalog.classes.find(row=>row.classId==="6").subjects,["science","mathematics"],"Class 6 is configured for Science and Mathematics");
assert.deepEqual(catalog.classes.find(row=>row.classId==="10").subjects,["science","mathematics","english","social-science","hindi"],"Class 10 subjects remain unchanged");
const context={window:{}};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync("js/question-bank.js","utf8"),context,{filename:"js/question-bank.js"});
const normalized=context.window.C10QuestionBank.normalize(bank,"class-6-science");
const questions=normalized.flatMap(chapter=>chapter.questions);
assert.equal(questions.length,1200);
assert.equal(new Set(questions.map(question=>question.questionKey)).size,1200,"Class 6 Science question keys are unique");
const normalizedMath=context.window.C10QuestionBank.normalize(mathBank,"class-6-mathematics");
const mathQuestions=normalizedMath.flatMap(chapter=>chapter.questions);
assert.equal(mathQuestions.length,1000);
assert.equal(new Set(mathQuestions.map(question=>question.questionKey)).size,1000,"Class 6 Mathematics question keys are unique");
for(const question of questions)assert.ok(question.options.includes(question.options[question.answer])&&question.explanation);
const engine=fs.readFileSync("js/quiz-engine.js","utf8");
assert.ok(engine.includes('classId === "6" && ["science","mathematics"].includes(subject) ? "class-6-" + subject : subject'),"Class 6 Science and Mathematics select class-specific JSON banks");
assert.ok(engine.includes('sessionStorage.getItem("c10playground_static_student_v1")'),"quiz engine reads the same static student session as the navigation");
assert.ok(engine.includes('recordId:bankId'),"progress and attempts are isolated by class-specific bank");
assert.ok(engine.includes('fetch("./data/"+bankId+".json"'),"the shared engine loads the selected class bank");
console.log("Class 6 banks passed: Science 12 chapters/1,200 MCQs, Mathematics 10 chapters/1,000 MCQs, unique IDs and question keys, valid MCQ structures and class-specific routing.");
