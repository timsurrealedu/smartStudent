// BinusMaya LMS scraper using Kimi WebBridge
// Makes HTTP requests to localhost:10086 to control the user's browser
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const WEBBRIDGE_URL = 'http://127.0.0.1:10086/command'
const SESSION = 'smartstudent-binusmaya'

interface WebBridgeResponse {
  ok: boolean
  error?: { code: string; message: string }
  url?: string
  title?: string
  tree?: string
  [key: string]: any
}

async function webbridgeCall(body: any): Promise<WebBridgeResponse> {
  const res = await fetch(WEBBRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, session: SESSION }),
  })
  return res.json() as Promise<WebBridgeResponse>
}

async function navigate(url: string, newTab = true) {
  return webbridgeCall({
    action: 'navigate',
    args: { url, newTab, group_title: 'SmartStudent - BinusMaya Import' },
  })
}

async function snapshot(): Promise<WebBridgeResponse> {
  return webbridgeCall({ action: 'snapshot', args: {} })
}

async function evaluate(code: string) {
  return webbridgeCall({ action: 'evaluate', args: { code } })
}

async function click(selector: string) {
  return webbridgeCall({ action: 'click', args: { selector } })
}

async function screenshot() {
  return webbridgeCall({ action: 'screenshot', args: {} })
}

function extractorCode() {
  const candidates = [
    join(process.cwd(), '..', 'browser-extension', 'extractor.js'),
    join(process.cwd(), 'browser-extension', 'extractor.js'),
  ]
  const file = candidates.find(existsSync)
  return file ? readFileSync(file, 'utf8') : ''
}

// ==================== SCRAPER LOGIC ====================

export interface BinusMayaCourse {
  name: string
  code: string
  instructor?: string
  schedule?: { day: string; time: string; room: string }[]
}

export interface BinusMayaAssignment {
  title: string
  courseName: string
  dueDate?: string
  type: string
  description?: string
}

export interface BinusMayaGrade {
  courseName: string
  itemName: string
  category: string
  score: number | null
  maxScore: number
  weight: number
}

export interface BinusMayaSchedule {
  courseCode?: string
  courseName?: string
  day?: string
  startTime?: string
  endTime?: string
  location?: string
}

export interface BinusMayaAnnouncement {
  title: string
  content?: string
  courseCode?: string
  courseName?: string
}

export interface BinusMayaImportResult {
  success: boolean
  error?: string
  courses: BinusMayaCourse[]
  assignments: BinusMayaAssignment[]
  grades: BinusMayaGrade[]
  schedules: BinusMayaSchedule[]
  announcements: BinusMayaAnnouncement[]
  imported: {
    courses: number
    assignments: number
    gradeItems: number
    classTimes: number
    notes: number
  }
}

