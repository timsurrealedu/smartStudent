import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export default function Kanban() {
  const [boards, setBoards] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBoardForm, setShowBoardForm] = useState(false)
  const [newCardColumn, setNewCardColumn] = useState<string | null>(null)
  const [cardForm, setCardForm] = useState({ title: '', description: '' })
  const [boardForm, setBoardForm] = useState({ name: '', courseId: '' })

  const load = () => {
    setLoading(true)
    Promise.all([api.getKanbanBoards(), api.getCourses()])
      .then(([b, c]) => { setBoards(b); setCourses(c); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createKanbanBoard({
      name: boardForm.name,
      courseId: boardForm.courseId || undefined
    })
    setShowBoardForm(false)
    setBoardForm({ name: '', courseId: '' })
    load()
  }

  const createCard = async (e: React.FormEvent, columnId: string) => {
    e.preventDefault()
    await api.createKanbanCard({ columnId, title: cardForm.title, description: cardForm.description })
    setNewCardColumn(null)
    setCardForm({ title: '', description: '' })
    load()
  }

  const deleteBoard = async (id: string) => {
    if (!confirm('Delete this board?')) return
    await api.deleteKanbanBoard(id)
    load()
  }

  if (loading) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading boards...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kanban Boards</h2>
        <button onClick={() => setShowBoardForm(!showBoardForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Board
        </button>
      </div>

      {showBoardForm && (
        <form onSubmit={createBoard} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-w-md">
          <input required placeholder="Board Name" className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg" value={boardForm.name} onChange={e => setBoardForm({ ...boardForm, name: e.target.value })} />
          <select className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg" value={boardForm.courseId} onChange={e => setBoardForm({ ...boardForm, courseId: e.target.value })}>
            <option value="">No Course (General)</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            <button type="button" onClick={() => setShowBoardForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {boards.map(board => (
          <div key={board.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{board.name}</h3>
                {board.course && <div className="text-sm text-slate-500 dark:text-slate-400">{board.course.name}</div>}
              </div>
              <button onClick={() => deleteBoard(board.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {board.columns.map((col: any) => (
                <div key={col.id} className="min-w-[280px] max-w-[280px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{col.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({col.cards.length})</span>
                  </div>

                  <div className="space-y-2">
                    {col.cards.map((card: any) => (
                      <div key={card.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-blue-300 transition-colors">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-slate-300 mt-0.5" />
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-100 text-sm">{card.title}</div>
                            {card.description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.description}</div>}
                          </div>
                        </div>
                      </div>
                    ))}

                    {newCardColumn === col.id ? (
                      <form onSubmit={(e) => createCard(e, col.id)} className="space-y-2">
                        <input autoFocus placeholder="Card title" className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={cardForm.title} onChange={e => setCardForm({ ...cardForm, title: e.target.value })} />
                        <textarea placeholder="Description" className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm" value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                          <button type="button" onClick={() => setNewCardColumn(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setNewCardColumn(col.id)} className="w-full py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Add card
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
