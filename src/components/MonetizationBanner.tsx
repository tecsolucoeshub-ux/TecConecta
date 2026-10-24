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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* ======================================================== */}
        {/* BANNER 1 (SLOT ESQUERDO)                                */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-2xl overflow-hidden border p-3 sm:p-3.5 transition-all duration-300 flex flex-col justify-between ${
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
                  <span className="font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 shrink-0 text-[8.5px]">
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

              {/* Main Content & Actions: Rectangular Sponsor Banner + Proportional Compact Text */}
              <div className="flex items-center gap-3 sm:gap-3.5 mt-0.5">
                {/* Photo / Banner (Retângulo com Alta Visibilidade para o Patrocinador) */}
                <div className="relative w-36 sm:w-52 md:w-44 lg:w-56 h-24 sm:h-28 md:h-28 lg:h-32 rounded-xl overflow-hidden border border-[#FF6B00]/40 shadow-md shrink-0 bg-black/40 group">
                  {slot1Banner.imageUrl && !imageErrorMap[slot1Banner.id] ? (
                    <img
                      src={slot1Banner.imageUrl}
                      alt={slot1Banner.companyName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => {
                        setImageErrorMap((prev) => ({ ...prev, [slot1Banner!.id]: true }));
                      }}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <img
                      src={generateFallbackBrandImage(slot1Banner.companyName, slot1Banner.category)}
                      alt={slot1Banner.companyName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[8px] font-bold text-[#FF6B00] border border-[#FF6B00]/30 pointer-events-none flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#FF6B00]" />
                    <span>Destaque</span>
                  </div>
                </div>

                {/* Company Name & Compact Text Column (Dimensionada para Máxima Harmonia) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1 text-left">
                  <div>
                    <h3
                      className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {slot1Banner.companyName}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-[#FF6B00] leading-snug line-clamp-1 mt-0.5">
                      {slot1Banner.headline}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] leading-tight line-clamp-2 mt-0.5 opacity-90 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[10px] sm:text-[11px] font-bold shadow-sm hover:brightness-110 active:scale-95 transition self-start shrink-0"
                    title="Falar com o patrocinador no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Slot 1: Monetization Call */
            <div className="relative flex items-center gap-3 sm:gap-3.5 h-full">
              <div className="relative w-36 sm:w-52 md:w-44 lg:w-56 h-24 sm:h-28 md:h-28 lg:h-32 rounded-xl border border-dashed border-[#FF6B00]/40 bg-gradient-to-br from-[#FF6B00]/15 via-black/30 to-[#00E5FF]/10 flex flex-col items-center justify-center text-center p-2 shrink-0 group">
                <Megaphone className="w-5 h-5 text-[#FF6B00] mb-1 animate-pulse" />
                <span className="text-[9.5px] sm:text-[10px] font-extrabold text-[#FF6B00] uppercase font-['Outfit']">Espaço Patrocinado</span>
                <span className="text-[8px] sm:text-[8.5px] text-gray-400">Banner Retangular</span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1 text-left">
                <div>
                  <span className="text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 inline-block mb-0.5">
                    Espaço Destaque 1
                  </span>
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {adminSettings.bannerHeadline || 'Anuncie Sua Empresa Aqui'}
                  </h3>
                  <p className={`text-[9px] sm:text-[10px] line-clamp-2 leading-tight mt-0.5 opacity-90 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    {adminSettings.bannerSubtext || 'Espaço de alta visibilidade no topo do TecConecta.'}
                  </p>
                </div>

                <a
                  href={admContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold text-[10px] sm:text-[11px] font-['Outfit'] shadow-[0_0_12px_rgba(255,107,0,0.3)] transition transform hover:-translate-y-0.5 shrink-0 self-start"
                  title="Contatar comercial para anunciar neste espaço"
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Anuncie</span>
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* BANNER 2 (SLOT DIREITO)                                 */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-2xl overflow-hidden border p-3 sm:p-3.5 transition-all duration-300 flex flex-col justify-between ${
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
                  <span className="font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shrink-0 text-[8.5px]">
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

              {/* Main Content & Actions: Rectangular Sponsor Banner + Proportional Compact Text */}
              <div className="flex items-center gap-3 sm:gap-3.5 mt-0.5">
                {/* Photo / Banner (Retângulo com Alta Visibilidade para o Patrocinador) */}
                <div className="relative w-36 sm:w-52 md:w-44 lg:w-56 h-24 sm:h-28 md:h-28 lg:h-32 rounded-xl overflow-hidden border border-[#00E5FF]/40 shadow-md shrink-0 bg-black/40 group">
                  {slot2Banner.imageUrl && !imageErrorMap[slot2Banner.id] ? (
                    <img
                      src={slot2Banner.imageUrl}
                      alt={slot2Banner.companyName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => {
                        setImageErrorMap((prev) => ({ ...prev, [slot2Banner!.id]: true }));
                      }}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <img
                      src={generateFallbackBrandImage(slot2Banner.companyName, slot2Banner.category)}
                      alt={slot2Banner.companyName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[8px] font-bold text-[#00E5FF] border border-[#00E5FF]/30 pointer-events-none flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#00E5FF]" />
                    <span>Destaque</span>
                  </div>
                </div>

                {/* Company Name & Compact Text Column */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1 text-left">
                  <div>
                    <h3
                      className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {slot2Banner.companyName}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-[#00E5FF] leading-snug line-clamp-1 mt-0.5">
                      {slot2Banner.headline}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] leading-tight line-clamp-2 mt-0.5 opacity-90 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[10px] sm:text-[11px] font-bold shadow-sm hover:brightness-110 active:scale-95 transition self-start shrink-0"
                    title="Falar com o patrocinador no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Slot 2: Secondary Monetization Call */
            <div className="relative flex items-center gap-3 sm:gap-3.5 h-full">
              <div className="relative w-36 sm:w-52 md:w-44 lg:w-56 h-24 sm:h-28 md:h-28 lg:h-32 rounded-xl border border-dashed border-[#00E5FF]/40 bg-gradient-to-br from-[#00E5FF]/15 via-black/30 to-[#FF6B00]/10 flex flex-col items-center justify-center text-center p-2 shrink-0 group">
                <Sparkles className="w-5 h-5 text-[#00E5FF] mb-1 animate-pulse" />
                <span className="text-[9.5px] sm:text-[10px] font-extrabold text-[#00E5FF] uppercase font-['Outfit']">Espaço Patrocinado</span>
                <span className="text-[8px] sm:text-[8.5px] text-gray-400">Banner Retangular</span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1 text-left">
                <div>
                  <span className="text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 inline-block mb-0.5">
                    Espaço Destaque 2
                  </span>
                  <h3
                    className={`font-['Outfit'] text-xs sm:text-sm font-extrabold leading-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Destaque Sua Marca Aqui
                  </h3>
                  <p className={`text-[9px] sm:text-[10px] line-clamp-2 leading-tight mt-0.5 opacity-90 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                    Conecte sua empresa a centenas de clientes e prestadores locais.
                  </p>
                </div>

                <a
                  href={admContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-600 hover:from-cyan-600 hover:to-[#00E5FF] text-[#0B132B] font-bold text-[10px] sm:text-[11px] font-['Outfit'] shadow-[0_0_12px_rgba(0,229,255,0.3)] transition transform hover:-translate-y-0.5 shrink-0 self-start"
                  title="Contatar comercial para anunciar neste espaço"
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Anuncie</span>
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
