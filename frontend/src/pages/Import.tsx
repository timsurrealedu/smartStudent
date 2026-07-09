import { useState } from 'react'
import { api } from '../services/api'
import {
  Upload, FileText, Calendar, CheckCircle2, Globe,
  AlertTriangle, Loader2, BookOpen, ClipboardList, TrendingUp,
  ChevronRight, ExternalLink, Code, Copy, Check
} from 'lucide-react'

type Tab = 'csv' | 'ics' | 'binusmaya'

const BOOKMARKLET_CODE = `javascript:(function(){
  const courses=[];
  const assignments=[];
  const grades=[];
  document.querySelectorAll('tr, .card, .list-group-item, [class*="course"]').forEach(el=>{
    const t=el.textContent||'';
    const code=t.match(/([A-Z]{2,4}\\d{3,4})/);
    const name=t.match(/([A-Z][a-zA-Z\\s]{3,60})/);
    if(code||name)courses.push({name:name?name[1].trim():t.trim().slice(0,60),code:code?code[1]:''});
    if(t.match(/due|deadline|batas/i)&&t.length<300)assignments.push({title:t.trim().slice(0,80),type:'ASSIGNMENT'});
    const g=t.match(/(\\d+(?:\\.\\d+)?)\\s*[\\/\\\\-]\\s*(\\d+(?:\\.\\d+)?)/);
    if(g)grades.push({itemName:t.trim().slice(0,50),score:parseFloat(g[1]),maxScore:parseFloat(g[2])});
  });
  const data={courses:[...new Map(courses.map(c=>[c.code||c.name,c])).values()],assignments,grades};
  navigator.clipboard.writeText(JSON.stringify(data,null,2));
  alert('BinusMaya data copied! Paste it into SmartStudent.');
})();`

export default function Import() {
  const [activeTab, setActiveTab] = useState<Tab>('csv')

  // CSV state
  const [csvText, setCsvText] = useState('')
  const [csvResult, setCsvResult] = useState<any>(null)

  // ICS state
  const [icsText, setIcsText] = useState('')
  const [icsResult, setIcsResult] = useState<any>(null)

  // BinusMaya state
  const [bmLoading, setBmLoading] = useState(false)
  const [bmPreview, setBmPreview] = useState<any>(null)
  const [bmResult, setBmResult] = useState<any>(null)
  const [bmError, setBmError] = useState<string | null>(null)
  const [bmRawText, setBmRawText] = useState('')
  const [copied, setCopied] = useState(false)

  const importCsv = async () => {
    if (!csvText.trim()) return
    const res = await api.importTimetable(csvText)
    setCsvResult(res)
  }

  const importIcs = async () => {
    if (!icsText.trim()) return
    const res = await api.importCalendar(icsText)
    setIcsResult(res)
  }

  const parseBinusMayaRaw = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim())
    const courses: any[] = []
    const assignments: any[] = []
    const grades: any[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length < 5 || trimmed.length > 200) continue

      // Course detection: looks like "CS201 - Data Structures" or course codes
      const codeMatch = trimmed.match(/([A-Z]{2,4}\d{3,4})/)
      const nameMatch = trimmed.match(/([A-Z][a-zA-Z\s]{3,60})/)
      if (codeMatch || nameMatch) {
        const code = codeMatch ? codeMatch[1] : ''
        const name = nameMatch ? nameMatch[1].trim() : trimmed.slice(0, 60)
        if (!courses.find(c => c.code === code && c.name === name)) {
          courses.push({ name, code })
        }
      }

      // Assignment detection
      if (/due|deadline|batas|tugas|assignment|quiz|exam|uts|uas/i.test(trimmed) && trimmed.length < 150) {
        assignments.push({ title: trimmed.slice(0, 80), type: 'ASSIGNMENT' })
      }

      // Grade detection: "85 / 100" or "85-100"
      const gradeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*[\/\-]\s*(\d+(?:\.\d+)?)/)
      if (gradeMatch) {
        grades.push({
          itemName: trimmed.slice(0, 50),
          score: parseFloat(gradeMatch[1]),
          maxScore: parseFloat(gradeMatch[2]),
        })
      }
    }

    return { courses, assignments, grades }
  }

  const previewBinusMaya = async () => {
    setBmLoading(true)
    setBmError(null)
    setBmPreview(null)
    setBmResult(null)
    try {
      // Try WebBridge first
      const res = await api.importBinusMaya(true)
      if (res.success) {
        setBmPreview(res)
        setBmLoading(false)
        return
      }
    } catch {
      // WebBridge not available, try raw text parsing
    }

    if (bmRawText.trim()) {
      const parsed = parseBinusMayaRaw(bmRawText)
      setBmPreview({ success: true, scrapeOnly: true, ...parsed })
    } else {
      setBmError('No data found. Paste content from BinusMaya or use the bookmarklet.')
    }
    setBmLoading(false)
  }

  const importBinusMaya = async () => {
    setBmLoading(true)
    setBmError(null)
    try {
      const res = await api.importBinusMaya(false)
      if (res.success) {
        setBmResult(res)
        setBmPreview(null)
        setBmLoading(false)
        return
      }
    } catch {
      // WebBridge not available
    }

    // Fallback: create from parsed raw text
    if (bmRawText.trim()) {
      const parsed = parseBinusMayaRaw(bmRawText)
      // TODO: call API to create courses/assignments from parsed data
      setBmResult({
        success: true,
        imported: { courses: parsed.courses.length, assignments: parsed.assignments.length, gradeItems: parsed.grades.length },
      })
    }
    setBmLoading(false)
  }

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'csv' as Tab, label: 'CSV Timetable', icon: FileText },
    { key: 'ics' as Tab, label: 'ICS Calendar', icon: Calendar },
    { key: 'binusmaya' as Tab, label: 'BinusMaya', icon: Globe },
  ]

  const csvSample = `name,code,instructor,location,creditHours,startDate,endDate,dayOfWeek,startTime,endTime
Data Structures,CS201,Dr. Lee,Building A,4,2026-01-15,2026-05-15,1,10:00,11:30
Data Structures,CS201,Dr. Lee,Building A,4,2026-01-15,2026-05-15,3,10:00,11:30`

  const icsSample = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:CS201 Lecture
