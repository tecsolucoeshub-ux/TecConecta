import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, MessageCircle, Sparkles, ArrowUpRight, ImageIcon } from 'lucide-react';
import { SponsoredBanner, AdminSettings } from '../types';
import { useTheme } from '../context/ThemeContext';

interface MonetizationBannerProps {
  banners: SponsoredBanner[];
  adminSettings: AdminSettings;
  onOpenAdmin?: () => void;
}

export const MonetizationBanner: React.FC<MonetizationBannerProps> = ({
  banners,
  adminSettings,
}) => {
  const { isLight } = useTheme();

  // Ensure strict deduplication so each advertiser only ever appears in ONE banner
  const activeBanners = useMemo(() => {
    const seen = new Set<string>();
    return banners.filter((b) => {
      if (!b || !b.active) return false;
      const key = (b.companyName || b.id).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate between sponsored companies if more than 1
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentIndex] || null;

  // Clean WhatsApp for ADM
  const cleanAdmWhatsapp = adminSettings.admWhatsapp.replace(/\D/g, '');
  const admContactUrl = `https://wa.me/55${cleanAdmWhatsapp}?text=${encodeURIComponent(
    'Olá! Tenho interesse em anunciar minha empresa no banner de destaque do TecConecta (DaMaceno Soluções). Gostaria de mais informações sobre os planos.'
  )}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div
        className={`relative rounded-2xl overflow-hidden border p-4 sm:p-5 transition-all duration-300 ${
          isLight
            ? 'bg-gradient-to-r from-orange-50/80 via-white to-cyan-50/70 border-orange-200/90 shadow-md shadow-orange-500/5'
            : 'border-[#FF6B00]/30 bg-gradient-to-r from-[#0C1530] via-[#111F45] to-[#1A1A3A] shadow-[0_0_30px_rgba(255,107,0,0.12)]'
        }`}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-32 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left Column: Sponsored Company (if any) or Main Ad Call */}
          <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Visual Icon or Business Photo Showcase */}
            {currentBanner?.imageUrl ? (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0 bg-black/40 group">
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.companyName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-0.5 text-center">
                  <span className="text-[8.5px] font-bold text-[#00E5FF] tracking-wider uppercase">Destaque</span>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00]/25 to-[#00E5FF]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.25)] shrink-0">
                <Megaphone className="w-6 h-6 animate-pulse" />
              </div>
            )}

            {currentBanner ? (
              <div className="space-y-1 text-left flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                    {currentBanner.badgeText || 'Empresa Patrocinada'}
                  </span>
                  {currentBanner.category && (
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      • {currentBanner.category}
                    </span>
                  )}
                  {activeBanners.length > 1 && (
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      ({currentIndex + 1}/{activeBanners.length})
                    </span>
                  )}
                </div>

                <h3
                  className={`font-['Outfit'] text-base sm:text-lg font-bold leading-tight truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {currentBanner.companyName}:{' '}
                  <span className={isLight ? 'text-[#0097A7] font-semibold' : 'text-[#00E5FF] font-medium'}>
                    {currentBanner.headline}
                  </span>
                </h3>

                <p className={`text-xs line-clamp-1 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                  {currentBanner.subtext}
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                    Espaço Publicitário
                  </span>
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-[#0097A7]' : 'text-[#00E5FF]'}`}>
                    Monetização & Parcerias
                  </span>
                </div>

                <h3
                  className={`font-['Outfit'] text-base sm:text-xl font-extrabold leading-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {adminSettings.bannerHeadline || 'Anuncie Sua Empresa Aqui'}
                </h3>

                <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                  {adminSettings.bannerSubtext || 'Entre em contato com o departamento administrativo'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Actions (Contact Sponsor + Anuncie Aqui / Contatar ADM) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            {/* If there is a current sponsor, provide button to talk to them */}
            {currentBanner && (
              <a
                href={`https://wa.me/55${currentBanner.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá ${currentBanner.companyName}, vi seu destaque no banner do TecConecta (DaMaceno Soluções)!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                    : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Falar com {currentBanner.companyName.split(' ')[0]}</span>
              </a>
            )}

            {/* ADM Contact Button (Always visible to recruit more sponsors) */}
            <a
              id="btn-monetize-contact-adm"
              href={admContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold text-xs font-['Outfit'] flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,107,0,0.35)] transition transform hover:-translate-y-0.5 text-center"
              title="Negociação direta fora da plataforma com o departamento administrativo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anuncie Sua Empresa Aqui</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
