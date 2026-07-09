import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
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

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
