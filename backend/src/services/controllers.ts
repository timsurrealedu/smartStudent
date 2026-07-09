import { Request, Response } from 'express'
import { prisma } from '../utils/db'
import { scrapeBinusMaya, closeBinusMayaSession } from './binusmaya-scraper'
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CreateEventInput,
  UpdateEventInput,
  CreateGradeItemInput,
  UpdateGradeItemInput,
  WhatIfScenario,
  CreateKanbanBoardInput,
  CreateKanbanColumnInput,
  CreateKanbanCardInput,
  MoveKanbanCardInput,
  CreateNoteInput,
  TodayOverview,
} from '../types'
import { addDays, startOfDay, endOfDay, addWeeks, differenceInHours, isToday, isSameDay, parseISO, format } from 'date-fns'

// ===================== DEMO USER ID =====================
// In a real app, this comes from auth middleware
const DEMO_USER_ID = 'demo-user-001'

// ===================== USER =====================
export async function getOrCreateUser(req: Request, res: Response) {
  let user = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } })
  if (!user) {
    user = await prisma.user.create({
      data: { id: DEMO_USER_ID, email: 'demo@student.edu', name: 'Demo Student' }
    })
  }
  res.json(user)
}

// ===================== COURSES =====================
export async function getCourses(req: Request, res: Response) {
  const courses = await prisma.course.findMany({
    where: { userId: DEMO_USER_ID },
    include: { classTimes: true, _count: { select: { assignments: true } } },
    orderBy: { name: 'asc' }
  })
  res.json(courses)
}

export async function getCourseById(req: Request, res: Response) {
  const { id } = req.params
  const course = await prisma.course.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: {
      classTimes: true,
      assignments: { orderBy: { dueDate: 'asc' } },
      gradeItems: true,
      notes: true,
      kanbanBoards: { include: { columns: { include: { cards: true } } } }
    }
  })
  if (!course) return res.status(404).json({ error: 'Course not found' })
  res.json(course)
}

export async function createCourse(req: Request, res: Response) {
  const data = req.body as CreateCourseInput
  const course = await prisma.course.create({
    data: {
      userId: DEMO_USER_ID,
      name: data.name,
      code: data.code,
      color: data.color || '#3B82F6',
      instructor: data.instructor,
      location: data.location,
      creditHours: data.creditHours || 3,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      classTimes: data.classTimes ? { create: data.classTimes } : undefined
    },
    include: { classTimes: true }
  })
  res.status(201).json(course)
}

export async function updateCourse(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body as UpdateCourseInput
  const course = await prisma.course.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      color: data.color,
      instructor: data.instructor,
      location: data.location,
      creditHours: data.creditHours,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: { classTimes: true }
  })
  res.json(course)
}

export async function deleteCourse(req: Request, res: Response) {
  const { id } = req.params
  await prisma.course.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== ASSIGNMENTS =====================
export async function getAssignments(req: Request, res: Response) {
  const { courseId, status, upcoming } = req.query
  const where: any = { userId: DEMO_USER_ID }
  if (courseId) where.courseId = String(courseId)
  if (status) where.status = String(status)
  if (upcoming === 'true') {
    where.dueDate = { gte: new Date() }
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: { course: { select: { name: true, color: true, code: true } } },
    orderBy: { dueDate: 'asc' }
  })
  res.json(assignments)
}

export async function createAssignment(req: Request, res: Response) {
  const data = req.body as CreateAssignmentInput
  const assignment = await prisma.assignment.create({
    data: {
      userId: DEMO_USER_ID,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      type: data.type || 'ASSIGNMENT',
      priority: data.priority || 'MEDIUM',
      estimatedMinutes: data.estimatedMinutes
    },
    include: { course: { select: { name: true, color: true } } }
  })
  res.status(201).json(assignment)
}

export async function updateAssignment(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body as UpdateAssignmentInput
  const assignment = await prisma.assignment.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      type: data.type,
      status: data.status,
      priority: data.priority,
      estimatedMinutes: data.estimatedMinutes,
      completedAt: data.completedAt === null ? null : data.completedAt ? new Date(data.completedAt) : undefined,
    },
    include: { course: { select: { name: true, color: true } } }
  })
  res.json(assignment)
}

