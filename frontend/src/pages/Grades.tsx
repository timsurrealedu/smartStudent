import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Trash2, Calculator, TrendingUp, BookOpen } from 'lucide-react'

export default function Grades() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [grades, setGrades] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [whatIf, setWhatIf] = useState<Record<string, number>>({})
  const [whatIfResult, setWhatIfResult] = useState<any>(null)
  const [form, setForm] = useState({ courseId: '', name: '', category: '', weight: 10, score: '', maxScore: 100, isFinal: false })

  useEffect(() => {
    api.getCourses().then(c => {
      setCourses(c)
      if (c.length > 0) {
        setSelectedCourse(c[0].id)
        setForm(f => ({ ...f, courseId: c[0].id }))
      }
    })
  }, [])

  useEffect(() => {
    if (selectedCourse) loadGrades(selectedCourse)
  }, [selectedCourse])

  const loadGrades = (id: string) => {
    api.getGrades(id).then(g => { setGrades(g); setWhatIfResult(null) })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createGradeItem({
      ...form,
      score: form.score === '' ? undefined : Number(form.score),
      maxScore: Number(form.maxScore),
      weight: Number(form.weight)
    })
    setShowForm(false)
    setForm({ courseId: selectedCourse, name: '', category: '', weight: 10, score: '', maxScore: 100, isFinal: false })
    loadGrades(selectedCourse)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this grade item?')) return
    await api.deleteGradeItem(id)
    loadGrades(selectedCourse)
  }

  const runWhatIf = async () => {
    const scenarios = Object.entries(whatIf)
      .filter(([_, score]) => !isNaN(score))
      .map(([itemId, hypotheticalScore]) => ({ itemId, hypotheticalScore }))
    if (scenarios.length === 0) return
    const result = await api.calculateWhatIf(selectedCourse, scenarios)
    setWhatIfResult(result)
  }

  const course = courses.find(c => c.id === selectedCourse)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Grades</h2>
        <select
          className="px-4 py-2 border dark:border-slate-700 rounded-lg"
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {grades && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Current Grade</h3>
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              {grades.summary.currentGrade !== null ? `${grades.summary.currentGrade.toFixed(1)}%` : '—'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course?.name}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Max Possible</h3>
            </div>
            <div className="text-4xl font-bold text-green-600">
              {grades.summary.maxPossibleGrade.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">If all remaining = 100%</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Min Possible</h3>
            </div>
            <div className="text-4xl font-bold text-red-600">
              {grades.summary.minPossibleGrade.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">If all remaining = 0%</div>
          </div>
        </div>
      )}

      {/* Grade Items */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Grade Items</h3>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="mb-4 grid grid-cols-6 gap-3">
            <input required placeholder="Name" className="col-span-2 px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input required placeholder="Category" className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input type="number" placeholder="Weight %" className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} />
            <input type="number" placeholder="Score" className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {grades?.items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex-1">
                <div className="font-medium text-slate-800 dark:text-slate-100">{item.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{item.category} · Weight: {item.weight}%</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  {item.score !== null ? `${item.score}/${item.maxScore}` : '—'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.score !== null ? `${((item.score / item.maxScore) * 100).toFixed(1)}%` : 'Pending'}
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Calculator */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">What-If Grade Calculator</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter hypothetical scores for pending items to see how your grade would change.</p>

        <div className="space-y-3 mb-4">
          {grades?.items.filter((i: any) => i.score === null).map((item: any) => (
            <div key={item.id} className="flex items-center gap-4">
              <span className="flex-1 text-sm">{item.name} ({item.weight}%)</span>
              <input
                type="number"
                min="0"
                max={item.maxScore}
                placeholder={`/ ${item.maxScore}`}
                className="w-24 px-3 py-1.5 border dark:border-slate-700 rounded-lg text-sm"
                value={whatIf[item.id] || ''}
                onChange={e => setWhatIf({ ...whatIf, [item.id]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>

        <button onClick={runWhatIf} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Calculate
        </button>

        {whatIfResult && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-6 mb-3">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Current</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{whatIfResult.currentGrade?.toFixed(1) || '—'}%</div>
              </div>
              <div className="text-2xl text-slate-300">→</div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Hypothetical</div>
                <div className="text-2xl font-bold text-indigo-600">{whatIfResult.hypotheticalGrade?.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Change</div>
                <div className={`text-2xl font-bold ${whatIfResult.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {whatIfResult.difference >= 0 ? '+' : ''}{whatIfResult.difference.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
