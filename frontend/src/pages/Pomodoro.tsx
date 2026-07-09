import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, BookOpen, CheckCircle2, Clock } from 'lucide-react'

const POMODORO_MINUTES = 25
const SHORT_BREAK_MINUTES = 5
const LONG_BREAK_MINUTES = 15

interface Session {
  id: string
  type: 'work' | 'shortBreak' | 'longBreak'
  startedAt: string
  duration: number // seconds actually completed
  assignmentId?: string
  assignmentTitle?: string
}

export default function Pomodoro() {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work')
  const [timeLeft, setTimeLeft] = useState(POMODORO_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState<Session[]>(() => {
    const stored = localStorage.getItem('smartstudent-pomodoro')
    return stored ? JSON.parse(stored) : []
  })
  const [completedToday, setCompletedToday] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const modeConfig = {
    work: { minutes: POMODORO_MINUTES, label: 'Focus', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600', ring: 'stroke-blue-500' },
    shortBreak: { minutes: SHORT_BREAK_MINUTES, label: 'Short Break', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-600', ring: 'stroke-green-500' },
    longBreak: { minutes: LONG_BREAK_MINUTES, label: 'Long Break', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-600', ring: 'stroke-purple-500' },
  }

  const config = modeConfig[mode]
  const totalTime = config.minutes * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  useEffect(() => {
    localStorage.setItem('smartstudent-pomodoro', JSON.stringify(sessions))
    const today = new Date().toDateString()
    const todayCount = sessions.filter(s => s.type === 'work' && new Date(s.startedAt).toDateString() === today).length
    setCompletedToday(todayCount)
  }, [sessions])

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - (totalTime - timeLeft) * 1000
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const remaining = totalTime - elapsed
        if (remaining <= 0) {
          setTimeLeft(0)
          setIsRunning(false)
          completeSession()
          if (timerRef.current) clearInterval(timerRef.current)
        } else {
          setTimeLeft(remaining)
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, totalTime])

  const completeSession = useCallback(() => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      type: mode,
      startedAt: new Date(Date.now() - totalTime * 1000).toISOString(),
      duration: totalTime,
    }
    setSessions(prev => [...prev, newSession])

    // Auto-switch mode
    if (mode === 'work') {
      const workCount = sessions.filter(s => s.type === 'work' && new Date(s.startedAt).toDateString() === new Date().toDateString()).length + 1
      if (workCount % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK_MINUTES * 60)
      } else {
        setMode('shortBreak')
        setTimeLeft(SHORT_BREAK_MINUTES * 60)
      }
    } else {
      setMode('work')
      setTimeLeft(POMODORO_MINUTES * 60)
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SmartStudent', {
        body: mode === 'work' ? 'Focus session complete! Take a break.' : 'Break over! Ready to focus?',
        icon: '/icon-192x192.png',
      })
    }
  }, [mode, sessions, totalTime])

  const toggleTimer = () => setIsRunning(!isRunning)

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(config.minutes * 60)
  }

  const switchMode = (m: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false)
    setMode(m)
    setTimeLeft(modeConfig[m].minutes * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Today's sessions
  const todaySessions = sessions.filter(s => new Date(s.startedAt).toDateString() === new Date().toDateString())
  const totalFocusMinutes = todaySessions
    .filter(s => s.type === 'work')
    .reduce((sum, s) => sum + (s.duration / 60), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pomodoro Timer</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          {/* Mode Switcher */}
          <div className="flex justify-center gap-2 mb-8">
            {(['work', 'shortBreak', 'longBreak'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-slate-800 dark:bg-slate-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* Circular Timer */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <svg width="280" height="280" className="transform -rotate-90">
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="8"
                />
                <circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  className={config.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-6xl font-bold ${config.color} font-mono`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">{config.label}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-medium transition-all ${config.bg} hover:opacity-90 active:scale-95`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Reset
            </button>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Today's Focus</h3>
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              {Math.round(totalFocusMinutes)}<span className="text-lg text-slate-400">min</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {completedToday} pomodoro{completedToday !== 1 ? 's' : ''} completed
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Session History</h3>
            </div>
            {todaySessions.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No sessions today yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...todaySessions].reverse().map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    {s.type === 'work' ? (
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Coffee className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-slate-700 dark:text-slate-200">
                      {s.type === 'work' ? 'Focus' : s.type === 'shortBreak' ? 'Short break' : 'Long break'}
                    </span>
                    <span className="text-slate-400 text-xs ml-auto">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
