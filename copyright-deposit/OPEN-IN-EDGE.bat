@echo off
set "FILE=%~dp0Cognitive-Care-Assistant-Copyright-Deposit.html"
if not exist "%FILE%" (
  echo File not found: %FILE%
  pause
  exit /b 1
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%FILE%"
  exit /b 0
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%FILE%"
  exit /b 0
)
start "" "msedge" "%FILE%"
exit /b 0