export async function deleteAssignment(req: Request, res: Response) {
  const { id } = req.params
  await prisma.assignment.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== EVENTS =====================
export async function getEvents(req: Request, res: Response) {
  const { start, end } = req.query
  const where: any = { userId: DEMO_USER_ID }
  if (start && end) {
    where.startTime = {
      gte: new Date(String(start)),
      lte: new Date(String(end))
    }
  }
  const events = await prisma.event.findMany({
    where,
    orderBy: { startTime: 'asc' }
  })
  res.json(events)
}

export async function createEvent(req: Request, res: Response) {
  const data = req.body as CreateEventInput
  const event = await prisma.event.create({
    data: {
      userId: DEMO_USER_ID,
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      location: data.location,
      isAllDay: data.isAllDay || false,
      type: data.type || 'GENERAL'
    }
  })
  res.status(201).json(event)
}

export async function updateEvent(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body as UpdateEventInput
  const event = await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : data.endTime === undefined ? undefined : null,
      location: data.location,
      isAllDay: data.isAllDay,
      type: data.type
    }
  })
  res.json(event)
}

export async function deleteEvent(req: Request, res: Response) {
  const { id } = req.params
  await prisma.event.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== GRADES =====================
export async function getCourseGrades(req: Request, res: Response) {
  const { courseId } = req.params
  const items = await prisma.gradeItem.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' }
  })

  const currentGrade = calculateCurrentGrade(items)
  const maxPossibleGrade = calculateMaxPossibleGrade(items)
  const minPossibleGrade = calculateMinPossibleGrade(items)

  res.json({
    items,
    summary: {
      currentGrade,
      maxPossibleGrade,
      minPossibleGrade,
      totalWeight: items.reduce((sum, i) => sum + i.weight, 0)
    }
  })
}

export async function createGradeItem(req: Request, res: Response) {
  const data = req.body as CreateGradeItemInput
  const item = await prisma.gradeItem.create({
    data: {
      courseId: data.courseId,
      name: data.name,
      category: data.category,
      weight: data.weight,
      score: data.score,
      maxScore: data.maxScore || 100,
      isFinal: data.isFinal || false,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  })
  res.status(201).json(item)
}

export async function updateGradeItem(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body as UpdateGradeItemInput
  const item = await prisma.gradeItem.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      weight: data.weight,
      score: data.score,
      maxScore: data.maxScore,
      isFinal: data.isFinal,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    }
  })
  res.json(item)
}

export async function deleteGradeItem(req: Request, res: Response) {
  const { id } = req.params
  await prisma.gradeItem.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== WHAT-IF CALCULATOR =====================
export async function calculateWhatIf(req: Request, res: Response) {
  const { courseId } = req.params
  const scenarios = req.body.scenarios as WhatIfScenario[]

  const items = await prisma.gradeItem.findMany({ where: { courseId } })

  const hypotheticalItems = items.map(item => {
    const scenario = scenarios.find(s => s.itemId === item.id)
    if (scenario) {
      return { ...item, score: scenario.hypotheticalScore }
    }
    return item
  })

  const currentGrade = calculateCurrentGrade(items)
  const hypotheticalGrade = calculateCurrentGrade(hypotheticalItems)

  res.json({
    currentGrade,
    hypotheticalGrade,
    difference: hypotheticalGrade - currentGrade,
    breakdown: hypotheticalItems.map(item => ({
      id: item.id,
      name: item.name,
      weight: item.weight,
      originalScore: items.find(i => i.id === item.id)?.score ?? null,
      hypotheticalScore: item.score ?? null,
      contribution: ((item.score || 0) / item.maxScore) * item.weight
    }))
  })
}

// ===================== KANBAN =====================
export async function getKanbanBoards(req: Request, res: Response) {
  const { courseId } = req.query
  const where: any = { userId: DEMO_USER_ID }
  if (courseId) where.courseId = String(courseId)

  const boards = await prisma.kanbanBoard.findMany({
    where,
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          cards: { orderBy: { order: 'asc' } }
        }
      }
    }
  })
  res.json(boards)
}

