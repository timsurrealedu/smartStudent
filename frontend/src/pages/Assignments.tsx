import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, CheckCircle2, Circle, Clock, Trash2, Filter } from 'lucide-react'

const typeOptions = ['ASSIGNMENT', 'QUIZ', 'EXAM', 'PROJECT', 'PAPER', 'READING', 'LAB', 'PRESENTATION', 'OTHER']
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

export default function Assignments() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    courseId: '', title: '', description: '', dueDate: '',
    type: 'ASSIGNMENT', priority: 'MEDIUM', estimatedMinutes: 120
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getAssignments(filter ? `?${filter}` : ''),
      api.getCourses()
    ]).then(([a, c]) => { setAssignments(a); setCourses(c); setLoading(false) })
  }

  useEffect(() => { load() }, [filter])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createAssignment(form)
    setShowForm(false)
    setForm({ courseId: '', title: '', description: '', dueDate: '', type: 'ASSIGNMENT', priority: 'MEDIUM', estimatedMinutes: 120 })
    load()
  }

  const toggleStatus = async (a: any) => {
    const newStatus = a.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    await api.updateAssignment(a.id, { status: newStatus, completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this assignment?')) return
    await api.deleteAssignment(id)
    load()
  }

  const priorityColor = (p: string) => {
    if (p === 'URGENT') return 'bg-red-100 text-red-700'
    if (p === 'HIGH') return 'bg-orange-100 text-orange-700'
    if (p === 'MEDIUM') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  if (loading) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading assignments...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assignments</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <select className="px-3 py-1.5 border dark:border-slate-700 rounded-lg text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="status=PENDING">Pending</option>
          <option value="status=IN_PROGRESS">In Progress</option>
          <option value="status=COMPLETED">Completed</option>
          <option value="upcoming=true">Upcoming</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Title" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
              <option value="">No Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="datetime-local" required className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            <input type="number" placeholder="Est. minutes" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} />
            <select className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <textarea placeholder="Description" className="col-span-2 px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {assignments.map(a => {
          const isDone = a.status === 'COMPLETED'
          const overdue = a.status !== 'COMPLETED' && new Date(a.dueDate) < new Date()
          return (
            <div key={a.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 flex items-center gap-4 ${overdue ? 'border-red-300 bg-red-50' : 'border-slate-200 dark:border-slate-700'}`}>
              <button onClick={() => toggleStatus(a)} className={isDone ? 'text-green-500' : 'text-slate-300 hover:text-green-500'}>
                {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{a.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  {a.course && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.course.color }} /> {a.course.name}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.dueDate).toLocaleString()}</span>
                  {a.estimatedMinutes && <span>{a.estimatedMinutes} min</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(a.priority)}`}>{a.priority}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:text-slate-300">{a.type}</span>
              <button onClick={() => remove(a.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
