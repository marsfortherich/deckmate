# 📦 Deckmate Build Guide

Anleitung zum Bauen von Deckmate für verschiedene Plattformen.

## 🎮 Web Version (Standard)

```bash
npm run build:ui
npm run preview
```

Die gebaute App liegt in `dist/` und kann auf jedem Webserver deployed werden.

---

## 💻 Desktop App (Windows, Mac, Linux)

### Mit Electron

**1. Installation:**
```bash
npm install --save-dev electron electron-builder
```

**2. Package.json erweitern:**

Füge zu den `scripts` hinzu:
```json
"electron": "electron .",
"electron:build": "npm run build:ui && electron-builder"
```

Füge diese Konfiguration ans Ende der package.json:
```json
"main": "electron.js",
"build": {
  "appId": "com.deckmate.app",
  "productName": "Deckmate",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron.js"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "src/ui/assets/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "src/ui/assets/icon.icns"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "src/ui/assets/icon.png"
  }
}
```

**3. EXE/DMG/AppImage bauen:**
```bash
npm run build:ui          # Build Web App
npm run electron:build    # Build Desktop App

# Die fertigen Installer sind in release/
```

**Alternative: Tauri (kleiner & schneller)**
```bash
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api
npx tauri init
npm run tauri build
```

---

## 📱 Mobile Apps (Android & iOS)

### Mit Capacitor

**1. Installation:**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
```

**2. Initialisierung:**
```bash
npx cap init
# Name: Deckmate
# Package ID: com.deckmate.app
# Web Dir: dist
```

**3. Android Setup:**
```bash
npm run build:ui
npx cap add android
npx cap sync
npx cap open android
```

In Android Studio:
- Build → Generate Signed Bundle / APK
- Wähle APK oder AAB
- Folge dem Wizard

**4. iOS Setup (nur auf Mac):**
```bash
npm run build:ui
npx cap add ios
npx cap sync
npx cap open ios
```

In Xcode:
- Product → Archive
- Distribute App → Ad Hoc oder App Store

**5. Nach Code-Änderungen:**
```bash
npm run build:ui
npx cap sync
```

---

## 🔥 Firebase Konfiguration für Native Apps

Erstelle zusätzliche Firebase Apps für Android/iOS:
1. Firebase Console → Project Settings
2. Add app → Android / iOS
3. Lade `google-services.json` (Android) bzw. `GoogleService-Info.plist` (iOS)
4. Platziere sie in den jeweiligen nativen Projekten

**Android:** `android/app/google-services.json`
**iOS:** `ios/App/GoogleService-Info.plist`

---

## 📝 Zusammenfassung

| Plattform | Tool | Befehl | Output |
|-----------|------|--------|--------|
| Web | Vite | `npm run build:ui` | `dist/` |
| Windows | Electron | `npm run electron:build` | `.exe` |
| Mac | Electron | `npm run electron:build` | `.dmg` |
| Linux | Electron | `npm run electron:build` | `.AppImage` |
| Android | Capacitor | Android Studio | `.apk` / `.aab` |
| iOS | Capacitor | Xcode | `.ipa` |

---

## 🚀 Schnellstart für alle Plattformen

```bash
# 1. Web Build
npm run build:ui

# 2. Desktop (Electron)
npm install --save-dev electron electron-builder
npm run electron:build

# 3. Mobile (Capacitor)
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init
npx cap add android
npx cap add ios
npx cap sync
```

Dann öffne Android Studio / Xcode um die finalen Apps zu bauen.
