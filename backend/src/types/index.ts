// String literals for SQLite (Prisma enums not supported in SQLite)
export type AssignmentTypeString = 'ASSIGNMENT' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'PAPER' | 'READING' | 'LAB' | 'PRESENTATION' | 'OTHER'
export type AssignmentStatusString = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
export type PriorityString = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type EventTypeString = 'CLASS' | 'STUDY' | 'EXAM' | 'DEADLINE' | 'MEETING' | 'GENERAL'

// ============ User Types ============

// ============ User Types ============
export interface CreateUserInput {
  email: string
  name: string
}

// ============ Course Types ============
export interface CreateCourseInput {
  name: string
  code?: string
  color?: string
  instructor?: string
  location?: string
  creditHours?: number
  startDate: string
  endDate: string
  classTimes?: ClassTimeInput[]
}

export interface ClassTimeInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

// ============ Assignment Types ============
export interface CreateAssignmentInput {
  courseId?: string
  title: string
  description?: string
  dueDate: string
  type?: AssignmentTypeString
  priority?: PriorityString
  estimatedMinutes?: number
}

export interface UpdateAssignmentInput {
  title?: string
  description?: string
  dueDate?: string
  type?: AssignmentTypeString
  status?: AssignmentStatusString
  priority?: PriorityString
  estimatedMinutes?: number
  completedAt?: string | null
}

// ============ Event Types ============
export interface CreateEventInput {
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  isAllDay?: boolean
  type?: EventTypeString
}
  courseId?: string
  title: string
  description?: string
  dueDate: string
  type?: AssignmentType
  priority?: Priority
  estimatedMinutes?: number
}

export interface UpdateAssignmentInput {
  title?: string
  description?: string
  dueDate?: string
  type?: AssignmentType
  status?: AssignmentStatus
  priority?: Priority
  estimatedMinutes?: number
  completedAt?: string | null
}

// ============ Event Types ============
export interface CreateEventInput {
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  isAllDay?: boolean
  type?: EventType
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

// ============ Grade Types ============
export interface CreateGradeItemInput {
  courseId: string
  name: string
  category: string
  weight: number
  score?: number
  maxScore?: number
  isFinal?: boolean
  dueDate?: string
}

export interface UpdateGradeItemInput extends Partial<Omit<CreateGradeItemInput, 'courseId'>> {}

export interface WhatIfScenario {
  itemId: string
  hypotheticalScore: number
}

// ============ Kanban Types ============
export interface CreateKanbanBoardInput {
  courseId?: string
  name: string
  columns?: CreateKanbanColumnInput[]
}

export interface CreateKanbanColumnInput {
  name: string
  order?: number
  color?: string
}

export interface CreateKanbanCardInput {
  columnId: string
  title: string
  description?: string
  order?: number
  dueDate?: string
  labels?: string[]
}

export interface MoveKanbanCardInput {
  cardId: string
  targetColumnId: string
  newOrder: number
}

// ============ Note Types ============
export interface CreateNoteInput {
  courseId?: string
  title: string
  content: string
  tags?: string[]
}

// ============ Import Types ============
export interface ImportTimetableInput {
  csvData: string
}

export interface ImportCalendarInput {
  icsData: string
}

// ============ Study Roadmap Types ============
export interface StudyBlock {
  startTime: Date
  endTime: Date
  courseId: string | null
  courseName: string | null
  courseColor: string | null
  title: string
  type: 'CLASS' | 'STUDY' | 'ASSIGNMENT' | 'EXAM' | 'BREAK'
}

// ============ Today Page Types ============
export interface TodayOverview {
  date: string
  classes: TodayClass[]
  upcomingDeadlines: UpcomingDeadline[]
  recommendedStudyBlocks: RecommendedStudyBlock[]
  quickNotes: QuickNote[]
  stats: TodayStats
}

export interface TodayClass {
  id: string
  courseName: string
  courseCode: string | null
  courseColor: string
  startTime: string
  endTime: string
  location: string | null
  instructor: string | null
}

export interface UpcomingDeadline {
  id: string
  title: string
  courseName: string | null
  courseColor: string | null
  dueDate: string
  type: AssignmentTypeString
  priority: PriorityString
  status: AssignmentStatusString
  hoursRemaining: number
}
  id: string
  title: string
  courseName: string | null
  courseColor: string | null
  dueDate: string
  type: AssignmentType
  priority: Priority
  status: AssignmentStatus
  hoursRemaining: number
}

export interface RecommendedStudyBlock {
  startTime: string
  endTime: string
  duration: number
  suggestedFor: string | null
  reason: string
}

export interface QuickNote {
  id: string
  title: string
  content: string
  courseName: string | null
  updatedAt: string
}

export interface TodayStats {
  totalAssignments: number
  completedToday: number
  upcomingThisWeek: number
  averageGrade: number | null
}
