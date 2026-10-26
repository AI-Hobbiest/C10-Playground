/* Starter student account lookup for the public GitHub Pages MVP.
 * This is convenience identity only, not secure authentication. Every account hash
 * is public, and client-side verification can be bypassed.
 */
(() => {
  "use strict";
  const FILE = "./data/student-accounts.json";
  const SESSION_KEY = "c10playground_static_student_v1";
  const DEFAULT_ITERATIONS = 600000;
  function decodeBase64(value) {
    const binary = atob(String(value || ""));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
  function encodeBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function equalHash(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
    let mismatch = 0;
    for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
    return mismatch === 0;
  }
  async function loadDatabase() {
    const response = await fetch(FILE, { cache: "no-store" });
    if (!response.ok) throw new Error("Student account file could not be loaded. Please try again later.");
    const data = await response.json();
    if (!data || data.schemaVersion !== 1 || data.kind !== "c10-student-accounts" || !Array.isArray(data.accounts)) {
      throw new Error("Student account file is invalid. Ask the administrator to republish it.");
    }
    return data;
  }
  async function deriveHash(password, saltText, iterations) {
    if (!window.crypto || !window.crypto.subtle) throw new Error("This browser does not support the required password-hashing feature.");
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({
      name: "PBKDF2", salt: decodeBase64(saltText), iterations, hash: "SHA-256"
    }, key, 256);
    return encodeBase64(new Uint8Array(bits));
  }
  function accountPublicView(row) { return { username: row.username, role: "student", classId: String(row.classId || "10") }; }
  function readSession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (!value || typeof value.username !== "string") return null;
      return { username: value.username, role: "student", classId: String(value.classId || "10") };
    } catch (_) { return null; }
  }
  async function login(usernameInput, password) {
    const username = String(usernameInput || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || typeof password !== "string" || !password) {
      throw new Error("Enter a valid username and password.");
    }
    const database = await loadDatabase();
    const account = database.accounts.find(item => String(item.username || "").toLowerCase() === username && item.active !== false);
    if (!account || !account.salt || !account.passwordHash) throw new Error("Invalid username or password.");
    const iterations = Number(account.iterations || database.defaultIterations || DEFAULT_ITERATIONS);
    if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 2000000) {
      throw new Error("This account has an invalid password-hash configuration. Ask the administrator to reset it.");
    }
    const calculated = await deriveHash(password, account.salt, iterations);
    if (!equalHash(calculated, account.passwordHash)) throw new Error("Invalid username or password.");
    const user = accountPublicView(account);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, classId: user.classId }));
    return { account: user };
  }
  async function restoreSession() {
    const current = readSession();
    if (!current) return null;
    try {
      const database = await loadDatabase();
      const account = database.accounts.find(item => String(item.username || "").toLowerCase() === current.username.toLowerCase() && item.active !== false);
      if (!account) { logout(); return null; }
      return accountPublicView(account);
    } catch (_) { return current; }
  }
  function logout() { sessionStorage.removeItem(SESSION_KEY); }
  window.C10StudentAuth = Object.freeze({ loadDatabase, login, currentUser: readSession, restoreSession, logout });
})();
