import React from 'react';
import { MessageCircle, MapPin, Zap, Compass } from 'lucide-react';

interface TecBrandHeroProps {
  onExplore: () => void;
}

export const TecBrandHero: React.FC<TecBrandHeroProps> = ({ onExplore }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#070D1E] via-[#0B132B] to-[#0E1B40] border-b border-white/10">
      {/* Subtle Tech Circuit & Neon Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#00E5FF]/15 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-[#FF6B00]/15 blur-3xl" />
        <svg className="w-full h-full text-[#00E5FF]/10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-circuit-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="30" cy="30" r="1.5" fill="#00E5FF" fillOpacity="0.4" />
              <path d="M 30 15 L 30 45 M 15 30 L 45 30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-circuit-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 lg:py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5">
          {/* Official Brand Badge - Only TecConecta with the pulsing dot */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs font-semibold tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
            <span className="font-['Outfit'] uppercase tracking-widest font-extrabold text-white text-xs sm:text-sm">
              Tec<span className="text-[#00E5FF]">Conecta</span>
            </span>
            <span className="text-white/40">•</span>
            <span className="text-xs text-[#00E5FF] font-bold">Conexão Direta</span>
          </div>

          {/* Centered Headline with Brand Gradient */}
          <h1 className="font-['Outfit'] text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            Conexão Direta entre{' '}
            <span className="bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-[#FF6B00] bg-clip-text text-transparent">
              Clientes e Prestadores
            </span>{' '}
            no seu Bairro
          </h1>

          {/* Centered Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-[#F4F7F6]/85 max-w-2xl leading-relaxed">
            Eliminamos intermediários e taxas abusivas. Encontre profissionais autônomos e MEIs locais e negocie <strong>100% direto pelo WhatsApp</strong>.
          </p>

          {/* 3 Core Value Pillars - Centered */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xl pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#00E5FF]/30 transition">
              <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit'] leading-tight">Sem Taxas</h4>
                <p className="text-[10px] text-gray-400 hidden sm:block">Zero comissão</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#25D366]/30 transition">
              <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit'] leading-tight">WhatsApp</h4>
                <p className="text-[10px] text-gray-400 hidden sm:block">Direto e rápido</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#FF6B00]/30 transition">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit'] leading-tight">No Mapa</h4>
                <p className="text-[10px] text-gray-400 hidden sm:block">Geolocalizado</p>
              </div>
            </div>
          </div>

          {/* Quick Action: Explore listings (single register button is kept exclusively at top navbar) */}
          <div className="pt-2">
            <button
              id="btn-hero-explore"
              onClick={onExplore}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#F4F7F6] font-semibold text-xs sm:text-sm transition hover:border-[#00E5FF]/50 flex items-center justify-center gap-2 shadow-lg"
            >
              <Compass className="w-4 h-4 text-[#00E5FF]" />
              <span>Explorar Profissionais & Mapa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