export async function createKanbanBoard(req: Request, res: Response) {
  const data = req.body as CreateKanbanBoardInput
  const board = await prisma.kanbanBoard.create({
    data: {
      userId: DEMO_USER_ID,
      courseId: data.courseId,
      name: data.name,
      columns: {
        create: data.columns && data.columns.length > 0
          ? data.columns.map((c: CreateKanbanColumnInput, i: number) => ({
              name: c.name,
              order: c.order ?? i,
              color: c.color || '#E5E7EB'
            }))
          : [
              { name: 'To Do', order: 0, color: '#FEE2E2' },
              { name: 'In Progress', order: 1, color: '#FEF3C7' },
              { name: 'Done', order: 2, color: '#D1FAE5' }
            ]
      }
    },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { cards: true }
      }
    }
  })
  res.status(201).json(board)
}

export async function createKanbanCard(req: Request, res: Response) {
  const data = req.body as CreateKanbanCardInput
  const card = await prisma.kanbanCard.create({
    data: {
      columnId: data.columnId,
      title: data.title,
      description: data.description,
      order: data.order ?? 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      labels: data.labels ? JSON.stringify(data.labels) : null
    }
  })
  res.status(201).json(card)
}

export async function moveKanbanCard(req: Request, res: Response) {
  const data = req.body as MoveKanbanCardInput
  const card = await prisma.kanbanCard.update({
    where: { id: data.cardId },
    data: { columnId: data.targetColumnId, order: data.newOrder }
  })
  res.json(card)
}

export async function deleteKanbanBoard(req: Request, res: Response) {
  const { id } = req.params
  await prisma.kanbanBoard.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== NOTES =====================
export async function getNotes(req: Request, res: Response) {
  const { courseId } = req.query
  const where: any = { userId: DEMO_USER_ID }
  if (courseId) where.courseId = String(courseId)

  const notes = await prisma.note.findMany({
    where,
    include: { course: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' }
  })
  res.json(notes)
}

export async function createNote(req: Request, res: Response) {
  const data = req.body as CreateNoteInput
  const note = await prisma.note.create({
    data: {
      userId: DEMO_USER_ID,
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.stringify(data.tags) : null
    }
  })
  res.status(201).json(note)
}

export async function updateNote(req: Request, res: Response) {
  const { id } = req.params
  const data = req.body as Partial<CreateNoteInput>
  const note = await prisma.note.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.stringify(data.tags) : undefined
    }
  })
  res.json(note)
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params
  await prisma.note.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== TODAY PAGE =====================
