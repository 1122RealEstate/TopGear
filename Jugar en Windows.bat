@echo off
rem ==========================================================
rem  TOP GEAR - Supercar Legends (Windows)
rem  Abre el juego en una ventana propia con Microsoft Edge
rem  (o Google Chrome). Si no estan, usa el navegador por defecto.
rem ==========================================================
setlocal
set "GAME=%~dp0TopGear.html"
set "URL=file:///%GAME:\=/%"

where msedge >nul 2>nul && (start "" msedge --app="%URL%" --start-maximized & goto :fin)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" --start-maximized & goto :fin)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" --start-maximized & goto :fin)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%URL%" --start-maximized & goto :fin)
start "" "%GAME%"

:fin
endlocal
