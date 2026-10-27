# Class 6 expansion roadmap

## Goal
Extend ExamGuru from a Class 6 Science pilot into a complete Class 6 learning track while preserving the existing Class 10 experience and reusing the shared practice engine.

## Class 6 subjects
- Science — NCERT Curiosity
- Mathematics — verify the prescribed textbook edition and chapter list before authoring
- English — verify the prescribed NCERT textbook (including the current edition) and add reading, vocabulary, grammar and writing practice where appropriate
- Social Science — follow the current Class 6 NCERT curriculum and keep History, Geography and Social/Political Life topics aligned to the prescribed book structure
- Hindi — confirm the student's prescribed Hindi textbook/course (for example, Malhar where applicable) before building literature questions

## Delivery sequence
1. **Curriculum inventory:** record exact textbook/edition, chapter titles, syllabus scope and source for each subject. Do not infer a chapter list from older editions.
2. **Question-bank schema:** use the existing shared question format and class-specific paths (for example, `data/class-6-science.json`). Never reuse Class 10 banks for Class 6.
3. **Build one subject at a time:** complete chapter coverage first, then generate a starter bank and progressively deepen it. Keep diagrams simple and only use them when they improve accuracy.
4. **Quality gates:** check schema, duplicate questions, answer-key correctness, explanation quality, chapter mapping, age-appropriate wording and curriculum alignment. For calculation-heavy questions, independently verify the answer.
5. **Integration:** connect the class-aware subject catalog and practice engine only after a subject bank passes the gates. A subject must not appear as ready while its bank is missing or only a tiny pilot.
6. **Pilot:** test on phone and desktop, including login, Learn/Test/Retry, answer changes, timed sessions, result review and PDF/Excel-compatible reports.

## Current state
- Class 6 Science is a starter pilot: 12 NCERT Curiosity chapters, 36 starter MCQs (3 per chapter).
- Class 6 Mathematics, English, Social Science and Hindi are not yet complete question-bank tracks.
- The class catalog must list only subjects that are actually integrated and ready. Do not enable all Class 6 subjects in the live catalog before their banks and tests are available.

## Pilot safety and data
This site is a static GitHub Pages MVP. Authentication is not secure access control, and student progress is stored locally in the browser rather than synced centrally. Use pilot-only passwords, collect minimal personal information, and remind students to export a JSON backup before clearing browser data or switching devices.
