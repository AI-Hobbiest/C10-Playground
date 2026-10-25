# C10-Playground

A mobile-friendly, non-commercial CBSE Class 10 practice portal hosted on GitHub Pages.

## Live portal

- Home: https://ai-hobbiest.github.io/C10-Playground/
- Science: https://ai-hobbiest.github.io/C10-Playground/science.html
- Mathematics: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=mathematics
- English: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=english
- Social Science: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=social-science
- Hindi Course A/B starter practice: https://ai-hobbiest.github.io/C10-Playground/practice.html?subject=hindi

## Branding and visual theme

The portal uses the **Midnight Indigo + Electric Coral + Mint** visual theme, with the attribution “Conceptualised by JP Ganathe” on the homepage and subject experiences. Shared theme styles live in `css/branding.css` so the look can be updated consistently without rewriting each module.

## What is available now?

| Subject | Coverage in this version | Starter questions |
|---|---|---:|
| Science | 14 chapter sets | 1,400 embedded MCQs |
| Mathematics | 14 chapters | 112 |
| English | Prescribed literature topics, reading, grammar and writing | 120 |
| Social Science | History, Geography, Political Science, Economics and marked enrichment topics | 110 |
| Hindi | General grammar/comprehension and selected Course A/B literature topics | 92 |

The new subject banks are **starter banks, not yet 100 questions per chapter**. Questions are original practice items, not copied from commercial question banks. English literature prompts discuss themes and events without reproducing textbook passages. Social Science includes some enrichment/map/project-related topics; confirm which chapters are included in the student's exam. Hindi literature coverage is a selection and should be matched to the student's actual Hindi Course A or Course B syllabus.

## Practice features

- Chapter/topic selector
- Learn mode with immediate explanation
- Test mode with review at the end
- Retry missed questions and mixed practice
- Session score and per-subject accuracy
- Local browser progress stored separately on each device
- Mobile-friendly layout; no Python or installation needed on student devices

Progress is stored in `localStorage` in the browser on the device. It does not currently sync between an iPhone, iPad or computer and is not yet linked to a student profile or cloud database.

## Deployment

The GitHub Actions workflow deploys `index.html`, `science.html`, `practice.html`, the shared storage adapter, question-bank normalizer, session model, quiz engine, versioned contract files, JSON banks and Science payload, with automated foundation and session tests when commits are pushed to `main`. The website is static and requires no server-side code.

## Syllabus and usage note

The practice sets are revision aids, not official CBSE publications or a guarantee of complete syllabus coverage. CBSE sample papers and subject syllabi change; verify the school’s current syllabus and assessment plan before relying on any chapter for exam preparation. Official current Class X sample-paper index: https://cbseacademic.nic.in/SQP_CLASSX_2026-27.html
