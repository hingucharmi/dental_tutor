#!/bin/bash
# Bash script to set up and activate Python virtual environment (Linux/Mac)
# Usage: source setup_env.sh

echo "Setting up Python virtual environment..."

if [ ! -d "venv" ]; then
    echo "Creating new virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed!"
else
    echo "Warning: requirements.txt not found"
fi

echo "✓ Virtual environment activated!"
echo "Python: $(python --version)"
echo "Pip: $(pip --version)"

