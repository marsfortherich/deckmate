# Friend System

Ein modulares Friend-System für Deckmate Chess mit Firebase Firestore.

## Features

- ✅ Freunde über Email-Adresse hinzufügen
- ✅ Real-time Freundschaftsanfragen
- ✅ Real-time Freundesliste
- ✅ Presence-Integration (Online/Offline/In-Game Status)
- ✅ Anfragen akzeptieren/ablehnen
- ✅ Freunde entfernen

## Firestore Struktur

```
users/{uid}/
  - displayName: string
  - email: string (lowercase)
  - ... (andere User-Daten)
  
  friends/{friendUid}/
    - uid: string
    - displayName: string
    - addedAt: Timestamp

friendRequests/{requestId}/
  - from: string (uid)
  - fromDisplayName: string
  - to: string (uid)
  - toDisplayName: string
  - status: 'pending' | 'accepted' | 'rejected'
  - createdAt: Timestamp
```

## Services

### `friendService.ts`

Alle Firestore-Operationen für das Friend-System.

**Funktionen:**
- `sendFriendRequest(from, fromName, to, toName)` - Sendet eine Freundschaftsanfrage
- `acceptFriendRequest(requestId)` - Akzeptiert eine Anfrage
- `rejectFriendRequest(requestId)` - Lehnt eine Anfrage ab
- `removeFriend(userUid, friendUid)` - Entfernt einen Freund
- `getFriendsList(userUid)` - Holt die Freundesliste
- `subscribeFriendsList(userUid, callback)` - Real-time Listener für Freundesliste
- `getIncomingRequests(userUid)` - Holt eingehende Anfragen
- `getOutgoingRequests(userUid)` - Holt ausgehende Anfragen
- `subscribeIncomingRequests(userUid, callback)` - Real-time Listener für Anfragen
- `findUserByEmail(email)` - Sucht einen User anhand der Email

## React Integration

### `useFriends()` Hook

```typescript
const {
  friends,              // FriendData[]
  incomingRequests,     // FriendRequest[]
  outgoingRequests,     // FriendRequest[]
  sendFriendRequest,    // (email: string) => Promise<void>
  acceptFriendRequest,  // (requestId: string) => Promise<void>
  rejectFriendRequest,  // (requestId: string) => Promise<void>
  removeFriend,         // (friendUid: string) => Promise<void>
  loading,              // boolean
  error,                // string | null
} = useFriends();
```

### `<FriendsList />` Component

Vollständige UI für das Friend-System:

- Freund über Email hinzufügen
- Eingehende Anfragen anzeigen (Akzeptieren/Ablehnen)
- Ausgehende Anfragen anzeigen
- Freundesliste mit Presence-Status:
  - 🟢 Grün = Online
  - 🟠 Orange = Im Spiel
  - ⚫ Grau = Offline
- Freunde entfernen (mit Bestätigung)

## Presence Integration

Jeder Freund in der Liste nutzt den `useUserPresence(uid)` Hook:

```typescript
const FriendItem = ({ uid, displayName }) => {
  const presence = useUserPresence(uid);
  
  // presence.online: boolean
  // presence.inGame: boolean
  // presence.lastSeen: number
};
```

## Security Rules

```javascript
// Firestore Rules (firestore.rules)
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      match /friends/{friendId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Friend Requests
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

## Deployment

```bash
# Deploy Firestore Rules
firebase deploy --only firestore
```

## Testing

```bash
# Test Friend System (benötigt Firebase Connection)
npm run test:friends
```

## Navigation

Friend-System ist im Main Menu verfügbar:

```
Main Menu → 👥 Friends
```

Route: `/friends`

## Verwendung in der UI

```typescript
import { FriendsList } from './components/FriendsList';

// In einer Route
<Route path="/friends" element={<FriendsList />} />

// Oder direkt
<FriendsList />
```

## Ohne Game-Invite / Matchmaking

Das Friend-System ist isoliert und enthält:
- ❌ **KEIN** Game-Invite-System
- ❌ **KEIN** Matchmaking
- ✅ **NUR** Friend-Management und Presence-Anzeige

## Zukünftige Erweiterungen

Das System ist vorbereitet für:
- Game-Invites (später implementierbar)
- Matchmaking mit Friends (später implementierbar)
- Chat-System (später implementierbar)
