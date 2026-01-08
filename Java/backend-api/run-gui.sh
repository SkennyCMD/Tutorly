#!/bin/bash

# Script per avviare la GUI di gestione del server

cd "$(dirname "$0")"

echo "Compilazione della GUI..."
javac -d target/classes -cp ".:target/classes" src/main/java/com/tutorly/app/backend_api/gui/ServerLauncherGUI.java

if [ $? -eq 0 ]; then
    echo "Avvio della GUI..."
    java -cp target/classes com.tutorly.app.backend_api.gui.ServerLauncherGUI
else
    echo "Errore durante la compilazione!"
    exit 1
fi