export async function getToday(req: Request, res: Response) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekEnd = addWeeks(todayStart, 1)
  const dayOfWeek = now.getDay()

  // Get today's classes
  const courses = await prisma.course.findMany({
    where: { userId: DEMO_USER_ID },
    include: { classTimes: true }
  })

  const todayClasses = courses
    .flatMap(c => c.classTimes
      .filter(ct => ct.dayOfWeek === dayOfWeek)
      .map(ct => ({
        id: ct.id,
        courseName: c.name,
        courseCode: c.code,
        courseColor: c.color,
        startTime: ct.startTime,
        endTime: ct.endTime,
        location: ct.location || c.location,
        instructor: c.instructor
      }))
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Get upcoming deadlines
  const assignments = await prisma.assignment.findMany({
    where: {
      userId: DEMO_USER_ID,
      status: { not: 'COMPLETED' },
      dueDate: { gte: todayStart, lte: weekEnd }
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' }
  })

  const upcomingDeadlines = assignments.map(a => ({
    id: a.id,
    title: a.title,
    courseName: a.course?.name || null,
    courseColor: a.course?.color || null,
    dueDate: a.dueDate.toISOString(),
    type: a.type,
    priority: a.priority,
    status: a.status,
    hoursRemaining: differenceInHours(a.dueDate, now)
  }))

  // Generate recommended study blocks
  const recommendedStudyBlocks = generateStudyBlocks(todayClasses, upcomingDeadlines, now)

  // Get quick notes
  const notes = await prisma.note.findMany({
    where: { userId: DEMO_USER_ID },
    include: { course: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5
  })

  const quickNotes = notes.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content.substring(0, 200) + (n.content.length > 200 ? '...' : ''),
    courseName: n.course?.name || null,
    updatedAt: n.updatedAt.toISOString()
  }))

  // Calculate stats
  const totalAssignments = await prisma.assignment.count({ where: { userId: DEMO_USER_ID } })
  const completedToday = await prisma.assignment.count({
    where: {
      userId: DEMO_USER_ID,
      status: 'COMPLETED',
      completedAt: { gte: todayStart, lte: todayEnd }
    }
  })
  const upcomingThisWeek = await prisma.assignment.count({
    where: {
      userId: DEMO_USER_ID,
      status: { not: 'COMPLETED' },
      dueDate: { gte: todayStart, lte: weekEnd }
    }
  })

  // Calculate average grade across all courses
  const allGradeItems = await prisma.gradeItem.findMany({
    include: { course: true }
  })
  const courseIds = [...new Set(allGradeItems.map(g => g.courseId))]
  const courseGrades = courseIds.map(cid => {
    const items = allGradeItems.filter(g => g.courseId === cid)
    return calculateCurrentGrade(items)
  }).filter(g => g !== null)

  const averageGrade = courseGrades.length > 0
    ? courseGrades.reduce((a, b) => a! + b!, 0)! / courseGrades.length
    : null

  const result: TodayOverview = {
    date: todayStart.toISOString(),
    classes: todayClasses,
    upcomingDeadlines,
    recommendedStudyBlocks,
    quickNotes,
    stats: {
      totalAssignments,
      completedToday,
      upcomingThisWeek,
      averageGrade
    }
  }

  res.json(result)
}

// ===================== IMPORT =====================
export async function importTimetable(req: Request, res: Response) {
  const { csvData } = req.body as { csvData: string }
  // Simple CSV parser for demo - in production use csv-parse library
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const courses: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((h, idx) => row[h] = values[idx])
    courses.push(row)
  }

  res.json({ imported: courses.length, courses })
}

export async function importCalendar(req: Request, res: Response) {
  const { icsData } = req.body as { icsData: string }
  // Simple ICS parser for demo
  const events: any[] = []
  const lines = icsData.split('\n')
  let currentEvent: any = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {}
    } else if (trimmed === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent)
      currentEvent = null
    } else if (currentEvent) {
      const [key, ...valueParts] = trimmed.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':')
        if (key === 'SUMMARY') currentEvent.title = value
        if (key === 'DTSTART') currentEvent.start = value
        if (key === 'DTEND') currentEvent.end = value
        if (key === 'LOCATION') currentEvent.location = value
        if (key === 'DESCRIPTION') currentEvent.description = value
      }
    }
  }

  res.json({ imported: events.length, events })
}

// ===================== STUDY ROADMAP =====================
export async function getStudyRoadmap(req: Request, res: Response) {
  const { courseId } = req.params
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: DEMO_USER_ID },
    include: {
      assignments: { orderBy: { dueDate: 'asc' } },
      classTimes: true,
      gradeItems: true
    }
  })

  if (!course) return res.status(404).json({ error: 'Course not found' })

  const now = new Date()
  const roadmap = course.assignments.map((a, index) => {
    const daysUntil = differenceInHours(a.dueDate, now) / 24
    const recommendedStart = addDays(now, Math.max(0, daysUntil - (a.estimatedMinutes ? Math.ceil(a.estimatedMinutes / 120) : 3)))

    return {
      assignmentId: a.id,
      title: a.title,
      dueDate: a.dueDate.toISOString(),
      type: a.type,
      priority: a.priority,
      estimatedMinutes: a.estimatedMinutes,
      recommendedStartDate: recommendedStart.toISOString(),
      suggestedStudySessions: a.estimatedMinutes
        ? Math.ceil(a.estimatedMinutes / 120)
        : 2,
      order: index + 1
    }
  })

  res.json({
    courseId: course.id,
    courseName: course.name,
    roadmap
  })
}

