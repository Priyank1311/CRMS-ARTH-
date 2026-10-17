#!/usr/bin/env bash
set -o errexit

echo "Applying database migrations..."
python manage.py migrate --no-input

echo "Seeding initial demo data if needed..."
python manage.py seed_data || true

echo "Starting Gunicorn server..."
gunicorn cmrs_project.wsgi:application
