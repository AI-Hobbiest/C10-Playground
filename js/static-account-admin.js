/* Local admin utility: creates a downloadable JSON draft; it cannot publish to GitHub. */
(() => {
  "use strict";
  const FILE = "./data/student-accounts.json";
  const ITERATIONS = 600000;
  const $ = id => document.getElementById(id);
  let database = null, dirty = false, classOptions = [];
  const charSet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  function status(message, error=false) {
    const el = $("staticAccountStatus");
    if (!el) return;
    el.textContent = message;
    el.className = "admin-status" + (error ? " error" : "");
  }
  function base64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function randomBytes(length) { const bytes = new Uint8Array(length); crypto.getRandomValues(bytes); return bytes; }
  function makeTemporaryPassword(length=16) {
    let password = "";
    for (const byte of randomBytes(length)) password += charSet[byte % charSet.length];
    return password;
  }
  async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
    return base64(new Uint8Array(bits));
  }
  async function loadDatabase() {
    const response = await fetch(FILE, { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load data/student-accounts.json (HTTP " + response.status + ").");
    const data = await response.json();
    if (!data || data.schemaVersion !== 1 || data.kind !== "c10-student-accounts" || !Array.isArray(data.accounts)) {
      throw new Error("The published account file has an unsupported format.");
    }
    data.accounts.forEach(item => {
      if (!item || !/^[a-z0-9._-]{3,32}$/.test(String(item.username || "")) ||
          !item.salt || !item.passwordHash || !Number.isInteger(Number(item.iterations))) {
        throw new Error("An account record is incomplete. Review student-accounts.json before continuing.");
      }
    });
    return data;
  }
  async function loadClasses() {
    const response = await fetch("./data/classes.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load data/classes.json. Class assignment is required.");
    const data = await response.json();
    if (!data || data.kind !== "class-catalog" || !Array.isArray(data.classes)) throw new Error("The class catalogue is invalid.");
    classOptions = data.classes.filter(item => item.active !== false).map(item => ({id:String(item.classId),label:String(item.label || ("Class "+item.classId))}));
    if (!classOptions.length) throw new Error("No active classes are available.");
    ["staticAccountClass","manageStaticAccountClass"].forEach(id => {
      const field = $(id); if (!field) return;
      const previous = field.value; field.innerHTML = "";
      classOptions.forEach(item => { const option = document.createElement("option"); option.value=item.id; option.textContent=item.label; field.appendChild(option); });
      if (classOptions.some(item => item.id === previous)) field.value = previous;
    });
  }
  function render() {
    const select = $("resetStaticAccountUsername"), chosen = select.value;
    const manageSelect = $("manageStaticAccountUsername"), manageChosen = manageSelect.value;
    select.innerHTML = "";
    if (!database || !database.accounts.length) {
      const option = document.createElement("option"); option.value = ""; option.textContent = "No accounts yet"; select.appendChild(option);
    } else {
      [...database.accounts].sort((a,b)=>a.username.localeCompare(b.username)).forEach(account => {
        const option = document.createElement("option");
        option.value = account.username; option.textContent = account.username + (account.active === false ? " (disabled)" : "");
        select.appendChild(option);
      });
      if ([...select.options].some(option => option.value === chosen)) select.value = chosen;
    }
    if (manageSelect) {
      manageSelect.innerHTML = "";
      if (!database || !database.accounts.length) {
        const option=document.createElement("option");option.value="";option.textContent="No accounts yet";manageSelect.appendChild(option);
      } else {
        [...database.accounts].sort((a,b)=>a.username.localeCompare(b.username)).forEach(account=>{
          const option=document.createElement("option");option.value=account.username;option.textContent=account.username;manageSelect.appendChild(option);
        });
        if ([...manageSelect.options].some(option=>option.value===manageChosen)) manageSelect.value=manageChosen;
      }
      const selected=database&&database.accounts.find(item=>item.username===manageSelect.value);
      const target=$("manageStaticAccountClass");
      if (selected && target && classOptions.some(item=>item.id===String(selected.classId||"10"))) target.value=String(selected.classId||"10");
    }
    const table = $("staticAccountsTable"); table.innerHTML = "";
    if (!database || !database.accounts.length) {
      const empty = document.createElement("div"); empty.className = "admin-empty"; empty.textContent = "No published accounts yet. Create the first account above."; table.appendChild(empty);
    } else {
      const grid = document.createElement("table"); grid.className = "admin-table";
      const head = document.createElement("thead"), header = document.createElement("tr");
      ["Username", "Class", "Status", "Created"].forEach(label => { const cell = document.createElement("th"); cell.textContent = label; header.appendChild(cell); });
      head.appendChild(header); grid.appendChild(head);
      const body = document.createElement("tbody");
      [...database.accounts].sort((a,b)=>a.username.localeCompare(b.username)).forEach(account => {
        const row = document.createElement("tr");
        [account.username, (classOptions.find(item=>item.id===String(account.classId||"10"))||{label:"Class "+String(account.classId||"10")}).label, account.active === false ? "Disabled" : "Active", account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"].forEach(value => {
          const cell = document.createElement("td"); cell.textContent = String(value); row.appendChild(cell);
        });
        body.appendChild(row);
      });
      grid.appendChild(body); table.appendChild(grid);
    }
  }
  function downloadDatabase() {
    const blob = new Blob([JSON.stringify(database, null, 2) + "\n"], {type:"application/json"});
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = "student-accounts.json"; anchor.style.display = "none";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200); dirty = false;
  }
  function showPassword(password) { $("staticAccountTempBox").hidden = false; $("staticAccountTempPassword").value = password; }
  async function createAccount() {
    try {
      if (!classOptions.length) await loadClasses();
      if (!database) database = await loadDatabase();
      const username = $("staticAccountUsername").value.trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error("Use 3–32 characters: lowercase letters, numbers, dot, underscore or hyphen.");
      if (database.accounts.some(item => item.username.toLowerCase() === username)) throw new Error("That username already exists. Use password reset instead.");
      const classId = $("staticAccountClass").value;
      if (!classOptions.some(item=>item.id===classId)) throw new Error("Choose an active class for this student.");
      const password = makeTemporaryPassword(), salt = randomBytes(16);
      database.accounts.push({ username, classId, salt: base64(salt), passwordHash: await hashPassword(password, salt),
        iterations: ITERATIONS, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      database.accounts.sort((a,b)=>a.username.localeCompare(b.username));
      dirty = true; render(); downloadDatabase(); showPassword(password); $("staticAccountUsername").value = "";
      status("Account prepared. Commit the downloaded student-accounts.json to data/student-accounts.json; it is not active until the file is published.");
    } catch (error) { status(error.message || "Unable to create account.", true); }
  }
  async function updateStudentClass() {
    try {
      if (!classOptions.length) await loadClasses();
      if (!database) throw new Error("Load the published account file first.");
      const username=$("manageStaticAccountUsername").value, classId=$("manageStaticAccountClass").value;
      const account=database.accounts.find(item=>item.username===username);
      if (!account) throw new Error("Select an account first.");
      if (!classOptions.some(item=>item.id===classId)) throw new Error("Choose an active class.");
      if (String(account.classId||"10")===classId) { status("This student is already assigned to that class."); return; }
      if (!confirm("Change "+username+" from Class "+String(account.classId||"10")+" to "+(classOptions.find(item=>item.id===classId).label)+"? The student cannot change this assignment themselves.")) return;
      account.classId=classId; account.updatedAt=new Date().toISOString();
      dirty=true; render(); downloadDatabase();
      status("Class assignment updated in the downloaded JSON. The change takes effect only after a maintainer commits it to GitHub and Pages redeploys.");
    } catch(error) { status(error.message||"Unable to update class.",true); }
  }
  async function resetPassword() {
    try {
      if (!database) database = await loadDatabase();
      const username = $("resetStaticAccountUsername").value;
      const account = database.accounts.find(item => item.username === username);
      if (!account) throw new Error("Select an existing account first.");
      if (account.active === false) throw new Error("This account is disabled. Enable it in the JSON file before resetting its password.");
      const password = makeTemporaryPassword(), salt = randomBytes(16);
      account.salt = base64(salt); account.passwordHash = await hashPassword(password, salt);
      account.iterations = ITERATIONS; account.updatedAt = new Date().toISOString();
      dirty = true; downloadDatabase(); showPassword(password);
      status("Password reset prepared. Share the temporary password privately, then commit the downloaded JSON file to data/student-accounts.json.");
    } catch (error) { status(error.message || "Unable to reset password.", true); }
  }
  async function reload() {
    if (dirty && !confirm("Discard account changes that have not been downloaded?")) return;
    try {
      await loadClasses(); database = await loadDatabase(); dirty = false; render();
      status("Loaded " + database.accounts.length + " published account(s). Changes take effect only after a maintainer commits the updated JSON file.");
    } catch (error) { database = null; render(); status(error.message || "Unable to load account file.", true); }
  }
  function init() {
    if (!$("flatFileAccountsPanel")) return;
    $("createStaticAccountBtn").addEventListener("click", createAccount);
    $("resetStaticAccountBtn").addEventListener("click", resetPassword);
    $("updateStaticAccountClassBtn").addEventListener("click", updateStudentClass);
    $("reloadStaticAccountsBtn").addEventListener("click", reload);
    $("copyStaticAccountTempPasswordBtn").addEventListener("click", async () => {
      const password = $("staticAccountTempPassword").value; if (!password) return;
      try { await navigator.clipboard.writeText(password); status("Password copied. Share it only with the intended student."); }
      catch (_) { $("staticAccountTempPassword").focus(); $("staticAccountTempPassword").select(); status("Browser clipboard access was blocked; the password is selected for manual copying."); }
    });
    reload();
    window.addEventListener("beforeunload", event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  }
  init();
})();
