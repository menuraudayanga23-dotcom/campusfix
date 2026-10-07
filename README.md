# CampusFix — complete JavaScript + local MongoDB project

This is a working learning project for reporting campus infrastructure damage and new requirements. It includes the frontend, backend, database models, API, account authentication, administrator dashboard, photos, and tests. You do not need to write the files again: extract the ZIP and follow the steps below.

## 1. What you are building

Students can create an account, sign in, report an issue, attach one optional photo, view only their own reports, search/filter their reports, and read progress updates. Administrators sign in through the same page, view all reports, filter them, change status, and add an explanation to the history. Statuses are Submitted, Under Review, In Progress, Resolved, and Rejected. Admins can reopen reports by changing status again; this prototype does not enforce a strict transition sequence.

Report types: Damage and Requirement. Categories: Building, Electrical, Water & Sanitation, Furniture, Roads & Grounds, IT & Network, and Other. Every report includes title, exact location, description, and Low/Medium/High priority.

Example damage: “Broken desk in Lecture Hall 2.” Example requirement: “Need additional chairs in the study room.” Do not use this website as an emergency service.

## 2. Understand the parts

| Part | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, browser JavaScript | Forms, dashboard, buttons and progress history |
| Backend | Node.js + Express | Validates requests, handles login and checks permissions |
| API | JSON over HTTP | Lets the frontend request or save information |
| Database | MongoDB Community Server on your laptop | Persists users, sessions and reports |
| Database library | Mongoose | Defines document structures and talks to MongoDB |

When you click Submit report, frontend JavaScript calls `fetch('/api/reports', ...)`. Express checks your login and input, Mongoose writes a report to MongoDB, and the API returns JSON. The frontend then refreshes the list.

The Node server serves both frontend files and API routes. You run ONE application server, not two frontend/backend terminals. MongoDB runs separately as a Windows service. Same-origin requests mean you do not need CORS for this setup.

## 3. Install/check the required software

You need Windows, VS Code, Node.js LTS (version 22 or newer), npm, and MongoDB Community Server. Git is optional. Download Node.js from https://nodejs.org/en/download and VS Code from https://code.visualstudio.com/ if needed. MongoDB Compass is optional: it is a database viewer, not the database server itself.

Use Windows **Command Prompt (CMD)** for the commands below. In VS Code, open Terminal → Select Default Profile → Command Prompt, then create a new terminal. This avoids the common PowerShell `npm.ps1 cannot be loaded` problem.

Check:

```bat
node -v
npm -v
```

If either command is not recognized, install Node.js LTS, close VS Code, and reopen it. You do not need React, Vue, Vite, or a global Express installation for this version.

## 4. Extract and open the project

Extract `CampusFix-Complete-Project.zip` to a normal writable folder, for example:

`D:\Projects\campusfix`

Open VS Code → File → Open Folder → choose that **campusfix** folder. Do not open only the frontend folder.

In CMD:

```bat
cd /d D:\Projects\campusfix
```

Use your own extracted location if different. The terminal folder must contain `package.json`.

## 5. Know the full file structure

| File | What it does |
|---|---|
| `package.json` | Dependencies and commands |
| `package-lock.json` | Exact dependency versions from installation |
| `.env.example` | Template for local configuration |
| `.gitignore` | Excludes secrets, installed packages and logs from Git |
| `frontend/index.html` | All frontend forms, dashboard and dialogs |
| `frontend/styles.css` | Responsive layout, colors and styling |
| `frontend/app.js` | API calls, form handling, account state and rendering |
| `backend/server.js` | Connects MongoDB and starts the web server |
| `backend/app.js` | Express middleware, API routing and frontend serving |
| `backend/password.js` | Salted password hashing and checking |
| `backend/validation.js` | Input and photo validation |
| `backend/models/User.js` | User document structure |
| `backend/models/Session.js` | Expiring database-backed login sessions |
| `backend/models/Report.js` | Report, photo and progress-history document structure |
| `backend/middleware/auth.js` | Login checks, administrator checks and cookies |
| `backend/routes/auth.js` | Registration, login, logout and current-user API |
| `backend/routes/reports.js` | Create/list/read reports, stats, photos and admin updates |
| `backend/scripts/create-admin.js` | Creates an administrator from your local terminal |
| `tests/core.test.js` | Password and validation tests |
| `tests/api.test.js` | Database-backed workflow and permission tests |
| `README.md` | This setup and learning guide |

The ZIP contains all source code. `node_modules` is intentionally excluded; install it in the next step. `.env.example` may appear hidden in some file viewers because its name starts with a dot.

## 6. Install project dependencies

From the project root:

```bat
npm ci
```

