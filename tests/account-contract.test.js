"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");

const worker = fs.readFileSync("cloudflare/worker.js", "utf8");
const apiClient = fs.readFileSync("js/api-client.js", "utf8");
const admin = fs.readFileSync("js/admin-manager.js", "utf8");
const profile = fs.readFileSync("profile.html", "utf8");
const schema = fs.readFileSync("cloudflare/schema.sql", "utf8");

assert.ok(profile.includes('id="studentLoginUsername"'), "students see a username field");
assert.ok(profile.includes('id="studentLoginPassword"'), "students sign in with a password");
assert.ok(!profile.includes('id="studentLoginId"'), "Student ID is not the login field");
assert.ok(apiClient.includes("body:{username,password}"), "student login sends username and password only");
assert.ok(worker.includes('if(!username||!password)return fail(request,env,400,"Enter your username and password.")'), "login requires username and password");
assert.ok(worker.includes("WHERE lower(u.username)=? AND u.role='student'"), "server verifies username without requiring Student ID");
assert.ok(worker.includes('if(!/^[a-z0-9._-]{3,32}$/.test(username))'), "server validates username format");
assert.ok(worker.includes('const username=String(body.username||"").trim().toLowerCase()'), "admin creates a separate username");
assert.ok(worker.includes("u.username AS username,p.student_id AS studentId"), "admin reports expose username and Student ID separately");
assert.ok(worker.includes('name:"PBKDF2"') || worker.includes('name: "PBKDF2"'), "passwords are derived with PBKDF2");
assert.ok(worker.includes("failures>=8"), "login attempts are rate-limited");
assert.ok(worker.includes("const chars=[letters[bytes[0]%letters.length],digits[bytes[1]%digits.length]]"), "temporary passwords always contain letters and digits");
assert.ok(schema.includes("username TEXT NOT NULL UNIQUE COLLATE NOCASE"), "database uniquely stores usernames without case sensitivity");
assert.ok(admin.includes("apiReady&&protectedTabs.has(name)&&!isAdminAuthenticated()"), "admin content tabs are gated once the account service is configured");
console.log("Account contract tests passed: admin-only GitHub identity, student username/password, password safeguards and separate Student ID.");
