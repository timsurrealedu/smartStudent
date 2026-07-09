# Student Life Organizer Hub

A unified full-stack application for students to manage courses, assignments, grades, study schedules, and notes — all in one place.

## Features

- **Smart Today Page** — See today's classes, upcoming deadlines, recommended study blocks, and quick notes at a glance
- **Course Management** — Add courses with schedules, instructors, and color coding
- **Assignment Tracker** — Track assignments with priorities, due dates, estimated time, and completion status
- **Grade Calculator** — Monitor current grades and run "what-if" scenarios to see how hypothetical scores affect final grades
- **Kanban Boards** — Per-course or general project boards with customizable columns
- **Quick Notes** — Tagged notes linked to courses
- **LMS Import** — Import timetables from CSV, calendar events from ICS, and **fetch directly from BinusMaya** using your existing browser login session

## PWA Features

- **Installable** — Add to home screen on any device (iOS/Android/Desktop)
- **Offline capable** — Service worker caches the app shell and API responses
- **Mobile-first responsive** — Collapsible sidebar, touch-friendly targets (44px+), safe-area insets for notched phones
- **Standalone display** — Runs in its own window without browser chrome
- **Theme-aware** — Dark status bar on mobile, splash screen with app icon
- **Study Roadmap** — Auto-generated study timelines based on assignment due dates and estimated effort

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | SQLite + Prisma ORM |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| API | REST JSON |

## Project Structure

```
smartStudent/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── index.ts           # Express server entry
│   │   ├── routes/
│   │   │   └── index.ts       # API route definitions
│   │   ├── services/
│   │   │   └── controllers.ts # Business logic
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript types
│   │   └── utils/
│   │       ├── db.ts          # Prisma client
│   │       └── seed.ts        # Demo data seeder
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # React router
│   │   ├── main.tsx           # Entry point
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx  # Today page
│   │   │   ├── Courses.tsx
│   │   │   ├── Assignments.tsx
│   │   │   ├── Grades.tsx     # With what-if calculator
│   │   │   ├── Kanban.tsx
│   │   │   ├── Notes.tsx
│   │   │   └── Import.tsx     # CSV / ICS import
│   │   └── services/
│   │       └── api.ts         # API client
│   └── package.json
└── README.md
```

## Quick Start

```bash
# One-command setup
npm run setup

# Or manually:
# 1. Backend
cd backend && npm install && npx prisma migrate dev && npx tsx src/utils/seed.ts

# 2. Frontend
cd frontend && npm install

# 3. Start both (in separate terminals)
cd backend && npx tsx src/index.ts
cd frontend && npx vite
```

The API runs at `http://localhost:3001` and the app at `http://localhost:5173`.

## PWA Installation

### Desktop Chrome/Edge
1. Open the app in your browser
2. Click the **Install** icon in the address bar (or the in-app install prompt)
3. The app opens in its own window

### iOS Safari
1. Open the app in Safari
2. Tap **Share** → **Add to Home Screen**
3. The app icon appears on your home screen

### Android Chrome
1. Open the app in Chrome
2. Tap the **Install** banner or menu → **Add to Home Screen**

## BinusMaya Import

To import courses, assignments, and grades directly from BinusMaya:

1. **Install the Kimi WebBridge browser extension** — [Download here](https://www.kimi.com/features/webbridge)
2. **Log into BinusMaya** at [https://binusmaya.binus.ac.id](https://binusmaya.binus.ac.id) in your browser
3. **Go to Import → BinusMaya** in SmartStudent
4. Click **Preview** to see what data will be fetched
5. Click **Import** to bring everything into SmartStudent

The scraper uses your existing browser login session — no password storage required.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/me` | GET | Get or create demo user |
| `/api/courses` | GET/POST | List / create courses |
| `/api/courses/:id` | GET/PUT/DELETE | Course CRUD |
| `/api/assignments` | GET/POST | List / create assignments |
| `/api/assignments/:id` | PUT/DELETE | Update / delete assignment |
| `/api/events` | GET/POST | List / create events |
| `/api/courses/:id/grades` | GET | Get grade items for course |
| `/api/grades` | POST | Create grade item |
| `/api/grades/:id` | PUT/DELETE | Update / delete grade item |
| `/api/courses/:id/what-if` | POST | What-if grade calculation |
| `/api/kanban` | GET/POST | List / create boards |
| `/api/kanban/cards` | POST | Create card |
| `/api/kanban/cards/move` | PUT | Move card between columns |
| `/api/notes` | GET/POST | List / create notes |
| `/api/today` | GET | Smart today page data |
| `/api/courses/:id/roadmap` | GET | Study roadmap for course |
| `/api/import/timetable` | POST | Import CSV timetable |
| `/api/import/calendar` | POST | Import ICS calendar |
| `/api/import/binusmaya` | POST | Import from BinusMaya LMS |

## Database Schema

The SQLite database uses these models:

- **User** — Student profile
- **Course** — Class information with class times
- **Assignment** — Tasks with type, priority, status, due date
- **Event** — Calendar events (classes, study sessions, etc.)
- **GradeItem** — Weighted grade components per course
- **KanbanBoard / KanbanColumn / KanbanCard** — Project boards
- **Note** — Quick notes with optional course linkage

## Key Design Decisions

1. **SQLite for simplicity** — Easy to run locally without Docker or external DB setup. The Prisma schema can migrate to PostgreSQL with a one-line config change.

2. **String enums** — SQLite doesn't support native enums, so we use string fields with documented valid values.

3. **Demo user** — Authentication is stubbed with a fixed demo user ID for rapid prototyping. In production, replace with JWT auth middleware.

4. **What-If Calculator** — Simulates hypothetical scores on pending grade items and recalculates the weighted course grade in real-time.

5. **Study Block Generation** — Analyzes class schedule gaps and assignment urgency to recommend optimal study times.

## Extending

- **Add auth** — Replace `DEMO_USER_ID` in `backend/src/services/controllers.ts` with JWT middleware
- **Switch to PostgreSQL** — Change `provider = "sqlite"` to `provider = "postgresql"` in schema.prisma
- **Add GraphQL** — Apollo Server can wrap the same Prisma client
- **Mobile app** — The REST API is ready for React Native or Flutter consumption