This needs internet access the first time. It installs the versions recorded in `package-lock.json`. Use `npm install` instead if you intentionally change `package.json`, then commit the updated lockfile too. Do not copy another project's node_modules folder.

## 7. Start your local MongoDB server

Since you already installed MongoDB, check Windows first:

1. Press Win + R.
2. Type `services.msc` and press Enter.
3. Find **MongoDB Server** / the MongoDB service.
4. If stopped, right-click → Start. Starting a service may require administrator privileges.

In MongoDB Compass, connect to:

```text
mongodb://127.0.0.1:27017
```

If Compass connects, your database server is running. Compass alone cannot store your project without a running server.

If no MongoDB service exists, check whether you installed only Compass. Install MongoDB Community Server from https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/ and choose its service option, or start your existing `mongod.exe` manually with a writable data directory.

For a manual installation, create `D:\mongodb-data`, then run the following in a separate CMD terminal, replacing the executable path with your actual installation:

```bat
"C:\Program Files\MongoDB\Server\YOUR_VERSION\bin\mongod.exe" --dbpath "D:\mongodb-data" --bind_ip 127.0.0.1
```

Keep that terminal running. Prefer the service method for a beginner. Do not start a second server if the service is already using port 27017.

## 8. Create your configuration file

Run in the project folder:

```bat
copy .env.example .env
```

The contents should be:

```dotenv
PORT=5000
HOST=127.0.0.1
APP_ORIGIN=http://localhost:5000
MONGO_URI=mongodb://127.0.0.1:27017/campusfix
NODE_ENV=development
```

`campusfix` is the database name. Mongoose uses 127.0.0.1 for a predictable local database connection. `HOST` binds the website to your laptop for development. `APP_ORIGIN` must match the browser address you use. Keep `.env` in the project root, next to `package.json`, and never commit it.

These defaults assume your locally installed MongoDB uses port 27017 without authentication. If you enabled MongoDB authentication, use your authenticated connection URI in `.env`, including the correct `authSource`. Do not disable an existing authentication setup just to match the example.

## 9. Start the website and backend

```bat
npm start
```

Expected messages:

```text
MongoDB connected.
CampusFix: http://localhost:5000
```

Open **http://localhost:5000** in your browser. Keep the terminal running. Do not double-click index.html and do not use VS Code Live Server: this project must run through Express so the API and cookies work.

Check **http://localhost:5000/api/health**. You should see JSON containing `API and MongoDB connected.`

Press Ctrl + C in the server terminal to stop the application. MongoDB data remains saved.

## 10. Create and test a student account

1. Click Create account.
2. Enter your name and an email address.
3. Choose a password with at least 10 characters.
4. Click Create account.
5. The dashboard opens automatically.

This learning version does not send verification emails or enforce a university domain. Use test details while developing. Registration always creates a student; a browser request cannot create an administrator.

## 11. Submit your first report

1. Click + New report.
2. Enter “Broken desk in Lecture Hall 2”.
3. Select Damage → Furniture.
4. Enter the exact location.
5. Explain the damage and its impact in the description.
6. Choose a priority.
7. Optionally attach a JPEG, PNG or WebP up to 2 MB.
8. Click Submit report.

You should see a Submitted report in your list. Click View report to see the description, photo and progress history. A student sees only their own reports, not other students' names or photos.

To report a new facility requirement, select Requirement and describe what is needed and why.

## 12. Create the administrator account

Leave `npm start` running. Open a second CMD terminal in the same project folder:

```bat
npm run create-admin
```

Answer the prompts for admin name, a **new separate email**, password and confirmation. Password input is visible in this local setup terminal; do not run this while screen sharing. Use a unique password rather than reusing one from another service.

Do not use an existing student email: the script deliberately refuses to overwrite or promote an existing account. This avoids accidentally changing someone else's permissions. Admin creation requires local access to the project and database, not access to a web signup form.

## 13. Test the administrator dashboard

1. Sign out of the student account.
2. Sign in with the admin email and password you just created.
3. The Campus overview shows all reports.
4. Open the report.
5. Select Under Review.
6. Write “Maintenance team will inspect this desk.”
7. Click Save update.
8. Later change it to In Progress, then Resolved, with a note each time.

Sign back into the student account. The same report now shows the administrator's latest status and timeline note. This is how both frontend roles share the same database.

## 14. Check the database in Compass

Connect to `mongodb://127.0.0.1:27017`, refresh, and open the `campusfix` database. The app creates collections as needed: `users`, `sessions`, and `reports`.

Users store name, email, role and a password hash—not the original password. Sessions store a hash of the session token and an expiry. Reports reference the reporter's user ID. A report can contain a photo as MongoDB binary data; photos are excluded from list/detail JSON and fetched from a separate protected endpoint.

