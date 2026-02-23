import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Estado { id: number; nombre: string; }

export default function Settings() {
  const { admin, logout, isSuperAdmin } = useAuth();
  const headers = useApiHeaders();
  const navigate = useNavigate();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoNombre, setEstadoNombre] = useState('');

  useEffect(() => {
    if (admin?.estado_id) {
      fetch('/api/geography/estados', { headers }).then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const e = data.find((e: Estado) => e.id === admin.estado_id);
          if (e) setEstadoNombre(e.nombre);
        }
      });
    }
  }, [admin]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const roleLabelMap: Record<string, string> = {
    superadmin: 'Super Administrador',
    nacional: 'Administrador Nacional',
    estadal: 'Administrador Estadal',
    municipal: 'Administrador Municipal',
  };

  const scopeLabel = () => {
    if (!admin) return '';
    if (admin.role === 'superadmin' || admin.role === 'nacional') return 'Acceso: Todo Venezuela';
    if (admin.role === 'estadal' && estadoNombre) return `Acceso: ${estadoNombre}`;
    if (admin.role === 'municipal') return `Acceso: Municipio #${admin.municipio_id}`;
    return '';
  };

  return (
    <div className="bg-[#F2F2F7] text-[#1e1e1e] min-h-screen pb-32 font-sans">
      <header className="px-5 pt-12 pb-4 bg-[#F2F2F7]">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </header>

      <main className="space-y-6 px-4">
        {/* Admin Profile */}
        <section>
          <h2 className="text-[12px] uppercase text-[#8E8E93] px-1 mb-2 font-semibold tracking-wide">Perfil del Administrador</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E5E5EA]">
            <div className="flex items-center gap-4 p-4">
              <div className="size-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center text-[#FDD041] font-bold text-xl shadow-sm">
                {admin?.nombre_completo?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-base">{admin?.nombre_completo}</p>
                <p className="text-xs text-[#8E8E93]">@{admin?.username}</p>
                {admin?.email && <p className="text-xs text-[#8E8E93]">{admin.email}</p>}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#FDD041] text-[18px]">shield</span>
                <span className="text-sm font-semibold">{admin?.role ? roleLabelMap[admin.role] : ''}</span>
              </div>
              {scopeLabel() && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8E8E93] text-[16px]">location_on</span>
                  <span className="text-xs text-[#8E8E93]">{scopeLabel()}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Navigation Shortcuts */}
        <section>
          <h2 className="text-[12px] uppercase text-[#8E8E93] px-1 mb-2 font-semibold tracking-wide">Acceso Rápido</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E5E5EA]">
            {[
              { icon: 'quiz', label: 'Preguntas del Portal', color: '#FDD041', bg: '#fdd13f', href: '/admin/content' },
              { icon: 'router', label: 'Puntos de Acceso', color: '#34C759', bg: '#34C759', href: '/admin/access-points' },
              { icon: 'map', label: 'Geografía', color: '#007AFF', bg: '#007AFF', href: '/admin/geography' },
              { icon: 'group', label: 'Base de Datos de Usuarios', color: '#FF9500', bg: '#FF9500', href: '/admin/users' },
            ].map(item => (
              <a key={item.href} href={item.href} className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg + '22' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <span className="text-[15px]">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-[#E5E5EA]">chevron_right</span>
              </a>
            ))}
          </div>
        </section>

        {/* Superadmin section */}
        {isSuperAdmin() && (
          <section>
            <h2 className="text-[12px] uppercase text-[#8E8E93] px-1 mb-2 font-semibold tracking-wide">Super Administrador</h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <a href="/admin/admins" className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-[20px]">manage_accounts</span>
                  </div>
                  <span className="text-[15px]">Gestión de Administradores</span>
                </div>
                <span className="material-symbols-outlined text-[#E5E5EA]">chevron_right</span>
              </a>
            </div>
          </section>
        )}

        {/* System info */}
        <section>
          <h2 className="text-[12px] uppercase text-[#8E8E93] px-1 mb-2 font-semibold tracking-wide">Sistema</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E5E5EA]">
              <p className="text-xs text-[#8E8E93]">Versión</p>
              <p className="text-sm font-semibold">Amarillo WiFi v3.0.0</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[#8E8E93]">Base de Datos</p>
              <p className="text-sm font-semibold">SQLite + Express API</p>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="pb-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <button onClick={handleLogout} className="w-full text-center py-4 text-[#FF3B30] font-semibold text-[17px] active:bg-red-50 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
