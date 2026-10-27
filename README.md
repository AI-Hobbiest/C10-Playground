# C10-Playground

A mobile-friendly, non-commercial CBSE Class 10 learning and MCQ practice portal hosted on GitHub Pages.

## Live portal

- Sign-in landing page: https://ai-hobbiest.github.io/C10-Playground/
- Learner subject hub and dashboard (after student sign-in): https://ai-hobbiest.github.io/C10-Playground/dashboard.html
- Learner dashboard, levels and rewards: https://ai-hobbiest.github.io/C10-Playground/dashboard.html
- Student profile, test history and JSON backup: https://ai-hobbiest.github.io/C10-Playground/profile.html
- Admin Workspace (local authoring and reports): https://ai-hobbiest.github.io/C10-Playground/admin.html
- Science: https://ai-hobbiest.github.io/C10-Playground/science.html
- Mathematics: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=mathematics
- English: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=english
- Social Science: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=social-science
- Hindi Course A/B starter practice: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=hindi

## Branding and navigation

The portal uses the **Midnight Indigo + Electric Coral + Mint** theme and the attribution **“Conceptualised by JP Ganathe.”** The landing page is now a sign-in screen. A successful student sign-in opens the dashboard, which includes subject launch cards and learning analytics. The responsive side menu changes according to guest, student or server-verified admin state. Guests see sign-in; signed-in students see learning and profile links; admins see the Admin Workspace only after server-side role verification.

- `css/branding.css`: shared theme tokens and styles.
- `css/app-shell.css` and `js/app-shell.js`: responsive navigation.

## What is available now?

| Subject | Coverage in this version | Starter questions |
|---|---|---:|
| Science | 14 chapter sets | 1,400 embedded MCQs |
| Mathematics | 14 chapters | 112 |
| English | All 37 prescribed literature, reading, grammar and writing topics | 3,700 |
| Social Science | All 22 topic sets, 100 MCQs per set | 2,200 |
| Hindi | General grammar/comprehension and selected Course A/B literature topics | 92 |

The English bank now contains 3,700 MCQs across all 37 topic sets, with 100 MCQs per set. The additional topic banks are maintained in `data/english-chapters-19-25.json`, `data/english-chapters-26-28.json`, `data/english-topics-29-33.json` and `data/english-topics-34-37.json`; all four are merged into `data/english.json` during the Pages build and checked by the deployment workflow. Mathematics and Hindi remain starter sets and are not yet at 100 questions per topic. The Science bank is generated from its existing compressed source during deployment. Social Science's 2,200 MCQs are maintained across four topic-override JSON files and merged into `data/social-science.json` during the Pages build. The deployment workflow checks all 22 topics and requires exactly 100 questions per topic. The Rise of Nationalism in India, Geography map skills and enrichment/project scope should be studied against the school's current assessment plan: for 2026–27, The Age of Industrialisation is periodic-assessment only, Lifelines of National Economy is map work only, and Consumer Rights is project work; the Globalisation chapter's board scope is narrower than its project themes. English prompts discuss literature themes and events without reproducing textbook passages. Social Science includes some enrichment/map/project-related topics; confirm which chapters are included in the student’s exam. Hindi literature coverage is a selection and should be matched to the student’s actual Hindi Course A or Course B syllabus.

## Admin Workspace

Open the Admin Workspace at https://ai-hobbiest.github.io/C10-Playground/admin.html. The page prepares local drafts and exports JSON. It has no in-app admin login or GitHub write token; only a trusted GitHub repository maintainer can publish changes.

For the starter phase, students can sign in with a **username and password** from `data/student-accounts.json`. Passwords are stored as salted PBKDF2-SHA-256 hashes, never as plaintext. For this phase, student accounts use the JSON flat-file database at `data/student-accounts.json`. An administrator creates an account in the Admin Workspace, exports the updated JSON, and commits it to GitHub; the account becomes available to all students after the Pages deployment. This is a deliberate MVP limitation: GitHub Pages is static and cannot write back to the repository. Central account storage and automated account publishing are tech debt for a later Cloudflare Auth or Google OAuth phase. Do not put personal, reused or confidential passwords in this MVP.

**Security limitation:** this repository and account file are public. Anyone can read usernames, salts and hashes and attempt offline password guesses. Verification happens in the browser and can be bypassed; this is not real authentication or a way to protect quiz content. Do not use personal, reused or confidential passwords, and do not store student profile data in the account file. Server-side authentication, private account storage, admin-only account management, cross-device sync and live reports are deferred. Cloudflare Worker and D1 source in `cloudflare/` is retained as future tech debt; no Cloudflare account is required for the current GitHub JSON MVP.

The login page offers username/password sign-in for the existing flat-file student MVP and a separate GitHub admin sign-in option. The GitHub option requires the Cloudflare Worker/API to be deployed and configured. Its `ADMIN_GITHUB_USERS` setting is a **server-side allowlist** (currently defaulted in the deployment template to `AI-Hobbiest`); add any other app-authorised GitHub usernames explicitly. Being a GitHub user or repository collaborator does not by itself grant admin access. The public Pages UI never decides admin eligibility on its own. Until the Worker, D1 database and GitHub OAuth client are configured, GitHub admin sign-in will explain that it is unavailable rather than accepting an unverified identity.

