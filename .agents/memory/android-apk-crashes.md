---
name: Android standalone APK crash patterns
description: Root causes of post-splash crashes in Brutal Mirror Android APK (works in Expo Go, crashes in standalone)
---

# Android Standalone APK Crash Patterns

## Rule
When an Expo app works in Expo Go but crashes in a standalone APK, the cause is almost always a native module mismatch — not JS code.

**Why:** Expo Go ships its own pre-built native modules. Standalone APKs only link what's in package.json, and version mismatches or missing config plugins cause native module registration to fail at runtime.

**How to apply:** Run `adb logcat -d | grep -E "FATAL|AndroidRuntime"` immediately after a crash. The error will name the exact module (e.g. `Cannot find native module 'ExpoClipboard'`).

## The three crashes we fixed (in order)

### 1. `react-native-keyboard-controller` (no config plugin)
- Symptom: crash immediately after splash
- Cause: `KeyboardProvider` wrapped the entire app, but the package has no Expo config plugin — native module init failed on Android
- Fix: removed the package entirely (it was the only usage; `KeyboardAwareScrollViewCompat` was dead code)

### 2. `newArchEnabled: true` + BlueStacks
- Symptom: crash on BlueStacks even after removing keyboard-controller
- Cause: New Architecture (Fabric/JSI) breaks under BlueStacks's ARM-to-x86 Houdini translation layer
- Fix: set `newArchEnabled: false` in app.json
- Note: `react-native-reanimated` 4.x requires New Architecture — removing it (it was unused) was necessary to allow old arch

### 3. `expo-clipboard` version mismatch (`ExpoClipboard` not found)
- Symptom: `com.facebook.react.common.JavascriptException: Error: Cannot find native module 'ExpoClipboard'`
- Cause: `expo-clipboard` 7.0.1 was installed but Expo 54 requires `~8.0.8` — Metro warned about this the whole time
- Fix: upgrade to `~8.0.8` in dependencies, then `rm -rf android && expo prebuild && gradlew assembleRelease`

## Build checklist for Android APK
1. `git pull` to get latest changes
2. `pnpm install` to sync lockfile
3. `rm -rf android` — always wipe before rebuild
4. `pnpm exec expo prebuild --platform android --no-install`
5. Restore signing: copy `.jks` to `android/app/`, write `keystore.properties`, write `local.properties`
6. `cd android && ./gradlew assembleRelease`

## Signing config
- Plugin: `artifacts/mobile/plugins/withAndroidSigning.js` registered in app.json
- Keystore alias: `c5526f07ba6ba4f964c027592774eec1`
- Keystore filename: `@orami-ai__brutal-mirror.jks` (fetched via `eas credentials --platform android`)
- `keystore.properties` goes in `android/` (NOT `android/app/`) — storeFile path is relative to `android/app/` so use just the filename
