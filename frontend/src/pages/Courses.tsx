import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Trash2, BookOpen, MapPin, User, Clock } from 'lucide-react'

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', color: '#3B82F6', instructor: '', location: '', creditHours: 3,
    startDate: '', endDate: '',
    classTimes: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: '' }]
  })

  const load = () => {
    setLoading(true)
    api.getCourses().then(d => { setCourses(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createCourse(form)
    setShowForm(false)
    setForm({ name: '', code: '', color: '#3B82F6', instructor: '', location: '', creditHours: 3, startDate: '', endDate: '', classTimes: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: '' }] })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this course?')) return
    await api.deleteCourse(id)
    load()
  }

  const dayName = (d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]

  if (loading) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading courses...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Courses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Course Name" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Course Code" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <input placeholder="Instructor" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
            <input placeholder="Location" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <input type="color" className="px-2 py-2 border dark:border-slate-700 rounded-lg h-10" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
            <input type="number" placeholder="Credit Hours" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.creditHours} onChange={e => setForm({ ...form, creditHours: Number(e.target.value) })} />
            <input type="date" required className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <input type="date" required className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: c.color }}>
                  {c.code ? c.code.slice(0, 2) : c.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</h3>
                  {c.code && <div className="text-sm text-slate-500 dark:text-slate-400">{c.code}</div>}
                </div>
              </div>
              <button onClick={() => remove(c.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
              {c.instructor && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {c.instructor}</div>}
              {c.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {c.location}</div>}
              <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> {c.creditHours} credits · {c._count.assignments} assignments</div>
            </div>
            {c.classTimes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.classTimes.map((ct: any) => (
                  <span key={ct.id} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {dayName(ct.dayOfWeek)} {ct.startTime}-{ct.endTime}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
