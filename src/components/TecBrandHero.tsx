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

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Brand Content */}
          <div className="lg:col-span-8 space-y-4 text-left">
            {/* Official Brand Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-semibold tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              <span className="font-['Outfit'] uppercase tracking-wider font-bold">DaMaceno Soluções Apresenta</span>
              <span className="text-white/40">•</span>
              <span className="text-[#F4F7F6]">TecConecta</span>
            </div>

            {/* Headline with Brand Gradient */}
            <h1 className="font-['Outfit'] text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Conexão Direta entre{' '}
              <span className="bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-[#FF6B00] bg-clip-text text-transparent">
                Clientes e Prestadores
              </span>{' '}
              do seu Bairro
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#F4F7F6]/85 max-w-2xl leading-relaxed">
              Eliminamos taxas, comissões e intermediários abusivos. Encontre profissionais autônomos, prestadores de serviços e comércios locais com negociação <strong>100% direta no WhatsApp</strong>.
            </p>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#00E5FF]/40 transition">
                <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-['Outfit']">Zero Intermediação</h4>
                  <p className="text-[11px] text-gray-400">Sem taxas nem comissões</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#25D366]/40 transition">
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-['Outfit']">100% WhatsApp</h4>
                  <p className="text-[11px] text-gray-400">Converse e combine direto</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#FF6B00]/40 transition">
                <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-['Outfit']">Geolocalizado</h4>
                  <p className="text-[11px] text-gray-400">Busca rápida e no mapa</p>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="btn-hero-register"
                onClick={onOpenRegister}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-400 hover:from-cyan-400 hover:to-[#00E5FF] text-[#0B132B] font-bold text-sm font-['Outfit'] flex items-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Sparkles className="w-4 h-4 text-[#0B132B]" />
                <span>Cadastrar Meu Negócio Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-hero-explore"
                onClick={onExplore}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#F4F7F6] font-semibold text-xs sm:text-sm transition hover:border-[#00E5FF]/50 flex items-center gap-2"
              >
                <span>Explorar Serviços e Mapa</span>
              </button>
            </div>
          </div>

          {/* Right Brand Badge / Visual Showcase */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#101F48] to-[#091024] border border-[#00E5FF]/30 p-5 shadow-[0_0_40px_rgba(0,229,255,0.15)] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
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

              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>Nenhum percentual sobre o seu serviço</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>O cliente chama você diretamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>Visualização simultânea em lista e mapa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>Geocodificação instantânea por CEP</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
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
