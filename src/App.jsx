import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Config ────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'todo',       label: 'To Do',       emoji: '📋', bg: '#EBF5FB', accent: '#2980b9' },
  { id: 'inprogress', label: 'In Progress',  emoji: '⚡', bg: '#FEF9E7', accent: '#f39c12' },
  { id: 'done',       label: 'Done',         emoji: '✅', bg: '#EAFAF1', accent: '#27ae60' },
]

const PRIO = {
  high:   { label: 'Vysoká',  color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  medium: { label: 'Střední', color: '#f59e0b', bg: '#fef9c3', border: '#fde68a' },
  low:    { label: 'Nízká',   color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
}

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onDelete, onDragStart, onDragEnd }) {
  const p = PRIO[task.priority] || PRIO.medium
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${p.color}`,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 10,
        cursor: 'grab',
        boxShadow: hovered ? '0 6px 16px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s, transform 0.1s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Source badge */}
      {task.source === 'whatsapp' && (
        <span
          title="Přidáno přes WhatsApp"
          style={{ position: 'absolute', top: 8, right: confirmDelete ? 64 : 36, fontSize: 13 }}
        >💬</span>
      )}

      {/* Delete */}
      {hovered && !confirmDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ position: 'absolute', top: 7, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
          title="Smazat"
        >×</button>
      )}
      {confirmDelete && (
        <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', gap: 4 }}>
          <button onClick={() => onDelete(task.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 5, padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Smazat</button>
          <button onClick={() => setConfirmDelete(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 5, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Zrušit</button>
        </div>
      )}

      {/* Title */}
      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 8, paddingRight: 44, lineHeight: 1.45 }}>
        {task.title}
      </div>

      {/* Priority badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: p.bg, border: `1px solid ${p.border}`,
        borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700,
        color: '#374151', marginBottom: 7,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
        {p.label}
      </span>

      {/* Date */}
      <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>🕒</span> {fmt(task.created_at)}
      </div>
    </div>
  )
}

// ── AddTaskForm ───────────────────────────────────────────────────────────────
function AddTaskForm({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  async function submit() {
    if (!title.trim()) return
    setSaving(true)
    await onAdd({ title: title.trim(), priority })
    setSaving(false)
  }

  return (
    <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>
      <div style={{ display: 'flex', gap: 10, maxWidth: 800, alignItems: 'stretch' }}>
        <input
          ref={inputRef}
          placeholder="Název úkolu… (Enter pro uložení)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
          style={{ flex: 1, border: '1.5px solid #3b82f6', borderRadius: 8, padding: '9px 13px', fontSize: 14, outline: 'none' }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 13px', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }}
        >
          <option value="high">🔴 Vysoká priorita</option>
          <option value="medium">🟡 Střední priorita</option>
          <option value="low">🟢 Nízká priorita</option>
        </select>
        <button
          onClick={submit}
          disabled={saving || !title.trim()}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: saving || !title.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: saving || !title.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}
        >
          {saving ? '…' : '+ Přidat'}
        </button>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', color: '#64748b', fontSize: 14 }}
        >✕</button>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState(null)

  // ── Load & Realtime ─────────────────────────────────────────────────────────
  useEffect(() => {
    load()
    const ch = supabase
      .channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else { setTasks(data || []); setError(null) }
    setLoading(false)
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async function addTask({ title, priority }) {
    await supabase.from('tasks').insert({ title, priority, col: 'todo', source: 'manual' })
    setShowForm(false)
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  function handleDragStart(id) { setDraggedId(id) }
  function handleDragEnd()     { setDraggedId(null); setDragOver(null) }

  async function handleDrop(colId) {
    if (draggedId) {
      const task = tasks.find(t => t.id === draggedId)
      if (task && task.col !== colId) {
        setTasks(prev => prev.map(t => t.id === draggedId ? { ...t, col: colId } : t))
        await supabase.from('tasks').update({ col: colId }).eq('id', draggedId)
      }
    }
    setDraggedId(null)
    setDragOver(null)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter)
  const countByCol = colId => tasks.filter(t => t.col === colId).length
  const totalByPrio = p => tasks.filter(t => t.priority === p).length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>📋</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: '-0.3px' }}>
              WhatsApp Kanban
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {tasks.length} úkolů · live sync
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: showForm ? '#e2e8f0' : '#25D366',
            color: showForm ? '#475569' : 'white',
            border: 'none', borderRadius: 8,
            padding: '8px 18px', cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s',
          }}
        >
          {showForm ? '✕ Zavřít' : '+ Nový úkol'}
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && <AddTaskForm onAdd={addTask} onClose={() => setShowForm(false)} />}

      {/* Error banner */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 24px', fontSize: 13, borderBottom: '1px solid #fca5a5' }}>
          ⚠️ Chyba připojení k Supabase: {error} — zkontroluj proměnné VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY
        </div>
      )}

      {/* Priority filter */}
      <div style={{ padding: '14px 24px 4px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'all',    label: '🔍 Vše',     count: tasks.length },
          { key: 'high',   label: '🔴 Vysoká',  count: totalByPrio('high') },
          { key: 'medium', label: '🟡 Střední', count: totalByPrio('medium') },
          { key: 'low',    label: '🟢 Nízká',   count: totalByPrio('low') },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: `1.5px solid ${filter === f.key ? '#3b82f6' : '#e2e8f0'}`,
              background: filter === f.key ? '#3b82f6' : 'white',
              color: filter === f.key ? 'white' : '#64748b',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {f.label}
            <span style={{
              background: filter === f.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              borderRadius: 10, padding: '1px 6px', fontSize: 11,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 18,
        padding: '16px 24px 40px',
      }}>
        {COLUMNS.map(col => {
          const colTasks = filtered
            .filter(t => t.col === col.id)
            .sort((a, b) => {
              const o = { high: 0, medium: 1, low: 2 }
              return (o[a.priority] ?? 1) - (o[b.priority] ?? 1)
            })
          const isOver = dragOver === col.id

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
              onDrop={() => handleDrop(col.id)}
              style={{
                background: isOver ? '#e0f2fe' : col.bg,
                borderRadius: 14,
                padding: 14,
                minHeight: 320,
                border: `2px solid ${isOver ? '#0ea5e9' : 'transparent'}`,
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{col.emoji}</span>
                  {col.label}
                </div>
                <span style={{
                  background: col.accent + '22', color: col.accent,
                  borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800,
                }}>
                  {countByCol(col.id)}
                </span>
              </div>

              {/* Tasks */}
              {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30, fontSize: 13 }}>
                  ⏳ Načítání…
                </div>
              ) : colTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '24px 0', fontSize: 13, fontStyle: 'italic' }}>
                  {isOver ? '👇 Pustit sem' : 'Žádné úkoly'}
                </div>
              ) : (
                colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={deleteTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}

              {/* Drop zone hint */}
              {isOver && colTasks.length > 0 && (
                <div style={{
                  border: '2px dashed #0ea5e9', borderRadius: 10,
                  padding: 14, textAlign: 'center',
                  color: '#0ea5e9', fontSize: 13, marginTop: 6,
                }}>
                  👇 Pustit sem
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingBottom: 28 }}>
        💬 Pošli úkol přes WhatsApp a automaticky se přidá · 🔄 Real-time sync přes Supabase
      </div>
    </div>
  )
}
