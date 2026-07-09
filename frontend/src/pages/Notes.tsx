import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Trash2, Save, X, Tag } from 'lucide-react'

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ courseId: '', title: '', content: '', tags: '' })

  const load = () => {
    setLoading(true)
    Promise.all([api.getNotes(), api.getCourses()])
      .then(([n, c]) => { setNotes(n); setCourses(c); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await api.createNote({
      courseId: form.courseId || undefined,
      title: form.title,
      content: form.content,
      tags: tags.length > 0 ? tags : undefined
    })
    setShowForm(false)
    setForm({ courseId: '', title: '', content: '', tags: '' })
    load()
  }

  const saveEdit = async (id: string) => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await api.updateNote(id, {
      title: form.title,
      content: form.content,
      tags: tags.length > 0 ? tags : undefined
    })
    setEditing(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return
    await api.deleteNote(id)
    load()
  }

  if (loading) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading notes...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notes</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Title" className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
              <option value="">No Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <textarea required placeholder="Content" rows={6} className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          <input placeholder="Tags (comma separated)" className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <div key={note.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            {editing === note.id ? (
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <textarea rows={4} className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                <input className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(note.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{note.title}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(note.id); setForm({ courseId: note.courseId || '', title: note.title, content: note.content, tags: note.tags ? JSON.parse(note.tags).join(', ') : '' }) }} className="text-slate-400 dark:text-slate-500 hover:text-blue-500"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(note.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6">{note.content}</div>
                {note.course && <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">{note.course.name}</div>}
                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {JSON.parse(note.tags).map((tag: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