// ===================== HELPER FUNCTIONS =====================
function calculateCurrentGrade(items: { score: number | null; maxScore: number; weight: number }[]): number | null {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const item of items) {
    if (item.score !== null && item.score !== undefined) {
      const normalizedScore = (item.score / item.maxScore) * 100
      totalWeightedScore += normalizedScore * item.weight
      totalWeight += item.weight
    }
  }

  if (totalWeight === 0) return null
  return totalWeightedScore / totalWeight
}

function calculateMaxPossibleGrade(items: { score: number | null; maxScore: number; weight: number }[]): number {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const item of items) {
    const score = item.score !== null ? item.score : item.maxScore
    const normalizedScore = (score / item.maxScore) * 100
    totalWeightedScore += normalizedScore * item.weight
    totalWeight += item.weight
  }

  if (totalWeight === 0) return 0
  return totalWeightedScore / totalWeight
}

function calculateMinPossibleGrade(items: { score: number | null; maxScore: number; weight: number }[]): number {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const item of items) {
    const score = item.score !== null ? item.score : 0
    const normalizedScore = (score / item.maxScore) * 100
    totalWeightedScore += normalizedScore * item.weight
    totalWeight += item.weight
  }

  if (totalWeight === 0) return 0
  return totalWeightedScore / totalWeight
}

