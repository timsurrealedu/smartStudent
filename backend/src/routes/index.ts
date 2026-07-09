import { Router } from 'express'
import {
  getOrCreateUser,
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
  getNotifications,
  getStudyRoadmap,
} from '../services/controllers'

const router = Router()

// User
router.get('/user/me', getOrCreateUser)

// Courses
router.get('/courses', getCourses)
router.get('/courses/:id', getCourseById)
router.post('/courses', createCourse)
router.put('/courses/:id', updateCourse)
router.delete('/courses/:id', deleteCourse)

// Assignments
router.get('/assignments', getAssignments)
router.post('/assignments', createAssignment)
router.put('/assignments/:id', updateAssignment)
router.delete('/assignments/:id', deleteAssignment)

// Events
router.get('/events', getEvents)
router.post('/events', createEvent)
router.put('/events/:id', updateEvent)
router.delete('/events/:id', deleteEvent)

// Grades
router.get('/courses/:courseId/grades', getCourseGrades)
router.post('/grades', createGradeItem)
router.put('/grades/:id', updateGradeItem)
router.delete('/grades/:id', deleteGradeItem)
router.post('/courses/:courseId/what-if', calculateWhatIf)

// Kanban
router.get('/kanban', getKanbanBoards)
router.post('/kanban', createKanbanBoard)
router.post('/kanban/cards', createKanbanCard)
router.put('/kanban/cards/move', moveKanbanCard)
router.delete('/kanban/:id', deleteKanbanBoard)

// Notes
router.get('/notes', getNotes)
router.post('/notes', createNote)
router.put('/notes/:id', updateNote)
router.delete('/notes/:id', deleteNote)

// Today
router.get('/today', getToday)

// Study Roadmap
router.get('/courses/:courseId/roadmap', getStudyRoadmap)

// Notifications
router.get('/notifications', getNotifications)

// Import
router.post('/import/timetable', importTimetable)
router.post('/import/calendar', importCalendar)
router.post('/import/binusmaya', importBinusMaya)

export default router
