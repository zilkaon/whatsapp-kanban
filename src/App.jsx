import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const COLUMNS = [
  { id: 'todo', label: 'K UDĚLÁNÍ', color: '#2563EB', lightColor: '#DBEAFE', border: '#93C5FD', emoji: '📋' },
  { id: 'inprogress', label: 'PROBÍHÁ', color: '#D97706', lightColor: '#FEF3C7', border: '#FCD34D', emoji: '⚩' },
  { id: 'done', label: 'HOTOVO', color: '#059669', lightColor: '#D1FAE5', border: '#6EE7B7', emoji: '✅' },
]

const PRIORITIES = [
  { id: 'high', label: 'Vysoká', color: '#DC2626', bg: '#FEE2E2', dot: '🔴' },
  { id: 'medium', label: 'Střední', color: '#D97706', bg: '#FEF3C7', dot: '🟡' },
  { id: 'low', label: 'Nízká', color: '#6B7280', bg: '#F3F4F6', dot: '⚪' },
]

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find(p => p.id === priority) || PRIORITIES[1]
  return (
    <span style={{
      background: p.bg, color: p.color,
      borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700,
      border: `1px solid ${p.color}30`, letterSpacing: '0.3px'
    }}>
      {p.dot} {p.label}
    </span>
  )
}

function EditModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [col, setCol] = useState(task.col)

  const save = async () => {
    if (!title.trim()) return
    await supabase.from('tasks').update({ title, priority, col }).eq('id', task.id)
    onSave()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          ✏️ Upravit úkol
        </h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>NÁZEV</label>
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={2}
            autoFocus
            style={{
              width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8,
              padding: '8px 10px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
              fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = '#6366F1'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>PRIORITA</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{
              width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8,
              padding: '8px 10px', fontSize: 13, background: '#fff', outline: 'none'
            }}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.dot} {p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>SLOUPEC</label>
            <select value={col} onChange={e => setCol(e.target.value)} style={{
              width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8,
              padding: '8px 10px', fontSize: 13, background: '#fff', outline: 'none'
            }}>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={{
            flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '10px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            Uložit změny
          </button>
          <button onClick={onClose} style={{
            flex: 1, background: '#F3F4F6', color: '#374151', border: 'none',
            borderRadius: 8, padding: '10px', fontSize: 14, cursor: 'pointer'
          }}>
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onDelete, onEdit }) {
  const [hovered, setHovered] = useState(false)
  const dateStr = task.created_at
    ? new Date(task.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('taskId', String(task.id))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 10, padding: '11px 13px', marginBottom: 8,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.07)',
        border: '1px solid #E5E7EB', cursor: 'grab', transition: 'box-shadow 0.15s, transform 0.1s',
        transform: hovered ? 'translateY(-1px)' : 'none', userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, flex: 1, lineHeight: 1.5 }}>
          {task.title}
        </span>
        <div style={{
          display: 'flex', gap: 1, flexShrink: 0, opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s'
        }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', fontSize: 14, padding: '2px 5px', borderRadius: 4,
              transition: 'color 0.1s'
            }}
            title="Upravit"
            onMouseEnter={e => e.currentTarget.style.color = '#6366F1'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
          >✏️</button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', fontSize: 14, padding: '2px 5px', borderRadius: 4,
              transition: 'color 0.1s'
            }}
            title="Smazat"
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
          >🗑️</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <PriorityBadge priority={task.priority} />
        {task.source === 'whatsapp' && (
          <span style={{
            background: '#DCFCE7', color: '#16A34A', borderRadius: 20,
            padding: '2px 9px', fontSize: 11, fontWeight: 700, border: '1px solid #BBF7D030'
          }}>💬 WhatsApp</span>
        )}
      </div>
      {dateStr && (
        <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 6 }}>{dateStr}</div>
      )}
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newCol, setNewCol] = useState('todo')
  const [filterPriority, setFilterPriority] = useState('all')
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadTasks()
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await supabase.from('tasks').insert({
      title: newTitle.trim(), col: newCol, priority: newPriority, source: 'manual'
    })
    setNewTitle('')
  }

  async function deleteTask(id) {
    if (!confirm('Opravdu smazat tento úkol?')) return
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function dropTask(e, colId) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) await supabase.from('tasks').update({ col: colId }).eq('id', taskId)
    setDragOver(null)
  }

  const filtered = filterPriority === 'all' ? tasks : tasks.filter(t => t.priority === filterPriority)
  const totalCount = tasks.length

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '18px 32px', color: '#fff',
        boxShadow: '0 4px 20px rgba(102,126,234,0.35)'
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 WhatsApp Kanban
            </h1>
            <p style={{ margin: '3px 0 0', opacity: 0.75, fontSize: 13 }}>
              {totalCount} úkol{totalCount === 1 ? '' : totalCount < 5 ? 'y' : 'ů'} celkem · správa přes WhatsApp
            </p>
          </div>
          {/* Priority filter */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ opacity: 0.7, fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>FILTR:</span>
            {[
              { id: 'all', label: 'Vše' },
              ...PRIORITIES.map(p => ({ id: p.id, label: p.label }))
            ].map(opt => (
              <button key={opt.id} onClick={() => setFilterPriority(opt.id)} style={{
                background: filterPriority === opt.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                color: '#fff', border: filterPriority === opt.id ? '1.5px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.25)',
                borderRadius: 20, padding: '4px 13px', fontSize: 12, cursor: 'pointer',
                fontWeight: filterPriority === opt.id ? 700 : 400, transition: 'all 0.15s'
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add task */}
      <div style={{ maxWidth: 1140, margin: '20px auto 0', padding: '0 20px' }}>
        <form onSubmit={addTask} style={{
          background: '#fff', borderRadius: 12, padding: '14px 18px',
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB'
        }}>
          <span style={{ fontSize: 16 }}>➕</span>
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Nový úkol..."
            style={{
              flex: '1 1 220px', border: '1.5px solid #E5E7EB', borderRadius: 8,
              padding: '8px 12px', fontSize: 14, outline: 'none', transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = '#6366F1'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
          <select value={newCol} onChange={e => setNewCol(e.target.value)} style={{
            border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px',
            fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer'
          }}>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{
            border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px',
            fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer'
          }}>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.dot} {p.label} priorita</option>)}
          </select>
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(102,126,234,0.35)',
            whiteSpace: 'nowrap'
          }}>
            Přidat úkol
          </button>
        </form>
      </div>

      {/* Kanban board */}
      <div style={{
        maxWidth: 1140, margin: '18px auto 32px', padding: '0 20px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16
      }}>
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.col === col.id)
          const isDragTarget = dragOver === col.id

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
              onDrop={e => dropTask(e, col.id)}
              style={{
                borderRadius: 14, overflow: 'hidden',
                border: isDragTarget ? `2px solid ${col.color}` : '2px solid transparent',
                boxShadow: isDragTarget
                  ? `0 0 0 4px ${col.color}20, 0 4px 20px rgba(0,0,0,0.1)`
                  : '0 2px 12px rgba(0,0,0,0.07)',
                transition: 'all 0.15s', background: isDragTarget ? col.lightColor : '#F8FAFC'
              }}
            >
              {/* Column header */}
              <div style={{
                background: col.color, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 22 }}>{col.emoji}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.8px' }}>
                      {col.label}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.22)', color: '#fff',
                  borderRadius: 20, minWidth: 28, height: 28, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, padding: '0 8px'
                }}>
                  {colTasks.length}
                </div>
              </div>

              {/* Colored accent bar */}
              <div style={{ height: 4, background: col.border, opacity: 0.6 }} />

              {/* Tasks */}
              <div style={{ padding: '10px 10px 12px', minHeight: 180 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', paddingTop: 40, fontSize: 13 }}>
                    Načítám...
                  </div>
                ) : colTasks.length === 0 ? (
                  <div style={{
                    textAlign: 'center', color: '#CBD5E1', fontSize: 12,
                    padding: '28px 16px', border: `2px dashed ${col.border}`,
                    borderRadius: 8, marginTop: 4, lineHeight: 1.6
                  }}>
                    {isDragTarget ? '⬇️ Pustit sem' : 'Žádné úkoly\nPřetáhněte sem'}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDelete={deleteTask}
                      onEdit={setEditingTask}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={() => setEditingTask(null)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}
