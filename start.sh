#!/bin/bash

echo "===================================="
echo "CIRQEN - Engineering Healthcare"
echo "===================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed"
        echo "Please install Python from https://www.python.org/"
        exit 1
    fi
    PYTHON=python
else
    PYTHON=python3
fi

echo "Choose your server:"
echo ""
echo "1. Simple Server (Recommended - Port 8000)"
echo "2. Flask Server (Full features - Port 5000)"
echo "3. Just open index.html in browser"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Starting Simple HTTP Server on http://localhost:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        $PYTHON serve.py
        ;;
    2)
        echo ""
        echo "Checking Flask installation..."
        $PYTHON -c "import flask" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "Flask not installed. Installing..."
            pip install flask
        fi
        echo ""
        echo "Starting Flask Server on http://localhost:5000"
        echo "Press Ctrl+C to stop"
        echo ""
        $PYTHON app.py
        ;;
    3)
        echo ""
        echo "Opening index.html in default browser..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open index.html
        else
            # Linux
            xdg-open index.html 2>/dev/null || echo "Please open index.html manually"
        fi
        ;;
    *)
        echo "Invalid choice. Please run again."
        exit 1
        ;;
esac
