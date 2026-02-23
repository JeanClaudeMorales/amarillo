import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';

interface AP {
  id: number; nombre: string; codigo: string; parroquia_id: number | null;
  parroquia_nombre: string; municipio_nombre: string; estado_nombre: string;
  ip_address: string; mac_address: string; status: string;
  signal_dbm: number; connected_users: number; bandwidth_mbps: number;
}
interface Parroquia { id: number; nombre: string; municipio_id: number; }

const defaultForm = { nombre: '', codigo: '', parroquia_id: '', ip_address: '', mac_address: '', bandwidth_mbps: '100' };

export default function AccessPoints() {
  const { admin } = useAuth();
  const headers = useApiHeaders();
  const [aps, setAPs] = useState<AP[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAP, setEditAP] = useState<AP | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    // Load APs first (already scoped by admin role via API)
    const a = await fetch('/api/access-points', { headers }).then(r => r.json());
    const apList: AP[] = Array.isArray(a) ? a : [];
    setAPs(apList);

    // Derive unique parroquias from whatever the admin can already see
    // Then optionally fetch all parroquias if admin's municipio_id is known
    const parroquiaMap = new Map<number, Parroquia>();
    // Extract from AP list first (avoids any hardcoded municipio)
    // Then try to pull full parroquia list from the first municipio we find
    const municipioIds = [...new Set(apList.map((ap: any) => ap.municipio_id).filter(Boolean))];

    if (municipioIds.length > 0) {
      const allParroquias = await Promise.all(
        municipioIds.slice(0, 5).map((mid: number) =>
          fetch(`/api/geography/parroquias?municipio_id=${mid}`, { headers }).then(r => r.json())
        )
      );
      allParroquias.flat().forEach((p: Parroquia) => parroquiaMap.set(p.id, p));
    }
    setParroquias([...parroquiaMap.values()]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditAP(null); setForm(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (ap: AP) => {
    setEditAP(ap);
    setForm({ nombre: ap.nombre, codigo: ap.codigo, parroquia_id: String(ap.parroquia_id || ''), ip_address: ap.ip_address || '', mac_address: ap.mac_address || '', bandwidth_mbps: String(ap.bandwidth_mbps || 100) });
    setError('');
    setShowModal(true);
  };

  const saveAP = async () => {
    if (!form.nombre.trim() || !form.codigo.trim()) { setError('Nombre y código son requeridos'); return; }
    setSaving(true);
    try {
      const body = { ...form, parroquia_id: form.parroquia_id ? Number(form.parroquia_id) : null, bandwidth_mbps: Number(form.bandwidth_mbps) };
      if (editAP) {
        await fetch(`/api/access-points/${editAP.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        const r = await fetch('/api/access-points', { method: 'POST', headers, body: JSON.stringify(body) });
        if (!r.ok) { const e = await r.json(); setError(e.error || 'Error'); setSaving(false); return; }
      }
      setShowModal(false);
      load();
    } catch { setError('Error de conexión'); }
    setSaving(false);
  };

  const deleteAP = async (ap: AP) => {
    if (!confirm(`¿Eliminar "${ap.nombre}"?`)) return;
    await fetch(`/api/access-points/${ap.id}`, { method: 'DELETE', headers });
    load();
  };

  const changeStatus = async (ap: AP, status: string) => {
    await fetch(`/api/access-points/${ap.id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    load();
  };

  const filtered = aps.filter(ap =>
    (ap.nombre.toLowerCase().includes(search.toLowerCase()) || ap.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (!filter || ap.status === filter)
  );

  const statusColors: Record<string, string> = { activo: 'text-green-500', inactivo: 'text-red-400', mantenimiento: 'text-amber-500' };
  const statusBg: Record<string, string> = { activo: 'bg-green-50 text-green-700 border-green-100', inactivo: 'bg-red-50 text-red-600 border-red-100', mantenimiento: 'bg-amber-50 text-amber-700 border-amber-100' };
  const statusIcon: Record<string, string> = { activo: 'check_circle', inactivo: 'cancel', mantenimiento: 'error' };

  const counts = { activo: aps.filter(a => a.status === 'activo').length, inactivo: aps.filter(a => a.status === 'inactivo').length, mantenimiento: aps.filter(a => a.status === 'mantenimiento').length };

  return (
    <div className="bg-[#F2F2F7] text-[#1C1C1E] min-h-screen flex flex-col font-sans pb-28">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA] px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Puntos de Acceso</h1>
          <button onClick={openCreate} className="bg-[#FDD041] text-[#1C1C1E] px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined text-[18px]">add_circle</span> Nuevo AP
          </button>
        </div>
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]">search</span>
          <input className="w-full bg-black/5 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FDD041]/50 outline-none" placeholder="Buscar AP por nombre o código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['', 'activo', 'inactivo', 'mantenimiento'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${filter === s ? 'bg-[#1C1C1E] text-white' : 'bg-white border border-[#E5E5EA] text-[#1C1C1E]'}`}>
              {s === '' ? 'Todos' : <><span className={`size-2 rounded-full ${s === 'activo' ? 'bg-green-500' : s === 'inactivo' ? 'bg-red-500' : 'bg-amber-500'}`} />{counts[s as keyof typeof counts]} {s}</>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white h-40 rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-gray-300">router</span>
            <p className="text-gray-400 text-sm mt-2">No hay puntos de acceso</p>
          </div>
        ) : filtered.map(ap => (
          <div key={ap.id} className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#FDD041]/10 p-2.5 rounded-xl">
                  <span className="material-symbols-outlined text-[#FDD041]">router</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">{ap.nombre}</h3>
                  <p className="text-[11px] text-[#8E8E93] uppercase font-bold tracking-wider">{ap.codigo}</p>
                  {ap.parroquia_nombre && <p className="text-[11px] text-[#8E8E93]">{ap.parroquia_nombre}{ap.municipio_nombre ? ` · ${ap.municipio_nombre}` : ''}</p>}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusBg[ap.status]}`}>
                {ap.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-50">
              <div>
                <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">Usuarios</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-[#1C1C1E]">group</span>
                  <span className="text-sm font-bold">{ap.connected_users}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">Señal</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm font-bold">{ap.signal_dbm}</span>
                  <span className="text-[10px] text-gray-400">dBm</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">BW</p>
                <p className="text-sm font-bold">{ap.bandwidth_mbps} Mbps</p>
              </div>
            </div>
            {ap.ip_address && <p className="text-[11px] text-gray-400 mt-2">IP: {ap.ip_address} {ap.mac_address ? `· ${ap.mac_address}` : ''}</p>}
            <div className="flex items-center justify-between pt-3">
              <div className="flex gap-3">
                <button onClick={() => openEdit(ap)} className="flex items-center gap-1 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span className="text-xs font-semibold">Editar</span>
                </button>
                <button onClick={() => changeStatus(ap, ap.status === 'activo' ? 'mantenimiento' : 'activo')} className="flex items-center gap-1 text-[#8E8E93] hover:text-blue-600 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span className="text-xs font-semibold">Toggle</span>
                </button>
              </div>
              <button onClick={() => deleteAP(ap)} className="text-red-400 hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold mb-5">{editAP ? 'Editar Punto de Acceso' : 'Nuevo Punto de Acceso'}</h2>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">error</span>{error}</div>}
            <div className="space-y-3">
              {[
                { key: 'nombre', label: 'Nombre del AP', placeholder: 'Plaza Bolívar Sagrario', icon: 'router' },
                { key: 'codigo', label: 'Código único', placeholder: 'AP-PLZ-BOL-01', icon: 'qr_code' },
                { key: 'ip_address', label: 'Dirección IP', placeholder: '192.168.1.1', icon: 'lan' },
                { key: 'mac_address', label: 'MAC Address', placeholder: 'AA:BB:CC:DD:EE:FF', icon: 'memory' },
                { key: 'bandwidth_mbps', label: 'Ancho de banda (Mbps)', placeholder: '100', icon: 'speed' },
              ].map(f => (
                <div key={f.key} className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">{f.icon}</span>
                  <input
                    className="w-full border border-[#e9e3cd] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none"
                    placeholder={`${f.label}: ${f.placeholder}`}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">location_on</span>
                <select
                  className="w-full border border-[#e9e3cd] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none bg-white appearance-none"
                  value={form.parroquia_id}
                  onChange={e => setForm(p => ({ ...p, parroquia_id: e.target.value }))}
                >
                  <option value="">Parroquia (opcional)</option>
                  {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-[#e9e3cd] rounded-full text-sm font-semibold text-gray-500">Cancelar</button>
              <button onClick={saveAP} disabled={saving} className="flex-1 py-3 bg-[#1C1C1E] text-white rounded-full text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                {saving ? 'Guardando...' : editAP ? 'Actualizar' : 'Crear AP'}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
