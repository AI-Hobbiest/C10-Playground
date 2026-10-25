"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), "utf8");

function makeContext(seed = {}) {
  const values = new Map(Object.entries(seed));
  const localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const context = { window: {}, localStorage, console, Date, Math, JSON, Object, Array, Number, String, TypeError, Uint8Array, encodeURIComponent };
  context.globalThis = context;
  vm.createContext(context);
  return { context, values, localStorage };
}

// Local storage adapter: migrates old progress into a versioned envelope and keeps import/export portable.
{
  const previous = { missed: ["1:1"], answered: 4, correct: 3, attempts: [{ id: "1:1", correct: true }] };
  const seeded = makeContext({ ["c10playground_v1_mathematics"]: JSON.stringify(previous) });
  vm.runInContext(read("js/storage.js"), seeded.context);
  const storage = seeded.context.window.C10Storage.createLocalStore({
    kind: "subject-progress",
    recordId: "mathematics",
    legacyKey: "c10playground_v1_mathematics",
    defaults: () => ({ missed: [], answered: 0, correct: 0, attempts: [] }),
    validate: v => !!v && Array.isArray(v.missed) && Number.isFinite(v.answered) &&
      Number.isFinite(v.correct) && Array.isArray(v.attempts)
  });
  const migrated = storage.load();
  assert.equal(migrated.answered, 4);
  assert.deepEqual(Array.from(migrated.missed), ["1:1"]);
  assert.equal(seeded.values.has("c10playground_v1_mathematics"), false, "legacy key removed after successful migration");
  const envelope = JSON.parse(seeded.values.get(storage.storageKey));
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.kind, "subject-progress");
  assert.equal(envelope.recordId, "mathematics");
  assert.equal(envelope.data.correct, 3);

  const exported = storage.exportJSON();
  assert.equal(JSON.parse(exported).schemaVersion, 1);
  storage.save({ missed: [], answered: 5, correct: 4, attempts: [] });
  const importedTarget = seeded.context.window.C10Storage.createLocalStore({
    kind: "subject-progress",
    recordId: "restored-profile",
    defaults: () => ({ missed: [], answered: 0, correct: 0, attempts: [] }),
    validate: v => !!v && Array.isArray(v.missed) && Number.isFinite(v.answered) &&
      Number.isFinite(v.correct) && Array.isArray(v.attempts)
  });
  importedTarget.importJSON(exported);
  assert.equal(importedTarget.load().answered, 4);
  assert.throws(() => importedTarget.importJSON("{not json"), /Import must be valid JSON/);
  importedTarget.clear();
  assert.equal(importedTarget.load().answered, 0);
}

// Normalizer: preserves the correct answer through option shuffling and assigns stable question IDs.
{
  const seeded = makeContext();
  vm.runInContext(read("js/question-bank.js"), seeded.context);
  const normalizer = seeded.context.window.C10QuestionBank;
  const legacy = [{
    chapter_no: 1, title: "Real Numbers", key: "real_numbers",
    questions: [{ id: 1, question: "Two plus two?", options: ["5", "4", "3", "6"], answer: 1, explanation: "Two and two make four." }]
  }];
  const legacyQ = normalizer.normalize(legacy, "mathematics")[0].questions[0];
  assert.equal(legacyQ.questionKey, "mathematics/real_numbers/q-1");
  assert.equal(legacyQ.options[legacyQ.answer], "4");

  const canonical = {
    schemaVersion: 1, kind: "question-bank", subjectId: "mathematics", title: "Mathematics",
    chapters: [{
      chapterId: "algebra", chapterNo: 2, title: "Algebra",
      questions: [{
        questionId: "linear-equations-q001", type: "mcq", prompt: "Choose the correct value.",
        options: [{ optionId: "a", text: "10" }, { optionId: "b", text: "12" }],
        correctOptionId: "b", explanation: "The correct value is twelve.", difficulty: "easy"
      }]
    }]
  };
  const canonicalQ = normalizer.normalize(canonical, "mathematics")[0].questions[0];
  assert.equal(canonicalQ.questionKey, "mathematics/algebra/q-linear-equations-q001");
  assert.equal(canonicalQ.options[canonicalQ.answer], "12");
  assert.throws(() => normalizer.normalize({ chapters: [] }, "mathematics"), /legacy chapter array/);
}

// Contract files parse as JSON and expose explicit versions / kinds.
{
  const contractDir = "data/contracts/v1";
  for (const file of [
    "question-bank.schema.json", "question-bank-import.schema.json", "student-profile.schema.json",
    "answer-record.schema.json", "test-attempt.schema.json", "local-store-envelope.schema.json", "backup.schema.json"
  ]) {
    const schema = JSON.parse(read(path.join(contractDir, file)));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema", file + " has a declared JSON Schema version");
    assert.ok(schema.title, file + " has a title");
  }
  const engine = read("js/quiz-engine.js");
  assert.ok(engine.includes("window.C10Storage.createLocalStore"), "quiz engine uses storage adapter");
  assert.ok(engine.includes("window.C10QuestionBank.normalize"), "quiz engine uses shared normalizer");
  assert.ok(!engine.includes("localStorage."), "quiz engine does not access localStorage directly");
  new Function(engine);
}

console.log("Foundation tests passed: versioned storage migration, JSON export/import, legacy and canonical bank normalization, stable IDs, and schema files.");
