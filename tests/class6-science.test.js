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
assert.deepEqual(catalog.classes.find(row=>row.classId==="6").subjects,["science","mathematics","english","social-science","mathematics-sof","science-sof"],"Class 6 includes CBSE subjects plus separate SOF Mathematics and Science subjects");
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
assert.equal(englishBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),1600,"Class 6 English contains 100 MCQs per reading piece");
const englishPrompts=new Set(),englishIds=new Set();
for(const chapter of englishBank){
  assert.ok(chapter.title,"every English topic has a title");
  assert.equal(chapter.questions.length,100,"each English topic has 100 distinct questions");
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
assert.ok(engine.includes('const bankId = classId === "10" ? subject : "class-" + classId + "-" + subject'),"non-Class-10 learners use class-prefixed question-bank files");
assert.ok(engine.includes('"3":["mathematics"]'),"Class 3 only exposes its published Mathematics bank");
assert.ok(engine.includes('"6":["science","science-sof","mathematics","mathematics-sof","english","social-science"]'),"Class 6 subject banks stay explicitly mapped including Mathematics - SOF");
assert.ok(engine.includes('if(!(CLASS_SUBJECTS[classId]||[]).includes(subject))'),"unpublished class-subject combinations are blocked");
assert.ok(engine.includes('sessionStorage.getItem("c10playground_static_student_v1")'),"quiz engine reads the same static student session as the navigation");
assert.ok(engine.includes('recordId:bankId'),"progress and attempts are isolated by class-specific bank");
assert.ok(engine.includes('fetch("./data/"+bankId+".json"'),"the shared engine loads the selected class bank");


const sofBank=JSON.parse(fs.readFileSync("data/class-6-mathematics-sof.json","utf8"));
assert.equal(sofBank.length,10,"Class 6 SOF IMO bank has ten topic sets");
assert.equal(sofBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),500,"Class 6 SOF IMO bank contains 500 original practice MCQs");
for(const chapter of sofBank)assert.equal(chapter.questions.length,50,"each SOF IMO topic has 50 questions");
const sofIds=new Set(),sofPrompts=new Set();
for(const chapter of sofBank){
  assert.ok(chapter.title&&chapter.questions.length>0,"each SOF topic has questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"SOF question has ID, prompt and explanation");
    assert.ok(!sofIds.has(question.id),"SOF question IDs are unique");sofIds.add(question.id);
    assert.equal(question.options.length,4,"SOF MCQs have four options");
    assert.equal(new Set(question.options).size,4,"SOF MCQ options are distinct");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"SOF answer index is valid");
    assert.ok(!sofPrompts.has(question.question),"SOF prompts are unique");sofPrompts.add(question.question);
  }
}
const normalizedSof=context.window.C10QuestionBank.normalize(sofBank,"class-6-mathematics-sof");
assert.equal(normalizedSof.flatMap(chapter=>chapter.questions).length,500,"SOF bank normalizes through shared engine");
assert.equal(new Set(normalizedSof.flatMap(chapter=>chapter.questions).map(question=>question.questionKey)).size,500,"SOF question keys are unique");
assert.ok(engine.includes('"mathematics-sof": { title:"Mathematics - SOF"'),"SOF has its own named subject entry");


const sofScienceBank=JSON.parse(fs.readFileSync("data/class-6-science-sof.json","utf8"));
assert.equal(sofScienceBank.length,10,"Class 6 SOF NSO bank has ten topic sets");
assert.equal(sofScienceBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),500,"Class 6 SOF NSO bank contains 500 original practice MCQs");
const sofScienceIds=new Set(),sofSciencePrompts=new Set();
for(const chapter of sofScienceBank){
  assert.ok(chapter.title&&chapter.questions.length===50,"each SOF Science topic has fifty questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"SOF Science question has ID, prompt and explanation");
    assert.ok(!sofScienceIds.has(question.id),"SOF Science question IDs are unique");sofScienceIds.add(question.id);
    assert.equal(question.options.length,4,"SOF Science MCQs have four options");
    assert.equal(new Set(question.options).size,4,"SOF Science options are distinct");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"SOF Science answer index is valid");
    assert.ok(!sofSciencePrompts.has(question.question),"SOF Science prompts are unique");sofSciencePrompts.add(question.question);
  }
}
const normalizedSofScience=context.window.C10QuestionBank.normalize(sofScienceBank,"class-6-science-sof");
assert.equal(normalizedSofScience.flatMap(chapter=>chapter.questions).length,500,"SOF Science bank normalizes through shared engine");
assert.equal(new Set(normalizedSofScience.flatMap(chapter=>chapter.questions).map(question=>question.questionKey)).size,500,"SOF Science question keys are unique");
assert.ok(engine.includes('"science-sof": { title:"Science - SOF"'),"SOF Science has its own named subject entry");