export async function scrapeBinusMaya(): Promise<BinusMayaImportResult> {
  const result: BinusMayaImportResult = {
    success: false,
    courses: [],
    assignments: [],
    grades: [],
    schedules: [],
    announcements: [],
    imported: { courses: 0, assignments: 0, gradeItems: 0, classTimes: 0, notes: 0 },
  }

  try {
    // Step 1: Navigate to BinusMaya
    const nav = await navigate('https://binusmaya.binus.ac.id')
    if (!nav.ok) {
      // Check if webbridge is running
      result.error = 'WebBridge not available. Please install the Kimi WebBridge browser extension and ensure it is connected.'
      return result
    }

    // Step 2: Take snapshot to check login state
    await new Promise(r => setTimeout(r, 3000)) // Wait for page load
    const snap = await snapshot()

    if (!snap.ok) {
      result.error = 'Could not read BinusMaya page. Please ensure you are logged into binusmaya.binus.ac.id in your browser.'
      return result
    }

    const pageTitle = snap.title?.toLowerCase() || ''
    const pageUrl = snap.url?.toLowerCase() || ''

    // Detect login page
    if (pageTitle.includes('login') || pageTitle.includes('sign in') || pageUrl.includes('login')) {
      result.error = 'You are not logged into BinusMaya. Please log in first, then retry the import.'
      return result
    }

    const extractor = extractorCode()
    if (extractor) {
      const extracted = await evaluate(`
        ${extractor}
        window.SmartStudentBinusMayaExtractor()
      `)
      const data = extracted.value || {}
      result.courses = data.courses || []
      result.assignments = (data.assignments || []).map((a: any) => ({
        title: a.title,
        courseName: a.courseName || a.courseCode || result.courses[0]?.name || 'General',
        dueDate: a.dueDate,
        type: a.type || 'ASSIGNMENT',
        description: a.description,
      }))
      result.grades = (data.grades || []).map((g: any) => ({
        courseName: g.courseName || g.courseCode || result.courses[0]?.name || 'General',
        itemName: g.itemName || g.component || 'Score',
        category: g.category || 'General',
        score: g.score ?? null,
        maxScore: g.maxScore || 100,
        weight: g.weight || 10,
      }))
      result.schedules = data.schedules || []
      result.announcements = data.announcements || []
      result.success = true
      return result
    }

    // Step 3: Extract courses from dashboard
    // BinusMaya v5 typically shows courses in a card/list layout
    const coursesData = await evaluate(`
      (() => {
        const courses = []
        // Try multiple selector patterns for BinusMaya course cards
        const selectors = [
          '[class*="course"]',
          '[class*="class"]',
          '[class*="subject"]',
          '[class*="mata"]',
          '.card',
          '.list-group-item',
          'tr',
        ]
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel)
          for (const el of els) {
            const text = el.textContent || ''
            if (text.length > 5 && text.length < 200) {
              const codeMatch = text.match(/([A-Z]{2,4}\d{3,4})/)
              const nameMatch = text.match(/([A-Z][a-zA-Z\s]+)/)
              if (codeMatch || nameMatch) {
                courses.push({
                  name: nameMatch ? nameMatch[1].trim() : text.trim().substring(0, 60),
                  code: codeMatch ? codeMatch[1] : '',
                  text: text.trim().substring(0, 200),
                })
              }
            }
          }
        }
        // Deduplicate by code
        const seen = new Set()
        return courses.filter(c => {
          const key = c.code || c.name
          if (seen.has(key)) return false
          seen.add(key)
          return true
        }).slice(0, 20)
      })()
    `)

    const rawCourses = coursesData.value || []
    result.courses = rawCourses.map((c: any) => ({
      name: c.name || 'Unknown Course',
      code: c.code || '',
      instructor: undefined,
      schedule: undefined,
    }))

    // Step 4: Try to find assignments
    // Navigate to assignments/schedule page if available
    const assignmentNav = await evaluate(`
      (() => {
        const links = Array.from(document.querySelectorAll('a'))
        const assignmentLink = links.find(a =>
          (a.textContent || '').toLowerCase().includes('assignment') ||
          (a.textContent || '').toLowerCase().includes('tugas') ||
          (a.textContent || '').toLowerCase().includes('task') ||
          (a.href || '').toLowerCase().includes('assignment')
        )
        const scheduleLink = links.find(a =>
          (a.textContent || '').toLowerCase().includes('schedule') ||
          (a.textContent || '').toLowerCase().includes('jadwal') ||
          (a.textContent || '').toLowerCase().includes('timetable')
        )
        const gradeLink = links.find(a =>
          (a.textContent || '').toLowerCase().includes('grade') ||
          (a.textContent || '').toLowerCase().includes('nilai') ||
          (a.textContent || '').toLowerCase().includes('score') ||
          (a.textContent || '').toLowerCase().includes('transcript')
        )
        return {
          assignmentHref: assignmentLink?.href || null,
          scheduleHref: scheduleLink?.href || null,
          gradeHref: gradeLink?.href || null,
        }
      })()
    `)

    const navLinks = assignmentNav.value || {}

    // Step 5: Extract assignments from current page or assignment page
    if (navLinks.assignmentHref) {
      await navigate(navLinks.assignmentHref, false)
      await new Promise(r => setTimeout(r, 2000))
    }

    const assignmentsData = await evaluate(`
      (() => {
        const items = []
        const rows = document.querySelectorAll('tr, [class*="list"] > div, [class*="item"]')
        for (const row of rows) {
          const text = row.textContent || ''
          const hasDate = text.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}/) || text.match(/\\d{4}-\\d{2}-\\d{2}/)
          const hasDue = text.toLowerCase().includes('due') || text.toLowerCase().includes('deadline') || text.toLowerCase().includes('batas')
          if ((hasDate || hasDue) && text.length > 10 && text.length < 300) {
            items.push({ text: text.trim().substring(0, 300) })
          }
        }
        return items.slice(0, 30)
      })()
    `)

    result.assignments = (assignmentsData.value || []).map((a: any) => ({
      title: a.text.substring(0, 80),
      courseName: result.courses[0]?.name || 'General',
      dueDate: undefined,
      type: 'ASSIGNMENT',
      description: a.text,
    }))

    // Step 6: Extract grades
    if (navLinks.gradeHref) {
      await navigate(navLinks.gradeHref, false)
      await new Promise(r => setTimeout(r, 2000))
    }

    const gradesData = await evaluate(`
      (() => {
        const items = []
        const rows = document.querySelectorAll('tr')
        for (const row of rows) {
          const cells = row.querySelectorAll('td, th')
          if (cells.length >= 3) {
            const text = Array.from(cells).map(c => c.textContent?.trim() || '').join(' | ')
            const scoreMatch = text.match(/(\\d+(?:\\.\\d+)?)\\s*[\\/\\-]\\s*(\\d+(?:\\.\\d+)?)/)
            if (scoreMatch) {
              items.push({
                text: text.substring(0, 200),
                score: parseFloat(scoreMatch[1]),
                maxScore: parseFloat(scoreMatch[2]),
              })
            }
          }
        }
        return items.slice(0, 30)
      })()
    `)

    result.grades = (gradesData.value || []).map((g: any) => ({
      courseName: result.courses[0]?.name || 'General',
      itemName: g.text.substring(0, 50),
      category: 'General',
      score: g.score || null,
      maxScore: g.maxScore || 100,
      weight: 0,
    }))

    result.success = true
    return result
  } catch (err: any) {
    result.error = err.message || 'Unknown scraping error'
    return result
  }
}

// Close the webbridge session when done
export async function closeBinusMayaSession() {
  await webbridgeCall({ action: 'close_session', args: {} })
}
