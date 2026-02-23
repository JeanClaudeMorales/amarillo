import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth, useApiHeaders } from '../context/AuthContext';

interface Question { id: number; texto: string; tipo: string; is_active: number; }
interface PortalConfig { consent_title?: string; consent_body?: string; welcome_message?: string; session_duration_minutes?: string; network_name?: string; }

export default function Content() {
  const { admin } = useAuth();
  const headers = useApiHeaders();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<PortalConfig>({});
  const [newQ, setNewQ] = useState('');
  const [newQTipo, setNewQTipo] = useState('abierta');
  const [editConfig, setEditConfig] = useState<PortalConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingQ, setEditingQ] = useState<number | null>(null);
  const [editQText, setEditQText] = useState('');

  const load = useCallback(async () => {
    const [q, c] = await Promise.all([
      fetch('/api/questions', { headers }).then(r => r.json()),
      fetch('/api/portal-config').then(r => r.json()),
    ]);
    setQuestions(Array.isArray(q) ? q : []);
    setConfig(c);
    setEditConfig(c);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addQuestion = async () => {
    if (!newQ.trim()) return;
    await fetch('/api/questions', { method: 'POST', headers, body: JSON.stringify({ texto: newQ, tipo: newQTipo }) });
    setNewQ('');
    load();
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE', headers });
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const saveEditQ = async (id: number) => {
    await fetch(`/api/questions/${id}`, { method: 'PUT', headers, body: JSON.stringify({ texto: editQText }) });
    setEditingQ(null);
    load();
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch('/api/portal-config', { method: 'PUT', headers, body: JSON.stringify(editConfig) });
    setConfig(editConfig);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-[#f8f8f5] text-[#1e1e1e] min-h-screen flex flex-col font-sans pb-28">
      <header className="bg-[#1e1e1e] text-white px-4 pt-12 pb-6 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdd13f]">wifi</span>
            <h1 className="text-xl font-bold tracking-tight uppercase">Amarillo WiFi</h1>
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wider">{admin?.role}</div>
        </div>
        <p className="text-white/60 text-sm font-medium">Gestión de Contenido e Interacciones</p>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8">
        {/* Questions CRUD */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdd13f]">quiz</span>
            <h2 className="text-lg font-bold">Preguntas Aleatorias del Portal</h2>
          </div>
          <p className="text-sm text-[#717171] -mt-2">Estas preguntas se muestran aleatoriamente a los usuarios en el portal cautivo.</p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e9e3cd] space-y-3">
            <label className="text-sm font-semibold text-[#1e1e1e]/70">Nueva Pregunta</label>
            <div className="flex flex-col gap-2">
              <input
                className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] focus:border-[#fdd13f] outline-none transition-all"
                placeholder="¿Qué quieres preguntar hoy?"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuestion()}
              />
              <div className="flex gap-2">
                <select
                  value={newQTipo}
                  onChange={e => setNewQTipo(e.target.value)}
                  className="border border-[#e9e3cd] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none bg-white"
                >
                  <option value="abierta">Respuesta abierta</option>
                  <option value="matematica">Matemática</option>
                </select>
                <button
                  onClick={addQuestion}
                  className="flex-1 bg-[#fdd13f] hover:bg-yellow-400 text-[#1e1e1e] px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Añadir
                </button>
              </div>
            </div>

            <div className="border-t border-[#e9e3cd] pt-3 space-y-2">
              <p className="text-xs font-bold text-[#1e1e1e]/40 uppercase tracking-widest">Preguntas Activas ({questions.length})</p>
              {questions.length === 0 && <p className="text-sm text-[#717171] text-center py-4">No hay preguntas configuradas</p>}
              {questions.map(q => (
                <div key={q.id} className="flex items-start gap-2 p-3 bg-[#f8f8f5] rounded-lg border border-[#e9e3cd]">
                  {editingQ === q.id ? (
                    <>
                      <input
                        className="flex-1 border border-[#e9e3cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none"
                        value={editQText}
                        onChange={e => setEditQText(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => saveEditQ(q.id)} className="text-green-600 p-1"><span className="material-symbols-outlined text-lg">check</span></button>
                      <button onClick={() => setEditingQ(null)} className="text-gray-400 p-1"><span className="material-symbols-outlined text-lg">close</span></button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.texto}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${q.tipo === 'matematica' ? 'text-blue-500' : 'text-[#717171]'}`}>{q.tipo}</span>
                      </div>
                      <button onClick={() => { setEditingQ(q.id); setEditQText(q.texto); }} className="p-1.5 text-[#1e1e1e]/40 hover:text-[#1e1e1e] transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Config */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdd13f]">notification_important</span>
            <h2 className="text-lg font-bold">Configuración del Portal Cautivo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e9e3cd] space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1e1e1e]/70 uppercase tracking-wide">Nombre de la Red</label>
                <input className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none" value={editConfig.network_name || ''} onChange={e => setEditConfig(p => ({ ...p, network_name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1e1e1e]/70 uppercase tracking-wide">Mensaje de Bienvenida</label>
                <input className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none" value={editConfig.welcome_message || ''} onChange={e => setEditConfig(p => ({ ...p, welcome_message: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1e1e1e]/70 uppercase tracking-wide">Título del Consentimiento</label>
                <input className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none" value={editConfig.consent_title || ''} onChange={e => setEditConfig(p => ({ ...p, consent_title: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1e1e1e]/70 uppercase tracking-wide">Texto de Consentimiento</label>
                <textarea className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none resize-none" rows={4} value={editConfig.consent_body || ''} onChange={e => setEditConfig(p => ({ ...p, consent_body: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1e1e1e]/70 uppercase tracking-wide">Duración de sesión (minutos)</label>
                <input type="number" className="w-full border border-[#e9e3cd] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#fdd13f] outline-none" value={editConfig.session_duration_minutes || ''} onChange={e => setEditConfig(p => ({ ...p, session_duration_minutes: e.target.value }))} />
              </div>
              <button onClick={saveConfig} disabled={saving} className="w-full bg-[#1e1e1e] text-white font-bold py-3 rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> Guardando...</> : saved ? <><span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span> Guardado</> : <><span className="material-symbols-outlined text-[18px]">save</span> Guardar Cambios</>}
              </button>
            </div>

            {/* Live Preview */}
            <div className="bg-gradient-to-br from-[#f8f8f5] to-[#e9e3cd] p-6 rounded-xl border border-[#e9e3cd] flex flex-col items-center justify-center relative min-h-[380px]">
              <p className="absolute top-3 left-3 text-[10px] font-bold text-[#1e1e1e]/30 uppercase tracking-tighter">Vista Previa en Vivo</p>
              <div className="bg-white/90 backdrop-blur-md w-full max-w-[240px] rounded-[18px] overflow-hidden flex flex-col shadow-lg border border-white">
                <div className="p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-[#FDD041]/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[#FDD041] text-2xl">wifi</span>
                  </div>
                  <p className="font-bold text-sm">{editConfig.network_name || 'Mérida te conecta'}</p>
                  <h3 className="font-bold text-base leading-tight">{editConfig.consent_title || 'Consentimiento de Datos'}</h3>
                  <p className="text-xs text-[#1e1e1e]/70 leading-snug">{editConfig.consent_body?.slice(0, 120) || '...'}{(editConfig.consent_body?.length || 0) > 120 ? '...' : ''}</p>
                </div>
                <div className="border-t border-[#e9e3cd]">
                  <button className="w-full py-3 text-sm font-semibold text-blue-600">Aceptar y Conectar</button>
                </div>
              </div>
              <div className="mt-4 flex gap-1 items-center opacity-30">
                <span className="material-symbols-outlined text-xs">smartphone</span>
                <span className="text-[10px] font-medium italic">Simulación de pantalla</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
