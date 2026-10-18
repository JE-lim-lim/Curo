# Curo — Care & Cure

A healthcare hackathon web-app prototype that combines ClearCare (a basic reading aid for written care instructions) and MedBridge (a personal care organiser).

## What's updated
- InternMatch-inspired animated full-width hero carousel using the six supplied healthcare images
- Homepage sections: About Us, FAQ, Contact Us
- Contact links: curo@gmail.com → Gmail, Curo Official → Facebook, curo.official → Instagram
- InternMatch-style footer structure and header Display settings
- Display settings: font size, light/dark theme, comfortable/compact density; preferences saved in browser local storage
- Separate dashboard HTML pages: Overview, ClearCare, Care Plan, Appointments, Medication Records
- Curo logo links back to the public homepage
- Sign up, log in, sign out, hashed passwords, user-specific SQLite records

## Run locally (Windows PowerShell)
```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000.

If you already have a `.venv`, activate it and run `python -m pip install -r requirements.txt` after replacing the old project files with this version.

## Dashboard pages
- `/app` — Overview
- `/app/clearcare` — ClearCare
- `/app/care-plan` — Care Plan
- `/app/appointments` — Doctor appointment requests and approval status
- `/app/reminders` — Personal reminders (separate page)
- `/app/medications` — Medication Records
- `/app/assistant` — Curo Care Assistant (sign-in required)

## Safety notes
ClearCare is a basic rule-based text reading aid, not a real AI model or medical interpretation. Do not use real patient data or change treatment based on this prototype. Before public deployment, set a strong `CURO_SECRET_KEY`, add CSRF protection and rate limiting, use HTTPS, and configure persistent managed storage. Local SQLite files may not persist on some hosting platforms.

## Recent layout and profile updates

- The profile page now uses the full available dashboard content width, with consistent box sizing and responsive field grids.
- Public About Us, FAQ and Contact sections use centered, responsive content widths to avoid narrow cards and horizontal clipping.
- Users can upload a PNG, JPG/JPEG or WEBP profile photo up to 5 MB. The image previews before saving and is shown beside the user's full name in the dashboard sidebar.
- Profile photos are stored under `static/uploads/profiles/` and their relative paths are saved in SQLite. The application accepts only the listed image extensions and checks the reported content type.
- The uploaded photo is optional; without one, Curo displays the user's initial.

## Curo Care Assistant (AI chatbot)

- Signed-in users can open the floating **Ask Curo** chat on the landing page and app pages, or visit `/app/assistant` from the dashboard sidebar.
- The assistant uses Google Gemini through the official Google Gen AI Python SDK from Flask on the server. The Gemini API key is never sent to the browser.
- Conversation history is kept in the current page's JavaScript memory only; it is not written to the Curo database. Refreshing the page starts a fresh conversation.
- Requests require a signed-in account and are limited to 20 requests per hour per session, with message length/history limits. This is a prototype-level guard, not a production rate limiter.
- The assistant must not diagnose, prescribe, calculate doses, or recommend starting/stopping/changing medication. It is instructed to preserve source wording, flag uncertainty, and refer medical decisions to a clinician or pharmacist. It gives an emergency notice for selected emergency phrases; it is not a reliable emergency detector.

### Configure the hosted AI API (Windows PowerShell)

1. Install the dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
2. Create your local environment file:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Open `.env` and replace `paste-your-google-ai-studio-api-key-here` with your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). Keep `.env` private and never commit it to GitHub. `GEMINI_MODEL` defaults to `gemini-3.8-flash`; change it only to a model available to your project. Free-tier availability and rate limits depend on Google AI Studio and the model.
4. Restart Flask:
   ```powershell
   python app.py
   ```
5. Sign in and open **Care Assistant**. If the API key is missing or the API is unavailable, Curo shows a friendly setup/error message instead of crashing.

API usage may incur separate charges. Do not paste real patient records, names, ID numbers, addresses, or other identifying information into this hackathon prototype. Before a public/clinical deployment, add a production-grade rate limiter, CSRF protection, privacy notices/consent, logging controls, monitoring, and appropriate security/compliance review.


## Doctor booking and Staff approval workflow

This update adds the following workflow while keeping the existing patient features:

- Patient role: browse the doctor directory and details, request an appointment with a preferred doctor/date/time, enter a reason, and optionally ask Gemini to organise their own symptom description into a neutral summary.
- Booking requests start as **Pending**. A request is not a confirmed appointment until a staff member approves it.
- Staff role: review appointment requests, approve or reject with a note, and check for an already-approved doctor/time conflict before approval.
- Patient status updates: the appointment page shows Pending / Approved / Rejected and any staff note. Updates are in-app; email/SMS delivery is not configured.
- Doctor profiles: the seeded profiles are clearly fictional demonstration data. Replace them with accurate, verified clinician information before any real-world use.
- AI symptom summary: uses the configured Gemini API if available, does not diagnose or recommend treatment, and reminds the user to review the text. If Gemini is unavailable, users can still submit their own description. The feature has a basic emergency-phrase safeguard but is not an emergency detector.

### Create a Staff account

Public sign-up always creates a normal patient account. To create a staff account, open a trusted terminal in the project folder and run:

```powershell
python create_staff.py
```

The script prompts for a name, email and password without printing the password. It can also promote an existing account to staff. Do not add a public “register as staff” option.

### Appointment workflow notes

- Patient booking requests are stored separately from personal appointment reminders.
- A request is created with `pending` status. Staff can approve or reject pending requests only.
- The backend checks for an existing pending/approved request when a patient requests a slot and checks approved-slot conflicts again during approval.
- The prototype uses a fixed list of daytime time slots and does not yet manage a real clinic's live availability, holidays, time zones, clinician rosters, or email/SMS notifications.
- The symptom description is sensitive information. Use fictional test data and do not deploy with real patient information without a proper privacy/security review, access auditing, CSRF protection, and a verified consent process.

### Updating an existing project safely

Back up your current `curo.db`, `.env`, and uploaded files before replacing code. The updated app migrates the existing SQLite database to add role and booking tables on startup. Keep your existing `.env` locally; do not upload it or share it. This ZIP intentionally excludes `.env` and `curo.db` so secrets and personal test records are not redistributed. Extract the ZIP to a new folder, then copy your existing `curo.db` and `.env` into that folder if you need to preserve accounts and configuration. If you do not copy the database, Curo creates a fresh one on first run and you will need to sign up again.


### Personal reminders page

- Personal reminders now live on their own `/app/reminders` page and have a dedicated sidebar link.
- The doctor appointment page contains only doctor booking requests and their status.
- New accounts are no longer seeded with a sample personal reminder.
- On startup, the app removes only the exact legacy demo reminder (“Sample follow-up appointment” with its known sample note); user-created reminders are preserved.
- The dashboard links its personal-reminders panel to the new Reminders page.


### Patient and Staff login
- The shared `/login` page now has separate **Patient Login** and **Staff Login** options.
- The selected option is checked against the account role stored in the database. Choosing Staff Login does not grant Staff permissions to a patient account.
- Staff accounts must be created by a trusted administrator using `python create_staff.py`; public signup cannot grant the Staff role.
- A valid Staff account is redirected to `/staff` (Appointment Desk); a valid Patient account is redirected to the patient dashboard.


### Latest UI and ClearCare update
- Removed the public-header `My Dashboard` button. Signed-in visitors see `Sign out`; signed-out visitors see `Sign up`.
- The hero image carousel continues scrolling while hovered, and the hero overlay uses black rather than a green-tinted overlay in both themes.
- Removed the hero slide label and the extra About-section safety line noted in `changes.pdf`.
- The dashboard top label is larger/bolder, the floating Ask Curo action is larger/bolder, and the footer bottom row now reads `Copyright © 2026 Curo · Care & Cure` with `About Us | FAQ | Contact Us`.
- New accounts are no longer seeded with fictional care-plan tasks. Startup removes only the exact known demo task/reminder rows from older versions; other user-created records remain.
- Empty overview/care-plan/appointment/medication states now explain that there are currently no items.

### ClearCare source-based reading aid
- ClearCare groups extracted source passages into appointment, medication, care, warning/follow-up and other-information cards.
- It uses the existing Gemini configuration when available, asks for JSON output, validates each quoted source passage against the submitted text, and rejects AI-generated passages that cannot be found in the source.
- If Gemini is unavailable or the response cannot be validated, it falls back to conservative sentence-level extraction and explicitly labels the result as source-only; it does not invent generic checklist tasks.
- Medication items and warning items never get a direct `Add to Care Plan` action. Unclear items show `Needs verification`.
- `Add to Care Plan` opens an editable confirmation dialog and saves through the existing `/api/tasks` database endpoint. The backend checks for exact duplicate tasks before inserting.
- Text-based PDFs are supported. Image-only/scanned PDFs with no extractable text return a clear error.
- Safety: ClearCare is a reading aid, not a diagnosis or treatment tool. Do not use real patient data in the hackathon demo.


## UI changes from `Changes (2).pdf`
- Public header: logged-out visitors see **Log in** and **Sign up**; signed-in users retain **Sign out**.
- Landing hero CTA says **Sign up**; removed the extra hero tagline. The hero overlay is black in light and dark themes, and the carousel keeps scrolling when hovered.
- About Us, FAQ and Contact Us use the requested cyan-to-yellow section ribbons.
- FAQ describes Curo as a healthcare web application.
- Footer bottom uses `Copyright © 2026 Curo · Care & Cure` and the About Us / FAQ / Contact Us links.
- Removed the auth page's Back to homepage link, demo safety note and duplicate Return to homepage link; retained the copyright footer and display settings.
- Display settings remain available across public/auth pages and patient/staff workspace pages.
- Ask Curo button is larger and bolder. Interactive controls now have hover colour/scale feedback, pressed feedback and keyboard focus rings.
- Overview snapshots omit task sub-details while retaining due dates; empty task and appointment sections show clear empty-state text.
- Profile page uses a red **Log out** button.
- Added the supplied `curo-logo-darkmode.png`; dark theme swaps to this transparent logo without a light tile/halo.
- Existing login roles, Staff Appointment Desk, booking approvals, reminders, ClearCare, Gemini assistant and data routes are retained.

### Package setup
This source ZIP intentionally excludes `.env` and `curo.db` so private API keys and local account data are not distributed. Copy your own `.env` and `curo.db` from your existing local project into the extracted `Curo` folder if you need to retain those settings and records. Keep `.env` private and never commit it to a public repository.


### Follow-up fixes (18 October 2026)
- Overview appointment panel title is now **Appointments & Reminder**.
- Public header shows a red **Log out** button when signed in.
- Ask Curo launcher uses a blue-to-turquoise gradient and hover/pressed/focus feedback.
- Landing section ribbons (including FAQ) are wider and use larger bold text, aligned with the content card width.
- Fixed Care Plan task submission to read fields via `form.elements.namedItem(...)` instead of `form.title`, which can collide with the built-in HTML form title property. The form now shows a saving state, posts title/date/category to the API, refreshes Overview after the response, and reports duplicate tasks clearly.


## Latest follow-up fixes
- Fixed Care Plan task persistence: `/api/tasks` now supplies all seven SQL values, including `completed=0`, so new tasks can be inserted successfully and then appear in the Care Plan and Overview refresh.
- Footer navigation separators are separate spans, so the `|` separators do not inherit link underline styling.
- Ask Curo has been moved into the shared public/dashboard header, immediately to the left of Display settings, instead of floating at the bottom-right.
- Ask Curo uses a blue-to-turquoise gradient and retains hover, pressed and focus feedback.
