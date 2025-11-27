@echo off
REM Batch script to activate Python virtual environment
REM Usage: activate_env.bat

echo Activating Python virtual environment...

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo Virtual environment activated!
    python --version
    pip --version
) else (
    echo Error: Virtual environment not found!
    echo Creating new virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Virtual environment created and activated!
    echo Installing dependencies...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    echo Dependencies installed!
)

