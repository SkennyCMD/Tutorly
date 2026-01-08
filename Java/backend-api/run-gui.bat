@echo off

REM Script per avviare la GUI di gestione del server (Windows)

cd /d "%~dp0"

echo Compilazione della GUI...
javac -d target\classes -cp ".;target\classes" src\main\java\com\tutorly\app\backend_api\gui\ServerLauncherGUI.java

if %ERRORLEVEL% EQU 0 (
    echo Avvio della GUI...
    java -cp target\classes com.tutorly.app.backend_api.gui.ServerLauncherGUI
) else (
    echo Errore durante la compilazione!
    exit /b 1
)
