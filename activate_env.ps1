# PowerShell script to activate Python virtual environment
# Usage: .\activate_env.ps1

Write-Host "Activating Python virtual environment..." -ForegroundColor Green

if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment activated!" -ForegroundColor Green
    Write-Host "Python: $(python --version)" -ForegroundColor Cyan
    Write-Host "Pip: $(pip --version)" -ForegroundColor Cyan
} else {
    Write-Host "Error: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating new virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment created and activated!" -ForegroundColor Green
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install --upgrade pip
    pip install -r requirements.txt
    Write-Host "✓ Dependencies installed!" -ForegroundColor Green
}

