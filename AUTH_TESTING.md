# Auth & Routing Testing Guide

## 🚀 Setup abgeschlossen!

Alle Komponenten sind implementiert und bereit zum Testen.

## 📋 Was wurde implementiert:

### 1. **Authentication Service**
- ✅ Login mit Email/Password
- ✅ Registrierung neuer User
- ✅ Logout-Funktion
- ✅ Automatische User-Dokument-Erstellung in Firestore
- ✅ Deutsche Fehlermeldungen

### 2. **UI-Komponenten**
- ✅ [AuthScreen](src/ui/components/AuthScreen.tsx) - Login/Register mit Tab-Switching
- ✅ [Header](src/ui/components/Header.tsx) - Mit User-Info und Logout-Button
- ✅ [GameLayout](src/ui/components/GameLayout.tsx) - Layout-Wrapper mit Header

### 3. **Routing**
- ✅ React Router Setup
- ✅ Protected Routes (nur für eingeloggte User)
- ✅ Public Routes (Login/Register)
- ✅ Automatische Weiterleitung

### 4. **Error Handling**
- ✅ Fehlerbehandlung bei Auth-Operationen
- ✅ User-freundliche Fehlermeldungen
- ✅ Loading States

---

## 🧪 Testen mit UI

### Dev-Server starten
```bash
npm run dev
```

Der Server läuft auf: **http://localhost:3001**

### Test-Ablauf

#### 1. **Registrierung testen**
1. Öffne http://localhost:3001
2. Du wirst zur Login-Seite weitergeleitet
3. Klicke auf "Registrierung" Tab
4. Fülle aus:
   - Anzeigename: `TestUser`
   - Email: `test@example.com`
   - Passwort: `test123456`
5. Klicke "Registrieren"
6. Bei Erfolg → Weiterleitung zum Hauptmenü

#### 2. **Login testen**
1. Klicke auf "Logout" (oben rechts)
2. Du wirst zurück zur Login-Seite geleitet
3. Klicke auf "Login" Tab
4. Gib deine Test-Credentials ein
5. Bei Erfolg → Weiterleitung zum Hauptmenü

#### 3. **Protected Routes testen**
1. Versuche direkt zu `http://localhost:3001/game` zu gehen
2. Du wirst automatisch zu `/login` weitergeleitet (wenn nicht eingeloggt)
3. Nach Login kannst du alle Routes besuchen:
   - `/` - Hauptmenü
   - `/deck-builder` - Deck Builder
   - `/player-select` - Farbauswahl
   - `/game` - Spiel

#### 4. **Firestore-Integration prüfen**
1. Gehe zur [Firebase Console](https://console.firebase.google.com)
2. Wähle dein Projekt: `deckmatechess`
3. Gehe zu **Firestore Database**
4. Du solltest eine `users` Collection sehen
5. Darin einen User mit deiner UID und den Daten:
   ```json
   {
     "displayName": "TestUser",
     "rankedUnlocked": false,
     "unrankedWins": 0,
     "tier": "Pawn",
     "division": 3,
     "lp": 0,
     "mmr": 1000,
     "wins": 0,
     "losses": 0
   }
   ```

---

## ⚡ Schnelltest

```bash
# 1. Terminal: Dev-Server
npm run dev

# 2. Browser öffnen
# http://localhost:3001

# 3. Registrieren → Spielen → Logout → Login
```

---

## 🐛 Häufige Probleme

### "auth/email-already-in-use"
- Email existiert bereits
- Lösung: Andere Email verwenden oder in Firebase Console löschen

### "permission-denied" bei Firestore
- Security Rules zu strikt
- Lösung: In `firestore.rules` temporär alle Operationen erlauben:
  ```
  match /{document=**} {
    allow read, write: if request.auth != null;
  }
  ```
- Deployen: `firebase deploy --only firestore:rules`

### Weiterleitung funktioniert nicht
- Browser-Cache leeren
- In Incognito/Private Mode testen

### "Cannot read properties of null"
- Firebase Config fehlt in `.env`
- Prüfe, dass alle `VITE_FIREBASE_*` Variablen gesetzt sind

---

## 📊 Routing-Struktur

```
/ (root)
├── /login                    (Public - AuthScreen)
│
└── /* (Protected - GameLayout wrapper)
    ├── /                     (MainMenu)
    ├── /deck-builder         (DeckBuilder)
    ├── /player-select        (Color Selection)
    ├── /game                 (GameView)
    └── /multiplayer/
        ├── /deck-white      (Multiplayer Deck Builder White)
        ├── /deck-black      (Multiplayer Deck Builder Black)
        └── /game            (Multiplayer Game)
```

---

## 🔒 Security

- ✅ Geschäftslogik bleibt im Backend (Firebase Cloud Functions später)
- ✅ User-Dokumente nur für authentifizierte User lesbar/schreibbar
- ✅ Passwörter werden von Firebase Auth gehasht
- ✅ Keine sensitiven Daten im Frontend

---

## 📝 Nächste Schritte

1. ✅ Auth & Routing funktioniert → **Du bist hier!**
2. ⬜ Firestore Security Rules anpassen
3. ⬜ Password-Reset Flow implementieren
4. ⬜ Email-Verification
5. ⬜ Cloud Functions für Ranking-System

---

## 📚 Code-Struktur

```
src/
├── services/
│   ├── authService.ts        # Login, Register, Logout
│   ├── userService.ts        # User-Dokument CRUD
│   └── firebase.ts           # Firebase Init
├── ui/
│   ├── auth/
│   │   ├── AuthProvider.tsx  # Auth Context
│   │   └── ProtectedRoute.tsx
│   ├── components/
│   │   ├── AuthScreen.tsx    # Login/Register UI
│   │   ├── Header.tsx        # Header mit Logout
│   │   └── GameLayout.tsx    # Layout Wrapper
│   ├── routes/
│   │   └── GameRouter.tsx    # Game Routes
│   ├── App.tsx               # Main Router
│   └── main.tsx              # Entry Point
```

---

## ✅ Checkliste

- [x] Firebase initialisiert
- [x] Auth Service implementiert
- [x] User Service implementiert
- [x] Login UI
- [x] Registration UI
- [x] Routing Setup
- [x] Protected Routes
- [x] Header mit Logout
- [x] Error Handling
- [x] Loading States
- [x] Firestore Integration

**Alles bereit zum Testen!** 🎉
