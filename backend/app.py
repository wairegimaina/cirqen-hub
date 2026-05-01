#!/usr/bin/env python3
"""
Cirqen - Flask Backend (Render-ready)

- API for contact form
- SQLite storage (temporary for production)
- Email notifications
- Ready for Gunicorn deployment
"""

# ─────────────────────────────────────────────
# Load environment variables
# ─────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

# ─────────────────────────────────────────────
# Timezone
# ─────────────────────────────────────────────
EAT = ZoneInfo("Africa/Nairobi")

# ─────────────────────────────────────────────
# Paths (IMPORTANT for your structure)
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

# Set ENV=production in your Render environment variables.
# In development it defaults to "development" so both modes work automatically.
IS_PRODUCTION = os.environ.get("ENV", "development") == "production"

# ─────────────────────────────────────────────
# App & DB setup
# ─────────────────────────────────────────────
app = Flask(__name__)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this')

# ─────────────────────────────────────────────
# Database — Postgres primary, SQLite fallback
# ─────────────────────────────────────────────
def resolve_db_uri():
    raw = os.environ.get('DATABASE_URL', '')
    if raw:
        uri = raw.replace('postgres://', 'postgresql://', 1)
        try:
            import psycopg2
            conn = psycopg2.connect(uri, connect_timeout=5)
            conn.close()
            print("[db] Connected to Postgres ✔")
            return uri
        except Exception as e:
            print(f"[db] Postgres unavailable ({e}) — falling back to SQLite")

    sqlite_path = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'cirqen.db')}"
    print(f"[db] Using SQLite: {sqlite_path}")
    return sqlite_path

app.config['SQLALCHEMY_DATABASE_URI'] = resolve_db_uri()

db = SQLAlchemy(app)

# ─────────────────────────────────────────────
# Database model
# ─────────────────────────────────────────────
class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f'<Contact {self.name}>'

# ─────────────────────────────────────────────
# Admin panel → /admin
# ─────────────────────────────────────────────
admin = Admin(app, name='Cirqen Admin')
admin.add_view(ModelView(Contact, db.session))

# ─────────────────────────────────────────────
# Email config
# ─────────────────────────────────────────────
NOTIFY_EMAIL = 'mainawairegi412@gmail.com'
GMAIL_USER = os.environ.get('GMAIL_USER')
GMAIL_PASSWORD = os.environ.get('GMAIL_PASSWORD')

def format_now_eat():
    return datetime.now(timezone.utc).astimezone(EAT).strftime('%Y-%m-%d %H:%M EAT')

def send_email_notification(name, email, message):
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print("[email] Missing credentials — skipping email")
        return

    submitted_at = format_now_eat()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Cirqen enquiry from {name}"
    msg["From"] = GMAIL_USER
    msg["To"] = NOTIFY_EMAIL
    msg["Reply-To"] = email

    text = f"""
New contact form submission

Name: {name}
Email: {email}

Message:
{message}

Submitted at {submitted_at}
"""

    html = f"""
    <html>
    <body>
        <h2 style="color:#156a3c;">New Cirqen Enquiry</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <h3>Message</h3>
        <p>{message}</p>
        <hr>
        <small>{submitted_at}</small>
    </body>
    </html>
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(GMAIL_USER, GMAIL_PASSWORD)
        smtp.sendmail(GMAIL_USER, NOTIFY_EMAIL, msg.as_string())

    print(f"[email] Sent for {name}")

# ─────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────
@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "All fields required"}), 400

    entry = Contact(name=name, email=email, message=message)
    db.session.add(entry)
    db.session.commit()

    try:
        send_email_notification(name, email, message)
    except Exception as e:
        print(f"[email] Failed: {e}")

    return jsonify({"ok": True})

# ─────────────────────────────────────────────
# Frontend serving (dev + production)
# ─────────────────────────────────────────────
# Serves index.html and all static assets (CSS, JS, images) from ../frontend/
# Works locally and on Render — frontend uses relative /api/contact so no
# origin mismatch. To split later (Vercel + Render), just set ENV=production
# and remove these routes; add CORS via FRONTEND_ORIGIN env var instead.

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)

# ─────────────────────────────────────────────
# CORS — only needed if frontend is on a different origin (split deployment)
# ─────────────────────────────────────────────
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN")  # e.g. https://cirqen.vercel.app

@app.after_request
def add_cors(response):
    origin = FRONTEND_ORIGIN or "*"
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# ─────────────────────────────────────────────
# Startup (Render-compatible)
# ─────────────────────────────────────────────
with app.app_context():
    db.create_all()

# DO NOT run app.run() in production
if __name__ == "__main__":
    app.run(port=8001, debug=True)
