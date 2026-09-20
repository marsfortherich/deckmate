# Firebase Auth Testing

## Übersicht

Dieses Verzeichnis enthält Tests für die Firebase Authentication-Module.

## Test-Struktur

### Unit Tests (Mocking)
Die aktuellen Tests verwenden **Mocking** (via `vi.mock`), um Firebase-Aufrufe zu simulieren:

- `authService.test.ts` - Tests für Login/Logout/Auth-State-Listener
- `userService.test.ts` - Tests für User-Dokument-Erstellung in Firestore
- `../ui/auth/__tests__/AuthProvider.test.tsx` - Tests für den React Auth Context

**Vorteile**: Schnell, keine Firebase-Verbindung nötig, isoliert testbar.  
**Nachteile**: Testet nicht die echte Firebase-Integration.

### Integration Tests (Firebase Emulator) - Optional

Für echte Integration-Tests kannst du den **Firebase Emulator** verwenden:

#### 1. Firebase CLI installieren
```bash
npm install -g firebase-tools
```

#### 2. Emulator initialisieren
```bash
firebase init emulators
```
Wähle: Auth, Firestore

#### 3. Emulator starten
```bash
firebase emulators:start
```

#### 4. Test-Setup anpassen

Erstelle `src/test/setupEmulator.ts`:

```typescript
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Connect to emulators
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

#### 5. Integration Tests schreiben

```typescript
// authService.integration.test.ts
import { describe, it, expect } from 'vitest';
import { signInWithEmailPassword } from '../authService';

describe('authService - Integration', () => {
  it('should sign in with email and password', async () => {
    // Echter Firebase-Aufruf gegen Emulator
    const result = await signInWithEmailPassword(
      'test@example.com',
      'password123'
    );
    expect(result.user).toBeDefined();
  });
});
```

## Tests ausführen

```bash
# Alle Tests
npm test

# Mit UI
npm run test:ui

# Mit Coverage
npm run test:coverage

# Einzelne Datei
npm test authService.test.ts

# Watch Mode
npm test -- --watch
```

## Best Practices

1. **Unit Tests für Business Logic** - Mock externe Abhängigkeiten
2. **Integration Tests für kritische Flows** - Verwende Emulator
3. **Teste Edge Cases** - Fehlerszenarien, null/undefined, Netzwerkfehler
4. **Isoliere Tests** - Jeder Test sollte unabhängig laufen
5. **Cleanup** - `afterEach(() => vi.clearAllMocks())`

## Troubleshooting

### "Cannot find module 'firebase/auth'"
```bash
npm install firebase
```

### "vi is not defined"
Prüfe, dass `vitest.config.ts` `globals: true` setzt.

### Tests hängen
Prüfe, ob async/await korrekt verwendet wird und alle Promises resolved werden.
