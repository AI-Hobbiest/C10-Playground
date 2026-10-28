"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const bank = JSON.parse(fs.readFileSync("data/class-3-mathematics.json", "utf8"));
const expectedTitles = [
  "What’s in a Name?", "Toy Joy", "Double Century", "Vacation with My Nani Maa",
  "Fun with Shapes", "House of Hundreds - I", "Raksha Bandhan", "Fair Share",
  "House of Hundreds - II", "Fun at Class Party!", "Filling and Lifting",
  "Give and Take", "Time Goes On", "The Surajkund Fair"
];
assert.equal(bank.length, 14, "Maths Mela has 14 chapters");
assert.deepEqual(bank.map(chapter => chapter.title), expectedTitles, "chapter titles and sequence match Maths Mela");
assert.equal(bank.reduce((sum, chapter) => sum + chapter.questions.length, 0), 1400, "the first version targets 100 MCQs per chapter");

const ids = new Set();
const stems = new Set();
const answerPositions = [0, 0, 0, 0];
const difficulty = { Easy: 0, Medium: 0, Challenge: 0 };
for (const [chapterIndex, chapter] of bank.entries()) {
  assert.equal(chapter.chapter_no, chapterIndex + 1);
  assert.ok(chapter.key && chapter.section, "chapter metadata is present");
  assert.equal(chapter.questions.length, 100, chapter.title + " contains 100 questions");
  for (const question of chapter.questions) {
    assert.match(question.id, /^c3m\d{2}q\d{3}$/);
    assert.ok(!ids.has(question.id), "question IDs are unique");
    ids.add(question.id);
    const stem = question.question.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9₹:]+/g, " ").trim();
    assert.ok(!stems.has(stem), "question stems are unique: " + question.question);
    stems.add(stem);
    assert.equal(question.options.length, 4, "every MCQ has four options");
    assert.equal(new Set(question.options).size, 4, "options within each MCQ are distinct");
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, "answer index is valid");
    assert.ok(question.explanation && question.explanation.length >= 5, "answer explanation is present");
    assert.equal(/the textbook uses .* in this context; the correct choice is/i.test(question.explanation), false, "avoid generic explanation filler");
    assert.ok(Object.prototype.hasOwnProperty.call(difficulty, question.difficulty), "difficulty label is supported");
    difficulty[question.difficulty]++;
    answerPositions[question.answer]++;
  }
}
assert.equal(ids.size, 1400);
assert.deepEqual(answerPositions, [350, 350, 350, 350], "correct-answer positions are balanced");
assert.deepEqual(difficulty, { Easy: 560, Medium: 560, Challenge: 280 }, "difficulty is distributed 40/40/20 per chapter");

const questionsIn = title => bank.find(chapter => chapter.title === title).questions;
assert.ok(questionsIn("Toy Joy").some(q => /six equal square faces/i.test(q.question) && q.options[q.answer] === "Cube"), "Toy Joy covers solid-shape properties");
assert.ok(questionsIn("Double Century").some(q => /comes immediately before|comes immediately after|number line/i.test(q.question)), "Double Century covers counting and number-line ideas");
assert.ok(questionsIn("Fun with Shapes").some(q => /straight sides|corners/i.test(q.question)), "Fun with Shapes covers sides and corners");
assert.ok(questionsIn("Raksha Bandhan").some(q => /equal groups|Rakhis|rows of/i.test(q.question)), "Raksha Bandhan covers multiplication as equal groups");
assert.ok(questionsIn("Fair Share").some(q => /one-quarter/i.test(q.question) && /four equal parts/i.test(q.explanation)), "Fair Share reinforces quarter as one of four equal parts");
assert.ok(questionsIn("Fun at Class Party!").some(q => /half-metre/i.test(q.question)), "Class Party covers half-metre measurement");
assert.ok(questionsIn("Filling and Lifting").some(q => /quarter-litre/i.test(q.question)), "Filling and Lifting covers capacity units");
assert.ok(questionsIn("Give and Take").some(q => /₹/.test(q.question) && /change/i.test(q.question)), "Give and Take covers money and change");
assert.ok(questionsIn("Time Goes On").some(q => /60 minutes/i.test(q.explanation)), "Time Goes On covers hour-to-minute conversion");
assert.ok(questionsIn("The Surajkund Fair").some(q => /symmetr/i.test(q.question + " " + q.explanation)), "Surajkund Fair covers symmetry");


