# C10-Playground

A mobile-friendly, non-commercial CBSE Class 10 learning and MCQ practice portal hosted on GitHub Pages.

## Live portal

- Home / all subjects: https://ai-hobbiest.github.io/C10-Playground/
- Learner dashboard, levels and rewards: https://ai-hobbiest.github.io/C10-Playground/dashboard.html
- Student profile, test history and JSON backup: https://ai-hobbiest.github.io/C10-Playground/profile.html
- Science: https://ai-hobbiest.github.io/C10-Playground/science.html
- Mathematics: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=mathematics
- English: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=english
- Social Science: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=social-science
- Hindi Course A/B starter practice: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=hindi

## Branding and navigation

The portal uses the **Midnight Indigo + Electric Coral + Mint** theme and the attribution **“Conceptualised by JP Ganathe.”** The responsive navigation shell is shared across the homepage, practice pages, Science module, dashboard and profile/history page. On a desktop it appears as a left sidebar; on narrower screens it becomes a slide-in menu with a backdrop and keyboard Escape support.

- `css/branding.css`: shared theme tokens and styles.
- `css/app-shell.css` and `js/app-shell.js`: responsive navigation.

## What is available now?

| Subject | Coverage in this version | Starter questions |
|---|---|---:|
| Science | 14 chapter sets | 1,400 embedded MCQs |
| Mathematics | 14 chapters | 112 |
| English | Prescribed literature topics, reading, grammar and writing | 120 |
| Social Science | History, Geography, Political Science, Economics and marked enrichment topics | 110 |
| Hindi | General grammar/comprehension and selected Course A/B literature topics | 92 |

The four JSON banks are starter banks, **not yet 100 questions per chapter**. Questions are original practice items rather than copied from commercial question banks. English prompts discuss literature themes and events without reproducing textbook passages. Social Science includes some enrichment/map/project-related topics; confirm which chapters are included in the student’s exam. Hindi literature coverage is a selection and should be matched to the student’s actual Hindi Course A or Course B syllabus.

## Practice engine

The shared practice engine supports chapter/topic selection, Learn mode, Test mode, Retry missed, Mixed practice and Timed Exam. Students can select no live timer, elapsed-time tracking, or a 10/20/30/60-minute countdown. Countdown sessions submit automatically when time expires. Answers and active attempts are saved locally; a same-browser refresh can restore a session. Completed records include score, duration, answer status and stable question/option IDs.

Science still uses its earlier standalone quiz engine. The shared session/history, XP and graphs do not yet incorporate Science attempts; bringing it onto the common session engine is a follow-on integration task.

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

Student records remain in the browser on the device. There is no server-side account, automatic cross-device sync, or server-enforced single-device session yet. Clearing browser storage can remove records, so export JSON backups regularly and keep them private. Manual JSON transfer is the current way to move a profile and records between devices.

The app is static, uses no paid charting library and makes no new API calls for dashboard data. Charts are rendered locally with HTML/CSS.

## Deployment and checks

GitHub Actions assembles and deploys the site to GitHub Pages. It validates the Science payload and question-bank structure, then runs automated tests for foundation migration, test-session calculations/recovery, student profile validation, JSON backup/restore, XP/levels/badges and responsive navigation.

## Syllabus and usage note

The practice sets are revision aids, not official CBSE publications or a guarantee of complete syllabus coverage. Verify the school’s current syllabus and assessment plan before relying on any topic for exam preparation. Official CBSE Class X sample-paper index: https://cbseacademic.nic.in/SQP_CLASSX_2026-27.html
