"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const bank=JSON.parse(fs.readFileSync("_site/data/science.json","utf8"));
assert.equal(bank.length,14,"Science bank keeps all 14 chapter sets");
const rawCount=bank.reduce((total,chapter)=>total+chapter.questions.length,0);
assert.equal(rawCount,1400,"Science bank keeps all 1,400 questions");
for(const chapter of bank){
  assert.ok(chapter.title,"every Science chapter has a title");
  assert.ok(Array.isArray(chapter.questions)&&chapter.questions.length>0,"every Science chapter has questions");
  for(const question of chapter.questions){
    assert.ok(question.question,"question text is retained");
    assert.equal(question.options.length,4,"each Science MCQ has four options");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"correct answer index is valid");
    assert.ok(question.explanation,"every MCQ has a usable explanation");
  }
}

const context={window:{}};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/question-bank.js","utf8"),context,{filename:"js/question-bank.js"});
const chapters=context.window.C10QuestionBank.normalize(bank,"science");
assert.equal(chapters.length,14,"shared question-bank normalizer accepts Science");
const questions=chapters.flatMap(chapter=>chapter.questions);
assert.equal(questions.length,1400,"all Science questions normalize into shared shape");
assert.equal(new Set(questions.map(question=>question.questionKey)).size,1400,"Science question keys are stable and unique");
for(const question of questions){
  assert.equal(question.options.length,4);
  assert.ok(question.optionIds.includes(question.correctOptionId),"correct option ID survives option shuffling");
  assert.ok(question.answer>=0&&question.answer<4);
  assert.ok(question.explanation);
}

const engine=fs.readFileSync("js/quiz-engine.js","utf8");
assert.ok(engine.includes('science: { title:"Science"'),"shared quiz engine registers Science");
const route=fs.readFileSync("science.html","utf8");
assert.ok(route.includes("practice.html?subject=science"),"legacy Science URL forwards to the common practice page");
console.log("Science integration passed: 14 chapters, 1,400 MCQs, shared normalization, unique question keys, correct-option mapping and legacy route.");
