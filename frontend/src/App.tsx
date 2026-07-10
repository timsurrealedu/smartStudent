import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Assignments from './pages/Assignments'
import Grades from './pages/Grades'
import GPA from './pages/GPA'
import Pomodoro from './pages/Pomodoro'
import Kanban from './pages/Kanban'
import Notes from './pages/Notes'
import Import from './pages/Import'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="grades" element={<Grades />} />
        <Route path="gpa" element={<GPA />} />
        <Route path="pomodoro" element={<Pomodoro />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="notes" element={<Notes />} />
        <Route path="import" element={<Import />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
