---
name: Expo env var prefix
description: Correct env var prefix for Expo/React Native vs Vite vs backend
---

## Rule
- Expo/React Native public vars: `EXPO_PUBLIC_*` (NOT `VITE_*`)
- Backend (Express/Node) vars: no prefix, plain `SUPABASE_URL` etc.
- These must be set separately even if the values are the same (e.g. SUPABASE_URL = EXPO_PUBLIC_SUPABASE_URL)

## Why
Expo's bundler strips `EXPO_PUBLIC_` and injects the value at build time. Vite uses `VITE_` instead. Mixing them causes `undefined` at runtime with no error.

## How to apply
Any time Supabase (or other) credentials are needed in the mobile app, use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
