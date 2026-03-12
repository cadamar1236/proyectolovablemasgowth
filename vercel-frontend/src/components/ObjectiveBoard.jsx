import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS = {
  todo:    { label: 'To Do',      color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', dot: 'bg-gray-400' },
  doing:   { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',  dot: 'bg-blue-400' },
  done:    { label: 'Done',        color: 'bg-green-500/20 text-green-300 border-green-500/30', dot: 'bg-green-400' },
  blocked: { label: 'Blocked',     color: 'bg-red-500/20 text-red-300 border-red-500/30',    dot: 'bg-red-400' },
};

const PRIORITY = {
  high:   { label: '🔴 High',   cls: 'text-red-400' },
  medium: { label: '🟡 Med',    cls: 'text-yellow-400' },
  low:    { label: '🟢 Low',    cls: 'text-green-400' },
};

const AREAS = ['Product', 'Growth', 'Fundraising', 'Team', 'Legal', 'Finance', 'Marketing', 'Other'];
const EMOJIS = ['🎯','📦','🚀','💰','📊','🔗','💬','🤝','🏗','📣','🔬','📝'];

function uid() { return Math.random().toString(36).slice(2); }

// ─── Individual task card ────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS[task.status] || STATUS.todo;

  return (
    <div
      className={`group rounded-xl border transition-all ${
        task.status === 'done'
          ? 'border-white/5 bg-white/3 opacity-60'
          : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-purple-500/30'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* checkbox */}
        <button
          onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
          className={`w-5 h-5 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center transition ${
            task.status === 'done'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-white/20 hover:border-purple-400'
          }`}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.emoji || '🎯'} {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* status badge */}
            <span className={`text-[10px] border rounded-full px-2 py-0.5 ${s.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} inline-block mr-1`} />
              {s.label}
            </span>
            {/* priority */}
            {task.priority && (
              <span className={`text-[10px] ${PRIORITY[task.priority]?.cls}`}>
                {PRIORITY[task.priority]?.label}
              </span>
            )}
            {/* area */}
            {task.area && (
              <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                {task.area}
              </span>
            )}
            {/* due date */}
            {task.due && (
              <span className="text-[10px] text-gray-400">
                📅 {task.due}
              </span>
            )}
            {/* ai badge */}
            {task.fromAI && (
              <span className="text-[10px] text-pink-300 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5">
                ⚡ Astro
              </span>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 text-gray-400 hover:text-white text-xs flex items-center justify-center rounded"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 text-gray-500 hover:text-red-400 text-xs flex items-center justify-center rounded"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      {/* expanded editor */}
      {expanded && (
        <TaskEditor task={task} onUpdate={onUpdate} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
};

// ─── Inline editor ────────────────────────────────────────────────────────────
const TaskEditor = ({ task, onUpdate, onClose }) => {
  const [form, setForm] = useState({ ...task });

  const save = () => {
    onUpdate(task.id, form);
    onClose();
  };

  return (
    <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-2">
      <input
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Title"
      />
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 resize-none"
        rows={2}
        value={form.description || ''}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
      />
      <div className="flex gap-2 flex-wrap">
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
        >
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
          value={form.priority || 'medium'}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
        >
          {Object.entries(PRIORITY).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
          value={form.area || ''}
          onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
        >
          <option value="">Area…</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          type="date"
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none"
          value={form.due || ''}
          onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
        />
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
          value={form.emoji || '🎯'}
          onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
        >
          {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition">
          Save
        </button>
        <button onClick={onClose} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition">
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Quick add form ──────────────────────────────────────────────────────────
const QuickAdd = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: uid(),
      title: title.trim(),
      area,
      status: 'todo',
      priority: 'medium',
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      fromAI: false,
      createdAt: Date.now(),
    });
    setTitle('');
    setArea('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-white/15 hover:border-purple-500/40 text-gray-500 hover:text-gray-300 text-sm transition"
      >
        <span className="text-lg">＋</span> Add task
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-white/5 p-3 space-y-2">
      <input
        autoFocus
        className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-white outline-none placeholder-gray-500 focus:border-purple-500/50"
        placeholder="Task title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
      />
      <div className="flex items-center gap-2">
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none flex-1"
          value={area}
          onChange={e => setArea(e.target.value)}
        >
          <option value="">Area…</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={submit} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition">Add</button>
        <button onClick={() => setOpen(false)} className="px-3 py-1 bg-white/5 text-gray-400 text-xs rounded-lg transition">✕</button>
      </div>
    </div>
  );
};

// ─── Main board ──────────────────────────────────────────────────────────────
export default function ObjectiveBoard({ aiTasks = [] }) {
  const isGuest = localStorage.getItem('guestMode') === 'true';

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('startupTasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Persist locally
  useEffect(() => {
    localStorage.setItem('startupTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync AI-generated tasks from chat
  useEffect(() => {
    if (!aiTasks.length) return;
    setTasks(prev => {
      const newTasks = aiTasks
        .filter(t => !prev.some(p => p.title.toLowerCase() === t.toLowerCase()))
        .map(title => ({
          id: uid(),
          title,
          status: 'todo',
          priority: 'high',
          emoji: '⚡',
          fromAI: true,
          area: '',
          createdAt: Date.now(),
        }));
      return newTasks.length ? [...newTasks, ...prev] : prev;
    });
  }, [aiTasks]);

  // Try to sync with backend
  useEffect(() => {
    if (isGuest) return;
    api.get('/goals').then(res => {
      const backendGoals = (res.data.goals || []).map(g => ({
        id: g.id || uid(),
        title: g.title,
        description: g.description,
        status: g.status === 'completed' ? 'done' : g.status === 'in_progress' ? 'doing' : 'todo',
        priority: g.priority || 'medium',
        emoji: g.emoji || '🎯',
        area: g.category || '',
        due: g.due_date,
        fromAI: false,
        createdAt: Date.now(),
      }));
      if (backendGoals.length) {
        setTasks(prev => {
          const ids = new Set(prev.map(t => t.id));
          return [...prev, ...backendGoals.filter(g => !ids.has(g.id))];
        });
      }
    }).catch(() => {});
  }, [isGuest]);

  const addTask = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = Object.fromEntries(
    Object.keys(STATUS).map(s => [s, tasks.filter(t => t.status === s).length])
  );
  const doneCount = counts.done || 0;
  const total = tasks.length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-white">Startup OS</h2>
            <p className="text-xs text-gray-400">{total} tasks · {doneCount} done</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs transition ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2 py-1 rounded text-xs transition ${viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              ⊞ Board
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Overall progress</span>
              <span className="text-purple-300 font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none placeholder-gray-500 focus:border-purple-500/50"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {[['all', 'All', total], ...Object.entries(STATUS).map(([k, v]) => [k, v.label, counts[k] || 0])].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition ${
                filter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {label} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {viewMode === 'list' ? (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No tasks yet.</p>
                <p className="text-xs mt-1">Ask Astro to help you create a plan!</p>
              </div>
            ) : (
              filtered
                .sort((a, b) => {
                  const pri = { high: 0, medium: 1, low: 2 };
                  const sta = { doing: 0, todo: 1, blocked: 2, done: 3 };
                  return (sta[a.status] - sta[b.status]) || (pri[a.priority] - pri[b.priority]);
                })
                .map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                ))
            )}
          </>
        ) : (
          /* Kanban board */
          <div className="flex gap-3 h-full overflow-x-auto pb-2">
            {Object.entries(STATUS).map(([status, conf]) => (
              <div key={status} className="min-w-[200px] flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                  <span className="text-xs font-medium text-gray-300">{conf.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">{counts[status] || 0}</span>
                </div>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === status).map(task => (
                    <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick add */}
      <div className="px-3 pb-3">
        <QuickAdd onAdd={addTask} />
      </div>
    </div>
  );
}
