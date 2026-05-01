#!/usr/bin/env python3
"""
Cirqen - Flask Backend
Serves the site, stores contact form submissions in SQLite,
and emails them to mainawairegi412@gmail.com.
"""

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
EAT = ZoneInfo("Africa/Nairobi")   # UTC+3  –  change to any tz string you need

# ─────────────────────────────────────────────
# App & DB setup
# ─────────────────────────────────────────────
app = Flask(__name__, static_folder='.')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cirqen.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this-before-going-live')

db = SQLAlchemy(app)

# ─────────────────────────────────────────────
# Database model
# Stored in UTC (best practice); displayed in EAT wherever shown to humans.
# ─────────────────────────────────────────────
class Contact(db.Model):
    id         = db.Column(db.Integer,           primary_key=True)
    name       = db.Column(db.String(100),       nullable=False)
    email      = db.Column(db.String(120),       nullable=False)
    message    = db.Column(db.Text,              nullable=False)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Contact {self.name} – {self.email}>'

# ─────────────────────────────────────────────
# Admin panel  →  visit /admin
# ─────────────────────────────────────────────
admin = Admin(app, name='Cirqen Admin')
admin.add_view(ModelView(Contact, db))

# ─────────────────────────────────────────────
# Email helper
# ─────────────────────────────────────────────
NOTIFY_EMAIL   = 'mainawairegi412@gmail.com'
GMAIL_USER     = os.environ.get('GMAIL_USER')
GMAIL_PASSWORD = os.environ.get('GMAIL_PASSWORD')

def format_now_eat() -> str:
    """Return the current time formatted in EAT for display in emails / logs."""
    return datetime.now(timezone.utc).astimezone(EAT).strftime('%Y-%m-%d %H:%M EAT')

def send_email_notification(name: str, email: str, message: str) -> None:
    """Send a notification email to NOTIFY_EMAIL via Gmail SMTP."""
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print('[email] GMAIL_USER / GMAIL_PASSWORD not set – skipping email.')
        return

    submitted_at = format_now_eat()

    msg = MIMEMultipart('alternative')
    msg['Subject']  = f'New Cirqen enquiry from {name}'
    msg['From']     = GMAIL_USER
    msg['To']       = NOTIFY_EMAIL
    msg['Reply-To'] = email   # replying goes straight to the visitor

    # ── Plain-text fallback ───────────────────
    text = (
        f"New contact form submission\n"
        f"───────────────────────────\n"
        f"Name:    {name}\n"
        f"Email:   {email}\n"
        f"Message:\n{message}\n"
        f"\nSubmitted at {submitted_at}\n"
    )

    # ── HTML version ──────────────────────────
    html = f"""
    <html>
    <body style="font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:auto">
      <h2 style="color:#156a3c">New Cirqen Enquiry</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#555;width:80px"><strong>Name</strong></td>
          <td style="padding:8px 0">{name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#555"><strong>Email</strong></td>
          <td style="padding:8px 0">
            <a href="mailto:{email}">{email}</a>
          </td>
        </tr>
      </table>
      <h3 style="color:#555;margin-top:24px">Message</h3>
      <p style="background:#f5f5f5;padding:16px;border-radius:8px;
                white-space:pre-wrap">{message}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:12px;color:#999">Submitted at {submitted_at}</p>
    </body>
    </html>
    """

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html,  'html'))

    with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(GMAIL_USER, GMAIL_PASSWORD)
        smtp.sendmail(GMAIL_USER, NOTIFY_EMAIL, msg.as_string())

    print(f'[email] Notification sent for {name} <{email}> at {submitted_at}')

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.route('/')
@app.route('/<path:filename>')
def serve_static(filename='index.html'):
    return send_from_directory('.', filename)

@app.route('/api/contact', methods=['POST'])
def contact():
    data    = request.get_json(silent=True) or {}
    name    = (data.get('name')    or '').strip()
    email   = (data.get('email')   or '').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({'ok': False, 'error': 'All fields are required.'}), 400

    # Save to database (timestamp stored in UTC)
    entry = Contact(name=name, email=email, message=message)
    db.session.add(entry)
    db.session.commit()

    # Send email notification (non-fatal – don't crash if email fails)
    try:
        send_email_notification(name, email, message)
    except Exception as exc:
        print(f'[email] Failed to send notification: {exc}')

    return jsonify({'ok': True})

# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print('=' * 65)
    print('  CIRQEN – Engineering Healthcare')
    print('=' * 65)
    print(f'  Started at {format_now_eat()}')
    print('  http://localhost:8001')
    print('  Admin panel → http://localhost:8001/admin')
    print('=' * 65)
    app.run(port=8001, debug=True)
