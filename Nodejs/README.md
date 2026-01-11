# Tutorly - Sistema di Login Node.js

Sistema di autenticazione completo per la piattaforma Tutorly costruito con Express.js, EJS e bcrypt.

## 🚀 Caratteristiche

- ✅ Sistema di login sicuro con hash delle password (bcrypt)
- ✅ Gestione sessioni con express-session
- ✅ Middleware di autenticazione e autorizzazione
- ✅ Pagine responsive con design moderno
- ✅ Dashboard personalizzata per ruolo utente
- ✅ Logout sicuro
- ✅ Protezione delle route

## 📦 Installazione

1. Installa le dipendenze:
```bash
npm install
```

## 🏃 Avvio del Server

### Modalità di produzione:
```bash
npm start
```

### Modalità di sviluppo (con nodemon):
```bash
npm run dev
```

Il server sarà disponibile su: **http://localhost:3000**

## 👤 Account Demo

Per testare il sistema, puoi utilizzare questi account:

| Ruolo | Username | Email | Password |
|-------|----------|-------|----------|
| Admin | admin | admin@tutorly.com | admin123 |
| Student | student | student@tutorly.com | admin123 |
| Tutor | tutor | tutor@tutorly.com | admin123 |

## 📁 Struttura del Progetto

```
Nodejs/
├── src/
│   └── index.js                    # Server principale e routes
├── views/
│   ├── login.ejs                   # Pagina di login
│   └── dashboard.ejs               # Dashboard utente
├── public/
│   └── css/
│       ├── login.css               # Stili login
│       └── dashboard.css           # Stili dashboard
├── server_utilities/
│   ├── authMiddleware.js           # Middleware di autenticazione
│   └── userService.js              # Gestione utenti
└── package.json
```

## 🔐 API Endpoints

### Autenticazione

- `GET /` - Homepage (redirect a login o dashboard)
- `GET /login` - Pagina di login
- `POST /login` - Effettua il login
- `POST /logout` - Effettua il logout
- `GET /dashboard` - Dashboard utente (protetta)
- `GET /api/auth/status` - Stato autenticazione (API)

## 🛡️ Middleware di Sicurezza

### `isAuthenticated`
Verifica che l'utente sia autenticato prima di accedere a una route protetta.

```javascript
app.get('/dashboard', isAuthenticated, (req, res) => {
    // Route protetta
});
```

### `hasRole(...roles)`
Verifica che l'utente abbia uno dei ruoli specificati.

```javascript
app.get('/admin', hasRole('admin'), (req, res) => {
    // Solo admin possono accedere
});
```

### `isGuest`
Permette l'accesso solo agli utenti non autenticati (es. pagina login).

## 📝 Sessioni

Le sessioni sono configurate con:
- **Durata:** 24 ore
- **Cookie httpOnly:** Sì (protezione XSS)
- **Cookie secure:** No (impostare su true in produzione con HTTPS)

## 🔧 Configurazione

### Variabili d'ambiente

Puoi creare un file `.env` per configurare:

```env
PORT=3000
SESSION_SECRET=tuo-secret-super-sicuro
NODE_ENV=production
```

### Modifica il Secret della Sessione

⚠️ **IMPORTANTE:** Prima di andare in produzione, cambia il secret della sessione in [src/index.js](src/index.js):

```javascript
app.use(session({
    secret: 'CAMBIA-QUESTO-SECRET-IN-PRODUZIONE',
    // ...
}));
```

## 🗄️ Database

Attualmente il sistema usa un mock database in memoria. Per la produzione, integra un vero database:

### Opzioni consigliate:
- **PostgreSQL** (per integrare con il backend Java esistente)
- **MongoDB**
- **MySQL**

Modifica [server_utilities/userService.js](server_utilities/userService.js) per integrare il tuo database.

## 🎨 Personalizzazione

### Cambiare i colori del tema

Modifica i file CSS in `public/css/`:
- `login.css` - Colori della pagina di login
- `dashboard.css` - Colori della dashboard

Cerca i gradient:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🔄 Integrazione con Backend Java

Per integrare con il backend Java esistente:

1. Configura le chiamate API al backend Java in [src/index.js](src/index.js)
2. Usa `fetch` o `axios` per comunicare con le API Java
3. Sincronizza l'autenticazione tra Node.js e Java (JWT o sessioni condivise)

## 📚 Prossimi Passi

- [ ] Implementare la registrazione utenti
- [ ] Aggiungere "Password dimenticata"
- [ ] Implementare OAuth (Google, Facebook)
- [ ] Aggiungere validazione email
- [ ] Implementare 2FA (Two-Factor Authentication)
- [ ] Integrare con database reale
- [ ] Aggiungere rate limiting
- [ ] Implementare CSRF protection

## 🐛 Troubleshooting

### Errore: "Cannot find module 'express'"
```bash
npm install
```

### Il server non parte
Verifica che la porta 3000 non sia occupata:
```bash
lsof -i :3000
```

### Le sessioni non persistono
Verifica che i cookie siano abilitati nel browser.

## 📄 Licenza

ISC

## 👨‍💻 Sviluppo

Contributi benvenuti! Per contribuire:

1. Fork del progetto
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit delle modifiche (`git commit -am 'Aggiunta nuova funzione'`)
4. Push al branch (`git push origin feature/nuova-funzione`)
5. Apri una Pull Request

---

Creato con ❤️ per Tutorly
