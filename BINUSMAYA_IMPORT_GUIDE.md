# BinusMaya Import Guide

## Method 1: Bookmarklet (Fastest — One Click)

A **bookmarklet** is a browser bookmark that runs JavaScript code instead of opening a URL.

### Step 1: Copy the full code

Open SmartStudent -> **Import** -> **BinusMaya** and click **Copy** in the bookmarklet section.

The app now keeps the bookmarklet source there so the guide does not drift behind the importer.

### Step 2: Create the bookmark

**Chrome / Edge:**
1. Click the **⋮** menu → **Bookmarks** → **Bookmark manager**
2. Click the **⋮** menu in the bookmark manager → **Add new bookmark**
3. **Name:** `BinusMaya → SmartStudent`
4. **URL:** Paste the code you copied above (starts with `javascript:`)
5. Click **Save**

**Firefox:**
1. Press `Ctrl+Shift+B` to open the bookmarks sidebar
2. Right-click in the sidebar → **New Bookmark**
3. **Name:** `BinusMaya → SmartStudent`
4. **Location:** Paste the code (starts with `javascript:`)
5. Click **Add**

### Step 3: Use it

1. Log into [binusmaya.binus.ac.id](https://binusmaya.binus.ac.id)
2. Go to your **Dashboard**, **Schedule**, assignment, or score page
3. Click the `BinusMaya → SmartStudent` bookmark in your bookmarks bar
4. You'll see a popup saying "BinusMaya data copied!"
5. Go to SmartStudent → **Import** → **BinusMaya**
6. The data is already on your clipboard — just click **Import**!

---

## Method 2: Copy-Paste (No Setup)

No bookmark needed. Just copy page text.

1. Log into [binusmaya.binus.ac.id](https://binusmaya.binus.ac.id)
2. Go to any page with your courses, assignments, or grades
3. Press `Ctrl + A` then `Ctrl + C` (select all, copy)
4. Open SmartStudent → **Import** → **BinusMaya**
5. Paste into the text box (`Ctrl + V`)
6. Click **Preview** to see what was detected
7. Click **Import** to bring it into SmartStudent

---

## What gets detected?

| Data | How it's found |
|------|---------------|
| **Courses** | Course codes such as `MATH6031`, plus nearby course names |
| **Class schedules** | Day names plus time ranges, linked back to nearby course codes/names |
| **Assignments** | Text containing "due", "deadline", "batas", "tugas", "assignment", "quiz", "exam", "UTS", or "UAS" |
| **Grades** | Score formats like `85 / 100`, or score/nilai/grade text with a number |

---

## Troubleshooting

**"No data found" error?**
- Make sure you're logged into BinusMaya
- Try the Dashboard page first — it usually has the most course info
- Some BinusMaya pages are loaded dynamically; wait for the page to fully load before clicking the bookmark

**Bookmark doesn't work?**
- Some browsers strip `javascript:` URLs from bookmarks for security
- If so, use Method 2 (copy-paste) instead

**Data looks wrong?**
- The parser is a best-effort guess. You can always edit imported courses/assignments after importing
- The bookmarklet simply copies raw text — nothing leaves your browser
