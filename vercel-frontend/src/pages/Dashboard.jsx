import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AstroChat from '../components/AstroChat';
import ObjectiveBoard from '../components/ObjectiveBoard';

// ─── sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { id: 'os',        icon: '🚀', label: 'Startup OS'   },
  { id: 'traction',  icon: '📈', label: 'Traction'     },
  { id: 'team',      icon: '👥', label: 'Team'         },
  { id: 'investors', icon: '💰', label: 'Investors'    },
  { id: 'crm',       icon: '🤖', label: 'CRM'          },
  { id: 'docs',      icon: '📝', label: 'Docs'         },
];

// ─── Traction panel ───────────────────────────────────────────────────────────
const TractionPanel = ({ userData }) => {
  const [metrics, setMetrics] = useState({
    users: 0, revenue: 0, growth: 0, nps: 0, sessions: 0, churn: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const isGuest = localStorage.getItem('guestMode') === 'true';

  useEffect(() => {
    if (isGuest) {
      setMetrics({ users: 47, revenue: 1240, growth: 23, nps: 72, sessions: 312, churn: 4 });
      setWeeklyData([
        { week: 'W1', users: 20, revenue: 400 },
        { week: 'W2', users: 30, revenue: 700 },
        { week: 'W3', users: 38, revenue: 950 },
        { week: 'W4', users: 47, revenue: 1240 },
      ]);
      return;
    }
    api.get('/user-metrics').then(r => {
      const m = r.data?.metrics || {};
      setMetrics({
        users: m.total_users || 0,
        revenue: m.monthly_revenue || 0,
        growth: m.weekly_growth || 0,
        nps: m.nps_score || 0,
        sessions: m.weekly_sessions || 0,
        churn: m.churn_rate || 0,
      });
    }).catch(() => {});
  }, [isGuest]);

  const CARDS = [
    { key: 'users',    label: 'Users',       emoji: '👤', color: 'from-purple-600/20 to-purple-800/20', border: 'border-purple-500/30', fmt: v => v.toLocaleString() },
    { key: 'revenue',  label: 'MRR ($)',     emoji: '💰', color: 'from-green-600/20 to-green-800/20',   border: 'border-green-500/30',  fmt: v => '$' + v.toLocaleString() },
    { key: 'growth',   label: 'Growth',      emoji: '📈', color: 'from-blue-600/20 to-blue-800/20',     border: 'border-blue-500/30',   fmt: v => v + '%' },
    { key: 'nps',      label: 'NPS',         emoji: '⭐', color: 'from-yellow-600/20 to-yellow-800/20', border: 'border-yellow-500/30', fmt: v => v },
    { key: 'sessions', label: 'Sessions/wk', emoji: '🔁', color: 'from-pink-600/20 to-pink-800/20',    border: 'border-pink-500/30',   fmt: v => v.toLocaleString() },
    { key: 'churn',    label: 'Churn',       emoji: '🔻', color: 'from-red-600/20 to-red-800/20',       border: 'border-red-500/30',    fmt: v => v + '%' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Traction</h2>
          <p className="text-gray-400 text-sm">Your real-time startup metrics</p>
        </div>
        <button
          onClick={() => { setEditMode(e => !e); setForm(metrics); }}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-sm transition"
        >
          {editMode ? 'Cancel' : 'Update metrics'}
        </button>
      </div>

      {editMode && (
        <div className="bg-black/30 border border-purple-500/20 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {CARDS.map(c => (
            <div key={c.key}>
              <label className="text-xs text-gray-400">{c.emoji} {c.label}</label>
              <input
                type="number"
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                value={form[c.key] || 0}
                onChange={e => setForm(f => ({ ...f, [c.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
          <div className="col-span-full flex gap-2">
            <button
              onClick={() => { setMetrics(form); setEditMode(false); }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CARDS.map(c => (
          <div key={c.key} className={'bg-gradient-to-br ' + c.color + ' backdrop-blur-xl rounded-2xl p-5 border ' + c.border}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-xs font-medium">{c.label}</span>
              <span className="text-2xl">{c.emoji}</span>
            </div>
            <div className="text-3xl font-bold text-white">{c.fmt(metrics[c.key])}</div>
          </div>
        ))}
      </div>

      {weeklyData.length > 0 && (
        <div className="bg-black/20 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Users</h3>
          <div className="flex items-end gap-3 h-24">
            {weeklyData.map((d, i) => {
              const maxU = Math.max(...weeklyData.map(x => x.users));
              const pct = maxU ? (d.users / maxU) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md transition-all"
                    style={{ height: pct + '%', minHeight: 4 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.week}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Team panel ───────────────────────────────────────────────────────────────
const TeamPanel = () => {
  const [members, setMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teamMembers') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', role: '', emoji: '👤' });
  const EMOJIS = ['👤','👩‍💻','👨‍💻','🎨','📊','🚀','💡','🔧'];

  const addMember = () => {
    if (!form.name.trim()) return;
    const updated = [...members, { ...form, id: Date.now(), tasks: 0 }];
    setMembers(updated);
    localStorage.setItem('teamMembers', JSON.stringify(updated));
    setForm({ name: '', role: '', emoji: '👤' });
  };

  const remove = (id) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem('teamMembers', JSON.stringify(updated));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Team</h2>
        <p className="text-gray-400 text-sm">Your co-founders and collaborators</p>
      </div>
      <div className="bg-black/20 border border-white/10 rounded-2xl p-4 flex gap-2 flex-wrap">
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none"
          value={form.emoji}
          onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
        >
          {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 min-w-24"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addMember()}
        />
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 min-w-24"
          placeholder="Role (e.g. CTO)"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addMember()}
        />
        <button onClick={addMember} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition">
          Add
        </button>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">👥</div>
          <p className="text-gray-400">Add your team members above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className="group bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                  {m.emoji}
                </div>
                <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition">✕</button>
              </div>
              <p className="font-semibold text-white">{m.name}</p>
              <p className="text-sm text-purple-300">{m.role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Investors panel ──────────────────────────────────────────────────────────
const InvestorsPanel = () => {
  const [investors, setInvestors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('investorCRM') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', fund: '', status: 'prospect', notes: '' });
  const STAGES = ['prospect', 'contacted', 'meeting', 'due_diligence', 'passed', 'invested'];
  const STAGE_COLOR = {
    prospect: 'text-gray-400', contacted: 'text-blue-400', meeting: 'text-yellow-400',
    due_diligence: 'text-orange-400', passed: 'text-red-400', invested: 'text-green-400',
  };

  const add = () => {
    if (!form.name.trim()) return;
    const updated = [{ ...form, id: Date.now(), createdAt: new Date().toLocaleDateString() }, ...investors];
    setInvestors(updated);
    localStorage.setItem('investorCRM', JSON.stringify(updated));
    setForm({ name: '', fund: '', status: 'prospect', notes: '' });
  };

  const updateStage = (id, status) => {
    const updated = investors.map(i => i.id === id ? { ...i, status } : i);
    setInvestors(updated);
    localStorage.setItem('investorCRM', JSON.stringify(updated));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Investor Pipeline</h2>
        <p className="text-gray-400 text-sm">Track your fundraising conversations</p>
      </div>
      <div className="bg-black/20 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
          placeholder="Investor name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
          placeholder="Fund / firm"
          value={form.fund}
          onChange={e => setForm(f => ({ ...f, fund: e.target.value }))}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
          placeholder="Notes"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
        <button onClick={add} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition">
          + Add Investor
        </button>
      </div>
      {investors.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">💰</div>
          <p className="text-gray-400">Start tracking your investor conversations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {investors.map(inv => (
            <div key={inv.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-4 transition">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-lg shrink-0">
                💼
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{inv.name}</p>
                <p className="text-xs text-gray-400">{inv.fund}</p>
                {inv.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{inv.notes}</p>}
              </div>
              <select
                value={inv.status}
                onChange={e => updateStage(inv.id, e.target.value)}
                className={'bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none capitalize ' + (STAGE_COLOR[inv.status] || 'text-gray-400')}
              >
                {STAGES.map(s => <option key={s} value={s} className="text-white bg-gray-900">{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Docs panel ───────────────────────────────────────────────────────────────
const DocsPanel = () => {
  const TEMPLATES = [
    { title: 'One-Pager',      icon: '📄', desc: 'Quick startup summary for investors' },
    { title: 'Pitch Deck',     icon: '📊', desc: '10-slide investor deck template' },
    { title: 'Go-to-Market',   icon: '🗺', desc: 'GTM strategy framework' },
    { title: 'OKRs',           icon: '🎯', desc: 'Objectives & Key Results' },
    { title: 'Term Sheet',     icon: '📋', desc: 'Investment term sheet template' },
    { title: 'Cap Table',      icon: '📈', desc: 'Equity ownership table' },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Docs & Templates</h2>
        <p className="text-gray-400 text-sm">Startup documents & frameworks</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map(t => (
          <button key={t.title} className="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group">
            <div className="text-3xl mb-3">{t.icon}</div>
            <h3 className="font-semibold text-white group-hover:text-purple-300 transition">{t.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
            <div className="mt-3 text-xs text-purple-400">Open with Astro →</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('os');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiTasks, setAiTasks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const isGuest = localStorage.getItem('guestMode') === 'true';

  useEffect(() => {
    const load = async () => {
      try {
        if (isGuest) {
          const role = localStorage.getItem('selectedRole') || 'founder';
          setUserData({ name: 'Guest', email: 'guest@astar.com', role, isGuest: true });
          setLoading(false);
          return;
        }
        const r = await api.get('/users/profile');
        setUserData(r.data);
      } catch {
        setUserData({ name: 'User', email: '', isGuest: false });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isGuest]);

  const handleTasksExtracted = useCallback((tasks) => {
    setAiTasks(tasks);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
            ⚡
          </div>
          <p className="text-purple-300 text-sm">Booting Startup OS…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 overflow-hidden">

      {/* Sidebar */}
      <aside className={'flex flex-col bg-black/50 backdrop-blur-2xl border-r border-white/8 transition-all duration-300 shrink-0 ' + (sidebarOpen ? 'w-52' : 'w-14')}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/8">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0"
          >
            ⚡
          </button>
          {sidebarOpen && (
            <span className="font-bold text-white text-sm tracking-wide truncate">ASTAR*</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={'w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm transition-all ' + (
                activeSection === item.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              )}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 py-3 border-t border-white/8 space-y-1">
          {isGuest && sidebarOpen && (
            <div className="px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300 text-center mb-1">
              Guest mode
            </div>
          )}
          <div className={'flex items-center gap-2 px-2 py-2 ' + (!sidebarOpen ? 'justify-center' : '')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userData?.name?.[0] || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{userData?.name}</p>
                <p className="text-[10px] text-gray-400 capitalize truncate">{userData?.role || 'Founder'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={'w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition ' + (!sidebarOpen ? 'justify-center' : '')}
          >
            <span>↩</span>
            {sidebarOpen && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">

        {/* Startup OS — 2-panel */}
        {activeSection === 'os' && (
          <div className="flex-1 flex gap-3 p-3 overflow-hidden">
            <div className="w-[42%] min-w-[280px] max-w-[500px] flex flex-col overflow-hidden">
              <ObjectiveBoard aiTasks={aiTasks} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <AstroChat userData={userData} onTasksExtracted={handleTasksExtracted} />
            </div>
          </div>
        )}

        {activeSection === 'traction'  && <TractionPanel userData={userData} />}
        {activeSection === 'team'      && <TeamPanel />}
        {activeSection === 'investors' && <InvestorsPanel />}
        {activeSection === 'docs'      && <DocsPanel />}

        {activeSection === 'crm' && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-white mb-2">AI CRM</h2>
              <p className="text-sm">Smart contact management — coming soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

