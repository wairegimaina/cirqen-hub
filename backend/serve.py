#!/usr/bin/env python3

import http.server
import socketserver
import os

PORT = 8001

# Get project root (one level up from backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Frontend folder path
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from frontend folder
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        # Allow frontend requests (useful later for API)
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


if __name__ == '__main__':
    print("=" * 70)
    print("CIRQEN - Engineering Healthcare")
    print("=" * 70)
    print(f"🌐 Server running at: http://localhost:{PORT}")
    print(f"📁 Serving frontend from: {FRONTEND_DIR}")
    print("")
    print("Pages:")
    print(f"  • Home:         http://localhost:{PORT}/index.html")
    print(f"  • Biomedical:   http://localhost:{PORT}/biomedical.html")
    print(f"  • Computational:http://localhost:{PORT}/computational.html")
    print(f"  • Analytics:    http://localhost:{PORT}/analytics.html")
    print("=" * 70)

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
