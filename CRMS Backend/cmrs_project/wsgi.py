import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cmrs_project.settings')

application = get_wsgi_application()

# Free-tier auto-migration & seed data on server startup
try:
    from django.core.management import call_command
    from django.db import connection
    print("Auto-checking database tables on startup...")
    call_command('migrate', interactive=False)

    from core.models import User
    if User.objects.count() == 0:
        print("Database is empty. Initializing demo seed data...")
        call_command('seed_data')
    print("Database startup check completed successfully!")
except Exception as e:
    print(f"Startup database check notification: {e}")
