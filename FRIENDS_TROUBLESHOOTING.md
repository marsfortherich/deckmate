# Friend System - Troubleshooting

## Problem: "Kein User mit dieser Email gefunden"

**Ursache:** Bestehende User-Dokumente haben kein `email`-Feld.

**Lösung:**

### Option 1: Logout & Login (Empfohlen)

1. Klicke auf **Logout** im Header
2. Logge dich **neu ein**
3. Das `email`-Feld wird beim Login automatisch hinzugefügt
4. Versuche erneut, einen Freund hinzuzufügen

### Option 2: Migration Script

```bash
npm run migrate:emails
```

Dieses Skript zeigt alle User ohne Email-Feld an.

## Problem: "Missing or insufficient permissions"

**Ursache:** Firestore Rules sind nicht korrekt deployed.

**Lösung:**

```bash
# Firestore Rules neu deployen
firebase deploy --only firestore

# Browser Hard-Reload
Ctrl + Shift + R
```

**Überprüfe in Firebase Console:**
- Gehe zu: Firestore Database → Rules
- Die Rules sollten so aussehen:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      match /friends/{friendId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    match /friendRequests/{requestId} {
      allow read: if request.auth != null && 
        (resource.data.from == request.auth.uid || 
         resource.data.to == request.auth.uid);
      
      allow create: if request.auth != null && 
        request.resource.data.from == request.auth.uid &&
        request.resource.data.status == 'pending';
      
      allow delete: if request.auth != null && 
        (resource.data.from == request.auth.uid || 
         resource.data.to == request.auth.uid);
    }
  }
}
```

## Problem: "Du kannst dir nicht selbst eine Freundschaftsanfrage senden"

**Ursache:** Du versuchst deine eigene Email-Adresse einzugeben.

**Lösung:** Erstelle einen zweiten Test-Account und füge dessen Email hinzu.

## Debugging

### Console Logs aktiviert

Die Services loggen jetzt Debug-Informationen:

```javascript
// Browser Console öffnen (F12)
// Du siehst:
🔍 Searching for user with email: test@example.com
🔍 Search results: 1 users found
👥 Sending friend request: { from: ..., to: ... }
✅ Friend request created successfully
```

### User-Dokument manuell prüfen

1. Firebase Console → Firestore Database → Data
2. Navigiere zu `users/{deine-uid}`
3. Überprüfe ob das Feld `email` existiert

**Sollte so aussehen:**
```
users/
  ├─ abc123.../
      ├─ displayName: "Test User"
      ├─ email: "test@example.com"  ← MUSS existieren!
      ├─ tier: "Pawn"
      ├─ mmr: 1000
      └─ ...
```

### Firestore Index fehlt?

Falls du folgenden Fehler siehst:
```
The query requires an index
```

**Lösung:**
1. Klicke auf den Link im Fehler (öffnet Firebase Console)
2. Klicke "Create Index"
3. Warte 2-3 Minuten bis der Index erstellt ist
4. Versuche es erneut

## Quick Fix: Kompletter Neustart

```bash
# 1. Logout in der App
# 2. Terminal:
firebase deploy --only firestore

# 3. Browser:
# - Hard Reload (Ctrl + Shift + R)
# - Erneut einloggen
# - Freund hinzufügen
```

## Noch Probleme?

1. **Browser Console** öffnen (F12) und Fehler kopieren
2. **Firebase Console** → Firestore Database → Data → users überprüfen
3. Überprüfe ob `email`-Feld existiert bei beiden Usern
