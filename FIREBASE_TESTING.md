# Firebase Testing Guide

## 🎯 Schnellstart

### Option 1: Automatischer Connection Test (empfohlen)

```bash
npm run test:firebase
```

Dieser Test:
- ✅ Initialisiert Firebase
- ✅ Erstellt einen Test-User
- ✅ Loggt sich ein
- ✅ Schreibt/Liest ein Firestore-Dokument
- ✅ Räumt alles wieder auf

**Wichtig**: Du musst **Email/Password Authentication** in der Firebase Console aktivieren.

---

### Option 2: Mit UI testen (manuell)

1. **User in Firebase Console anlegen**:
   - Gehe zu Firebase Console → Authentication → Users
   - Klicke "Add user"
   - Email: `test@example.com`
   - Password: `TestPassword123!`

2. **Dev-Server starten**:
   ```bash
   npm run dev
   ```

3. **Browser öffnen**: `http://localhost:5173`

4. **LoginScreen testen**:
   - Füge `LoginScreen` zu deiner App hinzu (siehe unten)
   - Logge dich mit dem Test-User ein

---

### Option 3: Mit Firebase Emulator (lokal, kein Internet)

1. **Emulator starten**:
   ```bash
   npm run emulator
   ```

2. **In separatem Terminal - Test ausführen**:
   ```bash
   # .env anpassen oder:
   VITE_USE_FIREBASE_EMULATOR=true npm run test:firebase
   ```

**Vorteile**:
- Keine echten Daten
- Keine Firebase-Kosten
- Schneller
- Offline verfügbar

**Emulator UI**: `http://localhost:4000`

---

## 📝 LoginScreen in App einbauen

### In `src/ui/App.tsx`:

```typescript
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './auth/AuthProvider';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  
  // Wenn nicht eingeloggt → LoginScreen zeigen
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginScreen onSuccess={() => setCurrentScreen('menu')} />;
  
  // Rest der App...
  return (
    <div>
      {/* Deine bestehende App */}
    </div>
  );
};
```

---

## ✅ Firestore Security Rules überprüfen

In `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Erlaube Lesen/Schreiben für authentifizierte User
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Für Tests: Erlaube alles (temporär!)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Deployment:
```bash
firebase deploy --only firestore:rules
```

---

## 🐛 Troubleshooting

### "auth/invalid-api-key"
- Prüfe `.env` Datei
- API Key muss mit `AIza` beginnen

### "auth/operation-not-allowed"
- Firebase Console → Authentication → Sign-in method
- Email/Password aktivieren

### "permission-denied" (Firestore)
- Firestore Security Rules anpassen
- Oder: User muss authentifiziert sein

### "CORS Error"
- Nur im Browser, nicht im Test-Script
- Lösung: Vite dev server nutzen (`npm run dev`)

---

## 📊 Was wird getestet?

| Test | Beschreibung |
|------|-------------|
| Firebase Init | App-Konfiguration korrekt? |
| Auth - Create User | Kann neuer User angelegt werden? |
| Auth - Login | Kann User sich einloggen? |
| Firestore - Write | Kann Dokument geschrieben werden? |
| Firestore - Read | Kann Dokument gelesen werden? |
| Cleanup | Werden Test-Daten entfernt? |

---

## 🚀 Nächste Schritte

1. ✅ Firebase Connection testen
2. ⬜ User Registration implementieren
3. ⬜ Password Reset Flow
4. ⬜ Firestore Security Rules anpassen
5. ⬜ Cloud Functions für Ranking

---

## 📚 Weitere Befehle

```bash
# Unit Tests (Mocking)
npm test

# Firebase Connection Test
npm run test:firebase

# Emulator starten
npm run emulator

# Dev-Server
npm run dev

# Firestore Rules deployen
firebase deploy --only firestore:rules
```
