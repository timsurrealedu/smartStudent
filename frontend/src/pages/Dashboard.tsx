import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import {
  Clock, AlertTriangle, Lightbulb, StickyNote, GraduationCap, Plus
} from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getToday().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading your day...</div>
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
      <GraduationCap className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Welcome!</p>
      <p className="text-sm mb-4">Add your courses to get started.</p>
      <Link to="/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
        <Plus className="w-4 h-4" />
        Add Courses
      </Link>
    </div>
  )

  const { classes, upcomingDeadlines, recommendedStudyBlocks, quickNotes, stats } = data

  const hasAnyData = classes?.length > 0 || upcomingDeadlines?.length > 0 || recommendedStudyBlocks?.length > 0 || quickNotes?.length > 0

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <GraduationCap className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Welcome!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
          Your dashboard is empty. Add your courses to start tracking assignments, grades, and study time.
        </p>
        <Link to="/courses" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Your First Course
        </Link>
      </div>
    )
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const priorityColor = (p: string) => {
    if (p === 'URGENT') return 'bg-red-100 text-red-700 border-red-200'
    if (p === 'HIGH') return 'bg-orange-100 text-orange-700 border-orange-200'
    if (p === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Today</h2>
          <p className="text-slate-500 dark:text-slate-400">{new Date(data.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">Assignments</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{stats?.totalAssignments ?? 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
            <div className="text-lg font-bold text-green-600">{stats?.completedToday ?? 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">This Week</div>
            <div className="text-lg font-bold text-blue-600">{stats?.upcomingThisWeek ?? 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg Grade</div>
            <div className="text-lg font-bold text-purple-600">
              {stats?.averageGrade !== null && stats?.averageGrade !== undefined ? `${stats.averageGrade.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Today */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Today's Classes</h3>
          </div>
          {classes.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No classes scheduled today.</p>
          ) : (
            <div className="space-y-3">
              {classes.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: c.courseColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{c.courseName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{c.startTime} – {c.endTime}</div>
                    {c.location && <div className="text-xs text-slate-400 dark:text-slate-500">{c.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming Deadlines</h3>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming deadlines!</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((d: any) => (
                <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: d.courseColor || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{d.title}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{d.courseName} · {formatDate(d.dueDate)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor(d.priority)}`}>
                        {d.priority}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{Math.round(d.hoursRemaining)}h left</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Study */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Study Recommendations</h3>
          </div>
          {recommendedStudyBlocks.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No study blocks recommended right now.</p>
          ) : (
            <div className="space-y-3">
              {recommendedStudyBlocks.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {formatTime(s.startTime)} – {formatTime(s.endTime)} ({s.duration}h)
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{s.suggestedFor || 'General study'}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{s.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Notes */}
      {quickNotes && quickNotes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Notes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickNotes.map((n: any) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="font-medium text-slate-800 dark:text-slate-100 mb-1">{n.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{n.content}</div>
                {n.courseName && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">{n.courseName}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
