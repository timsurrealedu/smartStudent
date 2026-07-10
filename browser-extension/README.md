# SmartStudent BinusMaya Sync — Browser Extension

A Chrome extension that automatically detects when you visit **BinusMaya** and syncs your course, assignment, and grade data to the **SmartStudent** backend.

---

## Features

- **Auto-detect** — Runs on every BinusMaya page and scrapes relevant data automatically.
- **Courses** — Detects course codes (e.g., `COMP6047`, `MATH6039`) and names.
- **Assignments** — Finds assignments, quizzes, exams, deadlines, and due dates.
- **Grades** — Extracts scores such as `85 / 100`.
- **Deduplication** — Remembers already-synced assignments to avoid duplicates.
- **Auto-sync** — Automatically syncs every 30 minutes if a BinusMaya tab is open.
- **Manual sync** — Click the extension popup and press **Sync Now** at any time.
- **Notifications** — Shows a browser notification when new assignments are found.
- **Non-intrusive** — Does not break or interfere with BinusMaya functionality.

---

## Installation

1. **Open Chrome** and navigate to:  
   `chrome://extensions/`
2. **Enable Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `browser-extension/` folder from this project.
5. The extension icon will appear in your Chrome toolbar.

---

## Usage

1. **Visit BinusMaya** while logged in (`https://binusmaya.binus.ac.id/*`).
2. The extension automatically scrapes data and sends it to the SmartStudent backend.
3. A small floating toast appears on the page confirming the sync.
4. Click the extension icon to see:
   - Last sync time
   - Number of courses, assignments, and grades synced
   - A **Sync Now** button
   - Backend URL setting (default: `http://localhost:3001/api`)

---

## File Overview

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome Extension Manifest V3 — permissions, content scripts, background worker, popup |
| `content.js` | Content script injected into BinusMaya pages; scrapes DOM and sends data to background |
| `background.js` | Service worker — receives data, POSTs to SmartStudent backend, manages storage & alarms |
| `popup.html` + `popup.js` | Extension popup UI for stats, manual sync, and settings |
| `README.md` | This file |
| `icons/` | Extension icons (add `icon16.png`, `icon48.png`, `icon128.png`) |

---

## SmartStudent Backend API

The extension expects the backend to expose:

```
POST {backendUrl}/import/binusmaya-json
Content-Type: application/json
```

**Request body example:**
```json
{
  "url": "https://binusmaya.binus.ac.id/...",
  "title": "Binusmaya - Dashboard",
  "scrapedAt": "2025-01-15T09:30:00.000Z",
  "courses": [
    { "code": "COMP6047", "name": "Algorithm Design" }
  ],
  "assignments": [
    { "title": "Assignment 1", "dueDate": "15/01/2025", "courseCode": "COMP6047" }
  ],
  "grades": [
    { "courseCode": "COMP6047", "component": "Mid Exam", "score": 85, "maxScore": 100 }
  ],
  "meta": {
    "newAssignmentCount": 1,
    "totalAssignmentCount": 3
  }
}
```

---

## Configuration

You can change the backend URL at any time from the extension popup. The default is:

```
http://localhost:3001/api
```

The extension stores settings and deduplication hashes using `chrome.storage.local`.

---

## Notes

- The content script **does not** make `fetch()` calls directly — it sends messages to the background service worker to avoid CORS issues.
- If the SmartStudent backend is unreachable, the extension stores the data locally and shows a "SmartStudent not reachable" message.
- Deduplication is based on a hash of `assignment title + course code`.
