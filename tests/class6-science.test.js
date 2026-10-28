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
const socialBank=JSON.parse(fs.readFileSync("data/class-6-social-science.json","utf8"));
assert.equal(socialBank.length,14,"Class 6 Social Science follows the 14 NCERT Exploring Society chapters");
assert.equal(socialBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),1400,"Class 6 Social Science includes 100 MCQs per chapter");
const socialPrompts=new Set(),socialIds=new Set();
for(const chapter of socialBank){
  assert.ok(chapter.title,"every Social Science chapter has a title");
  assert.equal(chapter.questions.length,100,"each Social Science chapter has 100 questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"Social Science question ID, prompt and explanation are present");
    assert.ok(!socialIds.has(question.id),"Social Science question IDs are unique");
    socialIds.add(question.id);
    assert.equal(question.options.length,4,"each Social Science MCQ has four options");
    assert.equal(new Set(question.options).size,4,"each Social Science MCQ has four distinct options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"Social Science answer index is valid");
    assert.ok(!socialPrompts.has(question.question),"Social Science prompts are unique");
    socialPrompts.add(question.question);
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
assert.deepEqual(catalog.classes.find(row=>row.classId==="6").subjects,["science","mathematics","english","social-science"],"Class 6 is configured for Science, Mathematics, English and Social Science");
assert.deepEqual(catalog.classes.find(row=>row.classId==="10").subjects,["science","mathematics","english","social-science","hindi"],"Class 10 subjects remain unchanged");
const context={window:{}};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync("js/question-bank.js","utf8"),context,{filename:"js/question-bank.js"});
const normalized=context.window.C10QuestionBank.normalize(bank,"class-6-science");
const questions=normalized.flatMap(chapter=>chapter.questions);
assert.equal(questions.length,1200);
assert.equal(new Set(questions.map(question=>question.questionKey)).size,1200,"Class 6 Science question keys are unique");
const normalizedSocial=context.window.C10QuestionBank.normalize(socialBank,"class-6-social-science");
const socialQuestions=normalizedSocial.flatMap(chapter=>chapter.questions);
assert.equal(socialQuestions.length,1400);
assert.equal(new Set(socialQuestions.map(question=>question.questionKey)).size,1400,"Class 6 Social Science question keys are unique");

const englishBank=JSON.parse(fs.readFileSync("data/class-6-english.json","utf8"));
assert.equal(englishBank.length,16,"Class 6 English follows the 16 reading pieces in Poorvi (2026-27)");
assert.equal(englishBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),1600,"Class 6 English includes 100 MCQs per reading piece");
const englishPrompts=new Set(),englishIds=new Set();
for(const chapter of englishBank){
  assert.ok(chapter.title,"every English topic has a title");
  assert.equal(chapter.questions.length,100,"each English topic has 100 questions");
  assert.ok(chapter.section&&chapter.section.startsWith("Unit "),"each English topic records the source unit");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"English question ID, prompt and explanation are present");
    assert.ok(!englishIds.has(question.id),"English question IDs are unique");englishIds.add(question.id);
    assert.equal(question.options.length,4,"each English MCQ has four options");
    assert.equal(new Set(question.options).size,4,"each English MCQ has four distinct options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"English answer index is valid");
    assert.ok(!englishPrompts.has(question.question),"English question stems are unique");englishPrompts.add(question.question);
  }
}


const normalizedEnglish=context.window.C10QuestionBank.normalize(englishBank,"class-6-english");
const englishQuestions=normalizedEnglish.flatMap(chapter=>chapter.questions);
assert.equal(englishQuestions.length,1600);
assert.equal(new Set(englishQuestions.map(question=>question.questionKey)).size,1600,"Class 6 English question keys are unique");

const normalizedMath=context.window.C10QuestionBank.normalize(mathBank,"class-6-mathematics");
const mathQuestions=normalizedMath.flatMap(chapter=>chapter.questions);
assert.equal(mathQuestions.length,1000);
assert.equal(new Set(mathQuestions.map(question=>question.questionKey)).size,1000,"Class 6 Mathematics question keys are unique");
for(const question of questions)assert.ok(question.options.includes(question.options[question.answer])&&question.explanation);
const engine=fs.readFileSync("js/quiz-engine.js","utf8");
assert.ok(engine.includes('classId === "6" && ["science","mathematics","english","social-science"].includes(subject) ? "class-6-" + subject : subject'),"Class 6 Science, Mathematics, English and Social Science select class-specific JSON banks");
assert.ok(engine.includes('sessionStorage.getItem("c10playground_static_student_v1")'),"quiz engine reads the same static student session as the navigation");
assert.ok(engine.includes('recordId:bankId'),"progress and attempts are isolated by class-specific bank");
assert.ok(engine.includes('fetch("./data/"+bankId+".json"'),"the shared engine loads the selected class bank");
console.log("Class 6 banks passed: Science 12/1,200, Mathematics 10/1,000, English 16/1,600, Social Science 14/1,400; unique IDs, question keys, valid MCQ structures and class-specific routing.");