The local backup-import/reporting tools remain available, but student backups are processed in the browser and are not uploaded automatically. Do not commit student backups or private documents to this public repository. The `data/classes.json` file is the class catalogue. For flat-file accounts, the class assigned in `data/student-accounts.json` overrides the local profile class while signed in; only the administrator can promote or change it through the Admin Workspace. `data/knowledge-base.json` is a metadata manifest, not a document store.

## Practice engine

All five subjects use the shared practice engine: Science, Mathematics, English, Social Science and Hindi. It supports chapter/topic selection, Learn mode, Test mode, Retry missed, Mixed practice and Timed Exam. Students can select no live timer, elapsed-time tracking, or a 10/20/30/60-minute countdown. Countdown sessions submit automatically when time expires. Answers and active attempts are saved locally; a same-browser refresh can restore a session. Completed records include score, duration, answer status and stable question/option IDs.

Science retains its existing compressed source payload so there is no manually maintained duplicate bank. During deployment, GitHub Actions validates the 14 chapter sets / 1,400 MCQs and generates the deployment copy of data/science.json, which is then consumed by the same question-bank normalizer, session ledger, local history and XP/levels/badges as the other subjects. The old science.html URL remains as a compatibility redirect to practice.html?subject=science.

## Question images and diagrams

The shared question model now supports optional `images` metadata on each question. Each image has a source, meaningful alternative text and an optional caption. Sources may be a relative asset path (recommended for curated question banks) or a PNG/JPEG/WebP/GIF base64 data URI (useful when packaging a figure with an imported question). Text-only questions remain valid and unchanged.

The practice screen and answer review render the figures responsively, and students can open an enlarged view. Image metadata passes through the common normalizer, so shuffled answer options do not change which question owns its diagram. Unsafe schemes such as JavaScript URLs are rejected by the normalizer. The existing starter banks do not yet contain curated diagrams; this change establishes the capability and data contract before bulk question-bank creation.

### PDF builder scope

The planned question-bank builder will target **text-based PDFs with selectable text**. Scanned/image-only PDFs and OCR are out of scope for now. For Science and Mathematics, the workflow must let the author associate a relevant figure with the question and preview that association before approving a generated bank; it must not silently guess when a diagram/question match is uncertain.

## Phase 1 — data foundation

- Versioned JSON Schema contracts live in `data/contracts/v1/`.
- `js/question-bank.js` accepts both existing legacy chapter arrays and the canonical v1 bank structure.
- `js/storage.js` provides a replaceable browser-local persistence interface: load, save, clear, export and import.
- Stable subject/chapter/question IDs support migration away from the initial numeric question references.

## Phase 2 — timed sessions and results

- No live timer, elapsed-time mode and configurable countdown.
- Automatic timeout submission, early manual submission and distinction between skipped/unanswered questions.
- In-progress session autosave and recovery in the same browser.
- Versioned attempt and per-answer records.

## Phase 3 — student profile and history

The profile page collects only:
- Generated local Student ID (not school-issued)
- Display name/nickname
- School
- Class
- City
- Indian State / Union Territory (dropdown)

No email address, phone number, date of birth or section is requested. School and city/state can still help identify someone in combination, so the information remains in browser storage and should be treated as private.

The profile/history page displays completed attempts from the shared-engine subjects and supports versioned JSON backup/restore. Importing a backup replaces the local profile and data for the included subjects after confirmation. Keep backups private and do not upload them to this public repository.

## Phase 4 — dashboard, levels and rewards

- Level progression from **Curious Starter** through **Grand Scholar**, calculated from accumulated XP.
- XP from completed sessions and correct answers, with accuracy bonuses.
- Achievement badges for completion milestones, perfect scores, accuracy, subject exploration, practice streaks and levels.
- Score trend for the latest 10 completed tests, answered-question accuracy by subject, and a 7-day practice-activity chart.
- Current/best practice streaks derived from saved attempt dates.
- Responsive side-menu navigation across the app.

XP, levels, streaks and badges are **derived from saved completed attempts**, not separately accumulated on each page load. This prevents reopening the dashboard from awarding XP repeatedly.

## Local storage and privacy limits

Student profiles, attempts, XP, levels, streaks and badges remain in that browser's local storage, whether or not the student signs in. Clearing browser storage can remove records, so students should export JSON backups and keep them private. The starter account file verifies a username/password locally but does not sync data across devices. Import or reconcile backups deliberately when moving devices.

## Deployment and checks

GitHub Actions assembles and deploys the site to GitHub Pages. It validates the Science payload and generates/tests the shared Science bank when no committed `data/science.json` exists; when that file exists, it becomes the editable source of truth. It checks each subject question-bank structure and any referenced image assets, then runs automated tests for foundation migration, test-session calculations/recovery, Science normalization and routing, student profile validation, Admin Workspace data handling, JSON backup/restore, XP/levels/badges and responsive navigation.

## Syllabus and usage note

The practice sets are revision aids, not official CBSE publications or a guarantee of complete syllabus coverage. Verify the school’s current syllabus and assessment plan before relying on any topic for exam preparation. Official CBSE Class X sample-paper index: https://cbseacademic.nic.in/SQP_CLASSX_2026-27.html
