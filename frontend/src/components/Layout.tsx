import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ClipboardList, TrendingUp,
  Award, Timer, Columns, StickyNote, GraduationCap, Upload,
  X, Menu, Settings, LogOut, User,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import PWAInstallPrompt from './PWAInstallPrompt'
import { startNotificationPolling } from '../services/notifications'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/', label: 'Today', icon: LayoutDashboard },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/assignments', label: 'Assignments', icon: ClipboardList },
  { path: '/grades', label: 'Grades', icon: TrendingUp },
  { path: '/gpa', label: 'GPA', icon: Award },
  { path: '/pomodoro', label: 'Focus', icon: Timer },
  { path: '/kanban', label: 'Kanban', icon: Columns },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/import', label: 'Import', icon: Upload },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    return startNotificationPolling()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-400 shrink-0" />
          <h1 className="text-xl font-bold">SmartStudent</h1>
        </div>
        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Student Hub</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-400" />
          <span className="font-bold">SmartStudent</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-slate-300 hidden sm:inline">{user.name}</span>
          )}
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-800" aria-label="Toggle menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <nav className="relative z-50 w-64 bg-slate-900 text-white h-full flex flex-col pt-14">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            <div className="mt-auto p-4 border-t border-slate-800">
              {user && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-8 overflow-auto pt-20 lg:pt-8">
        <Outlet />
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
