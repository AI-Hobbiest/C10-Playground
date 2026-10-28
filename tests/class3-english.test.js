"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");

const bank = JSON.parse(fs.readFileSync("data/class-3-english.json", "utf8"));
const expectedTitles = [
  "Colours", "Badal and Moti", "Best Friends", "Out in the Garden",
  "Talking Toys", "Paper Boats", "The Big Laddoo", "Thank God",
  "Madhu’s Wish", "Night", "Chanda Mama Counts the Stars", "Chandrayaan"
];
assert.equal(bank.length, 12, "Santoor has 12 chapters");
assert.deepEqual(bank.map(c => c.title), expectedTitles, "chapter titles and order match Santoor");

const ids = new Set();
const stems = new Set();
const positions = [0, 0, 0, 0];
for (const [i, chapter] of bank.entries()) {
  assert.equal(chapter.chapter_no, i + 1);
  assert.ok(chapter.key && chapter.section, "chapter metadata is present");
  assert.equal(chapter.questions.length, 10, chapter.title + " has 10 questions in the initial bank");
  for (const q of chapter.questions) {
    assert.match(q.id, /^c3e\\d{2}q\\d{3}$/);
    assert.ok(!ids.has(q.id), "question IDs are unique");
    ids.add(q.id);
    const stem = q.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    assert.ok(!stems.has(stem), "question stems are unique: " + q.question);
    stems.add(stem);
    assert.equal(q.options.length, 4, "four options per question");
    assert.equal(new Set(q.options).size, 4, "options are distinct");
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, "answer index is valid");
    assert.ok(q.explanation && q.explanation.length >= 5, "explanation is present");
    assert.ok(["Easy", "Medium", "Challenge"].includes(q.difficulty), "difficulty is supported");
    positions[q.answer]++;
  }
}
assert.equal(ids.size, 120);
assert.deepEqual(positions, [30, 30, 30, 30], "answer positions are balanced");

const classCatalog = JSON.parse(fs.readFileSync("data/classes.json", "utf8"));
assert.deepEqual(classCatalog.classes.find(c => c.classId === "3").subjects, ["mathematics", "english"]);
console.log("Class 3 English bank checks passed: 12 chapters, 120 MCQs.");