Do not manually edit password hashes or roles while testing normal behavior. Never upload a real database export to a public repository.

## 15. API reference

All routes below start with `http://localhost:5000`. Protected endpoints require the login cookie. All POST/PATCH requests require `Content-Type: application/json` and `Origin: http://localhost:5000`. Browser fetch sends Origin automatically. In Postman, set it explicitly and let Postman's cookie jar keep the login cookie. Requests from a different origin are rejected.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Database connection health |
| POST | `/api/auth/register` | Public | Register student and sign in |
| POST | `/api/auth/login` | Public | Sign in and set session cookie |
| GET | `/api/auth/me` | Signed in | Current user |
| POST | `/api/auth/logout` | Public | Invalidate session and clear cookie |
| GET | `/api/reports/meta` | Signed in | Categories and statuses |
| GET | `/api/reports` | Signed in | Paginated report list |
| GET | `/api/reports/stats` | Signed in | Counts for dashboard |
| POST | `/api/reports` | Signed in | Submit report |
| GET | `/api/reports/:id` | Owner or admin | Report details and history |
| GET | `/api/reports/:id/photo` | Owner or admin | Attached image |
| PATCH | `/api/reports/:id/status` | Admin | Status and timeline update |

List filters: `/api/reports?page=1&status=Submitted&category=Furniture&q=desk`. Each page contains up to 10 reports. Category/status must match their exact names; URL-encode spaces and `&` in query values. Students' stats are for their own reports; admins' stats are campus-wide. Statistics are not restricted by the list filters.

Registration body:

```json
{"name":"Test Student","email":"student@example.com","password":"ChooseYourOwnPassword!"}
```

Login body:

```json
{"email":"student@example.com","password":"ChooseYourOwnPassword!"}
```

Create report body:

```json
{
  "title":"Broken desk in Lecture Hall 2",
  "type":"Damage",
  "category":"Furniture",
  "location":"Main building, Hall 2",
  "description":"The front desk has a broken leg and cannot be used safely.",
  "priority":"High"
}
```

Optional `photo` field: a base64 data URL produced by FileReader in the frontend. Do not send a Windows file path; the backend cannot read a browser user's laptop path. The server checks format signatures and size; it is not a full image sanitization pipeline.

Administrator status body:

```json
{"status":"Resolved","note":"The maintenance team replaced the damaged desk."}
```

`:id` means the report's MongoDB `_id`, returned after creating or listing reports. Do not type `:id` literally.

Success examples: registration returns `{ "user": {...} }`, creation returns `{ "report": {...} }`, list returns `{ "reports": [...], "total": 1, "page": 1, "pages": 1 }`. Failures return `{ "message": "Explanation" }` with an appropriate HTTP status.

Codes: 201 created, 400 invalid input, 401 sign in required, 403 access/origin denied, 404 missing or inaccessible report, 409 duplicate email, 413 too large, 415 wrong content type, 429 rate limited, 500 server error.

## 16. Understand how frontend and backend connect

Simplified browser example:

```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Broken desk in Lecture Hall 2',
    type: 'Damage',
    category: 'Furniture',
    location: 'Main building, Hall 2',
    description: 'The desk has a broken leg and needs replacement.',
    priority: 'High'
  })
});
const data = await response.json();
if (!response.ok) throw new Error(data.message);
console.log(data.report);
```

Run this only after signing in, from the site's browser console. It creates a real test report. The actual reusable helper is `api()` near the top of `frontend/app.js`.

`/api/reports` reaches `backend/app.js`, which mounts `backend/routes/reports.js`. Authentication adds `req.user`, validation checks the fields, and `Report.create()` writes to MongoDB. The API returns JSON, not a whole HTML page.

The session cookie is HTTP-only: browser JavaScript does not read it or put login tokens in localStorage. The browser automatically sends it with same-origin requests. Refreshing the page calls `/api/auth/me` to restore the interface. Sessions expire after eight hours; logout invalidates them in MongoDB.

## 17. Run checks and the complete test flow

For fast password/input checks:

```bat
npm test
```

The database integration test is skipped unless TEST_MONGO_URI is set. To run it against your local server, use a NEW CMD terminal:

```bat
set TEST_MONGO_URI=mongodb://127.0.0.1:27017
npm test
set TEST_MONGO_URI=
```

The integration test creates a unique `campusfix_test_...` database, checks login, student isolation, photos, report submission, admin updates, stats and logout, then drops **only that generated test database**. It does not use or delete the `campusfix` application database.

Manual acceptance checklist:

