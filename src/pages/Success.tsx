import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center relative bg-[#FDD041] font-sans">
      <div className="w-full flex justify-center pt-12 pb-4 shrink-0 z-20">
        <span className="material-symbols-outlined text-[#1E1E1E] opacity-50 text-2xl">wifi</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 -mt-10">
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          <div className="absolute inset-0 border border-[#1E1E1E] opacity-20 rounded-full w-full h-full animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute border border-[#1E1E1E] opacity-15 rounded-full w-40 h-40 animate-[spin_30s_linear_infinite_reverse]"></div>
          <div className="relative z-10 w-16 h-16 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#1E1E1E] text-5xl font-light">check</span>
          </div>
        </div>

        <div className="text-center space-y-3 px-8">
          <h1 className="text-2xl font-bold text-[#1E1E1E] tracking-tight">
            Conexión establecida
          </h1>
          <p className="text-[#1E1E1E] opacity-70 text-base font-normal">
            Ya puedes navegar libremente
          </p>
        </div>
      </div>

      <div className="w-full px-6 pb-12 shrink-0 z-20">
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-[#1E1E1E] text-white font-semibold text-lg py-4 rounded-full shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
