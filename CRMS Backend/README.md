# CRMS Backend (Cash Management & Reconciliation System)

Robust Django REST Framework API for multi-branch cash collection, reconciliation, and bank settlements.

## Render Deployment Guide

### Option 1: Automatic Blueprint (Easiest)
1. Push this repository to GitHub.
2. In Render Dashboard, click **New +** -> **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml` and provision:
   - A PostgreSQL database (`crms-database`)
   - A Python Web Service (`crms-backend`)
4. Render will run `build.sh` (installs dependencies, runs migrations, seeds demo data, and collects static files).

### Option 2: Manual Web Service
1. **Create PostgreSQL Database** on Render:
   - Name: `crms-database`
   - Copy the **Internal Database URL** (or External if connecting from outside).
2. **Create Web Service** on Render:
   - Environment: `Python`
   - Build Command: `./build.sh` (or `pip install -r requirements.txt && python manage.py migrate && python manage.py seed_data && python manage.py collectstatic --no-input`)
   - Start Command: `gunicorn cmrs_project.wsgi:application`
3. **Environment Variables**:
   - `DATABASE_URL`: Your Render Postgres connection string
   - `PYTHON_VERSION`: `3.11.9`
   - `DEBUG`: `False`
   - `SECRET_KEY`: `<generate-a-random-secret-key>`
   - `CORS_ALLOW_ALL_ORIGINS`: `True` (or set `CORS_ALLOWED_ORIGINS` to your Vercel URL e.g. `https://your-frontend.vercel.app`)

## Local Development
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```
API Documentation will be available at: `http://127.0.0.1:8000/api/docs/`