const languageFiller = /For a language note connected|correct plural of friend|the chapter’s main idea/i;
assert.equal(englishBank.some(chapter=>chapter.questions.some(question=>languageFiller.test(question.question))),false,"Class 6 English should not contain generic repeated grammar filler");
const explanationFiller=/The textbook uses .* in this context; the correct choice is/i;
assert.equal(englishBank.some(chapter=>chapter.questions.some(question=>explanationFiller.test(question.explanation))),false,"Class 6 English should use informative explanations rather than boilerplate answer-key text");
const ramaChapter=englishBank.find(chapter=>chapter.key==="rama-to-the-rescue");
assert.ok(ramaChapter.questions.some(question=>question.question.includes("Who arrests the robber") && /kotwal/i.test(question.options[question.answer])),"Rama to the Rescue correctly identifies the kotwal as the person who arrests the thief");
const kiteChapter=englishBank.find(chapter=>chapter.key==="the-kites");
assert.ok(kiteChapter.questions.some(question=>question.question.includes("example of alliteration") && question.options[question.answer]==="Stand and stare"),"The Kites correctly identifies stand and stare as alliteration, not rhyme");

const sofEnglishBank=JSON.parse(fs.readFileSync("data/class-6-english-sof.json","utf8"));
assert.equal(sofEnglishBank.length,10,"Class 6 SOF IEO bank has ten topic sets");
assert.equal(sofEnglishBank.reduce((sum,chapter)=>sum+chapter.questions.length,0),500,"Class 6 SOF IEO bank contains 500 practice MCQs");
const sofEnglishIds=new Set(),sofEnglishPrompts=new Set();
for(const chapter of sofEnglishBank){
  assert.equal(chapter.questions.length,50,"each SOF IEO topic has fifty questions");
  for(const question of chapter.questions){
    assert.ok(question.id&&question.question&&question.explanation,"SOF IEO question has ID, prompt and explanation");
    assert.ok(!sofEnglishIds.has(question.id),"SOF IEO question IDs are unique");sofEnglishIds.add(question.id);
    assert.ok(!sofEnglishPrompts.has(question.question),"SOF IEO prompts are unique");sofEnglishPrompts.add(question.question);
    assert.equal(question.options.length,4,"SOF IEO MCQs have four options");
    assert.equal(new Set(question.options).size,4,"SOF IEO options are distinct");
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,"SOF IEO answer index is valid");
  }
}
const normalizedSofEnglish=context.window.C10QuestionBank.normalize(sofEnglishBank,"class-6-english-sof");
assert.equal(normalizedSofEnglish.flatMap(chapter=>chapter.questions).length,500,"SOF English bank normalizes through shared engine");
assert.equal(new Set(normalizedSofEnglish.flatMap(chapter=>chapter.questions).map(question=>question.questionKey)).size,500,"SOF English question keys are unique");
assert.ok(engine.includes('"english-sof": { title:"English - SOF"'),"SOF English has its own named subject entry");
assert.ok(engine.includes('"english","english-sof","social-science"'),"Class 6 English - SOF is included in class-subject routing");

console.log("Class 6 banks passed content review: Science 12/1,200, Mathematics 10/1,000, English 16/320, Social Science 14/1,400; unique IDs, question keys, valid MCQ structures and class-specific routing.");
