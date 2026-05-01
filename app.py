"""
Cirqen - Engineering Healthcare
Flask Web Application (Enhanced - Fixed Routing)
"""

from flask import Flask, send_from_directory, request, jsonify
from datetime import datetime
import json
import os

# Configure Flask to serve static files from current directory
app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'cirqen-engineering-healthcare-2025'

CONTACTS_FILE = 'contacts.json'

def load_contacts():
    if os.path.exists(CONTACTS_FILE):
        with open(CONTACTS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_contact(contact_data):
    contacts = load_contacts()
    contact_data['timestamp'] = datetime.now().isoformat()
    contact_data['id'] = len(contacts) + 1
    contacts.append(contact_data)

    with open(CONTACTS_FILE, 'w') as f:
        json.dump(contacts, f, indent=2)

    return contact_data

# Main routes
@app.route('/')
def index():
    """Homepage"""
    return send_from_directory('.', 'index.html')

@app.route('/index.html')
def index_html():
    """Homepage with .html extension"""
    return send_from_directory('.', 'index.html')

@app.route('/biomedical')
@app.route('/biomedical.html')
def biomedical():
    """Biomedical Systems detail page"""
    return send_from_directory('.', 'biomedical.html')

@app.route('/computational')
@app.route('/computational.html')
def computational():
    """Computational Health & Oncology Research detail page"""
    return send_from_directory('.', 'computational.html')

@app.route('/analytics')
@app.route('/analytics.html')
def analytics():
    """Healthcare Analytics & Innovation detail page"""
    return send_from_directory('.', 'analytics.html')

# Static file serving
@app.route('/styles.css')
def serve_css():
    """Serve CSS file"""
    return send_from_directory('.', 'styles.css', mimetype='text/css')

@app.route('/main.js')
def serve_js():
    """Serve JavaScript file"""
    return send_from_directory('.', 'main.js', mimetype='application/javascript')

# API endpoints
@app.route('/api/contact', methods=['POST'])
def contact_submission():
    try:
        data = request.get_json()
        required_fields = ['name', 'email', 'organization', 'message']

        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        contact = save_contact(data)

        return jsonify({
            'success': True,
            'message': 'Thank you for your message!',
            'contact_id': contact['id']
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats')
def get_stats():
    """Get platform statistics"""
    return jsonify({
        'calibration_accuracy': 99.9,
        'devices_managed': 50000,
        'simulations_run': 15000000,
        'uptime': 98.7,
        'satisfaction': 4.9
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'cirqen-website',
        'timestamp': datetime.now().isoformat()
    })

# Catch-all for any other static files
@app.route('/<path:filename>')
def serve_file(filename):
    """Serve any other static files"""
    try:
        return send_from_directory('.', filename)
    except:
        return "File not found", 404

if __name__ == '__main__':
    # Create contacts file if it doesn't exist
    if not os.path.exists(CONTACTS_FILE):
        with open(CONTACTS_FILE, 'w') as f:
            json.dump([], f)

    print("=" * 70)
    print("CIRQEN - Engineering Healthcare")
    print("=" * 70)
    print("Enhanced Platform: Biomedical + Oncology Research + Analytics")
    print("Flask server starting...")
    print("")
    print("🌐 Access the website at:")
    print("   • Homepage:     http://localhost:5001")
    print("   • Biomedical:   http://localhost:5001/biomedical")
    print("   • Computational: http://localhost:5001/computational")
    print("   • Analytics:    http://localhost:5001/analytics")
    print("")
    print("📁 API Endpoints:")
    print("   • POST /api/contact - Submit contact form")
    print("   • GET  /api/stats   - Get platform statistics")
    print("   • GET  /api/health  - Health check")
    print("=" * 70)
    print("")

    app.run(debug=True, host='0.0.0.0', port=5001)


@app.route('/api/contact', methods=['POST'])
def contact_submission():
    try:
        data = request.get_json()
        required_fields = ['name', 'email', 'organization', 'message']

        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        contact = save_contact(data)

        return jsonify({
            'success': True,
            'message': 'Thank you for your message!',
            'contact_id': contact['id']
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats')
def get_stats():
    return jsonify({
        'calibration_accuracy': 99.9,
        'devices_managed': 50000,
        'simulations_run': 15000000,
        'uptime': 98.7,
        'satisfaction': 4.9
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'cirqen-website',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    if not os.path.exists(CONTACTS_FILE):
        with open(CONTACTS_FILE, 'w') as f:
            json.dump([], f)

    print("=" * 70)
    print("CIRQEN - Engineering Healthcare")
    print("=" * 70)
    print("Enhanced Platform: Biomedical + Oncology Research + Analytics")
    print("Flask server starting...")
    print("Access at: http://localhost:5001")
    print("=" * 70)

    app.run(debug=True, host='0.0.0.0', port=5001)
