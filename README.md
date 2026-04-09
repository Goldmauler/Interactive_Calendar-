# Interactive Wall Calendar (Next.js)

A polished, responsive wall-calendar inspired component built with Next.js and React.

## What This Project Demonstrates

- Wall calendar aesthetic with a visual hero banner and month grid
- Start/end day range selection with clear in-range highlighting
- Integrated notes area (general monthly notes and date-linked notes)
- Events and habits tracking in the same left panel workflow
- Responsive layout for desktop and mobile
- Client-side persistence via `localStorage` (no backend)
- Optional delight features: month flip animation, festivals, confetti, dark/light theme

## Requirement Coverage (Challenge Mapping)

### 1) Wall Calendar Aesthetic
- Implemented with:
  - top hero imagery banner
  - physical calendar cues (wire binding)
  - clearly segmented notes panel + date grid panel
- Files:
  - `src/components/CalendarApp/CalendarApp.js`
  - `src/components/CalendarApp/CalendarApp.module.css`

### 2) Day Range Selector
- Users can select start and end days.
- UI states include:
  - start day
  - end day
  - in-between range
- Includes mode switching (`range` / `individual`) and clear selection.
- Files:
  - `src/components/CalendarApp/CalendarApp.js`

### 3) Integrated Notes Section
- Supports:
  - monthly general notes
  - date-linked notes (start/end date metadata)
  - edit/delete/complete states
- Notes persist in `localStorage`.
- Files:
  - `src/components/CalendarApp/CalendarApp.js`
  - `src/utils/storageUtils.js`

### 4) Fully Responsive Design
- Desktop:
  - split layout with left notes panel and right calendar grid
- Mobile:
  - stacked layout with preserved usability
  - touch swipe month navigation
- Files:
  - `src/components/CalendarApp/CalendarApp.module.css`

### 5) Frontend-Only Scope
- No backend, database, or API required for core functionality.
- Uses browser storage for persistence.
- Optional public holiday API integration is included but non-blocking.

## Bonus Features Included

- Theme toggle (light/dark)
- Year overview modal
- Festival markers and interactions
- Event management per selected day
- Habit tracker with streaks
- Keyboard and swipe navigation
- Subtle motion and transitions

## Tech Stack

- Next.js 14
- React 18
- Framer Motion
- Lucide React
- Canvas Confetti
- CSS Modules

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

- `http://localhost:3000` (or `3001` if 3000 is occupied)

## Optional Environment Variable

If you want live Calendarific festival data, create `.env.local`:

```bash
NEXT_PUBLIC_CALENDARIFIC_KEY=your_key_here
```

Without this key, static festival data still works.

## Build & Production

```bash
npm run build
npm run start
```

## Deploy (Vercel Recommended)

### Option A: Vercel UI (fastest)
1. Push this repo to GitHub/GitLab.
2. Go to Vercel and import the repository.
3. Framework preset: Next.js (auto-detected).
4. Add optional env var (`NEXT_PUBLIC_CALENDARIFIC_KEY`) in Project Settings.
5. Deploy.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Submission Guide (What You Need to Provide)

### 1) Source Code Link
- Push this repository to your public GitHub/GitLab.
- Include this README.

### 2) Video Demonstration (Required)
Record a short walkthrough (2-5 minutes) using Loom/OBS/QuickTime:
- Desktop view:
  - select a day range
  - add/edit/delete a note
  - switch tabs (Notes/Events/Habits)
- Mobile responsive view:
  - show stacked layout
  - demonstrate touch usability (or device emulation)
- Optional extras:
  - theme toggle
  - year overview
  - festivals/events/habits

Suggested structure:
1. Intro (10-15s)
2. Range selection demo
3. Notes demo
4. Responsive/mobile demo
5. Closing (repo + deployed URL)

### 3) Live Demo Link (Optional but recommended)
- Share your Vercel deployment URL.

## Quality Notes

- The app is intentionally frontend-only.
- State is stored in browser `localStorage`.
- Recent reliability fix: notes/events are now persisted even when cleared.

---

If you are submitting this for a hiring challenge, include in your submission text:
- Repo URL
- Video URL
- Live URL
- Brief note on design/architecture tradeoffs
