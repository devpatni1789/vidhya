@echo off
setlocal
cd /d "%~dp0"
echo Starting GTU Diploma Study Space at http://localhost:5500/
echo Keep this window open while using the website.
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 5500
) else (
  python -m http.server 5500
)
