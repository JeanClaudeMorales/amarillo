import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';

interface Estado { id: number; nombre: string; iso: string; total_aps?: number; active_aps?: number; total_users?: number; }
interface Municipio { id: number; estado_id: number; nombre: string; }
interface Parroquia { id: number; municipio_id: number; nombre: string; total_aps: number; active_aps: number; total_users: number; }

type Level = 'estado' | 'municipio' | 'parroquia';

export default function Geography() {
  const { admin } = useAuth();
  const headers = useApiHeaders();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<Estado | null>(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
  const [level, setLevel] = useState<Level>('estado');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [geoStats, setGeoStats] = useState<Estado[]>([]);

  useEffect(() => {
    fetch('/api/geography/estados', { headers }).then(r => r.json()).then(data => {
      setEstados(Array.isArray(data) ? data : []);
    });
    fetch('/api/geography/stats', { headers }).then(r => r.json()).then(data => {
      setGeoStats(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const selectEstado = async (estado: Estado) => {
    setSelectedEstado(estado);
    const data = await fetch(`/api/geography/municipios?estado_id=${estado.id}`, { headers }).then(r => r.json());
    setMunicipios(Array.isArray(data) ? data : []);
    setLevel('municipio');
    setSearch('');
  };

  const selectMunicipio = async (mun: Municipio) => {
    setSelectedMunicipio(mun);
    const data = await fetch(`/api/geography/parroquias?municipio_id=${mun.id}`, { headers }).then(r => r.json());
    setParroquias(Array.isArray(data) ? data : []);
    setLevel('parroquia');
    setSearch('');
  };

  const goBack = () => {
    if (level === 'parroquia') { setLevel('municipio'); setSelectedMunicipio(null); }
    else if (level === 'municipio') { setLevel('estado'); setSelectedEstado(null); }
    setSearch('');
  };

  const getStatsForEstado = (id: number) => geoStats.find(s => s.id === id) || { total_aps: 0, active_aps: 0, total_users: 0 };

  const filteredEstados = estados.filter(e => e.nombre.toLowerCase().includes(search.toLowerCase()));
  const filteredMunicipios = municipios.filter(m => m.nombre.toLowerCase().includes(search.toLowerCase()));
  const filteredParroquias = parroquias.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));

  const totalActiveAPs = geoStats.reduce((s, e) => s + (e.active_aps || 0), 0);
  const totalAPs = geoStats.reduce((s, e) => s + (e.total_aps || 0), 0);

  return (
    <div className="bg-[#f8f8f5] text-[#1E1E1E] min-h-screen flex flex-col font-sans pb-28">
      <div className="max-w-lg mx-auto w-full flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[#f8f8f5]/90 backdrop-blur-md border-b border-[#e9e3cd] px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight">Geografía</h1>
          </div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap py-1 text-sm">
            <button onClick={() => { setLevel('estado'); setSelectedEstado(null); setSelectedMunicipio(null); setSearch(''); }} className="text-[#fdd13f] font-semibold">Venezuela</button>
            {selectedEstado && (
              <><span className="material-symbols-outlined text-xs text-gray-400">chevron_right</span>
                <button onClick={() => { setLevel('municipio'); setSelectedMunicipio(null); setSearch(''); }} className={`font-semibold ${level === 'municipio' ? 'text-[#fdd13f]' : 'text-gray-500'}`}>{selectedEstado.nombre}</button></>
            )}
            {selectedMunicipio && (
              <><span className="material-symbols-outlined text-xs text-gray-400">chevron_right</span>
                <span className="text-[#fdd13f] font-semibold">{selectedMunicipio.nombre}</span></>
            )}
          </nav>
        </header>

        <main className="flex-1 px-4 py-4 space-y-4">
          {/* Overall coverage banner */}
          {level === 'estado' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e9e3cd]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado de la Red</p>
                  <h2 className="text-2xl font-bold">{totalActiveAPs} <span className="text-sm font-normal text-gray-500">APs Activos</span></h2>
                </div>
                <div className="bg-[#fdd13f]/20 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-[#fdd13f]">wifi_tethering</span>
                </div>
              </div>
              {totalAPs > 0 && (
                <>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#fdd13f] h-full rounded-full transition-all" style={{ width: `${Math.round((totalActiveAPs / totalAPs) * 100)}%` }} />
                  </div>
                  <p className="text-[11px] mt-1.5 text-gray-400">{Math.round((totalActiveAPs / totalAPs) * 100)}% de cobertura configurada operativa</p>
                </>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              className="w-full bg-gray-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#fdd13f] focus:bg-white transition-all outline-none placeholder:text-gray-400"
              placeholder={`Buscar ${level === 'estado' ? 'estado' : level === 'municipio' ? 'municipio' : 'parroquia'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Level heading */}
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-base">
              {level === 'estado' ? 'Estados de Venezuela' : level === 'municipio' ? `Municipios · ${selectedEstado?.nombre}` : `Parroquias · ${selectedMunicipio?.nombre}`}
            </h3>
            {level !== 'estado' && (
              <button onClick={goBack} className="flex items-center gap-1 text-sm text-[#fdd13f] font-semibold">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver
              </button>
            )}
          </div>

          {/* ESTADOS */}
          {level === 'estado' && (
            <div className="space-y-3">
              {loading ? (
                [...Array(5)].map((_, i) => <div key={i} className="bg-white h-28 rounded-xl animate-pulse border border-[#e9e3cd]" />)
              ) : filteredEstados.map(estado => {
                const stats = getStatsForEstado(estado.id);
                const pct = (stats.total_aps || 0) > 0 ? Math.round((stats.active_aps! / stats.total_aps!) * 100) : 0;
                return (
                  <div key={estado.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e3cd] active:scale-[0.99] transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <div className={`size-10 rounded-lg flex items-center justify-center ${stats.active_aps ? 'bg-[#fdd13f]/10' : 'bg-gray-100'}`}>
                          <span className={`material-symbols-outlined ${stats.active_aps ? 'text-[#fdd13f]' : 'text-gray-400'}`}>location_on</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-base">{estado.nombre}</h4>
                          <p className="text-xs text-gray-500">{stats.total_users || 0} usuarios · {stats.active_aps || 0}/{stats.total_aps || 0} APs</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stats.active_aps ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div className="bg-[#fdd13f] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <button onClick={() => selectEstado(estado)} className="flex items-center justify-center w-full py-2 bg-[#f8f8f5] rounded-lg text-xs font-bold text-gray-600 gap-1 hover:bg-[#fdd13f]/10 hover:text-[#1e1e1e] transition-colors">
                      Ver Municipios <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* MUNICIPIOS */}
          {level === 'municipio' && (
            <div className="space-y-2">
              {filteredMunicipios.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No hay municipios</div>
              ) : filteredMunicipios.map(m => (
                <button key={m.id} onClick={() => selectMunicipio(m)}
                  className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-[#e9e3cd] flex items-center justify-between active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-[#fdd13f]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#fdd13f]">account_balance</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.nombre}</p>
                      <p className="text-xs text-gray-400">Estado {selectedEstado?.nombre}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                </button>
              ))}
            </div>
          )}

          {/* PARROQUIAS */}
          {level === 'parroquia' && (
            <div className="space-y-2">
              {filteredParroquias.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No hay parroquias configuradas</div>
              ) : filteredParroquias.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e9e3cd]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-lg flex items-center justify-center ${p.active_aps ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <span className={`material-symbols-outlined text-[20px] ${p.active_aps ? 'text-green-500' : 'text-gray-400'}`}>cell_tower</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.active_aps}/{p.total_aps} APs · {p.total_users} usuarios</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.active_aps ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                      {p.total_aps > 0 ? Math.round((p.active_aps / p.total_aps) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
