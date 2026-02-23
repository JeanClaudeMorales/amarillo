import React, { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useApiHeaders } from '../context/AuthContext';

interface AP { id: number; nombre: string; codigo: string; status: string; connected_users: number; signal_dbm: number; bandwidth_mbps: number; parroquia_nombre: string; municipio_nombre: string; }

export default function Network() {
  const headers = useApiHeaders();
  const [aps, setAPs] = useState<AP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/access-points', { headers }).then(r => r.json()).then(data => {
      setAPs(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const filtered = aps.filter(ap => ap.nombre.toLowerCase().includes(search.toLowerCase()) || ap.parroquia_nombre?.toLowerCase().includes(search.toLowerCase()));

  const activos = aps.filter(a => a.status === 'activo').length;
  const criticos = aps.filter(a => a.status === 'inactivo').length;
  const mantenimiento = aps.filter(a => a.status === 'mantenimiento').length;

  const statusColor = (s: string) => ({ activo: 'text-green-500', inactivo: 'text-red-400', mantenimiento: 'text-amber-500' }[s] || '');
  const statusBadge = (s: string) => ({
    activo: 'bg-green-50 text-green-700 border-green-100',
    inactivo: 'bg-red-50 text-red-600 border-red-100',
    mantenimiento: 'bg-amber-50 text-amber-700 border-amber-100'
  }[s] || '');

  // Group by parroquia
  const byParroquia: Record<string, AP[]> = {};
  filtered.forEach(ap => {
    const key = ap.parroquia_nombre || 'Sin Parroquia';
    if (!byParroquia[key]) byParroquia[key] = [];
    byParroquia[key].push(ap);
  });

  return (
    <div className="bg-[#F2F2F7] text-[#1C1C1E] min-h-screen flex flex-col font-sans pb-28">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA] px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Red y Parroquias</h1>
          <a href="/admin/access-points" className="bg-[#FDD041] text-[#1C1C1E] px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add_circle</span> New AP
          </a>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-[20px]">search</span>
          <input className="w-full bg-[#E3E3E8]/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FDD041]/50 outline-none placeholder:text-[#8E8E93]" placeholder="Buscar parroquia o sector..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-white">
            <div className="flex items-center gap-1.5 mb-1"><span className="size-2 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-[#8E8E93] uppercase">Online</span></div>
            <p className="text-2xl font-bold">{activos} <span className="text-xs text-[#8E8E93] font-normal">APs</span></p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-white">
            <div className="flex items-center gap-1.5 mb-1"><span className="size-2 rounded-full bg-red-500" /><span className="text-[10px] font-bold text-[#8E8E93] uppercase">Caídos</span></div>
            <p className="text-2xl font-bold">{criticos} <span className="text-xs text-[#8E8E93] font-normal">APs</span></p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-white">
            <div className="flex items-center gap-1.5 mb-1"><span className="size-2 rounded-full bg-amber-500" /><span className="text-[10px] font-bold text-[#8E8E93] uppercase">Mant.</span></div>
            <p className="text-2xl font-bold">{mantenimiento} <span className="text-xs text-[#8E8E93] font-normal">APs</span></p>
          </div>
        </div>

        {/* By parroquia */}
        <section>
          <h2 className="text-base font-bold mb-3">Infraestructura por Parroquia</h2>
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="bg-white h-36 rounded-2xl mb-3 animate-pulse" />)
          ) : Object.entries(byParroquia).map(([parroquia, parAPs]) => {
            const allActive = parAPs.every(a => a.status === 'activo');
            const anyDown = parAPs.some(a => a.status === 'inactivo');
            const totalUsers = parAPs.reduce((s, a) => s + a.connected_users, 0);
            const totalBW = parAPs.reduce((s, a) => s + (a.status === 'activo' ? a.bandwidth_mbps : 0), 0);
            return (
              <div key={parroquia} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${anyDown ? 'bg-red-50 text-red-500' : allActive ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                      <span className="material-symbols-outlined">{anyDown ? 'wifi_off' : 'router'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{parroquia}</h3>
                      <p className="text-xs text-[#8E8E93]">{parAPs.length} AP{parAPs.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${anyDown ? 'bg-red-50 text-red-600 border-red-100' : allActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {anyDown ? 'DEGRADADO' : allActive ? 'ACTIVO' : 'PARCIAL'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-[#E5E5EA] pt-3">
                  <div>
                    <p className="text-[10px] text-[#8E8E93] uppercase font-bold">Ancho de Banda</p>
                    <p className="text-sm font-semibold">{totalBW >= 1000 ? `${(totalBW / 1000).toFixed(1)} Gbps` : `${totalBW} Mbps`}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8E8E93] uppercase font-bold">Usuarios</p>
                    <p className="text-sm font-semibold">{totalUsers} Conectados</p>
                  </div>
                </div>
                {parAPs.length > 1 && (
                  <div className="mt-3 space-y-1">
                    {parAPs.map(ap => (
                      <div key={ap.id} className="flex items-center justify-between py-1 border-t border-gray-50 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[14px] ${statusColor(ap.status)}`}>circle</span>
                          <span className="text-xs text-gray-600">{ap.nombre}</span>
                        </div>
                        <span className="text-xs text-gray-400">{ap.signal_dbm} dBm · {ap.connected_users}u</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Global config */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FDD041]">settings_input_component</span>
            Configuración Global
          </h3>
          <div className="space-y-0.5">
            {[
              { label: 'Límites de Ancho de Banda', icon: 'speed', href: '/admin/access-points' },
              { label: 'Configuración del Portal', icon: 'settings', href: '/admin/content' },
              { label: 'Gestión de Preguntas', icon: 'quiz', href: '/admin/content' },
              { label: 'Ver Usuarios', icon: 'group', href: '/admin/users' },
            ].map(item => (
              <a key={item.label} href={item.href} className="w-full flex items-center justify-between py-3 border-b border-[#E5E5EA] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8E8E93] text-[20px]">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-[#8E8E93]">chevron_right</span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
