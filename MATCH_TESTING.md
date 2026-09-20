# Match System Testing

## Setup

1. **Starte den Dev Server:**
   ```bash
   npm run dev
   ```

2. **Deploy die Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Öffne die App in 2 Browsern/Tabs:**
   - Browser 1: `http://localhost:3000` (Login als User 1)
   - Browser 2: `http://localhost:3000` (Login als User 2)

## Test-Flow

### Browser 1 (User 1):
1. Nach Login → **"🎮 Match Test"** Button klicken
2. Deine UID kopieren (wird oben angezeigt)
3. UID an Browser 2 weitergeben

### Browser 2 (User 2):
1. Nach Login → **"🎮 Match Test"** Button klicken
2. **Match erstellen:**
   - UID von User 1 in "Opponent UID" Feld einfügen
   - Optional: Initial Game State editieren (z.B. `{"turn": 1, "phase": "start"}`)
   - **"Match erstellen"** klicken
3. **Match ID kopieren** aus dem Alert (z.B. `"abc123xyz"`)
4. Match ID an Browser 1 weitergeben

### Browser 1 (User 1):
1. **Match laden:**
   - Match ID in das "Match ID" Feld einfügen
   - **"Match laden"** klicken
2. **Match akzeptieren:**
   - **"✅ Match akzeptieren"** Button klicken
   - Status wechselt von `pending` zu `active`

### Beide Browser (Real-time Sync testen):
1. **Game State updaten:**
   - Du siehst zwei JSON-Bereiche:
     - **"Aktueller Game State (Read-Only)"** - zeigt den Live-State aus Firestore
     - **"Neuer Game State (Editierbar)"** - hier kannst du Änderungen machen
   - Das Editier-Feld wird automatisch mit dem aktuellen State befüllt
   - Änderungen machen, z.B. `turn` von 1 auf 2 ändern:
     ```json
     {
       "turn": 2,
       "phase": "playing",
       "lastMove": "e2-e4"
     }
     ```
   - **"🔄 Game State updaten"** klicken
2. **Real-time Update beobachten:**
   - Der andere Browser zeigt **sofort** den neuen Game State! 🚀
   - Das Editier-Feld wird automatisch mit dem neuen State aktualisiert
   - Hin und her wechseln und Updates machen

3. **Match beenden:**
   - In einem Browser: **"🏁 Match beenden"** klicken
   - Status wechselt zu `finished` in beiden Browsern

## Was wird getestet?

✅ **Match Creation** - Erstellen eines Matches zwischen 2 Spielern  
✅ **Match Accept** - Match-Status von `pending` zu `active`  
✅ **Real-time Sync** - Änderungen werden sofort in beiden Browsern sichtbar  
✅ **Game State Updates** - Beliebige JSON-Objekte als Game State  
✅ **Match Finish** - Beenden eines Matches  
✅ **Firestore Rules** - Nur beteiligte Spieler können Match sehen/bearbeiten  

## Tipps

- **Console öffnen** (F12) um die Debug-Logs zu sehen:
  - `🎮 Match created: {matchId}`
  - `✅ Match accepted: {matchId}`
  - `🎮 Game state updated`
  - `🏁 Match finished: {matchId}`

- **Firestore Console** öffnen um Dokumente live zu sehen:
  - https://console.firebase.google.com/project/deckmatechess/firestore

- **Mehrere Matches testen:**
  - Einfach neue Match ID erstellen und mit verschiedenen Gegnern spielen

## Fehlerbehandlung

- **"Missing or insufficient permissions"**: Firestore Rules nicht deployed
  ```bash
  firebase deploy --only firestore:rules
  ```

- **Match nicht gefunden**: Match ID falsch kopiert oder Match gelöscht

- **JSON Syntax Error**: Game State muss valid JSON sein, z.B.:
  ```json
  {"key": "value", "number": 123, "array": [1, 2, 3]}
  ```
