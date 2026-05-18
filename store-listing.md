# Brutal Mirror — Google Play Store Listing

## App Name
Brutal Mirror

## Short Description (max 80 characters)
AI roasts your ideas, profiles & pitches — then makes them better.

---

## Full Description (max 4000 characters)

Most feedback is useless. It's either too nice to be honest or too harsh to be helpful.

Brutal Mirror is different.

Paste your startup idea, Instagram bio, dating profile, resume summary, business name, YouTube concept, or app pitch — and get a brutally honest AI critique that actually fixes the problem.

**What you get:**

→ A savage, witty roast of exactly what's wrong
→ A clinical diagnosis of the core issue
→ Your 3 biggest weaknesses, named clearly
→ 3 specific fixes you can act on today
→ A fully rewritten, improved version
→ A shareable one-liner built for screenshots
→ A 6-metric Roast Report score (clarity, originality, marketability, cringe level, fixability, overall)

**Who it's for:**

Founders who need to hear what investors actually think before the pitch.
Creatives who know something's off but can't name it.
Job seekers who've been copy-pasting the same resume for 2 years.
Anyone who's tired of "looks great!" from people who don't want to hurt your feelings.

**How it works:**

1. Paste the thing you secretly know needs work
2. Choose a category, intensity level, and roast personality
3. Get a full structured report in seconds
4. Use the refinement buttons to go Sharper, Funnier, or more Professional
5. Save your roasts to the Vault and revisit them anytime

**Roast Intensities:**
- Honest — direct but professional
- Harsh — sharp and unfiltered
- Brutal — savage, witty, uncomfortable
- Career-ending — maximum destruction

**Roast Personalities:**
- Savage Mentor — brutal but growth-focused
- Startup Investor — market, positioning, differentiation
- Creative Director — branding, taste, originality
- Dating Coach — attraction, confidence, personality
- Resume Recruiter — credibility, outcomes, hiring value
- Internet Troll, but useful — funnier, meaner, still constructive

**Roast Vault:**
Every roast you generate is saved automatically. Search, filter by category, copy quotes, and revisit your full reports anytime — no account required.

All data is stored locally on your device. We don't collect personal information. No login. No subscription. No BS.

---

## Keywords / Tags (for ASO)
ai feedback, startup feedback, resume feedback, bio writer, pitch deck, idea validator, roast generator, brutal honesty, self improvement, writing tool, startup tool, creative feedback, profile optimizer

---

## Category
Productivity (primary)
Tools (secondary)

---

## Content Rating Questionnaire Notes
- Violence: None
- Sexual content: None
- Language: Mild (the roasts use sharp/critical language, not profanity)
- Suitable for: 13+
- Likely rating: **Everyone 10+** or **Teen**

---

## Privacy Policy URL
https://YOUR_REPLIT_DOMAIN/privacy

Replace YOUR_REPLIT_DOMAIN with your actual deployed domain (e.g. brutal-mirror.replit.app)

---

## Screenshots needed (minimum 2, recommended 6-8)

Suggested shots to capture (use iPhone 14 Pro or Pixel 7 simulator):

1. Home screen with onboarding card visible
2. Form filled out — category "Startup Idea", intensity "Career-ending"
3. Loading state with rotating message
4. Result — Report header + viral one-liner tab
5. Score Report with animated bars
6. ViralCard (share card) — the purple gradient quote card
7. Roast Vault with a saved roast card visible
8. Settings screen showing defaults

---

## Feature Graphic (1024×500px banner)
Suggested design:
- Background: #0a0a0a (near-black)
- Large text: "Brutal Mirror" in white, bold
- Subtext: "Brutal feedback. Better results." in #a78bfa (soft purple)
- Purple glow/gradient accent on the right side
- Small tagline at bottom: "AI that roasts your ideas and rebuilds them better"

---

## App Icon requirements
- 512×512px PNG, no transparency
- Current icon at: artifacts/mobile/assets/images/icon.png
- Verify it looks good at small sizes (48px on a device list)

---

## EAS Build — Step by Step

### Prerequisites
- Node.js installed on your local machine
- Expo account at expo.dev (free)

### 1. Install EAS CLI
```
npm install -g eas-cli
```

### 2. Log in to Expo
```
eas login
```

### 3. Link your project
From inside artifacts/mobile/:
```
eas project:init
```
This gives you a projectId — copy it into app.json under expo.extra.eas.projectId

### 4. Build a preview APK (for testing on a real Android device)
```
eas build --platform android --profile preview
```
This takes ~10-15 minutes and gives you a downloadable .apk to install on your phone.

### 5. Build a production AAB (for Play Store submission)
```
eas build --platform android --profile production
```
This produces a .aab file (Android App Bundle) — the format Play Store requires.

### 6. Submit to Play Store
Once you've created your Play Console app listing and uploaded your first build manually:
```
eas submit --platform android
```
You'll need a Google Service Account JSON key — Play Console walks you through creating it.

---

## Version management
- Current version: 1.0.0 (in app.json)
- Current versionCode: 1 (in app.json android section)
- Every update to Play Store requires incrementing versionCode by at least 1
- Version name (1.0.0 → 1.0.1) is what users see; versionCode (1 → 2) is what Play Store tracks
