import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question { id: number | null; texto: string; tipo: string; }
interface PortalConfig { consent_title?: string; consent_body?: string; welcome_message?: string; network_name?: string; }

export default function UserLogin() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PortalConfig>({});
  const [question, setQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState({ nombre_completo: '', cedula: '', whatsapp: '', fecha_nacimiento: '', direccion: '', security_answer: '' });
  const [showConsent, setShowConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal-config').then(r => r.json()).then(setConfig).catch(() => { });
    fetch('/api/questions/random').then(r => r.json()).then(setQuestion).catch(() => {
      setQuestion({ id: null, texto: '¿Cuánto es 5 + 3?', tipo: 'matematica' });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) { setShowConsent(true); return; }
    if (!form.nombre_completo.trim() || !form.cedula.trim()) { setError('Nombre y cédula son requeridos'); return; }
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, security_question_id: question?.id }),
      });
      if (!r.ok) {
        const err = await r.json();
        setError(err.error || 'Error al registrar');
        setSubmitting(false);
        return;
      }
      navigate('/success');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  const networkName = config.network_name || 'Venezuela WiFi';
  const welcome = config.welcome_message || 'Ingresa tus datos para navegar gratis en la red pública.';

  return (
    <div className="bg-white dark:bg-[#121212] font-sans antialiased min-h-screen flex flex-col items-center justify-start py-8 px-6 relative selection:bg-[#FDD041] selection:text-black">
      {/* Consent Modal */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" onClick={() => setShowConsent(false)} />
          <div className="relative w-full max-w-[300px] bg-white dark:bg-[#1E1E1E] rounded-[20px] shadow-2xl border border-white/20 overflow-hidden p-6 space-y-5 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-[#FDD041]/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#FDD041] text-2xl">privacy_tip</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-[17px] font-bold text-black dark:text-white leading-tight">{config.consent_title || 'Tratamiento de Datos'}</h3>
              <p className="text-[13px] leading-[19px] text-gray-600 dark:text-gray-300">{config.consent_body || 'Al conectarse a esta red WiFi pública, acepta el procesamiento de su información para fines estadísticos.'}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setAccepted(true); setShowConsent(false); }}
                className="w-full bg-[#1E1E1E] dark:bg-white text-white dark:text-[#1E1E1E] font-semibold text-[15px] py-3.5 rounded-full shadow-md active:scale-[0.98] transition-transform"
              >Aceptar y Continuar</button>
              <button onClick={() => setShowConsent(false)} className="w-full text-gray-400 text-sm py-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-md mx-auto flex flex-col items-center space-y-7">
        {/* Logo */}
        <header className="flex flex-col items-center text-center space-y-4 w-full pt-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#FDD041]/20 rounded-full blur-xl scale-150" />
            <div className="relative w-20 h-20 bg-[#FDD041]/10 dark:bg-[#FDD041]/20 rounded-full flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[#FDD041] text-4xl">wifi</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{networkName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">{welcome}</p>
          </div>
        </header>

        {error && (
          <div className="w-full flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>{error}
          </div>
        )}

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {[
            { id: 'nombre_completo', label: 'Nombre Completo', placeholder: 'Ej. Juan Pérez', icon: 'person', type: 'text' },
            { id: 'cedula', label: 'Cédula de Identidad', placeholder: 'V-12.345.678', icon: 'badge', type: 'text' },
            { id: 'whatsapp', label: 'WhatsApp', placeholder: '+58 412 123 4567', icon: 'chat', type: 'tel' },
            { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento', placeholder: '', icon: 'calendar_today', type: 'date' },
            { id: 'direccion', label: 'Dirección', placeholder: 'Sector, calle, casa/apto', icon: 'place', type: 'text' },
          ].map(f => (
            <div key={f.id} className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-900 dark:text-gray-100 ml-1">{f.label}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-xl group-focus-within:text-[#FDD041] transition-colors">{f.icon}</span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400/50 focus:ring-2 focus:ring-[#FDD041] focus:border-transparent transition-all outline-none text-sm"
                  id={f.id}
                  placeholder={f.placeholder}
                  type={f.type}
                  value={(form as any)[f.id]}
                  onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}

          {/* Security Question */}
          {question && (
            <div className="w-full bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[#FDD041] text-xl">security</span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Pregunta de Seguridad</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{question.texto}</p>
                <input
                  className="block w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400/50 focus:ring-2 focus:ring-[#FDD041] transition-all outline-none text-sm"
                  placeholder="Tu respuesta"
                  type={question.tipo === 'matematica' ? 'number' : 'text'}
                  value={form.security_answer}
                  onChange={e => setForm(p => ({ ...p, security_answer: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {accepted && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Términos y condiciones aceptados
              </div>
            )}
            <button
              className="w-full bg-[#FDD041] hover:bg-[#e5bc3b] text-black font-bold py-4 px-6 rounded-full shadow-lg shadow-[#FDD041]/20 transform transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#FDD041]/30 text-base tracking-wide disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Conectando...' : accepted ? 'Conéctate' : 'Revisar y Conectar'}
            </button>
          </div>
        </form>

        <footer className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-gray-400">Red WiFi Pública · Venezuela</p>
          <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-3" />
        </footer>
      </main>
    </div>
  );
}
