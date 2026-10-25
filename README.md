# C10-Playground

A growing, mobile-friendly, non-commercial Class 10 CBSE learning portal. Science is the first available module; Mathematics, English, Social Science and Hindi/second-language modules are planned for later phases.

## Live site

- Home: https://AI-Hobbiest.github.io/C10-Playground/
- Science practice: https://AI-Hobbiest.github.io/C10-Playground/science.html

The Science loader assembles the compressed, embedded question bank in the browser. It does not fetch a separate JSON file, which avoids the local-file question-loading issue seen in the first iPad test. Use a recent browser with gzip `DecompressionStream` support and an internet connection.

## Deployment

GitHub Actions deploys the static site on pushes to `main`. The workflow includes `index.html`, the Science loader, and the compressed Science payload parts. No Python is required on student devices.

This is an independent, non-commercial revision aid. Verify chapter coverage against the student's current school syllabus. Practice scores/progress are stored locally in the browser on the device and do not currently sync across devices. Additional subjects and student profiles/history are future phases, not included yet.
