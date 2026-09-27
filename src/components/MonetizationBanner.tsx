import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, MessageCircle, Sparkles, ArrowUpRight } from 'lucide-react';
import { SponsoredBanner, AdminSettings } from '../types';
import { useTheme } from '../context/ThemeContext';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { generateFallbackBrandImage } from '../utils/imageCompressor';
import { recordBannerClick } from '../services/firebase';

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

  // Strict deduplication so each active advertiser only appears once in the rotation pool
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

  const [rotationTick, setRotationTick] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // Auto-rotate every 6 seconds when 2 or more banners are available
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setRotationTick((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  // Determine which banner is shown on Slot 1 (Left) and Slot 2 (Right)
  let slot1Banner: SponsoredBanner | null = null;
  let slot2Banner: SponsoredBanner | null = null;
  let slot1Index = 0;
  let slot2Index = 1;

  if (activeBanners.length === 1) {
    slot1Banner = activeBanners[0];
    slot2Banner = null; // Slot 2 displays monetization invitation
  } else if (activeBanners.length === 2) {
    if (rotationTick % 2 === 0) {
      slot1Banner = activeBanners[0];
      slot2Banner = activeBanners[1];
      slot1Index = 0;
      slot2Index = 1;
    } else {
      slot1Banner = activeBanners[1];
      slot2Banner = activeBanners[0];
      slot1Index = 1;
      slot2Index = 0;
    }
  } else if (activeBanners.length >= 3) {
    slot1Index = rotationTick % activeBanners.length;
    slot2Index = (rotationTick + 1) % activeBanners.length;
    slot1Banner = activeBanners[slot1Index];
    slot2Banner = activeBanners[slot2Index];
  }

  const admContactUrl = buildWhatsAppUrl(
    adminSettings.admWhatsapp || '64999317499',
    'Olá! Tenho interesse em anunciar minha empresa em um dos banners de destaque do TecConecta (TecSoluções). Gostaria de mais informações sobre os planos.'
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* ======================================================== */}
        {/* BANNER 1 (SLOT ESQUERDO)                                */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-2xl overflow-hidden border p-2.5 sm:p-3 transition-all duration-300 flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-r from-orange-50/90 via-white to-orange-50/40 border-orange-200/90 shadow-sm'
              : 'border-[#FF6B00]/30 bg-gradient-to-r from-[#0C1530] via-[#111F45] to-[#1A1A3A] shadow-[0_0_20px_rgba(255,107,0,0.08)]'
          }`}
        >
          {/* Subtle Glow Accent */}
          <div className="absolute top-0 left-0 w-48 h-24 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none" />

          {slot1Banner ? (
            <div className="relative flex flex-col justify-between h-full space-y-2">
              {/* Header: Badge & Category */}
              <div className="flex items-center justify-between gap-1.5 text-[9.5px]">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 shrink-0">
                    {slot1Banner.badgeText || 'Patrocinador Oficial'}
                  </span>
                  {slot1Banner.category && (
                    <span className={`truncate font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      • {slot1Banner.category}
                    </span>
                  )}
                  {activeBanners.length > 2 && (
                    <span className={`font-mono text-[9px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      ({slot1Index + 1}/{activeBanners.length})
                    </span>
                  )}
                </div>

                <a
                  href={admContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:underline flex items-center gap-0.5 shrink-0 text-[10px] font-semibold ${
                    isLight ? 'text-[#0097A7]' : 'text-[#00E5FF]'
                  }`}
                  title="Anuncie também a sua empresa no TecConecta"
                >
                  <Sparkles className="w-2.5 h-2.5 text-[#FF6B00]" />
                  <span>Anuncie</span>
                </a>
              </div>

              {/* Main Content & Actions Row */}
              <div className="flex items-center justify-between gap-2.5">
                {/* Photo / Logo */}
                {slot1Banner.imageUrl && !imageErrorMap[slot1Banner.id] ? (
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-[#FF6B00]/50 shadow-[0_0_12px_rgba(255,107,0,0.2)] shrink-0 bg-black/40 group">
                    <img
                      src={slot1Banner.imageUrl}
                      alt={slot1Banner.companyName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => {
                        setImageErrorMap((prev) => ({ ...prev, [slot1Banner!.id]: true }));
                      }}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#FF6B00]/40 shrink-0 shadow-sm">
                    <img
                      src={generateFallbackBrandImage(slot1Banner.companyName, slot1Banner.category)}
                      alt={slot1Banner.companyName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Company Name & Headline */}
                <div className="space-y-0.5 text-left flex-1 min-w-0">
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-bold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {slot1Banner.companyName}:{' '}
                    <span className={isLight ? 'text-[#0097A7] font-semibold' : 'text-[#00E5FF] font-medium'}>
                      {slot1Banner.headline}
                    </span>
                  </h3>
                  <p className={`text-[11px] line-clamp-1 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    {slot1Banner.subtext}
                  </p>
                </div>

                {/* Contact Sponsor Button */}
                <a
                  href={buildWhatsAppUrl(
                    slot1Banner.whatsapp,
                    `Olá ${slot1Banner.companyName}, vi seu destaque no banner do TecConecta (TecSoluções)!`
                  )}
                  onClick={() => recordBannerClick(slot1Banner!.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition shrink-0 shadow-sm ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                  title="Falar com o patrocinador no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* Empty Slot 1: Monetization Call */
            <div className="relative flex items-center justify-between gap-3 h-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#FF6B00]/25 to-[#00E5FF]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.2)] shrink-0">
                  <Megaphone className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-0.5 text-left min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 inline-block">
                    Espaço Destaque 1
                  </span>
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {adminSettings.bannerHeadline || 'Anuncie Sua Empresa Aqui'}
                  </h3>
                  <p className={`text-[10.5px] truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    {adminSettings.bannerSubtext || 'Espaço de alta visibilidade no topo do TecConecta.'}
                  </p>
                </div>
              </div>

              <a
                href={admContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold text-xs font-['Outfit'] flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(255,107,0,0.3)] transition transform hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
                title="Contatar comercial para anunciar neste espaço"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Anuncie</span>
                <ArrowUpRight className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* BANNER 2 (SLOT DIREITO)                                 */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-2xl overflow-hidden border p-2.5 sm:p-3 transition-all duration-300 flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-r from-cyan-50/90 via-white to-cyan-50/40 border-cyan-200/90 shadow-sm'
              : 'border-[#00E5FF]/30 bg-gradient-to-r from-[#081226] via-[#0E2042] to-[#141C38] shadow-[0_0_20px_rgba(0,229,255,0.08)]'
          }`}
        >
          {/* Subtle Glow Accent */}
          <div className="absolute top-0 right-0 w-48 h-24 bg-[#00E5FF]/10 rounded-full blur-2xl pointer-events-none" />

          {slot2Banner ? (
            <div className="relative flex flex-col justify-between h-full space-y-2">
              {/* Header: Badge & Category */}
              <div className="flex items-center justify-between gap-1.5 text-[9.5px]">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shrink-0">
                    {slot2Banner.badgeText || 'Parceiro Destaque'}
                  </span>
                  {slot2Banner.category && (
                    <span className={`truncate font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      • {slot2Banner.category}
                    </span>
                  )}
                  {activeBanners.length > 2 && (
                    <span className={`font-mono text-[9px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      ({slot2Index + 1}/{activeBanners.length})
                    </span>
                  )}
                </div>

                <a
                  href={admContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:underline flex items-center gap-0.5 shrink-0 text-[10px] font-semibold ${
                    isLight ? 'text-[#0097A7]' : 'text-[#00E5FF]'
                  }`}
                  title="Anuncie também a sua empresa no TecConecta"
                >
                  <Sparkles className="w-2.5 h-2.5 text-[#00E5FF]" />
                  <span>Anuncie</span>
                </a>
              </div>

              {/* Main Content & Actions Row */}
              <div className="flex items-center justify-between gap-2.5">
                {/* Photo / Logo */}
                {slot2Banner.imageUrl && !imageErrorMap[slot2Banner.id] ? (
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-[#00E5FF]/50 shadow-[0_0_12px_rgba(0,229,255,0.2)] shrink-0 bg-black/40 group">
                    <img
                      src={slot2Banner.imageUrl}
                      alt={slot2Banner.companyName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => {
                        setImageErrorMap((prev) => ({ ...prev, [slot2Banner!.id]: true }));
                      }}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#00E5FF]/40 shrink-0 shadow-sm">
                    <img
                      src={generateFallbackBrandImage(slot2Banner.companyName, slot2Banner.category)}
                      alt={slot2Banner.companyName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Company Name & Headline */}
                <div className="space-y-0.5 text-left flex-1 min-w-0">
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-bold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {slot2Banner.companyName}:{' '}
                    <span className={isLight ? 'text-[#FF6B00] font-semibold' : 'text-[#FF6B00] font-medium'}>
                      {slot2Banner.headline}
                    </span>
                  </h3>
                  <p className={`text-[11px] line-clamp-1 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    {slot2Banner.subtext}
                  </p>
                </div>

                {/* Contact Sponsor Button */}
                <a
                  href={buildWhatsAppUrl(
                    slot2Banner.whatsapp,
                    `Olá ${slot2Banner.companyName}, vi seu destaque no banner do TecConecta (TecSoluções)!`
                  )}
                  onClick={() => recordBannerClick(slot2Banner!.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition shrink-0 shadow-sm ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                  title="Falar com o patrocinador no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* Empty Slot 2: Secondary Monetization Call */
            <div className="relative flex items-center justify-between gap-3 h-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#00E5FF]/25 to-[#FF6B00]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)] shrink-0">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-0.5 text-left min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 inline-block">
                    Espaço Destaque 2
                  </span>
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Destaque Sua Marca Aqui
                  </h3>
                  <p className={`text-[10.5px] truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    Conecte sua empresa a centenas de clientes e autônomos locais.
                  </p>
                </div>
              </div>

              <a
                href={admContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-600 hover:from-cyan-600 hover:to-[#00E5FF] text-[#0B132B] font-bold text-xs font-['Outfit'] flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(0,229,255,0.3)] transition transform hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
                title="Contatar comercial para anunciar neste espaço"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Anuncie</span>
                <ArrowUpRight className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
