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

// Helper to get userId from authenticated request
function getUserId(req: Request): string | undefined {
  return (req as any).userId
}

// ===================== COURSES =====================
export async function getCourses(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const courses = await prisma.course.findMany({
    where: { userId },
    include: { classTimes: true, _count: { select: { assignments: true } } },
    orderBy: { name: 'asc' }
  })
  res.json(courses)
}

export async function getCourseById(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const course = await prisma.course.findFirst({
    where: { id, userId },
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateCourseInput
  const course = await prisma.course.create({
    data: {
      userId,
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.course.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Course not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.course.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Course not found' })

  await prisma.course.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== ASSIGNMENTS =====================
export async function getAssignments(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId, status, upcoming } = req.query
  const where: any = { userId }
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateAssignmentInput
  const assignment = await prisma.assignment.create({
    data: {
      userId,
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.assignment.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Assignment not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.assignment.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Assignment not found' })

  await prisma.assignment.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== EVENTS =====================
export async function getEvents(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { start, end } = req.query
  const where: any = { userId }
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateEventInput
  const event = await prisma.event.create({
    data: {
      userId,
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.event.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Event not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.event.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Event not found' })

  await prisma.event.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== GRADES =====================
export async function getCourseGrades(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId } = req.params
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } })
  if (!course) return res.status(404).json({ error: 'Course not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateGradeItemInput
  const course = await prisma.course.findFirst({ where: { id: data.courseId, userId } })
  if (!course) return res.status(404).json({ error: 'Course not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.gradeItem.findFirst({
    where: { id },
    include: { course: true }
  })
  if (!existing || existing.course.userId !== userId) {
    return res.status(404).json({ error: 'Grade item not found' })
  }

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.gradeItem.findFirst({
    where: { id },
    include: { course: true }
  })
  if (!existing || existing.course.userId !== userId) {
    return res.status(404).json({ error: 'Grade item not found' })
  }

  await prisma.gradeItem.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== WHAT-IF CALCULATOR =====================
export async function calculateWhatIf(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId } = req.params
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } })
  if (!course) return res.status(404).json({ error: 'Course not found' })

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
    difference: (hypotheticalGrade ?? 0) - (currentGrade ?? 0),
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId } = req.query
  const where: any = { userId }
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateKanbanBoardInput
  const board = await prisma.kanbanBoard.create({
    data: {
      userId,
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as MoveKanbanCardInput
  const card = await prisma.kanbanCard.update({
    where: { id: data.cardId },
    data: { columnId: data.targetColumnId, order: data.newOrder }
  })
  res.json(card)
}

export async function deleteKanbanBoard(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.kanbanBoard.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Board not found' })

  await prisma.kanbanBoard.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== NOTES =====================
export async function getNotes(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId } = req.query
  const where: any = { userId }
  if (courseId) where.courseId = String(courseId)

  const notes = await prisma.note.findMany({
    where,
    include: { course: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' }
  })
  res.json(notes)
}

export async function createNote(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const data = req.body as CreateNoteInput
  const note = await prisma.note.create({
    data: {
      userId,
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.stringify(data.tags) : null
    }
  })
  res.status(201).json(note)
}

export async function updateNote(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.note.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Note not found' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.params
  const existing = await prisma.note.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Note not found' })

  await prisma.note.delete({ where: { id } })
  res.json({ success: true })
}

// ===================== TODAY PAGE =====================
export async function getToday(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekEnd = addWeeks(todayStart, 1)
  const dayOfWeek = now.getDay()

  // Get today's classes
  const courses = await prisma.course.findMany({
    where: { userId },
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
      userId,
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
    type: a.type as any,
    priority: a.priority as any,
    status: a.status as any,
    hoursRemaining: differenceInHours(a.dueDate, now)
  }))

  // Generate recommended study blocks
  const recommendedStudyBlocks = generateStudyBlocks(todayClasses, upcomingDeadlines, now)

  // Get quick notes
  const notes = await prisma.note.findMany({
    where: { userId },
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
  const totalAssignments = await prisma.assignment.count({ where: { userId } })
  const completedToday = await prisma.assignment.count({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: todayStart, lte: todayEnd }
    }
  })
  const upcomingThisWeek = await prisma.assignment.count({
    where: {
      userId,
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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courseId } = req.params
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
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

type BinusMayaJsonCourse = {
  name?: string
  code?: string
  classTimes?: BinusMayaJsonClassTime[]
  schedule?: BinusMayaJsonClassTime[]
}

type BinusMayaJsonClassTime = {
  dayOfWeek?: number
  day?: string
  startTime?: string
  endTime?: string
  time?: string
  location?: string
  room?: string
  courseCode?: string
  courseName?: string
}

type BinusMayaJsonAssignment = {
  title?: string
  description?: string
  dueDate?: string | null
  type?: string
  courseCode?: string
  courseName?: string
}

type BinusMayaJsonGrade = {
  itemName?: string
  component?: string
  category?: string
  score?: number | null
  maxScore?: number
  weight?: number
  courseCode?: string
  courseName?: string
}

type BinusMayaJsonAnnouncement = {
  title?: string
  content?: string
  courseCode?: string
  courseName?: string
}

function courseKey(value?: string | null): string | null {
  const key = value?.trim()
  return key ? key.toLowerCase() : null
}

function setCourseMapKey(map: Map<string, string>, key: string | undefined | null, id: string) {
  const normalized = courseKey(key)
  if (normalized) map.set(normalized, id)
}

function isValidBinusCourseCode(value?: string | null): boolean {
  return /^[A-Z]{2,6}\d{3,8}$/.test(value?.trim() || '')
}

function isNoisyBinusText(value?: string | null): boolean {
  const text = value?.trim()
  if (!text) return true
  return /^text\b/i.test(text) ||
    /^[{[]/.test(text) ||
    /^[A-Z][A-Z .'-]{5,}$/.test(text) ||
    /latest forum posts?|unread posts?|no discussion forums?|academic calendar|being a student is easy|william crawford|dashboard|my progress|your progress|add course/i.test(text)
}

function isValidBinusAssignmentTitle(value?: string | null): boolean {
  const title = value?.trim()
  return !!title &&
    title.length >= 4 &&
    title.length <= 180 &&
    !isNoisyBinusText(title) &&
    !/gradingScore|iamType|scoreDate|SmartStudent synced/i.test(title)
}

function isValidBinusGrade(value: BinusMayaJsonGrade): boolean {
  const name = value.itemName?.trim() || value.component?.trim()
  const score = value.score
  return !!name &&
    !isNoisyBinusText(name) &&
    !/gradingScore|courseCode.*range/i.test(name) &&
    (score === null || score === undefined || (Number.isFinite(score) && score >= 0 && score <= (value.maxScore || 100)))
}

function parseBinusMayaDate(value?: string | null): Date {
  if (!value) return addDays(new Date(), 7)

  const trimmed = value.trim()
  const dmy = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
  if (dmy) {
    const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3])
    const date = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]))
    if (!Number.isNaN(date.getTime())) return date
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? addDays(new Date(), 7) : parsed
}

function parseBinusMayaDay(value?: string | null): number | null {
  const day = value?.trim().toLowerCase()
  if (!day) return null
  const days: Record<string, number> = {
    sunday: 0, minggu: 0,
    monday: 1, senin: 1,
    tuesday: 2, selasa: 2,
    wednesday: 3, rabu: 3,
    thursday: 4, kamis: 4,
    friday: 5, jumat: 5, "jum'at": 5,
    saturday: 6, sabtu: 6,
  }
  return days[day] ?? null
}

function parseBinusMayaTime(value?: string | null): string | null {
  const match = value?.match(/([01]?\d|2[0-3])[:.]([0-5]\d)/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null
}

function isValidClassTime(value: BinusMayaJsonClassTime): value is Required<Pick<BinusMayaJsonClassTime, 'dayOfWeek' | 'startTime' | 'endTime'>> & BinusMayaJsonClassTime {
  const dayOfWeek = value.dayOfWeek ?? parseBinusMayaDay(value.day) ?? undefined
  const [legacyStart, legacyEnd] = value.time?.split(/\s*-\s*/) || []
  const startTime = parseBinusMayaTime(value.startTime) || parseBinusMayaTime(legacyStart)
  const endTime = parseBinusMayaTime(value.endTime) || parseBinusMayaTime(legacyEnd) || startTime
  if (dayOfWeek === undefined || !startTime || !endTime) return false
  value.dayOfWeek = dayOfWeek
  value.startTime = startTime
  value.endTime = endTime
  return dayOfWeek >= 0 && dayOfWeek <= 6
}

async function importClassTimes(courseId: string, classTimes?: BinusMayaJsonClassTime[]) {
  let imported = 0
  for (const ct of classTimes || []) {
    if (!isValidClassTime(ct)) continue

    const existing = await prisma.classTime.findFirst({
      where: {
        courseId,
        dayOfWeek: ct.dayOfWeek,
        startTime: ct.startTime,
        endTime: ct.endTime,
        location: ct.location || ct.room || null,
      }
    })
    if (existing) continue

    await prisma.classTime.create({
      data: {
        courseId,
        dayOfWeek: ct.dayOfWeek,
        startTime: ct.startTime,
        endTime: ct.endTime,
        location: ct.location || ct.room || null,
      }
    })
    imported++
  }
  return imported
}

// ===================== BINUSMAYA IMPORT =====================
export async function importBinusMaya(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
    return res.json({ scrapeOnly: true, ...result })
  }

  // Import courses
  const semesterStart = new Date()
  semesterStart.setMonth(semesterStart.getMonth() - 1)
  const semesterEnd = new Date()
  semesterEnd.setMonth(semesterEnd.getMonth() + 3)

  const courseMap = new Map<string, string>() // code -> id

  for (const c of result.courses) {
    const existing = await prisma.course.findFirst({
      where: { userId, code: c.code || undefined }
    })
    if (existing) {
      setCourseMapKey(courseMap, c.code, existing.id)
      setCourseMapKey(courseMap, c.name, existing.id)
      result.imported.classTimes += await importClassTimes(existing.id, c.schedule as any)
      continue
    }
    const created = await prisma.course.create({
      data: {
        userId,
        name: c.name,
        code: c.code || null,
        color: '#3B82F6',
        instructor: c.instructor || null,
        creditHours: 3,
        startDate: semesterStart,
        endDate: semesterEnd,
      }
    })
    setCourseMapKey(courseMap, c.code, created.id)
    setCourseMapKey(courseMap, c.name, created.id)
    result.imported.classTimes += await importClassTimes(created.id, c.schedule as any)
    result.imported.courses++
  }

  for (const s of result.schedules || []) {
    const courseId =
      courseMap.get(courseKey(s.courseCode) || '') ||
      courseMap.get(courseKey(s.courseName) || '')
    if (!courseId) continue
    result.imported.classTimes += await importClassTimes(courseId, [s])
  }

  // Import assignments
  for (const a of result.assignments) {
    const courseId = courseMap.get(courseKey(a.courseName) || '') || null
    await prisma.assignment.create({
      data: {
        userId,
        courseId,
        title: a.title,
        description: a.description || null,
        dueDate: parseBinusMayaDate(a.dueDate),
        type: 'ASSIGNMENT',
        priority: 'MEDIUM',
      }
    })
    result.imported.assignments++
  }

  // Import grades
  for (const g of result.grades) {
    const courseId = courseMap.get(courseKey(g.courseName) || '')
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

  for (const announcement of result.announcements || []) {
    const title = announcement.title?.trim()
    if (!title) continue
    const courseId =
      courseMap.get(courseKey(announcement.courseCode) || '') ||
      courseMap.get(courseKey(announcement.courseName) || '') ||
      null
    const existing = await prisma.note.findFirst({ where: { userId, courseId, title } })
    if (existing) continue
    await prisma.note.create({
      data: {
        userId,
        courseId,
        title,
        content: announcement.content || title,
        tags: JSON.stringify(['binusmaya', 'announcement']),
      }
    })
    result.imported.notes++
  }

  await closeBinusMayaSession()

  res.json({
    success: true,
    imported: result.imported,
    courses: result.courses.map(c => ({ name: c.name, code: c.code })),
    assignmentsCount: result.assignments.length,
    gradesCount: result.grades.length,
    schedulesCount: result.schedules.length,
    announcementsCount: result.announcements.length,
  })
}

// ===================== BINUSMAYA IMPORT FROM JSON (No WebBridge) =====================
export async function importBinusMayaJson(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { courses, assignments, grades, schedules, announcements } = req.body as {
    courses?: BinusMayaJsonCourse[]
    assignments?: BinusMayaJsonAssignment[]
    grades?: BinusMayaJsonGrade[]
    schedules?: BinusMayaJsonClassTime[]
    announcements?: BinusMayaJsonAnnouncement[]
  }

  const imported = { courses: 0, assignments: 0, gradeItems: 0, classTimes: 0, notes: 0 }
  const semesterStart = new Date()
  semesterStart.setMonth(semesterStart.getMonth() - 1)
  const semesterEnd = new Date()
  semesterEnd.setMonth(semesterEnd.getMonth() + 3)

  const courseMap = new Map<string, string>()

  for (const c of courses || []) {
    const code = c.code?.trim()
    if (!code || !isValidBinusCourseCode(code) || (c.name && isNoisyBinusText(c.name))) continue
    const name = c.name?.trim() || code

    const existing = await prisma.course.findFirst({
      where: { userId, code }
    })
    const course = existing || await prisma.course.create({
      data: {
        userId,
        name,
        code,
        color: '#3B82F6',
        creditHours: 3,
        startDate: semesterStart,
        endDate: semesterEnd,
      }
    })
    setCourseMapKey(courseMap, c.code, course.id)
    setCourseMapKey(courseMap, name, course.id)
    imported.classTimes += await importClassTimes(course.id, [...(c.classTimes || []), ...(c.schedule || [])])
    if (!existing) imported.courses++
  }

  for (const s of schedules || []) {
    const courseId =
      courseMap.get(courseKey(s.courseCode) || '') ||
      courseMap.get(courseKey(s.courseName) || '')
    if (!courseId) continue
    imported.classTimes += await importClassTimes(courseId, [s])
  }

  for (const a of assignments || []) {
    const title = a.title?.trim()
    if (!title) continue
    if (!isValidBinusAssignmentTitle(title) || (!isValidBinusCourseCode(a.courseCode) && !a.dueDate)) continue

    const courseId =
      courseMap.get(courseKey(a.courseCode) || '') ||
      courseMap.get(courseKey(a.courseName) || '') ||
      null
    const dueDate = parseBinusMayaDate(a.dueDate)

    const existing = await prisma.assignment.findFirst({
      where: { userId, courseId, title, dueDate }
    })
    if (existing) continue

    await prisma.assignment.create({
      data: {
        userId,
        courseId,
        title,
        description: a.description || null,
        dueDate,
        type: a.type || 'ASSIGNMENT',
        priority: 'MEDIUM',
      }
    })
    imported.assignments++
  }

  for (const g of grades || []) {
    if (!isValidBinusGrade(g)) continue
    const courseId =
      courseMap.get(courseKey(g.courseCode) || '') ||
      courseMap.get(courseKey(g.courseName) || '') ||
      courseMap.values().next().value
    if (!courseId) continue

    const name = g.itemName?.trim() || g.component?.trim() || 'Score'
    const existing = await prisma.gradeItem.findFirst({
      where: { courseId, name }
    })
    if (existing) continue

    await prisma.gradeItem.create({
      data: {
        courseId,
        name,
        category: g.category || 'General',
        weight: g.weight || 10,
        score: g.score ?? null,
        maxScore: g.maxScore || 100,
      }
    })
    imported.gradeItems++
  }

  for (const announcement of announcements || []) {
    const title = announcement.title?.trim()
    if (!title) continue

    const courseId =
      courseMap.get(courseKey(announcement.courseCode) || '') ||
      courseMap.get(courseKey(announcement.courseName) || '') ||
      null
    const existing = await prisma.note.findFirst({
      where: { userId, courseId, title }
    })
    if (existing) continue

    await prisma.note.create({
      data: {
        userId,
        courseId,
        title,
        content: announcement.content || title,
        tags: JSON.stringify(['binusmaya', 'announcement']),
      }
    })
    imported.notes++
  }

  res.json({ success: true, imported })
}

// ===================== NOTIFICATIONS =====================
export async function getNotifications(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const now = new Date()
  const in24h = addDays(now, 1)
  const currentTime = format(now, 'HH:mm')

  // Get assignments due within 24h (for reminders)
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      userId,
      status: { not: 'COMPLETED' },
      dueDate: { gte: now, lte: in24h },
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' },
  })

  // Get overdue assignments (for alerts)
  const overdueAssignments = await prisma.assignment.findMany({
    where: {
      userId,
      status: { not: 'COMPLETED' },
      dueDate: { lt: now },
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Get classes starting within 1 hour
  const dayOfWeek = now.getDay()
  const coursesWithClass = await prisma.course.findMany({
    where: { userId },
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
        hoursUntil: (parseTime(ct.startTime) - parseTime(currentTime)) / 60,
      }))
    )
    .filter(c => c.hoursUntil > 0 && c.hoursUntil <= 1)
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
