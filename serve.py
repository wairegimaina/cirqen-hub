#!/usr/bin/env python3
"""
Simple HTTP Server for Cirqen Website
Run this if you don't want to use Flask
"""

import http.server
import socketserver
import os

PORT = 8001

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("=" * 70)
    print("CIRQEN - Engineering Healthcare")
    print("Simple HTTP Server")
    print("=" * 70)
    print(f"🌐 Server running at: http://localhost:{PORT}")
    print("")
    print("📄 Pages available:")
    print(f"   • Homepage:      http://localhost:{PORT}/index.html")
    print(f"   • Biomedical:    http://localhost:{PORT}/biomedical.html")
    print(f"   • Computational: http://localhost:{PORT}/computational.html")
    print(f"   • Analytics:     http://localhost:{PORT}/analytics.html")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 70)
    print("")

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
