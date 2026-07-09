import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Columns,
  StickyNote,
  GraduationCap,
  Upload,
} from 'lucide-react'

const nav = [
  { path: '/', label: 'Today', icon: LayoutDashboard },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/assignments', label: 'Assignments', icon: ClipboardList },
  { path: '/grades', label: 'Grades', icon: TrendingUp },
  { path: '/kanban', label: 'Kanban', icon: Columns },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/import', label: 'Import', icon: Upload },
]

export default function Sidebar() {
  const location = useLocation()
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold">SmartStudent</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {nav.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 text-xs text-slate-500 text-center">
        Student Life Organizer Hub
      </div>
    </aside>
  )
}
