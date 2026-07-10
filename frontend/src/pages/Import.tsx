import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import {
  Upload, FileText, Calendar, CheckCircle2, Globe,
  AlertTriangle, Loader2, BookOpen, ClipboardList,
  Code, Copy, Check, Smartphone, ClipboardPaste, Share2
} from 'lucide-react'

type Tab = 'csv' | 'ics' | 'binusmaya'

const BOOKMARKLET_CODE = `javascript:(function(){
const CODE=/\\b[A-Z]{2,6}\\d{3,5}\\b/g,ASSIGN=/\\b(assignment|assign|task|tugas|quiz|exam|uts|uas|project|submission|deadline|due|batas|homework)\\b/i,GRADE=/\\b(score|grade|nilai|mark|result|final|mid|quiz|exam|uts|uas|assessment)\\b/i;
const DAYS={sunday:0,sun:0,minggu:0,monday:1,mon:1,senin:1,tuesday:2,tue:2,selasa:2,wednesday:3,wed:3,rabu:3,thursday:4,thu:4,kamis:4,friday:5,fri:5,jumat:5,"jum'at":5,saturday:6,sat:6,sabtu:6};
const clean=s=>String(s||'').replace(/\\s+/g,' ').replace(/[|•]+/g,' ').trim();
const cname=(t,c)=>clean(t).replace(c||'',' ').replace(/(odd|even)\\s*semester/ig,' ').replace(/all\\s*sessions?/ig,' ').replace(/all\\s*active\\s*class\\s*this\\s*period/ig,' ').replace(/upcoming|outdated|no upcoming class|nothing in your to do list|have a good day/ig,' ').replace(/\\b(lecture|lab|class|course|subject|session|period)\\b/ig,' ').replace(/^[\\W_]+|[\\W_]+$/g,' ').trim();
const chunks=()=>{const out=[];document.querySelectorAll('tr,[role=row],li,article,section,.card,[class*=card],[class*=course],[class*=class],[class*=schedule],[class*=assignment],[class*=task],[class*=grade],[class*=score]').forEach(e=>{const t=clean(e.innerText||e.textContent);if(t.length>=4&&t.length<=1000)out.push(t)});const l=(document.body.innerText||'').split(/\\n+/).map(clean).filter(x=>x.length>=4&&x.length<=300);for(let i=0;i<l.length;i++)out.push(l.slice(i,i+4).join(' '));return out};
const date=t=>{let m=t.match(/\\b(\\d{1,2})[\\/.-](\\d{1,2})[\\/.-](\\d{2,4})\\b/);if(m)return(m[3].length==2?'20'+m[3]:m[3])+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');m=t.match(/\\b(20\\d{2})-(\\d{1,2})-(\\d{1,2})\\b/);return m?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):null};
const time=t=>{const m=t.match(/\\b([01]?\\d|2[0-3])[:.]([0-5]\\d)\\s*(?:-|to|until|s\\/d|sd)\\s*([01]?\\d|2[0-3])[:.]([0-5]\\d)\\b/i);return m?{startTime:m[1].padStart(2,'0')+':'+m[2],endTime:m[3].padStart(2,'0')+':'+m[4]}:null};
const day=t=>{t=t.toLowerCase();for(const k in DAYS)if(new RegExp('\\\\b'+k.replace(\"'\",\"\\\\'\")+'\\\\b','i').test(t))return DAYS[k];return null};
const courses=[],seen=new Set;for(const t of chunks()){for(const m of t.matchAll(CODE)){const code=m[0],name=cname(t,code).slice(0,90),key=code.toLowerCase();if(name&&!/no upcoming|nothing in your|active class|upcomingoutdated/i.test(name)&&!seen.has(key)){seen.add(key);courses.push({code,name,classTimes:[]})}}}
const near=t=>{const code=(t.match(CODE)||[''])[0];return courses.find(c=>c.code===code)||courses.find(c=>t.toLowerCase().includes(c.name.toLowerCase()))||null};
const schedules=[],sk=new Set;for(const t of chunks()){const r=time(t),d=day(t),c=near(t);if(!r||d===null||!c)continue;const loc=clean(t).replace(CODE,' ').replace(/\\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|minggu|senin|selasa|rabu|kamis|jumat|sabtu)\\b/ig,' ').replace(/\\b([01]?\\d|2[0-3])[:.]([0-5]\\d)\\s*(?:-|to|until|s\\/d|sd)\\s*([01]?\\d|2[0-3])[:.]([0-5]\\d)\\b/ig,' ').slice(0,120),k=c.code+d+r.startTime+r.endTime+loc;if(!sk.has(k)){sk.add(k);const s={dayOfWeek:d,startTime:r.startTime,endTime:r.endTime,location:loc||undefined};c.classTimes.push(s);schedules.push({courseCode:c.code,courseName:c.name,...s})}}
const assignments=[],ak=new Set;for(const t of chunks()){if(!ASSIGN.test(t)||/nothing in your to do list|no assignment|no data/i.test(t))continue;const c=near(t),parts=t.split(/(?=Due|Deadline|Batas)|[|;]/i).map(clean).filter(Boolean),title=clean((parts.find(x=>ASSIGN.test(x))||parts[0]||t).replace(/^(\\w+\\s*)?(assignment|task|tugas|quiz|exam|deadline|due)\\s*[:.-]?\\s*/i,'')).slice(0,180),dueDate=date(t),type=/quiz/i.test(t)?'QUIZ':/exam|uts|uas/i.test(t)?'EXAM':/project/i.test(t)?'PROJECT':'ASSIGNMENT',k=(c?.code||'')+title+(dueDate||'');if(title.length>2&&!ak.has(k)){ak.add(k);assignments.push({title,description:t.slice(0,500),dueDate,type,courseCode:c?.code||'',courseName:c?.name||''})}}
const grades=[],gk=new Set;for(const t of chunks()){let m=t.match(/\\b(\\d{1,3}(?:\\.\\d+)?)\\s*\\/\\s*(\\d{1,3}(?:\\.\\d+)?)\\b/)||(GRADE.test(t)&&t.match(/\\b(\\d{1,3}(?:\\.\\d+)?)\\b/));if(!m)continue;const score=Number(m[1]),maxScore=Number(m[2]||100);if(!isFinite(score)||!isFinite(maxScore)||maxScore<=0||score>maxScore*1.5)continue;const c=near(t),itemName=clean(t).replace(CODE,' ').replace(/\\b\\d{1,3}(?:\\.\\d+)?\\s*\\/\\s*\\d{1,3}(?:\\.\\d+)?\\b/,' ').slice(0,80)||'Score',k=(c?.code||'')+itemName+score+'/'+maxScore;if(!gk.has(k)){gk.add(k);grades.push({courseCode:c?.code||'',courseName:c?.name||'',itemName,category:/quiz/i.test(itemName)?'Quiz':/exam|uts|uas/i.test(itemName)?'Exam':'General',score,maxScore,weight:10})}}
const announcements=[],nk=new Set;for(const t of chunks()){if(!/\b(announcement|pengumuman|notice|news|info)\b/i.test(t))continue;const c=near(t),title=clean(t).slice(0,140),k=(c?.code||'')+title;if(title&&!nk.has(k)){nk.add(k);announcements.push({title,content:t.slice(0,1000),courseCode:c?.code||'',courseName:c?.name||''})}}
const data={url:location.href,title:document.title,scrapedAt:new Date().toISOString(),courses,assignments,grades,schedules,announcements};
navigator.clipboard.writeText(JSON.stringify(data,null,2));alert('SmartStudent copied '+courses.length+' courses, '+assignments.length+' assignments, '+grades.length+' grades.');
})();`

