#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse, unquote

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        # Remove leading slash for file system operations
        if path.startswith('/'):
            path = path[1:]
        
        # Handle root URL - serve index.html
        if path == '' or path == '/':
            path = 'index.html'
        
        # If path doesn't end with .html and doesn't have an extension, try adding .html
        elif '.' not in os.path.basename(path):
            # Check if the .html version exists
            html_path = path + '.html'
            if os.path.isfile(html_path):
                path = html_path
        
        # Update the request path
        self.path = '/' + path if path != 'index.html' or self.path != '/' else '/index.html'
        
        # Call the parent class method to handle the request
        return super().do_GET()
    
    def end_headers(self):
        # Add CORS headers to prevent issues with external resources
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=8000):
    handler = CleanURLHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving HTTP on port {port} with clean URLs...")
        print(f"Access your site at: http://localhost:{port}/")
        print("\nClean URL examples:")
        print(f"  http://localhost:{port}/          → index.html")
        print(f"  http://localhost:{port}/about     → about.html")
        print(f"  http://localhost:{port}/contact   → contact.html")
        print(f"  http://localhost:{port}/signup    → signup.html")
        print("\nPress Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.shutdown()

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)