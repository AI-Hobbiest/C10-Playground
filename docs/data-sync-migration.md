# ExamGuru local data and future sync plan

## Current behaviour
- Student profile, quiz attempts, answer records, XP, and learning progress are stored in browser local storage through `js/storage.js`.
- Data stays on the browser/device that created it. The current static GitHub Pages deployment does not provide cross-device sync or central Admin reporting from student records.
- The Admin Workspace can currently import student backup JSON files; it does not silently upload local student data.

## Sync-ready boundary
`C10Storage.createLocalStore()` remains the single persistence boundary used by profile and quiz modules. Each successful save writes the existing versioned local envelope and records the latest version of that record in a local sync outbox. The outbox coalesces repeated writes by `kind + recordId` so it holds the newest pending snapshot for each record.

The exposed future adapter API is:
- `C10Storage.getSyncStatus()` — reports whether a remote adapter is configured and how many local records are pending.
- `C10Storage.configureSyncAdapter(adapter)` — registers an adapter that implements `upsertRecord(record)`.
- `C10Storage.syncPending()` — uploads queued records only when an adapter has explicitly been configured; successful records are removed from the outbox and failed records remain queued.

No adapter is configured in the current deployment, so there is **no network sync today**. Local saves and offline use continue to work.

## Future backend requirements
1. Add authenticated server-side identity and authorization; do not use the public static account JSON as production authentication.
2. Define student-scoped server records and admin-only aggregate/report endpoints.
3. Use stable student IDs and record IDs, server-side validation, conflict/version rules, and idempotent upserts.
4. Only sync after an authenticated adapter is configured. Preserve local data if a request fails or the user is offline.
5. Provide explicit privacy/consent, backup, retention, and account-recovery rules before centralizing student records.

## Current admin publishing limitation
GitHub Pages is static. Class catalogues, subject mappings, and static student account changes made in Admin are drafts until exported and committed to the repository. Never embed a GitHub token or repository write credential in browser JavaScript. Direct publishing needs a separately authorized workflow or backend.
