import React from 'react';
import { Sparkles, MessageCircle, MapPin, Zap, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface TecBrandHeroProps {
  onOpenRegister: () => void;
  onExplore: () => void;
}

export const TecBrandHero: React.FC<TecBrandHeroProps> = ({ onOpenRegister, onExplore }) => {
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

      <div className="relative max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Main Brand Content */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 text-left">
            {/* Official Brand Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] sm:text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
              <span className="font-['Outfit'] uppercase tracking-wider font-bold">DaMaceno Soluções</span>
              <span className="text-white/40">•</span>
              <span className="text-[#F4F7F6]">TecConecta</span>
            </div>

            {/* Headline with Brand Gradient */}
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Conexão Direta entre{' '}
              <span className="bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-[#FF6B00] bg-clip-text text-transparent">
                Clientes e Prestadores
              </span>{' '}
              no seu Bairro
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#F4F7F6]/85 max-w-2xl leading-relaxed">
              Eliminamos intermediários e taxas abusivas. Negocie serviços e comércios locais <strong>100% direto pelo WhatsApp</strong>.
            </p>

            {/* 3 Core Value Pillars - Sleek on mobile */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="w-6 h-6 rounded-md bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-white font-['Outfit'] leading-tight">Sem Taxas</h4>
                  <p className="text-[9.5px] text-gray-400 hidden sm:block">Zero comissão</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="w-6 h-6 rounded-md bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-white font-['Outfit'] leading-tight">WhatsApp</h4>
                  <p className="text-[9.5px] text-gray-400 hidden sm:block">Direto e rápido</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="w-6 h-6 rounded-md bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-white font-['Outfit'] leading-tight">No Mapa</h4>
                  <p className="text-[9.5px] text-gray-400 hidden sm:block">Geolocalizado</p>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-hero-register"
                onClick={onOpenRegister}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-400 hover:from-cyan-400 hover:to-[#00E5FF] text-[#0B132B] font-bold text-xs sm:text-sm font-['Outfit'] flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(0,229,255,0.35)] transition transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0B132B] shrink-0" />
                <span>Cadastrar Negócio Grátis</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <button
                id="btn-hero-explore"
                onClick={onExplore}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#F4F7F6] font-semibold text-xs sm:text-sm transition hover:border-[#00E5FF]/50 flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Ver Lista & Mapa</span>
              </button>
            </div>
          </div>

          {/* Right Brand Badge / Visual Showcase (Hidden on very small mobile to prioritize actual provider listings) */}
          <div className="hidden lg:flex lg:col-span-4 justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#101F48] to-[#091024] border border-[#00E5FF]/30 p-4 shadow-[0_0_30px_rgba(0,229,255,0.12)] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] font-bold text-xs">
                    DS
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">DaMaceno Soluções</span>
                    <span className="text-xs font-bold text-white font-['Outfit']">Ecossistema Digital</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                  Oficial
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  <span>Sem comissão sobre o seu serviço</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  <span>O cliente chama você diretamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  <span>Visualização simultânea em lista e mapa</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px]">
                <span className="text-gray-400">Desenvolvido por</span>
                <span className="font-bold text-[#00E5FF] tracking-wide">DaMaceno Soluções</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
