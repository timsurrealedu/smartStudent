import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { register, login, getMe } from '../services/auth'
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCourseGrades,
  createGradeItem,
  updateGradeItem,
  deleteGradeItem,
  calculateWhatIf,
  getKanbanBoards,
  createKanbanBoard,
  createKanbanCard,
  moveKanbanCard,
  deleteKanbanBoard,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getToday,
  importTimetable,
  importCalendar,
  importBinusMaya,
  importBinusMayaJson,
  getNotifications,
  getStudyRoadmap,
} from '../services/controllers'

const router = Router()

// Auth (public)
router.post('/auth/register', register)
router.post('/auth/login', login)
router.get('/auth/me', authenticate, getMe)

// Courses
router.get('/courses', authenticate, getCourses)
router.get('/courses/:id', authenticate, getCourseById)
router.post('/courses', authenticate, createCourse)
router.put('/courses/:id', authenticate, updateCourse)
router.delete('/courses/:id', authenticate, deleteCourse)

// Assignments
router.get('/assignments', authenticate, getAssignments)
router.post('/assignments', authenticate, createAssignment)
router.put('/assignments/:id', authenticate, updateAssignment)
router.delete('/assignments/:id', authenticate, deleteAssignment)

// Events
router.get('/events', authenticate, getEvents)
router.post('/events', authenticate, createEvent)
router.put('/events/:id', authenticate, updateEvent)
router.delete('/events/:id', authenticate, deleteEvent)

// Grades
router.get('/courses/:courseId/grades', authenticate, getCourseGrades)
router.post('/grades', authenticate, createGradeItem)
router.put('/grades/:id', authenticate, updateGradeItem)
router.delete('/grades/:id', authenticate, deleteGradeItem)
router.post('/courses/:courseId/what-if', authenticate, calculateWhatIf)

// Kanban
router.get('/kanban', authenticate, getKanbanBoards)
router.post('/kanban', authenticate, createKanbanBoard)
router.post('/kanban/cards', authenticate, createKanbanCard)
router.put('/kanban/cards/move', authenticate, moveKanbanCard)
router.delete('/kanban/:id', authenticate, deleteKanbanBoard)

// Notes
router.get('/notes', authenticate, getNotes)
router.post('/notes', authenticate, createNote)
router.put('/notes/:id', authenticate, updateNote)
router.delete('/notes/:id', authenticate, deleteNote)

// Today
router.get('/today', authenticate, getToday)

// Study Roadmap
router.get('/courses/:courseId/roadmap', authenticate, getStudyRoadmap)

// Notifications
router.get('/notifications', authenticate, getNotifications)

// Import
router.post('/import/timetable', authenticate, importTimetable)
router.post('/import/calendar', authenticate, importCalendar)
router.post('/import/binusmaya', authenticate, importBinusMaya)
router.post('/import/binusmaya-json', authenticate, importBinusMayaJson)

export default router