- Registration signs in; duplicate emails show an error.
- Wrong passwords are rejected.
- A valid report appears after submission and after a server restart.
- Damage and Requirement types both work.
- Optional photos appear only to the reporter and administrators.
- Search, category/status filters and pagination work.
- A second student cannot see the first student's reports.
- Students cannot perform administrator updates.
- An admin sees all reports and can save a status plus note.
- The first student sees that admin note after refreshing/applying filters.
- Narrow the browser window to check the mobile layout.
- Logout blocks protected APIs, even with the old session cookie.

## 18. Fix common errors

| Error or symptom | What to do |
|---|---|
| `npm` or `node` not recognized | Install Node.js LTS and reopen the terminal |
| `ENOENT ... package.json` | Use `cd` to the campusfix project root |
| PowerShell blocks `npm.ps1` | Use Command Prompt or `npm.cmd` |
| `Cannot find module` | Run `npm ci` in the project root |
| `MONGO_URI is missing` | Copy `.env.example` to `.env` in the root |
| `ECONNREFUSED 127.0.0.1:27017` | Start MongoDB Server; Compass alone is not enough |
| Database authentication failed | Correct credentials and authSource in MONGO_URI |
| `EADDRINUSE ... 5000` | Stop the other server, or set PORT=5001 and APP_ORIGIN=http://localhost:5001; restart |
| `Request origin is not allowed` | Open the exact APP_ORIGIN URL; use localhost, not 127.0.0.1, with default config |
| `Cannot GET /` in another project | Make sure this project's `npm start` is the server running at the port you opened |
| Clicking index.html does not work | Open http://localhost:5000 after npm start |
| Photo rejected | Use an actual JPEG/PNG/WebP under 2 MB; renaming an extension is insufficient |
| Too many attempts | Wait for the limit window; auth limit is 30 attempts per IP per 15 minutes |
| Changes are not visible | Save files and refresh; use npm run dev for automatic backend restart |
| Login seems lost after eight hours | Sign in again; sessions expire deliberately |
| Another PC cannot connect | Default host is loopback, for your own laptop only |

Open DevTools → Network to inspect `/api/...` requests, status codes and JSON. Check the VS Code server terminal for backend errors. Do not send screenshots containing passwords, cookies or database credentials.

## 19. Make changes and save to Git

During coding, use:

```bat
npm run dev
```

Do not run npm start and npm run dev simultaneously on the same port. The dev command watches backend JavaScript and restarts the server; refresh the browser after frontend edits.

Change site text in index.html, appearance in styles.css, frontend behavior in app.js, API behavior in routes, and database fields in models. Adding a new field normally needs changes to the form, frontend request, server validation, schema and detail display.

When ready to save your work:

```bat
git init
git add .
git commit -m "Build CampusFix reporting website"
```

Then create an empty GitHub repository, add its HTTPS remote using the URL GitHub gives you, and push:

```bat
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Replace YOUR_REPOSITORY_URL. Commit source, README and package-lock.json; the provided .gitignore excludes .env and node_modules. MongoDB data is not stored in Git.

## 20. Understand local use and your next milestones

This is a complete local learning prototype, not a deployed university service. A local MongoDB database on each laptop would produce separate data; it would not synchronize reports automatically. For real campus use, everyone must reach one backend, and that backend must use one shared database. That database can still be MongoDB Community Server on a centrally managed university server; it does not have to be Atlas.

A static host such as GitHub Pages cannot run this Node/MongoDB backend. Do not upload only frontend files there and expect the API to work.

Before campus deployment, plan HTTPS, institutional sign-in or email verification, account/password recovery, approved admin provisioning, backups, retention/privacy rules, audit logs and stronger image processing/storage. In production, cookies are marked Secure, so HTTPS is required. Deploying needs different host/origin configuration and operational setup; changing NODE_ENV alone is insufficient.

Suggested learning order: get the provided project running → follow one frontend fetch call into its Express route → inspect the saved MongoDB document → make a small category/text change → add a new field across all layers → implement an approved enhancement such as maintenance assignment or email notifications.

The current version deliberately keeps reports and their histories instead of allowing deletion. Student editing, notifications, maps, maintenance-team assignment and password reset are future features, not existing functions.

Official references:

- Node.js installation: https://nodejs.org/en/download
- Express static files: https://expressjs.com/en/starter/static-files.html
- Express JSON parsing: https://expressjs.com/en/5x/api.html#express.json
- Mongoose connections: https://mongoosejs.com/docs/connections.html
- MongoDB Windows installation: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/

## Validation performed for this delivery

JavaScript syntax checks passed. All four automated tests passed, including the integration test against a temporary MongoDB 7.0 server. The integration test covers registration/login, role protection, student report isolation, validated report submission, photo permissions, search, administrator updates, statistics and logout. A browser visual test was not completed in the build environment; use the manual checklist on your Windows laptop.