const allQuestions = bank.flatMap(chapter => chapter.questions);
assert.equal(allQuestions.filter(q => /\\b1 (?:metres|litres|kilograms|tens|ones)\\b/i.test(q.question + " " + q.explanation)).length, 0,
  "singular quantities and place-value language use correct grammar");
assert.equal(allQuestions.filter(q => /\\bsymmetrical\\s+symmetrical\\b/i.test(q.question)).length, 0,
  "question text does not repeat words accidentally");
assert.equal(allQuestions.filter(q => /\\ba dice\\b/i.test(q.question + " " + q.explanation)).length, 0,
  "singular die is not incorrectly written as 'a dice'");
const fairQuestions = questionsIn("The Surajkund Fair");
assert.ok(fairQuestions.some(q => /line of symmetry/i.test(q.question)), "Surajkund Fair includes a line-of-symmetry concept");
assert.ok(fairQuestions.some(q => /mala/i.test(q.question)), "Surajkund Fair includes symmetrical mala patterns");
assert.ok(fairQuestions.some(q => /map key|map legend/i.test(q.question)), "Surajkund Fair includes map symbols and keys");
assert.ok(fairQuestions.some(q => /maze/i.test(q.question)), "Surajkund Fair includes maze route reasoning");
assert.ok(fairQuestions.some(q => /tiling|tiles cover/i.test(q.question)), "Surajkund Fair includes tiling");
const fairNormalizedStems = new Set(fairQuestions.map(q => q.question.toLowerCase().replace(/\\d+/g, "#").replace(/[^a-z0-9#]+/g, " ").trim()));
assert.ok(fairNormalizedStems.size >= 75, "Surajkund Fair exercises varied question stems rather than a few copied templates");

const catalogue = JSON.parse(fs.readFileSync("data/classes.json", "utf8"));
const class3 = catalogue.classes.find(item => String(item.classId) === "3");
assert.ok(class3 && class3.active && class3.subjects.includes("mathematics"), "Class 3 Mathematics appears in the catalogue");
const admin = fs.readFileSync("js/admin-manager.js", "utf8");
assert.ok(admin.includes('path:"class-3-mathematics.json"'), "Admin Question Banks lists the Class 3 Mathematics bank");
const engine = fs.readFileSync("js/quiz-engine.js", "utf8");
assert.ok(engine.includes('const bankId = classId === "10" ? subject : "class-" + classId + "-" + subject'), "non-Class-10 classes use their own bank files");
assert.ok(engine.includes('"3":["mathematics"]'), "Class 3 only exposes Mathematics until more banks are published");
assert.ok(engine.includes('if(!(CLASS_SUBJECTS[classId]||[]).includes(subject))'), "unpublished subject links are blocked rather than falling through to Class 10");

const dashboard = fs.readFileSync("dashboard.html", "utf8");
assert.ok(dashboard.includes('id="subjectLaunchCards"'), "dashboard uses class-aware subject launch cards");
const dashboardScript = fs.readFileSync("js/dashboard-manager.js", "utf8");
assert.ok(dashboardScript.includes('async function renderSubjectLaunches()'), "dashboard checks the logged-in class and bank inventory");

const context = { window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/question-bank.js", "utf8"), context, { filename: "js/question-bank.js" });
const normalized = context.window.C10QuestionBank.normalize(bank, "class-3-mathematics");
assert.equal(normalized.flatMap(chapter => chapter.questions).length, 1400, "all questions load through the shared runtime normalizer");

console.log("Class 3 Mathematics checks passed: 14 Maths Mela chapters, 1,400 MCQs, distinct stems and options, balanced answer positions, explanations, concept coverage, class-aware routing and Admin/dashboard integration.");
