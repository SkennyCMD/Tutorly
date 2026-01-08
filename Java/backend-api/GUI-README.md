# Tutorly API Server Manager - GUI

Interfaccia grafica Swing per gestire l'avvio e la configurazione del server API Tutorly.

## Caratteristiche

✅ **Gestione configurazione database**
- Host, porta, nome database
- Username e password
- Salvataggio automatico dell'ultima configurazione

✅ **Configurazione server**
- Porta del server
- SSL abilitato/disabilitato
- Percorso keystore e password
- API Key di sicurezza

✅ **Controllo server**
- Avvio del server Spring Boot
- Arresto del server
- Log in tempo reale

✅ **Persistenza configurazione**
- All'avvio vengono caricate le informazioni dell'ultimo collegamento
- Salvataggio manuale della configurazione

## Come usare

### Opzione 1: Script di avvio (Consigliato)

#### Su Linux/Mac:
```bash
chmod +x run-gui.sh
./run-gui.sh
```

#### Su Windows:
```cmd
run-gui.bat
```

### Opzione 2: Compilazione ed esecuzione manuale

```bash
# Compilazione
javac -cp ".:target/classes" src/main/java/com/tutorly/app/backend_api/gui/ServerLauncherGUI.java

# Esecuzione
cd src/main/java
java com.tutorly.app.backend_api.gui.ServerLauncherGUI
```

### Opzione 3: Esecuzione diretta da IDE

Apri il file `ServerLauncherGUI.java` nel tuo IDE (IntelliJ IDEA, Eclipse, VS Code) ed esegui il metodo `main`.

## Utilizzo della GUI

1. **All'avvio**: La GUI carica automaticamente l'ultima configurazione salvata da `launcher-config.properties`

2. **Configurazione Database**:
   - Inserisci host (es: localhost)
   - Porta (es: 5432)
   - Nome database (es: tutorly_db)
   - Username e password

3. **Configurazione Server**:
   - Porta del server (es: 8443 per HTTPS)
   - Abilita/disabilita SSL
   - Percorso keystore (es: classpath:keystore.p12)
   - Password keystore
   - API Key di sicurezza

4. **Salva configurazione**: Clicca su "Salva Configurazione" per salvare le impostazioni

5. **Avvia server**: Clicca su "Avvia Server" per:
   - Aggiornare automaticamente `application.properties`
   - Avviare il server Spring Boot
   - Visualizzare i log in tempo reale

6. **Ferma server**: Clicca su "Ferma Server" per arrestare il server

## File generati

- `launcher-config.properties`: Contiene l'ultima configurazione salvata (nella directory root del progetto)
- `application.properties`: Viene aggiornato automaticamente all'avvio del server

## Note

- La GUI deve essere eseguita dalla directory root del progetto (`backend-api`)
- Assicurati che Maven sia installato e configurato correttamente
- Per Windows usa `mvnw.cmd`, per Linux/Mac usa `./mvnw`
- I log del server vengono visualizzati nella sezione "Log Server" della GUI

## Requisiti

- Java 21 o superiore
- Maven
- PostgreSQL in esecuzione (se vuoi connetterti al database)

## Troubleshooting

**Problema**: Il server non si avvia
- Verifica che la porta specificata non sia già in uso
- Controlla che le credenziali del database siano corrette
- Verifica che PostgreSQL sia in esecuzione

**Problema**: SSL non funziona
- Verifica che il file keystore esista nel percorso specificato
- Controlla che la password del keystore sia corretta

**Problema**: La GUI non trova il file application.properties
- Assicurati di eseguire la GUI dalla directory `backend-api`
- Il percorso predefinito è `src/main/resources/application.properties`
