import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f8f5] min-h-screen flex flex-col items-center justify-center p-6 font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FDD041]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#FDD041]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#1E1E1E] rounded-[28px] flex items-center justify-center shadow-lg mb-5 relative">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#FDD041]/20 to-transparent" />
            <span className="material-symbols-outlined text-[#FDD041] text-5xl">wifi_tethering</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] tracking-tight">Amarillo WiFi</h1>
          <p className="text-sm text-[#717171] mt-1 font-medium">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#e9e3cd] p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#717171] text-xl">person</span>
              <input
                className="w-full bg-[#f8f8f5] border border-[#e9e3cd] rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#FDD041] focus:border-[#FDD041] outline-none transition-all placeholder:text-[#717171]/50"
                placeholder="Usuario"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoCapitalize="none"
              />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#717171] text-xl">lock</span>
              <input
                className="w-full bg-[#f8f8f5] border border-[#e9e3cd] rounded-2xl py-4 pl-12 pr-12 text-sm focus:ring-2 focus:ring-[#FDD041] focus:border-[#FDD041] outline-none transition-all placeholder:text-[#717171]/50"
                placeholder="Contraseña"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#1E1E1E] transition-colors">
                <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <button
              className="w-full bg-[#1E1E1E] text-white font-semibold py-4 rounded-full transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-xl">refresh</span> Autenticando...</>
              ) : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#717171]">Sistema de gestión WiFi pública</p>
          <p className="text-xs text-[#717171]/50 mt-1">Venezuela · v3.0</p>
        </div>
      </div>
    </div>
  );
}
