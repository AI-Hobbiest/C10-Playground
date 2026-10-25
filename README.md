# C10-Playground

A growing, mobile-friendly, non-commercial Class 10 CBSE learning portal. Version 1 starts with Science practice; Mathematics, English, Social Science and Hindi/second-language modules are planned.

## One-time GitHub Pages setup

1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions** and save if prompted. The GitHub integration can commit site files but cannot enable Pages for the repository itself.
3. Open **Actions** and select **Deploy C10-Playground to GitHub Pages**. Each new commit to `main` will then trigger deployment.
4. When the workflow succeeds, the home page should be available at `https://AI-Hobbiest.github.io/C10-Playground/`.

The site is a static website. No Python or build step is needed on student devices. The full Science practice module with its embedded question bank still needs to be committed as `science.html` before the Science card can open it.

This is a non-commercial revision aid. Please verify chapter coverage against the student's current school syllabus. Scores stored by the practice app are local to each browser and do not sync across devices yet.
