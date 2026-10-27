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
// Keep the two original pilot accounts plus the newly approved Class 6 and Class 10 student accounts.
assert.equal(database.accounts.length, 4, "publish the two original and two new pilot accounts");
const expectedAccounts = [
  ["jp10", "10"],
  ["c6pilot", "6"],
  ["srivatsav", "6"],
  ["sonaakshi", "10"]
];
for (const [username, classId] of expectedAccounts) {
  const testAccount = database.accounts.find(account => account.username === username);
  assert.ok(testAccount, "Expected pilot account should remain available: " + username);
  assert.equal(String(testAccount.classId), classId, "Class assignment should match for " + username);
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
console.log("Static account contract tests passed: four assigned pilot accounts, salted PBKDF2 hashes, local-only login and admin export/reset.");
