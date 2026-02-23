import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';

interface User {
  id: number; nombre_completo: string; cedula: string; whatsapp: string;
  fecha_nacimiento: string; direccion: string; parroquia_nombre: string;
  ap_nombre: string; connected_at: string; is_active: number;
}
interface Parroquia { id: number; nombre: string; }

export default function Users() {
  const { admin } = useAuth();
  const headers = useApiHeaders();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [search, setSearch] = useState('');
  const [parroquiaFilter, setParroquiaFilter] = useState<number | ''>('');
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (search) params.append('search', search);
    if (parroquiaFilter) params.append('parroquia_id', String(parroquiaFilter));

    const data = await fetch(`/api/users?${params}`, { headers }).then(r => r.json());
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, parroquiaFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Load parroquias for filter (from APs)
  useEffect(() => {
    fetch('/api/dashboard/parroquias', { headers }).then(r => r.json()).then(data => {
      setParroquias(Array.isArray(data) ? data : []);
    });
  }, []);

  const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatRelative = (d: string) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `Hace ${m}m`;
    if (m < 1440) return `Hace ${Math.floor(m / 60)}h`;
    return `Hace ${Math.floor(m / 1440)}d`;
  };

  return (
    <div className="bg-[#f6f7f8] text-[#1E1E1E] min-h-screen flex flex-col font-sans pb-28">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E6E6E6]">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-xs text-gray-400">{total.toLocaleString()} registrados</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const data = users.map(u => `${u.nombre_completo},${u.cedula},${u.whatsapp},${u.parroquia_nombre}`).join('\n');
                const blob = new Blob([`Nombre,Cédula,WhatsApp,Parroquia\n${data}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'usuarios.csv'; a.click();
              }}
              className="bg-[#f8f8f5] border border-[#e9e3cd] text-[#1E1E1E] p-2 rounded-xl"
            >
              <span className="material-symbols-outlined text-[22px]">download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search + Filter */}
      <div className="px-4 py-3 bg-white sticky top-[58px] z-40 border-b border-[#E6E6E6]">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#fdd13f]/30 placeholder:text-slate-400 outline-none"
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => { setParroquiaFilter(''); setPage(1); }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${parroquiaFilter === '' ? 'bg-[#1e1e1e] text-white' : 'bg-slate-100 text-slate-600 border border-[#E6E6E6]'}`}
          >Todas</button>
          {parroquias.map(p => (
            <button
              key={p.id}
              onClick={() => { setParroquiaFilter(p.id); setPage(1); }}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${parroquiaFilter === p.id ? 'bg-[#1e1e1e] text-white' : 'bg-slate-100 text-slate-600 border border-[#E6E6E6]'}`}
            >{p.nombre}</button>
          ))}
        </div>
      </div>

      <main className="flex-1 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
            <p className="text-slate-400 text-sm mt-2">{search ? 'Sin resultados para tu búsqueda' : 'No hay usuarios registrados'}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E6E6]">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
                className="w-full flex items-center gap-4 px-4 py-4 active:bg-slate-50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-[#fdd13f]/20 flex items-center justify-center text-[#1E1E1E] shrink-0 font-bold text-lg">
                  {initials(u.nombre_completo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[15px] font-semibold truncate">{u.nombre_completo}</h3>
                    <span className="text-[11px] text-slate-400 ml-2 shrink-0">{formatRelative(u.connected_at)}</span>
                  </div>
                  <div className="flex flex-col text-[13px] text-slate-500 gap-0.5">
                    <p>{u.cedula} {u.whatsapp ? `· ${u.whatsapp}` : ''}</p>
                    {u.parroquia_nombre && (
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        {u.parroquia_nombre}
                      </p>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
            ))}
          </div>
        )}

        {!loading && Math.ceil(total / 30) > 1 && (
          <div className="flex justify-center gap-3 p-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg border border-[#e9e3cd] text-sm font-medium disabled:opacity-40">Anterior</button>
            <span className="px-4 py-2 text-sm text-slate-500">{page} / {Math.ceil(total / 30)}</span>
            <button disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-[#e9e3cd] text-sm font-medium disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#fdd13f]/20 flex items-center justify-center text-[#1E1E1E] font-bold text-2xl">
                {initials(selected.nombre_completo)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selected.nombre_completo}</h2>
                <p className="text-sm text-gray-500">{selected.cedula}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: 'chat', label: 'WhatsApp', val: selected.whatsapp },
                { icon: 'cake', label: 'Fecha de Nacimiento', val: formatDate(selected.fecha_nacimiento) },
                { icon: 'home', label: 'Dirección', val: selected.direccion },
                { icon: 'location_on', label: 'Parroquia', val: selected.parroquia_nombre },
                { icon: 'router', label: 'Punto de Acceso', val: selected.ap_nombre },
                { icon: 'schedule', label: 'Conectado', val: formatDate(selected.connected_at) },
              ].filter(f => f.val).map(f => (
                <div key={f.label} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <span className="material-symbols-outlined text-[#fdd13f] text-[20px]">{f.icon}</span>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wide">{f.label}</p>
                    <p className="text-sm font-medium">{f.val}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-full">Cerrar</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
