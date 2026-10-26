/* C10 Playground storage boundary — versioned local adapter, ready for remote replacement. */
(() => {
  "use strict";

  const SCHEMA_VERSION = 1;
  const ROOT_KEY = "c10playground:store:v1:";
  const OUTBOX_KEY = "c10playground:sync-outbox:v1";
  const memoryFallback = new Map();
  let syncAdapter = null;
  function readOutbox(){
    try{return JSON.parse(globalThis.localStorage.getItem(OUTBOX_KEY)||"[]");}catch(_){return memoryFallback.has(OUTBOX_KEY)?JSON.parse(memoryFallback.get(OUTBOX_KEY)||"[]"):[];}
  }
  function writeOutbox(items){
    const raw=JSON.stringify(items);
    memoryFallback.set(OUTBOX_KEY,raw);
    try{globalThis.localStorage.setItem(OUTBOX_KEY,raw);return true;}catch(_){return false;}
  }
  function enqueuePending(record){
    const items=readOutbox();
    const key=record.kind+":"+record.recordId;
    const index=items.findIndex(item=>item.key===key);
    const entry={key,kind:record.kind,recordId:record.recordId,schemaVersion:record.schemaVersion,updatedAt:record.updatedAt,data:clone(record.data)};
    if(index>=0)items[index]=entry;else items.push(entry);
    writeOutbox(items);
  }

  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const parse = value => {
    try { return JSON.parse(value); } catch (_) { return null; }
  };
  const now = () => new Date().toISOString();

  function makeId() {
    try {
      if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
      }
      if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        globalThis.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0"));
        return hex.slice(0, 4).join("") + "-" + hex.slice(4, 6).join("") + "-" +
          hex.slice(6, 8).join("") + "-" + hex.slice(8, 10).join("") + "-" + hex.slice(10).join("");
      }
    } catch (_) { /* Fall through for older browsers and restricted contexts. */ }
    return "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
  }

  function createLocalStore(options) {
    if (!options || !options.kind || !options.recordId) {
      throw new TypeError("C10Storage.createLocalStore needs kind and recordId.");
    }
    const kind = String(options.kind);
    const recordId = String(options.recordId);
    const storageKey = ROOT_KEY + encodeURIComponent(kind) + ":" + encodeURIComponent(recordId);
    const legacyKey = options.legacyKey || null;
    const defaults = typeof options.defaults === "function" ? options.defaults : () => clone(options.defaults || {});
    const validate = typeof options.validate === "function" ? options.validate : () => true;
    let currentData = clone(defaults());

    function localGet(key) {
      try {
        if (globalThis.localStorage) return globalThis.localStorage.getItem(key);
      } catch (_) { /* Private mode, storage disabled, or quota errors. */ }
      return memoryFallback.has(key) ? memoryFallback.get(key) : null;
    }

    function localSet(key, value) {
      memoryFallback.set(key, value);
      try {
        if (globalThis.localStorage) {
          globalThis.localStorage.setItem(key, value);
          return true;
        }
      } catch (_) { /* Memory remains available for this page session. */ }
      return false;
    }

    function localRemove(key) {
      memoryFallback.delete(key);
      try {
        if (globalThis.localStorage) globalThis.localStorage.removeItem(key);
      } catch (_) { /* Ignore unavailable storage. */ }
    }

    function envelope(data) {
      return {
        schemaVersion: SCHEMA_VERSION,
        kind,
        recordId,
        updatedAt: now(),
        data: clone(data)
      };
    }

    function save(data) {
      if (!validate(data)) throw new TypeError("Data failed validation for store kind: " + kind);
      currentData = clone(data);
      const wrapped = envelope(currentData);
      const persisted = localSet(storageKey, JSON.stringify(wrapped));
      enqueuePending(wrapped);
      return { persisted, schemaVersion: SCHEMA_VERSION, updatedAt: wrapped.updatedAt, syncPending: true };
    }

    function load() {
      const raw = localGet(storageKey);
      if (raw !== null) {
        const wrapped = parse(raw);
        if (wrapped && wrapped.schemaVersion === SCHEMA_VERSION &&
            wrapped.kind === kind && wrapped.recordId === recordId &&
            Object.prototype.hasOwnProperty.call(wrapped, "data") && validate(wrapped.data)) {
          currentData = clone(wrapped.data);
          return clone(currentData);
        }
      }

      // One-way migration from the previous unversioned localStorage format.
      if (legacyKey) {
        const legacyRaw = localGet(legacyKey);
        if (legacyRaw !== null) {
          const legacy = parse(legacyRaw);
          if (legacy !== null && validate(legacy)) {
            currentData = clone(legacy);
            const result = save(currentData);
            if (result.persisted) localRemove(legacyKey);
            return clone(currentData);
          }
        }
      }

      currentData = clone(defaults());
      return clone(currentData);
    }

    function clear() {
      localRemove(storageKey);
      if (legacyKey) localRemove(legacyKey);
      currentData = clone(defaults());
      return { cleared: true, persisted: true };
    }

    function exportJSON() {
      return JSON.stringify(envelope(currentData), null, 2);
    }

    function importJSON(input) {
      const imported = typeof input === "string" ? parse(input) : clone(input);
      if (!imported || typeof imported !== "object") throw new TypeError("Import must be valid JSON.");
      let data;
      if (imported.schemaVersion === SCHEMA_VERSION && imported.kind === kind &&
          Object.prototype.hasOwnProperty.call(imported, "data")) {
        data = imported.data;
      } else {
        // Raw data is accepted for a controlled import, but is saved in the versioned envelope.
        data = imported;
      }
      if (!validate(data)) throw new TypeError("Import does not match the expected " + kind + " data shape.");
      save(data);
      return clone(currentData);
    }

    return Object.freeze({
      kind,
      recordId,
      load,
      save,
      clear,
      exportJSON,
      importJSON,
      storageKey
    });
  }

  async function syncPending(){
    const pending=readOutbox();
    if(!syncAdapter||typeof syncAdapter.upsertRecord!=="function"){
      return {configured:false,synced:0,pending:pending.length,message:"Local storage is active; no remote sync adapter is configured yet."};
    }
    const remaining=[];
    let synced=0;
    for(const item of pending){
      try{await syncAdapter.upsertRecord(clone(item));synced++;}
      catch(_){remaining.push(item);}
    }
    writeOutbox(remaining);
    return {configured:true,synced,pending:remaining.length};
  }
  window.C10Storage = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    createId: makeId,
    createLocalStore,
    getSyncStatus:()=>({configured:!!syncAdapter,pending:readOutbox().length,adapter:syncAdapter?"configured":"local-only"}),
    configureSyncAdapter(adapter){
      if(adapter!==null&&(!adapter||typeof adapter.upsertRecord!=="function"))throw new TypeError("Sync adapter must expose upsertRecord(record).");
      syncAdapter=adapter;
      return {configured:!!syncAdapter};
    },
    syncPending
  });
})();
