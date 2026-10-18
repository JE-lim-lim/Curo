# Curo competition deployment (browser-managed)

Deploy as a **Python web service** using a hosting dashboard (e.g. Render), connected to your GitHub repository.

- Runtime: Python 3.12 or 3.13 recommended (set `PYTHON_VERSION` to a supported runtime in hosting dashboard).
- Build command configured in hosting dashboard: `pip install -r requirements.txt` (hosting executes this automatically; no local PowerShell/CMD needed).
- Start command configured in hosting dashboard: `gunicorn app:app` (automated server startup).
- Environment variables: `CURO_SECRET_KEY` (random strong secret), `CURO_ADMIN_SETUP_TOKEN` (random 24+ character secret), `CURO_SECURE_COOKIES=1`, and `GEMINI_API_KEY` if the AI features need it.
- Visit `/setup-admin` in a browser once after deployment; supply the setup token and create the first administrator. Then visit `/login?role=administrator`. The setup page is disabled after the first admin is created.
- The SQLite database is stored in `curo.db` by default. **On hosts with ephemeral disks it will reset on redeployment or restart.** Use a persistent disk and set `CURO_DB_PATH` to its writable persistent location, or migrate to a managed database before real use.
- This is a prototype. Do not enter actual patient medical data or represent seeded fictional doctor profiles as verified.
- Do not commit `.env`, `curo.db`, uploads, or `.venv` to GitHub.