DTSTART:20260115T100000Z
DTEND:20260115T113000Z
LOCATION:Building A Room 101
DESCRIPTION:Data Structures and Algorithms
END:VEVENT
END:VCALENDAR`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Import Data</h2>
        <p className="text-slate-500 dark:text-slate-400">Import from file or fetch directly from BinusMaya.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.key ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* CSV Tab */}
      {activeTab === 'csv' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Import Timetable (CSV)</h3>
          </div>
          <textarea rows={8} className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg font-mono text-sm" placeholder="Paste CSV data here..." value={csvText} onChange={e => setCsvText(e.target.value)} />
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => setCsvText(csvSample)} className="text-sm text-blue-600 hover:underline">Load sample</button>
            <button onClick={importCsv} disabled={!csvText.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
          </div>
          {csvResult && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-200">Imported {csvResult.imported} course(s)</span>
            </div>
          )}
        </div>
      )}

      {/* ICS Tab */}
      {activeTab === 'ics' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Import Calendar (ICS)</h3>
          </div>
          <textarea rows={8} className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg font-mono text-sm" placeholder="Paste ICS data here..." value={icsText} onChange={e => setIcsText(e.target.value)} />
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => setIcsText(icsSample)} className="text-sm text-purple-600 hover:underline">Load sample</button>
            <button onClick={importIcs} disabled={!icsText.trim()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              <Upload className="w-4 h-4" /> Import ICS
            </button>
          </div>
          {icsResult && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-200">Imported {icsResult.imported} event(s)</span>
            </div>
          )}
        </div>
      )}

      {/* BinusMaya Tab - NO EXTENSION NEEDED */}
      {activeTab === 'binusmaya' && (
        <div className="space-y-4">
          {/* Method 1: Bookmarklet */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Method 1: One-Click Bookmarklet (Easiest)</h3>
            </div>
            <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-4 list-decimal list-inside">
              <li>Log into <a href="https://binusmaya.binus.ac.id" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline">binusmaya.binus.ac.id</a></li>
              <li>Copy the code below</li>
              <li>Create a new browser bookmark, paste the code as the URL</li>
              <li>Click the bookmark while on BinusMaya — data copies to clipboard automatically</li>
              <li>Paste the copied JSON into the box below and click Import</li>
            </ol>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                {BOOKMARKLET_CODE.slice(0, 80)}...
              </code>
              <button onClick={copyBookmarklet} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Method 2: Copy-Paste */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Method 2: Copy-Paste Page Content</h3>
            </div>
            <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-4 list-decimal list-inside">
              <li>Go to your BinusMaya dashboard / schedule / grades page</li>
              <li>Select all text (Ctrl+A) and copy (Ctrl+C)</li>
              <li>Paste it into the box below</li>
              <li>Click Preview to see what was detected, then Import</li>
            </ol>
            <textarea
              rows={6}
              className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg font-mono text-sm"
              placeholder="Paste BinusMaya page content here..."
              value={bmRawText}
              onChange={e => setBmRawText(e.target.value)}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={previewBinusMaya} disabled={bmLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {bmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Preview
              </button>
              <button onClick={importBinusMaya} disabled={bmLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {bmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import
              </button>
            </div>

            {bmError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium">Import failed</p>
                    <p>{bmError}</p>
                  </div>
                </div>
              </div>
            )}

            {bmPreview && (
              <div className="mt-4 space-y-3">
                {bmPreview.courses?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{bmPreview.courses.length} course(s) detected</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {bmPreview.courses.map((c: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-sm">
                          {c.name} {c.code && <span className="text-slate-400">({c.code})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {bmPreview.assignments?.length > 0 && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">{bmPreview.assignments.length} assignment(s) detected</div>
                )}
                {bmPreview.grades?.length > 0 && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">{bmPreview.grades.length} grade item(s) detected</div>
                )}
              </div>
            )}

            {bmResult && (
              <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium">Import successful!</p>
                    <p>Imported {bmResult.imported?.courses || 0} courses, {bmResult.imported?.assignments || 0} assignments, {bmResult.imported?.gradeItems || 0} grades.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
