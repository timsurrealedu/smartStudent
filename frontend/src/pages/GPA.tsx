import { useState, useEffect } from 'react'
import { Calculator, Target, Plus, Trash2, TrendingUp, Award } from 'lucide-react'

// Standard 4.0 scale
const GRADE_POINTS: Record<string, number> = {
  'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
}

interface GPACourse {
  id: string
  name: string
  credits: number
  grade: string
}

export default function GPA() {
  const [courses, setCourses] = useState<GPACourse[]>(() => {
    const stored = localStorage.getItem('smartstudent-gpa')
    return stored ? JSON.parse(stored) : []
  })
  const [targetGPA, setTargetGPA] = useState(3.5)
  const [remainingCredits, setRemainingCredits] = useState(60)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', credits: 3, grade: 'B' })

  useEffect(() => {
    localStorage.setItem('smartstudent-gpa', JSON.stringify(courses))
  }, [courses])

  const addCourse = () => {
    if (!form.name) return
    setCourses([...courses, { id: crypto.randomUUID(), name: form.name, credits: form.credits, grade: form.grade }])
    setForm({ name: '', credits: 3, grade: 'B' })
    setShowForm(false)
  }

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id))
  }

  const updateCourse = (id: string, field: keyof GPACourse, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const calcGPA = (list: GPACourse[]) => {
    let totalPoints = 0
    let totalCredits = 0
    for (const c of list) {
      const gp = GRADE_POINTS[c.grade] || 0
      totalPoints += gp * c.credits
      totalCredits += c.credits
    }
    return totalCredits > 0 ? totalPoints / totalCredits : 0
  }

  const currentGPA = calcGPA(courses)
  const currentCredits = courses.reduce((sum, c) => sum + c.credits, 0)

  // What GPA needed on remaining credits to hit target
  const neededGPA = currentCredits + remainingCredits > 0
    ? ((targetGPA * (currentCredits + remainingCredits)) - (currentGPA * currentCredits)) / remainingCredits
    : 0

  const gradeDistribution = () => {
    const counts: Record<string, number> = {}
    for (const c of courses) {
      counts[c.grade] = (counts[c.grade] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => (GRADE_POINTS[b[0]] || 0) - (GRADE_POINTS[a[0]] || 0))
  }

  const gradeOptions = Object.keys(GRADE_POINTS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">GPA Calculator</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Current GPA</span>
          </div>
          <div className={`text-4xl font-bold ${currentGPA >= 3.5 ? 'text-green-600 dark:text-green-400' : currentGPA >= 2.5 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {currentGPA.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentCredits} credits</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Target GPA</span>
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="4"
            value={targetGPA}
            onChange={e => setTargetGPA(Number(e.target.value))}
            className="text-3xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none w-24"
          />
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Need {neededGPA > 4 ? 'impossible' : neededGPA > 0 ? neededGPA.toFixed(2) : '0.00'} on remaining {remainingCredits}cr
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Grade Distribution</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gradeDistribution().map(([grade, count]) => (
              <span key={grade} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {grade}: {count}
              </span>
            ))}
            {courses.length === 0 && <span className="text-xs text-slate-400">No courses yet</span>}
          </div>
        </div>
      </div>

      {/* Add Course Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Course name"
              className="px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Credits"
              className="px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              value={form.credits}
              onChange={e => setForm({ ...form, credits: Number(e.target.value) })}
            />
            <select
              className="px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              value={form.grade}
              onChange={e => setForm({ ...form, grade: e.target.value })}
            >
              {gradeOptions.map(g => <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={addCourse} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Courses</h3>
        </div>

        {courses.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Add courses to calculate your GPA.</p>
        ) : (
          <div className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                <input
                  className="flex-1 px-3 py-1.5 bg-transparent border rounded dark:border-slate-600 dark:text-slate-100 text-sm"
                  value={c.name}
                  onChange={e => updateCourse(c.id, 'name', e.target.value)}
                />
                <input
                  type="number"
                  className="w-20 px-3 py-1.5 bg-transparent border rounded dark:border-slate-600 dark:text-slate-100 text-sm"
                  value={c.credits}
                  onChange={e => updateCourse(c.id, 'credits', Number(e.target.value))}
                />
                <select
                  className="px-3 py-1.5 bg-transparent border rounded dark:border-slate-600 dark:text-slate-100 text-sm"
                  value={c.grade}
                  onChange={e => updateCourse(c.id, 'grade', e.target.value)}
                >
                  {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <span className="text-sm font-mono w-12 text-right text-slate-500 dark:text-slate-400">
                  {(GRADE_POINTS[c.grade] * c.credits).toFixed(1)}pts
                </span>
                <button onClick={() => removeCourse(c.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target Calculator */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Target GPA Simulator</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Current GPA</label>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentGPA.toFixed(2)}</div>
          </div>
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Remaining Credits</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              value={remainingCredits}
              onChange={e => setRemainingCredits(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Required GPA on Remaining</label>
            <div className={`text-2xl font-bold ${neededGPA > 4 ? 'text-red-600 dark:text-red-400' : neededGPA > 3 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
              {neededGPA > 4 ? 'Impossible' : neededGPA.toFixed(2)}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          To reach a {targetGPA.toFixed(1)} GPA, you need to average {neededGPA > 4 ? '—' : neededGPA.toFixed(2)} across your remaining {remainingCredits} credits.
        </p>
      </div>
    </div>
  )
}

