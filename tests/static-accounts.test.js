"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const database = JSON.parse(fs.readFileSync("data/student-accounts.json", "utf8"));
const auth = fs.readFileSync("js/student-auth.js", "utf8");
const adminTool = fs.readFileSync("js/static-account-admin.js", "utf8");
const profile = fs.readFileSync("profile.html", "utf8");
const admin = fs.readFileSync("admin.html", "utf8");
const workflow = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const manager = fs.readFileSync("js/profile-manager.js", "utf8");
assert.equal(database.kind, "c10-student-accounts");
assert.equal(database.schemaVersion, 1);
assert.equal(database.kdf, "PBKDF2-SHA-256");
// The MVP intentionally carries one Class 10 and one Class 6 pilot account for manual class-isolation testing.
assert.equal(database.accounts.length, 2, "publish only the two intentional pilot accounts");
const class10Account = database.accounts.find(account => account.username === "jp10");
const class6Account = database.accounts.find(account => account.username === "c6pilot");
assert.ok(class10Account, "Class 10 test account should remain available");
assert.ok(class6Account, "Class 6 pilot account should be published");
assert.equal(String(class10Account.classId), "10");
assert.equal(String(class6Account.classId), "6");
for (const testAccount of [class10Account, class6Account]) {
  assert.equal(testAccount.active, true);
  assert.ok(testAccount.salt && testAccount.passwordHash && Number(testAccount.iterations) >= 10000,
    "test account must use a salted password hash");
}
assert.ok(auth.includes('name: "PBKDF2"') && auth.includes('hash: "SHA-256"'));
assert.ok(auth.includes("window.C10StudentAuth"));
assert.ok(adminTool.includes("passwordHash: await hashPassword(password, salt)"));
assert.ok(adminTool.includes('anchor.download = "student-accounts.json"'));
assert.ok(profile.includes('./js/student-auth.js'));
assert.ok(!profile.includes('./js/api-config.js') && !profile.includes('./js/api-client.js'));
assert.ok(profile.includes('id="studentLoginUsername"') && profile.includes('id="studentLoginPassword"'));
assert.ok(manager.includes("Progress stays in this browser"));
for (const id of ["createStaticAccountBtn","resetStaticAccountBtn","staticAccountTempPassword","staticAccountsTable"]) {
  assert.ok(admin.includes('id="' + id + '"'), "Admin account tool missing " + id);
}
assert.ok(admin.includes("not secure authentication"));
assert.ok(workflow.includes("cp js/student-auth.js _site/js/student-auth.js"));
assert.ok(workflow.includes("cp js/static-account-admin.js _site/js/static-account-admin.js"));
console.log("Static account contract tests passed: single JP test account, salted PBKDF2 hash, local-only login and admin export/reset.");
