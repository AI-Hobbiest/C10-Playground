# C10 Playground account-service setup

This is a one-time setup for the **optional central account service** behind the GitHub Pages site.

- Students sign in with a username and password. They do not need GitHub accounts.
- Only approved administrators use GitHub OAuth for admin access.
- Student accounts, password hashes, sessions and progress are stored in Cloudflare D1 behind the Worker API. GitHub Pages remains the frontend.
- Keep all secrets in Cloudflare Worker secrets or the Cloudflare dashboard. Never commit secrets, student passwords or student backup JSON to this public repository.

The account features do not become active until these setup steps are completed. If `js/api-config.js` is empty, the site continues in local-only mode.

## 1. Create a D1 database

Install Node.js, then open a terminal in this repository:

```sh
cd cloudflare
npx wrangler login
npx wrangler d1 create c10-playground
```

Copy the database ID returned by Wrangler into `cloudflare/wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`. Then initialise the database schema:

```sh
npx wrangler d1 execute c10-playground --remote --file=./schema.sql
```

This creates student accounts, class metadata, completed attempts, hashed-password fields, sessions, login rate limits and audit-log tables. Do not put student account records in GitHub files.

## 2. Deploy the Worker once

In `cloudflare/wrangler.toml`, replace `ADMIN_GITHUB_USERS` with the exact GitHub login(s) allowed to administer the portal. Separate multiple logins with commas. Keep the other frontend URLs aligned with the live GitHub Pages site.

Deploy the Worker:

```sh
npx wrangler deploy
```

Record the Worker HTTPS URL from the deployment output, usually shaped like `https://c10-playground.<your-workers-subdomain>.workers.dev`. Use the exact URL shown by Cloudflare; do not add a trailing slash.

Set `API_PUBLIC_URL` in `wrangler.toml` to that exact Worker URL. Keep `FRONTEND_ORIGIN` as `https://ai-hobbiest.github.io`, `FRONTEND_ADMIN_URL` as `https://ai-hobbiest.github.io/C10-Playground/admin.html`, and `FRONTEND_PROFILE_URL` as `https://ai-hobbiest.github.io/C10-Playground/profile.html`.

## 3. Register GitHub OAuth for administrators only

Create a GitHub OAuth App under your GitHub account settings. Set the homepage URL to:

`https://ai-hobbiest.github.io/C10-Playground/`

Set the **Authorization callback URL** to:

`<your exact Worker URL>/api/auth/github/callback`

Copy the OAuth App's client ID into `GITHUB_CLIENT_ID` in `cloudflare/wrangler.toml`. Do **not** put the client secret in `wrangler.toml` or any frontend JavaScript. Set it as a Worker secret:

```sh
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Paste the client secret only into the secure prompt from Wrangler. The configured `ADMIN_GITHUB_USERS` allowlist is checked after GitHub identifies the person, so having a GitHub account by itself does not grant portal-admin access.

## 4. Connect the GitHub Pages frontend

Edit `js/api-config.js` and set the exact Worker URL:

```js
window.C10_API_BASE = "https://<your-exact-worker-url>";
```

Replace the example with the URL recorded from Cloudflare; do not leave angle brackets or a trailing slash. Commit and push that small config change to the repository's `main` branch. This URL is public and is not a secret. No OAuth client secret or password belongs in this file.

Then redeploy the Worker after any final variable changes:

```sh
npx wrangler deploy
```

## 5. Verify the setup

Open `https://<your-exact-worker-url>/api/health`. Expected successful response:

```json
{"ok":true,"service":"c10-playground-api","database":"connected"}
```

Then check the app in this order:

1. Open the Admin Workspace and choose **Continue with GitHub**. An allowlisted GitHub user should sign in; another GitHub account should be rejected.
2. Create a test student with a unique username such as `test-learner-01`. Copy the temporary password and Student ID from the one-time result.
3. Open the Student Profile page and sign in with the **username**, not the Student ID. Change the temporary password when prompted.
4. Complete a short practice session while signed in and confirm that the profile/history page and Admin live report show the submitted attempt.
5. Use the admin password-reset action and verify the next student sign-in requires a password change.

Use dummy student data during the initial checks. Never share a temporary password in a public issue, commit, screenshot or chat. After testing, remove the test account through Admin Workspace.

## Important boundaries

- GitHub OAuth is for the administrator; student accounts are ordinary username/password accounts.
- Student passwords are salted and hashed by the Worker. They are never stored in GitHub Pages code or the repository.
- The Worker rate-limits failed login attempts and grants expiring sessions.
- The Admin Workspace has central account controls only when the Worker endpoint is configured and an admin session is present. Server-side admin endpoints still enforce the GitHub allowlist.
- Question-bank and class-list edits in this version are still exported and published through an authorised GitHub repository change. The website does not contain a GitHub write token and cannot safely commit repository files by itself.
- Existing browser-local history is not automatically connected to a newly created central account. Keep a private JSON backup and reconcile it deliberately if you need to migrate past records.
- A future Google OAuth migration for students can be considered as a separate phase. It is not needed for the current username/password flow.
