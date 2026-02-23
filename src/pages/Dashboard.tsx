import React, { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';

interface Stats {
  totalUsers: number; activeUsers: number; totalAPs: number; activeAPs: number;
  totalConnected: number; newToday: number; uptime: number;
}
interface Question { id: number; texto: string; tipo: string; is_active: number; }
interface Parroquia { id: number; nombre: string; active_aps: number; total_aps: number; connected_users: number; }
interface AP { id: number; nombre: string; codigo: string; status: string; connected_users: number; signal_dbm: number; parroquia_nombre: string; }

export default function Dashboard() {
  const { admin } = useAuth();
  const headers = useApiHeaders();
  const [stats, setStats] = useState<Stats | null>(null);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [aps, setAPs] = useState<AP[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddQ, setShowAddQ] = useState(false);

  const load = async () => {
    const [s, p, a, q] = await Promise.all([
      fetch('/api/dashboard/stats', { headers }).then(r => r.json()),
      fetch('/api/dashboard/parroquias', { headers }).then(r => r.json()),
      fetch('/api/access-points', { headers }).then(r => r.json()),
      fetch('/api/questions', { headers }).then(r => r.json()),
    ]);
    setStats(s);
    setParroquias(Array.isArray(p) ? p : []);
    setAPs(Array.isArray(a) ? a : []);
    setQuestions(Array.isArray(q) ? q : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    await fetch('/api/questions', { method: 'POST', headers, body: JSON.stringify({ texto: newQuestion, tipo: 'abierta' }) });
    setNewQuestion('');
    setShowAddQ(false);
    const q = await fetch('/api/questions', { headers }).then(r => r.json());
    setQuestions(Array.isArray(q) ? q : []);
  };

  const deleteQuestion = async (id: number) => {
    await fetch(`/api/questions/${id}`, { method: 'DELETE', headers });
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const getRoleBadge = () => {
    const labels: Record<string, string> = { superadmin: 'Super Admin', nacional: 'Nacional', estadal: 'Estadal', municipal: 'Municipal' };
    return labels[admin?.role || ''] || admin?.role;
  };

  const filteredAPs = activeTab === 'all' ? aps.slice(0, 6) : aps.filter(a => a.parroquia_nombre === parroquias.find(p => p.id === activeTab)?.nombre).slice(0, 6);

  const statusColor = (s: string) => ({ activo: 'text-green-500', inactivo: 'text-red-400', mantenimiento: 'text-amber-500' }[s] || '');
  const statusIcon = (s: string) => ({ activo: 'check_circle', inactivo: 'cancel', mantenimiento: 'error' }[s] || 'help');

  return (
    <div className="bg-[#f8f8f5] text-[#1e1e1e] min-h-screen flex flex-col font-sans pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#e9e3cd] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-[#1E1E1E] rounded-xl flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[#fdd13f] text-[22px]">wifi_tethering</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Amarillo WiFi</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#717171] font-semibold">{getRoleBadge()} · {admin?.nombre_completo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {admin?.nombre_completo?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Stats */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <span className="text-xs font-medium text-[#717171] bg-white px-2 py-1 rounded-lg border border-[#e9e3cd]">En vivo</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-white h-24 rounded-xl border border-[#e9e3cd]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#e9e3cd] shadow-sm">
                <p className="text-xs text-[#717171] mb-1">Usuarios Registrados</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString()}</span>
                  <span className="text-green-600 text-xs font-bold mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[12px]">arrow_upward</span>{stats?.newToday} hoy
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e9e3cd] shadow-sm">
                <p className="text-xs text-[#717171] mb-1">Conectados Ahora</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stats?.totalConnected?.toLocaleString()}</span>
                  <span className="text-[#fdd13f] text-xs font-bold mb-1">activos</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e9e3cd] shadow-sm">
                <p className="text-xs text-[#717171] mb-1">Uptime Red</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stats?.uptime}%</span>
                  <span className="text-green-600 text-xs font-bold mb-1">estable</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e9e3cd] shadow-sm">
                <p className="text-xs text-[#717171] mb-1">APs Activos</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stats?.activeAPs}</span>
                  <span className="text-[#717171] text-xs mb-1">/ {stats?.totalAPs}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Parroquias Tabs */}
        {parroquias.length > 0 && (
          <section className="mt-1">
            <div className="flex overflow-x-auto border-b border-[#e9e3cd] px-4 no-scrollbar gap-5">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 text-sm whitespace-nowrap transition-colors ${activeTab === 'all' ? 'font-bold text-[#1e1e1e] border-b-2 border-[#fdd13f]' : 'font-medium text-[#717171]'}`}
              >General</button>
              {parroquias.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  className={`pb-3 text-sm whitespace-nowrap transition-colors ${activeTab === p.id ? 'font-bold text-[#1e1e1e] border-b-2 border-[#fdd13f]' : 'font-medium text-[#717171]'}`}
                >{p.nombre}</button>
              ))}
            </div>
          </section>
        )}

        {/* APs Status */}
        <section className="p-4">
          <div className="bg-white rounded-xl border border-[#e9e3cd] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#e9e3cd] flex justify-between items-center">
              <h3 className="font-bold">Puntos de Acceso</h3>
              <a href="/admin/access-points" className="text-xs text-[#fdd13f] font-bold">Ver todos</a>
            </div>
            {filteredAPs.length === 0 ? (
              <div className="p-8 text-center text-[#717171] text-sm">No hay APs en este sector</div>
            ) : (
              <div className="divide-y divide-[#e9e3cd]">
                {filteredAPs.map(ap => (
                  <div key={ap.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${statusColor(ap.status)}`}>{statusIcon(ap.status)}</span>
                      <div>
                        <p className="font-semibold text-sm">{ap.nombre}</p>
                        <p className="text-xs text-[#717171]">{ap.connected_users} conectados · {ap.signal_dbm} dBm</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${ap.status === 'activo' ? 'bg-green-50 text-green-700' : ap.status === 'inactivo' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                      {ap.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Security Questions CRUD */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">security</span>
              Preguntas Aleatorias
            </h3>
            <button onClick={() => setShowAddQ(!showAddQ)} className="bg-[#1e1e1e] text-white p-1.5 rounded-xl shadow-sm active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-[20px]">{showAddQ ? 'close' : 'add'}</span>
            </button>
          </div>

          {showAddQ && (
            <div className="bg-white p-4 rounded-xl border border-[#e9e3cd] shadow-sm mb-3 flex gap-2">
              <input
                className="flex-1 border border-[#e9e3cd] rounded-lg text-sm p-3 focus:ring-2 focus:ring-[#fdd13f] focus:border-[#fdd13f] outline-none"
                placeholder="Nueva pregunta..."
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuestion()}
              />
              <button onClick={addQuestion} className="bg-[#fdd13f] text-[#1e1e1e] font-bold px-4 rounded-lg text-sm active:scale-[0.98] transition-transform">
                Añadir
              </button>
            </div>
          )}

          <div className="space-y-2">
            {questions.slice(0, 6).map((q, i) => (
              <div key={q.id} className="bg-white p-4 rounded-xl border border-[#e9e3cd] flex items-start gap-3 shadow-sm">
                <div className="bg-[#fdd13f]/20 text-[#1e1e1e] size-8 rounded-lg flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">Q{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{q.texto}</p>
                  <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wide">{q.tipo}</span>
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