export default function Import() {
  const sharedText = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('source') !== 'share') return ''
    return [params.get('title'), params.get('text'), params.get('url')]
      .filter(Boolean)
      .join('\n')
  }, [])

  const [activeTab, setActiveTab] = useState<Tab>(sharedText ? 'binusmaya' : 'csv')

  const [csvText, setCsvText] = useState('')
  const [csvResult, setCsvResult] = useState<any>(null)

  const [icsText, setIcsText] = useState('')
  const [icsResult, setIcsResult] = useState<any>(null)

  const [bmLoading, setBmLoading] = useState(false)
  const [bmPreview, setBmPreview] = useState<any>(null)
  const [bmResult, setBmResult] = useState<any>(null)
  const [bmError, setBmError] = useState<string | null>(null)
  const [bmRawText, setBmRawText] = useState('')
  const [copied, setCopied] = useState(false)
  const [showFullCode, setShowFullCode] = useState(false)
  const [pasteStatus, setPasteStatus] = useState<string | null>(sharedText ? 'Shared text received from Android.' : null)

  useEffect(() => {
    if (!sharedText) return
    setBmRawText(sharedText)
    window.history.replaceState({}, '', '/import')
  }, [sharedText])

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
    const maybeJson = text.trim()
    if (maybeJson.startsWith('{')) {
      try {
        const parsed = JSON.parse(maybeJson)
        return {
          courses: Array.isArray(parsed.courses) ? parsed.courses : [],
          assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
          grades: Array.isArray(parsed.grades) ? parsed.grades : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        }
      } catch {
        // Fall back to text parsing.
      }
    }

    const lines = text.split('\n').filter(l => l.trim())
    const courses: any[] = []
    const assignments: any[] = []
    const grades: any[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length < 5 || trimmed.length > 200) continue

      const codeMatch = trimmed.match(/([A-Z]{2,4}\d{3,4})/)
      const nameMatch = trimmed.match(/([A-Z][a-zA-Z\s]{3,60})/)
      if (codeMatch || nameMatch) {
        const code = codeMatch ? codeMatch[1] : ''
        const name = nameMatch ? nameMatch[1].trim() : trimmed.slice(0, 60)
        if (!courses.find(c => c.code === code && c.name === name)) {
          courses.push({ name, code })
        }
      }

      if (/due|deadline|batas|tugas|assignment|quiz|exam|uts|uas/i.test(trimmed) && trimmed.length < 150) {
        const dateMatch = trimmed.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/)
        assignments.push({
          title: trimmed.slice(0, 120),
          dueDate: dateMatch ? dateMatch[1] : null,
          courseCode: codeMatch ? codeMatch[1] : '',
          type: /quiz/i.test(trimmed) ? 'QUIZ' : /exam|uts|uas/i.test(trimmed) ? 'EXAM' : 'ASSIGNMENT',
        })
      }

      const gradeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*[\/\-]\s*(\d+(?:\.\d+)?)/)
      if (gradeMatch) {
        grades.push({
          itemName: trimmed.slice(0, 50),
          courseCode: codeMatch ? codeMatch[1] : '',
          score: parseFloat(gradeMatch[1]),
          maxScore: parseFloat(gradeMatch[2]),
        })
      }
    }

    return { courses, assignments, grades, schedules: [], announcements: [] }
  }

  const previewBinusMaya = async () => {
    setBmLoading(true)
    setBmError(null)
    setBmPreview(null)
    setBmResult(null)
    try {
      const res = await api.importBinusMaya(true)
      if (res.success) {
        setBmPreview(res)
        setBmLoading(false)
        return
      }
    } catch {
      // WebBridge not available
    }

    if (bmRawText.trim()) {
      const parsed = parseBinusMayaRaw(bmRawText)
      setBmPreview({ success: true, scrapeOnly: true, ...parsed })
    } else {
      setBmError('No data found. Paste content from BinusMaya or use the bookmarklet.')
    }
    setBmLoading(false)
  }

  const pasteFromClipboard = async () => {
    setPasteStatus(null)
    if (!navigator.clipboard?.readText) {
      setPasteStatus('Use long-press Paste in the text box on this browser.')
      return
    }

    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setPasteStatus('Clipboard is empty.')
        return
      }
      setBmRawText(text)
      setActiveTab('binusmaya')
      setPasteStatus('Pasted from clipboard.')
    } catch {
      setPasteStatus('Clipboard access was blocked. Long-press the box and tap Paste.')
    }
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

    if (bmRawText.trim()) {
      const parsed = parseBinusMayaRaw(bmRawText)
      try {
        const res = await api.importBinusMayaJson(parsed)
        setBmResult(res)
        setBmPreview(null)
      } catch (e: any) {
        setBmError(e.message || 'Failed to import parsed data')
      }
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

      {activeTab === 'binusmaya' && (
        <div className="space-y-4">
          {/* Android */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Android import</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Install SmartStudent, copy text from BINUSMAYA, then paste here. If your browser shows SmartStudent in the Android share sheet, share selected BINUSMAYA text directly to this app.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={pasteFromClipboard} className="flex items-center gap-2 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium">
                    <ClipboardPaste className="w-4 h-4" /> Paste from clipboard
                  </button>
                  <a href="https://binusmaya.binus.ac.id" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium">
                    <Share2 className="w-4 h-4" /> Open BINUSMAYA
                  </a>
                </div>
                {pasteStatus && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{pasteStatus}</p>}
              </div>
            </div>
          </div>

          {/* Bookmarklet */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Method 1: One-Click Bookmarklet</h3>
            </div>
            <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-4 list-decimal list-inside">
              <li>Log into <a href="https://binusmaya.binus.ac.id" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 underline">binusmaya.binus.ac.id</a></li>
              <li>Copy the code below (or click Copy)</li>
              <li>Create a new browser bookmark, paste the code as the URL</li>
              <li>Click the bookmark while on BinusMaya — data copies to clipboard</li>
              <li>Paste the JSON into the box below and click Import</li>
            </ol>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                {showFullCode ? (
                  <textarea
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400"
                    value={BOOKMARKLET_CODE}
                  />
                ) : (
                  <code className="block px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                    {BOOKMARKLET_CODE.slice(0, 80)}...
                  </code>
                )}
                <button
                  onClick={() => setShowFullCode(!showFullCode)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  {showFullCode ? 'Hide full code' : 'Show full code'}
                </button>
              </div>
              <button onClick={copyBookmarklet} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Copy-Paste */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Method 2: Copy-Paste Page Content</h3>
            </div>
            <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-4 list-decimal list-inside">
              <li>Go to your BinusMaya dashboard / schedule / grades page</li>
              <li>Copy the page text. On Android, select the useful section and tap Copy or Share to SmartStudent.</li>
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
