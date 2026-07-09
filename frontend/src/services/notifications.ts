import { api } from './api'

interface NotificationItem {
  id: string
  title: string
  courseName: string | null
  dueDate?: string
  hoursRemaining?: number
  hoursOverdue?: number
  minutesUntil?: number
  type: 'UPCOMING' | 'OVERDUE' | 'CLASS'
}

interface NotificationPayload {
  upcoming: NotificationItem[]
  overdue: NotificationItem[]
  classes: NotificationItem[]
}

interface NotificationPrefs {
  enabled: boolean
  assignmentReminders: boolean
  deadlineAlerts: boolean
  classReminders: boolean
  dailyDigest: boolean
}

const SHOWN_KEY = 'smartstudent-shown-notifications'

function getShownIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markShown(id: string) {
  const shown = getShownIds()
  shown.add(id)
  localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]))
  // Clean up old entries (keep last 100)
  if (shown.size > 100) {
    const arr = [...shown]
    localStorage.setItem(SHOWN_KEY, JSON.stringify(arr.slice(-100)))
  }
}

function getPrefs(): NotificationPrefs {
  const raw = localStorage.getItem('smartstudent-notifications')
  return raw ? JSON.parse(raw) : { enabled: false }
}

function notify(title: string, body: string, tag: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  new Notification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag,
    renotify: false,
  })
}

function makeId(type: string, id: string, suffix?: string) {
  return suffix ? `${type}:${id}:${suffix}` : `${type}:${id}`
}

export async function checkAndNotify() {
  const prefs = getPrefs()
  if (!prefs.enabled || Notification.permission !== 'granted') return

  try {
    const data: NotificationPayload = await api.getNotifications()
    const shown = getShownIds()

    // Upcoming assignment reminders (due within 24h)
    if (prefs.assignmentReminders) {
      for (const item of data.upcoming) {
        const nid = makeId('upcoming', item.id)
        if (shown.has(nid)) continue
        if ((item.hoursRemaining || 0) > 24) continue

        const hours = item.hoursRemaining || 0
        const body = item.courseName
          ? `${item.courseName} — due in ${Math.round(hours)}h`
          : `Due in ${Math.round(hours)}h`

        notify('Assignment Due Soon', `${item.title}\n${body}`, nid)
        markShown(nid)
      }
    }

    // Overdue alerts
    if (prefs.deadlineAlerts) {
      for (const item of data.overdue) {
        const nid = makeId('overdue', item.id)
        if (shown.has(nid)) continue

        const hours = item.hoursOverdue || 0
        const body = item.courseName
          ? `${item.courseName} — overdue by ${Math.round(hours)}h`
          : `Overdue by ${Math.round(hours)}h`

        notify('Overdue Assignment', `${item.title}\n${body}`, nid)
        markShown(nid)
      }
    }

    // Class reminders (15 min before)
    if (prefs.classReminders) {
      for (const item of data.classes) {
        const nid = makeId('class', item.courseName || 'class', item.startTime)
        if (shown.has(nid)) continue
        if ((item.minutesUntil || 999) > 20) continue

        const body = item.location
          ? `Starts at ${item.startTime} in ${item.location}`
          : `Starts at ${item.startTime}`

        notify('Class Starting Soon', `${item.courseName}\n${body}`, nid)
        markShown(nid)
      }
    }
  } catch (e) {
    console.error('Notification check failed:', e)
  }
}

export function startNotificationPolling() {
  // Check immediately
  checkAndNotify()
  // Then every 5 minutes
  const interval = setInterval(checkAndNotify, 5 * 60 * 1000)
  return () => clearInterval(interval)
}

export function clearShownNotifications() {
  localStorage.removeItem(SHOWN_KEY)
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return Promise.resolve('denied')
  return Notification.requestPermission()
}
