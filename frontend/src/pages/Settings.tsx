import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Monitor, Bell, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface NotificationPrefs {
  enabled: boolean
  assignmentReminders: boolean
  deadlineAlerts: boolean
  classReminders: boolean
  dailyDigest: boolean
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [perms, setPerms] = useState<NotificationPermission>('default')
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    enabled: false,
    assignmentReminders: true,
    deadlineAlerts: true,
    classReminders: false,
    dailyDigest: false,
  })

  useEffect(() => {
    if ('Notification' in window) {
      setPerms(Notification.permission)
      const stored = localStorage.getItem('smartstudent-notifications')
      if (stored) {
        try { setPrefs(JSON.parse(stored)) } catch {}
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported on this browser.')
      return
    }
    const result = await Notification.requestPermission()
    setPerms(result)
    if (result === 'granted') {
      setPrefs(p => ({ ...p, enabled: true }))
      savePrefs({ ...prefs, enabled: true })
      // Send a test notification
      new Notification('SmartStudent', {
        body: 'Notifications are now enabled!',
        icon: '/icon-192x192.png',
      })
    }
  }

  const savePrefs = (newPrefs: NotificationPrefs) => {
    setPrefs(newPrefs)
    localStorage.setItem('smartstudent-notifications', JSON.stringify(newPrefs))
  }

  const togglePref = (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    savePrefs(updated)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>

      {/* Appearance */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Appearance</h3>
        </div>
        <div className="flex gap-2">
          {([
            { key: 'light', label: 'Light', icon: Sun },
            { key: 'dark', label: 'Dark', icon: Moon },
            { key: 'system', label: 'System', icon: Monitor },
          ] as const).map((t) => {
            const Icon = t.icon
            const active = theme === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
        </div>

        {/* Permission status */}
        <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {perms === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : perms === 'denied' ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {perms === 'granted' ? 'Notifications enabled' : perms === 'denied' ? 'Notifications blocked' : 'Notifications not enabled'}
              </span>
            </div>
            {perms !== 'granted' && (
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Enable
              </button>
            )}
          </div>
          {perms === 'denied' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              You have blocked notifications. Please enable them in your browser settings.
            </p>
          )}
        </div>

        {/* Notification toggles */}
        <div className="space-y-3">
          {[
            { key: 'assignmentReminders', label: 'Assignment reminders', desc: 'Get notified when assignments are due within 24 hours' },
            { key: 'deadlineAlerts', label: 'Deadline alerts', desc: 'Urgent notifications for overdue assignments' },
            { key: 'classReminders', label: 'Class reminders', desc: 'Remind 15 minutes before classes start' },
            { key: 'dailyDigest', label: 'Daily digest', desc: 'Morning summary of today\'s schedule and tasks' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
              </div>
              <button
                onClick={() => togglePref(item.key as keyof NotificationPrefs)}
                disabled={perms !== 'granted'}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prefs[item.key as keyof NotificationPrefs] && perms === 'granted'
                    ? 'bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    prefs[item.key as keyof NotificationPrefs] && perms === 'granted' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">About</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
          <p>SmartStudent Hub v1.0</p>
          <p>Student Life Organizer — courses, assignments, grades, and study planner.</p>
          <p>PWA with offline support.</p>
        </div>
      </div>
    </div>
  )
}
