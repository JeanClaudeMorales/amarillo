import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import { useApiHeaders } from '../context/AuthContext';

interface Admin { id: number; username: string; role: string; nombre_completo: string; email: string; estado_nombre: string; municipio_nombre: string; is_active: number; created_at: string; }
interface Estado { id: number; nombre: string; }
interface Municipio { id: number; nombre: string; estado_id: number; }

const defaultForm = { username: '', password: '', nombre_completo: '', email: '', role: 'estadal', estado_id: '', municipio_id: '' };

export default function AdminManagement() {
    const headers = useApiHeaders();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        const [a, e] = await Promise.all([
            fetch('/api/admins', { headers }).then(r => r.json()),
            fetch('/api/geography/estados', { headers }).then(r => r.json()),
        ]);
        setAdmins(Array.isArray(a) ? a : []);
        setEstados(Array.isArray(e) ? e : []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (form.estado_id && (form.role === 'municipal')) {
            fetch(`/api/geography/municipios?estado_id=${form.estado_id}`, { headers }).then(r => r.json()).then(data => {
                setMunicipios(Array.isArray(data) ? data : []);
            });
        } else {
            setMunicipios([]);
        }
    }, [form.estado_id, form.role]);

    const saveAdmin = async () => {
        if (!form.username || !form.password || !form.role) { setError('Usuario, contraseña y rol son requeridos'); return; }
        if (form.role === 'estadal' && !form.estado_id) { setError('Selecciona un estado'); return; }
        if (form.role === 'municipal' && !form.municipio_id) { setError('Selecciona un municipio'); return; }
        setSaving(true);
        try {
            const body = { ...form, estado_id: form.estado_id ? Number(form.estado_id) : null, municipio_id: form.municipio_id ? Number(form.municipio_id) : null };
            const r = await fetch('/api/admins', { method: 'POST', headers, body: JSON.stringify(body) });
            if (!r.ok) { const e = await r.json(); setError(e.error || 'Error'); setSaving(false); return; }
            setShowModal(false);
            setForm(defaultForm);
            load();
        } catch { setError('Error de conexión'); }
        setSaving(false);
    };

    const deleteAdmin = async (a: Admin) => {
        if (!confirm(`¿Eliminar a "${a.nombre_completo}"?`)) return;
        await fetch(`/api/admins/${a.id}`, { method: 'DELETE', headers });
        load();
    };

    const toggleActive = async (a: Admin) => {
        await fetch(`/api/admins/${a.id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: a.is_active ? 0 : 1 }) });
        load();
    };

    const roleLabel: Record<string, string> = { superadmin: 'Super Admin', nacional: 'Nacional', estadal: 'Estadal', municipal: 'Municipal' };
    const roleBg: Record<string, string> = { superadmin: 'bg-purple-100 text-purple-700', nacional: 'bg-blue-100 text-blue-700', estadal: 'bg-amber-100 text-amber-700', municipal: 'bg-green-100 text-green-700' };

    return (
        <div className="bg-[#f8f8f5] text-[#1e1e1e] min-h-screen flex flex-col font-sans pb-28">
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#e9e3cd] px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Administradores</h1>
                        <p className="text-xs text-gray-400">{admins.length} administradores en el sistema</p>
                    </div>
                    <button onClick={() => { setShowModal(true); setForm(defaultForm); setError(''); }}
                        className="bg-[#1e1e1e] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm active:scale-[0.98] transition-transform">
                        <span className="material-symbols-outlined text-[18px]">person_add</span> Nuevo
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="bg-white h-28 rounded-xl animate-pulse border border-[#e9e3cd]" />)
                ) : admins.map(a => (
                    <div key={a.id} className={`bg-white rounded-xl p-4 border shadow-sm ${!a.is_active ? 'opacity-50 border-gray-100' : 'border-[#e9e3cd]'}`}>
                        <div className="flex items-start gap-3 mb-3">
                            <div className="size-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-[#FDD041] font-bold text-lg">
                                {a.nombre_completo?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold">{a.nombre_completo}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBg[a.role]}`}>{roleLabel[a.role]}</span>
                                    {!a.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactivo</span>}
                                </div>
                                <p className="text-xs text-gray-400">@{a.username} {a.email ? `· ${a.email}` : ''}</p>
                                {(a.estado_nombre || a.municipio_nombre) && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                                        {a.estado_nombre || ''}{a.municipio_nombre ? ` · ${a.municipio_nombre}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        {a.role !== 'superadmin' && (
                            <div className="flex gap-3 border-t border-gray-50 pt-3">
                                <button onClick={() => toggleActive(a)} className={`flex items-center gap-1 text-xs font-semibold ${a.is_active ? 'text-amber-600' : 'text-green-600'}`}>
                                    <span className="material-symbols-outlined text-[16px]">{a.is_active ? 'pause_circle' : 'play_circle'}</span>
                                    {a.is_active ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => deleteAdmin(a)} className="flex items-center gap-1 text-xs font-semibold text-red-500">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </main>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                        <h2 className="text-lg font-bold mb-5">Nuevo Administrador</h2>
                        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">error</span>{error}</div>}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input className="border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none" placeholder="Usuario" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoCapitalize="none" />
                                <input className="border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none" placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                            </div>
                            <input className="w-full border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none" placeholder="Nombre Completo" value={form.nombre_completo} onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} />
                            <input className="w-full border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none" placeholder="Email (opcional)" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <select className="w-full border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none bg-white" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value, estado_id: '', municipio_id: '' }))}>
                                <option value="nacional">Nacional</option>
                                <option value="estadal">Estadal (por estado)</option>
                                <option value="municipal">Municipal (por municipio)</option>
                            </select>
                            {(form.role === 'estadal' || form.role === 'municipal') && (
                                <select className="w-full border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none bg-white" value={form.estado_id} onChange={e => setForm(p => ({ ...p, estado_id: e.target.value, municipio_id: '' }))}>
                                    <option value="">Seleccionar Estado</option>
                                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            )}
                            {form.role === 'municipal' && municipios.length > 0 && (
                                <select className="w-full border border-[#e9e3cd] rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#FDD041] outline-none bg-white" value={form.municipio_id} onChange={e => setForm(p => ({ ...p, municipio_id: e.target.value }))}>
                                    <option value="">Seleccionar Municipio</option>
                                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-[#e9e3cd] rounded-full text-sm font-semibold text-gray-500">Cancelar</button>
                            <button onClick={saveAdmin} disabled={saving} className="flex-1 py-3 bg-[#1e1e1e] text-white rounded-full text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                                {saving ? 'Creando...' : 'Crear Administrador'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <BottomNav />
        </div>
    );
}