function generateStudyBlocks(
  classes: { startTime: string; endTime: string }[],
  deadlines: { hoursRemaining: number; title: string; courseName: string | null }[],
  now: Date
) {
  const blocks: any[] = []
  const sortedClasses = [...classes].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Find gaps between classes for study blocks
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const currentEnd = parseTime(sortedClasses[i].endTime)
    const nextStart = parseTime(sortedClasses[i + 1].startTime)

    if (nextStart > currentEnd + 30) {
      const gapMinutes = nextStart - currentEnd
      if (gapMinutes >= 60) {
        const urgent = deadlines.find(d => d.hoursRemaining <= 48)
        blocks.push({
          startTime: format(addMinutes(setTime(now, sortedClasses[i].endTime), 15), "yyyy-MM-dd'T'HH:mm:ss"),
          endTime: format(addMinutes(setTime(now, sortedClasses[i + 1].startTime), -15), "yyyy-MM-dd'T'HH:mm:ss"),
          duration: Math.floor(gapMinutes / 60),
          suggestedFor: urgent?.courseName || 'General study',
          reason: urgent
            ? `Urgent: ${urgent.title} due soon`
            : 'Free time between classes'
        })
      }
    }
  }

  // Evening study block if assignments are pending
  if (deadlines.length > 0) {
    const eveningStart = setTime(now, '19:00')
    if (eveningStart > now) {
      blocks.push({
        startTime: format(eveningStart, "yyyy-MM-dd'T'HH:mm:ss"),
        endTime: format(addMinutes(eveningStart, 120), "yyyy-MM-dd'T'HH:mm:ss"),
        duration: 2,
        suggestedFor: deadlines[0].courseName,
        reason: `${deadlines.length} assignment(s) due this week`
      })
    }
  }

  return blocks
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function setTime(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

// ===================== BINUSMAYA IMPORT =====================
export async function importBinusMaya(req: Request, res: Response) {
  const { scrapeOnly } = req.query
  const result = await scrapeBinusMaya()

  if (!result.success) {
    await closeBinusMayaSession()
    return res.status(400).json({
      success: false,
      error: result.error,
      hint: 'Make sure you are logged into https://binusmaya.binus.ac.id in your browser and the Kimi WebBridge extension is connected.'
    })
  }

  // If scrapeOnly, return raw data without importing
  if (scrapeOnly === 'true') {
    await closeBinusMayaSession()
    return res.json({ success: true, scrapeOnly: true, ...result })
  }

  // Import courses
  const semesterStart = new Date()
  semesterStart.setMonth(semesterStart.getMonth() - 1)
  const semesterEnd = new Date()
  semesterEnd.setMonth(semesterEnd.getMonth() + 3)

  const courseMap = new Map<string, string>() // code -> id

  for (const c of result.courses) {
    const existing = await prisma.course.findFirst({
      where: { userId: DEMO_USER_ID, code: c.code || undefined }
    })
    if (existing) {
      courseMap.set(c.code, existing.id)
      continue
    }
    const created = await prisma.course.create({
      data: {
        userId: DEMO_USER_ID,
        name: c.name,
        code: c.code || null,
        color: '#3B82F6',
        instructor: c.instructor || null,
        creditHours: 3,
        startDate: semesterStart,
        endDate: semesterEnd,
      }
    })
    courseMap.set(c.code, created.id)
    result.imported.courses++
  }

  // Import assignments
  for (const a of result.assignments) {
    const courseId = courseMap.get(a.courseName) || null
    await prisma.assignment.create({
      data: {
        userId: DEMO_USER_ID,
        courseId,
        title: a.title,
        description: a.description || null,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
        type: 'ASSIGNMENT',
        priority: 'MEDIUM',
      }
    })
    result.imported.assignments++
  }

  // Import grades
  for (const g of result.grades) {
    const courseId = courseMap.get(g.courseName)
    if (!courseId) continue
    await prisma.gradeItem.create({
      data: {
        courseId,
        name: g.itemName,
        category: g.category,
        weight: g.weight || 10,
        score: g.score,
        maxScore: g.maxScore || 100,
      }
    })
    result.imported.gradeItems++
  }

  await closeBinusMayaSession()

  res.json({
    success: true,
    imported: result.imported,
    courses: result.courses.map(c => ({ name: c.name, code: c.code })),
    assignmentsCount: result.assignments.length,
    gradesCount: result.grades.length,
  })
}

// ===================== NOTIFICATIONS =====================
export async function getNotifications(req: Request, res: Response) {
  const now = new Date()
  const in24h = addDays(now, 1)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)

  // Get assignments due within 24h (for reminders)
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      userId: DEMO_USER_ID,
      status: { not: 'COMPLETED' },
      dueDate: { gte: now, lte: in24h },
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' },
  })

  // Get overdue assignments (for alerts)
  const overdueAssignments = await prisma.assignment.findMany({
    where: {
      userId: DEMO_USER_ID,
      status: { not: 'COMPLETED' },
      dueDate: { lt: now },
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Get classes starting within 1h
  const dayOfWeek = now.getDay()
  const currentTime = format(now, 'HH:mm')
  const coursesWithClass = await prisma.course.findMany({
    where: { userId: DEMO_USER_ID },
    include: { classTimes: true },
  })

  const upcomingClasses = coursesWithClass
    .flatMap(c => c.classTimes
      .filter(ct => ct.dayOfWeek === dayOfWeek)
      .map(ct => ({
        courseName: c.name,
        startTime: ct.startTime,
        endTime: ct.endTime,
        location: ct.location,
        hoursUntil: parseTime(ct.startTime) - parseTime(currentTime),
      }))
    )
    .filter(c => c.hoursUntil > 0 && c.hoursUntil <= 1) // Within 1 hour and hasn't started
    .sort((a, b) => a.hoursUntil - b.hoursUntil)

  res.json({
    upcoming: upcomingAssignments.map(a => ({
      id: a.id,
      title: a.title,
      courseName: a.course?.name || null,
      courseColor: a.course?.color || null,
      dueDate: a.dueDate.toISOString(),
      hoursRemaining: differenceInHours(a.dueDate, now),
      type: 'UPCOMING',
    })),
    overdue: overdueAssignments.map(a => ({
      id: a.id,
      title: a.title,
      courseName: a.course?.name || null,
      courseColor: a.course?.color || null,
      dueDate: a.dueDate.toISOString(),
      hoursOverdue: Math.abs(differenceInHours(a.dueDate, now)),
      type: 'OVERDUE',
    })),
    classes: upcomingClasses.map(c => ({
      courseName: c.courseName,
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      minutesUntil: Math.round(c.hoursUntil * 60),
      type: 'CLASS',
    })),
  })
}
