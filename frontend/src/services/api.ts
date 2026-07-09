const API_BASE = '/api'

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  getToday: () => fetchJson<any>('/today'),
  getCourses: () => fetchJson<any[]>('/courses'),
  getCourse: (id: string) => fetchJson<any>(`/courses/${id}`),
  createCourse: (data: any) => fetchJson<any>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => fetchJson<any>(`/courses/${id}`, { method: 'DELETE' }),

  getAssignments: (params?: string) => fetchJson<any[]>(`/assignments${params || ''}`),
  createAssignment: (data: any) => fetchJson<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: string, data: any) => fetchJson<any>(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id: string) => fetchJson<any>(`/assignments/${id}`, { method: 'DELETE' }),

  getEvents: (params?: string) => fetchJson<any[]>(`/events${params || ''}`),
  createEvent: (data: any) => fetchJson<any>('/events', { method: 'POST', body: JSON.stringify(data) }),

  getGrades: (courseId: string) => fetchJson<any>(`/courses/${courseId}/grades`),
  createGradeItem: (data: any) => fetchJson<any>('/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGradeItem: (id: string, data: any) => fetchJson<any>(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGradeItem: (id: string) => fetchJson<any>(`/grades/${id}`, { method: 'DELETE' }),
  calculateWhatIf: (courseId: string, scenarios: any[]) =>
    fetchJson<any>(`/courses/${courseId}/what-if`, { method: 'POST', body: JSON.stringify({ scenarios }) }),

  getKanbanBoards: (courseId?: string) => fetchJson<any[]>(`/kanban${courseId ? `?courseId=${courseId}` : ''}`),
  createKanbanBoard: (data: any) => fetchJson<any>('/kanban', { method: 'POST', body: JSON.stringify(data) }),
  createKanbanCard: (data: any) => fetchJson<any>('/kanban/cards', { method: 'POST', body: JSON.stringify(data) }),
  moveKanbanCard: (data: any) => fetchJson<any>('/kanban/cards/move', { method: 'PUT', body: JSON.stringify(data) }),
  deleteKanbanBoard: (id: string) => fetchJson<any>(`/kanban/${id}`, { method: 'DELETE' }),

  getNotes: (courseId?: string) => fetchJson<any[]>(`/notes${courseId ? `?courseId=${courseId}` : ''}`),
  createNote: (data: any) => fetchJson<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: any) => fetchJson<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: string) => fetchJson<any>(`/notes/${id}`, { method: 'DELETE' }),

  getStudyRoadmap: (courseId: string) => fetchJson<any>(`/courses/${courseId}/roadmap`),
  importTimetable: (csvData: string) => fetchJson<any>('/import/timetable', { method: 'POST', body: JSON.stringify({ csvData }) }),
  importCalendar: (icsData: string) => fetchJson<any>('/import/calendar', { method: 'POST', body: JSON.stringify({ icsData }) }),
  importBinusMaya: (scrapeOnly?: boolean) => fetchJson<any>(`/import/binusmaya${scrapeOnly ? '?scrapeOnly=true' : ''}`, { method: 'POST' }),
  getNotifications: () => fetchJson<any>('/notifications'),
}
