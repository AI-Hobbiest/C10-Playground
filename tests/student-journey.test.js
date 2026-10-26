"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto, pbkdf2Sync, randomBytes } = require("node:crypto");

const username = "learner.demo";
const password = "ClassroomOnly-42!";
const iterations = 10000;
const salt = randomBytes(16);
const passwordHash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64");
const database = {
  schemaVersion: 1,
  kind: "c10-student-accounts",
  kdf: "PBKDF2-SHA-256",
  defaultIterations: iterations,
  accounts: [
    { username, classId: "10", active: true, salt: salt.toString("base64"), passwordHash, iterations },
    { username: "inactive.demo", classId: "9", active: false, salt: salt.toString("base64"), passwordHash, iterations }
  ]
};
const sessionValues = new Map();
const sessionStorage = {
  getItem: key => sessionValues.has(key) ? sessionValues.get(key) : null,
  setItem: (key, value) => sessionValues.set(key, String(value)),
  removeItem: key => sessionValues.delete(key)
};
const context = {
  window: { crypto: webcrypto },
  crypto: webcrypto,
  sessionStorage,
  fetch: async path => {
    assert.equal(path, "./data/student-accounts.json", "login loads the published student account file");
    return { ok: true, json: async () => database };
  },
  atob, btoa, TextEncoder, Uint8Array, JSON, Object, Array, String, Number, Math, TypeError,
  console
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/student-auth.js", "utf8"), context);
const auth = context.window.C10StudentAuth;

(async () => {
  const loggedIn = await auth.login("  LEARNER.DEMO  ", password);
  assert.deepEqual(JSON.parse(JSON.stringify(loggedIn.account)), {
    username, role: "student", classId: "10"
  }, "student can sign in case-insensitively and sees the assigned class");
  assert.ok(sessionStorage.getItem("c10playground_static_student_v1"), "login persists a same-browser session");
  assert.equal((await auth.restoreSession()).username, username, "refresh restores the published student account");
  await assert.rejects(() => auth.login(username, "wrong-password"), /Invalid username or password/);
  await assert.rejects(() => auth.login("inactive.demo", password), /Invalid username or password/);
  auth.logout();
  assert.equal(auth.currentUser(), null, "sign-out clears the session");
  assert.equal(await auth.restoreSession(), null, "a signed-out student cannot restore a session");
  console.log("Student journey auth checks passed: published account lookup, PBKDF2 password verification, class assignment, session restore, wrong-password rejection, inactive-account rejection and sign-out. Quiz completion, refresh recovery and result persistence are covered by quiz-engine.test.js.");
})().catch(error => { console.error(error); process.exitCode = 1; });
