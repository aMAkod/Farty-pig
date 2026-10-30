# ============================================================================
# Farty Pig - One-Click GitHub Push Script
# ============================================================================

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "C:\Users\Lenovo\pig"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  FARTY PIG -> GITHUB DEPLOYMENT          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check GitHub authentication
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nLogging into GitHub with browser..." -ForegroundColor Yellow
    gh auth login -h github.com -p https -w -s workflow
}

Write-Host "`nPushing code to main branch..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Your code is now live on GitHub:" -ForegroundColor Green
    Write-Host "https://github.com/aMAkod/Farty-pig" -ForegroundColor Cyan
} else {
    Write-Host "`nPush failed. Please check the error above." -ForegroundColor Red
}

Read-Host "`nPress Enter to exit"
