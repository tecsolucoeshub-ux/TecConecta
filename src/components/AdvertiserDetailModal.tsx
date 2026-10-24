import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Sparkles,
  MapPin,
  Instagram,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { SponsoredBanner } from '../types';
import { useTheme } from '../context/ThemeContext';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { recordBannerClick } from '../services/firebase';
import { generateFallbackBrandImage } from '../utils/imageCompressor';

interface AdvertiserDetailModalProps {
  banner: SponsoredBanner | null;
  isOpen: boolean;
  onClose: () => void;
  admWhatsapp?: string;
}

export const AdvertiserDetailModal: React.FC<AdvertiserDetailModalProps> = ({
  banner,
  isOpen,
  onClose,
  admWhatsapp,
}) => {
  const { isLight } = useTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Collect all photos: prefer banner.photos array, fallback to imageUrl or single fallback
  const photos: string[] = React.useMemo(() => {
    if (!banner) return [];
    if (banner.photos && banner.photos.length > 0) {
      return banner.photos.filter((p) => typeof p === 'string' && p.trim().length > 0);
    }
    if (banner.imageUrl && banner.imageUrl.trim().length > 0) {
      return [banner.imageUrl.trim()];
    }
    return [generateFallbackBrandImage(banner.companyName, banner.category)];
  }, [banner]);

  // Reset active photo index whenever a new banner is selected
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [banner?.id]);

  if (!isOpen || !banner) {
    return null;
  }

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleWhatsAppClick = () => {
    recordBannerClick(banner.id);
  };

  const whatsappMessage = `Olá ${banner.companyName}! Vi o seu destaque oficial no TecConecta e gostaria de mais informações.`;
  const whatsappUrl = buildWhatsAppUrl(banner.whatsapp, whatsappMessage);

  const googleMapsUrl = banner.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${banner.companyName} ${banner.address}`)}`
    : null;

  const instagramClean = banner.instagram
    ? banner.instagram.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
    : null;
  const instagramUrl = instagramClean ? `https://instagram.com/${instagramClean}` : null;

  return (
    <div
      id="advertiser-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[92vh] my-auto flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-gradient-to-b from-[#0F1B3E] via-[#0B132B] to-[#080E21] border-[#00E5FF]/40 text-[#F4F7F6] shadow-[0_0_50px_rgba(0,229,255,0.2)]'
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 text-[9px] sm:text-[10px] shrink-0">
              {banner.badgeText || 'Patrocinador Oficial'}
            </span>
            {banner.category && (
              <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-600' : 'text-[#00E5FF]'}`}>
                • {banner.category}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition ${
              isLight
                ? 'bg-slate-200/60 hover:bg-slate-300 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/15 border-white/10 text-gray-300 hover:text-white'
            }`}
            title="Fechar detalhes"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* ======================================================== */}
          {/* PHOTO GALLERY (ATÉ 5 FOTOS)                              */}
          {/* ======================================================== */}
          <div className="space-y-2">
            {/* Main Active Photo Container */}
            <div
              className={`relative w-full aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden border bg-black/60 shadow-lg group select-none ${
                isLight ? 'border-slate-300' : 'border-[#00E5FF]/30'
              }`}
            >
              <img
                key={photos[activePhotoIndex]}
                src={photos[activePhotoIndex]}
                alt={`${banner.companyName} - Foto ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Photo Counter Badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/20 pointer-events-none">
                {activePhotoIndex + 1} de {photos.length} fotos
              </div>

              {/* Official Sponsor Corner Badge */}
              <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded-xl bg-black/75 backdrop-blur-sm text-[10px] font-extrabold text-[#00E5FF] border border-[#00E5FF]/40 pointer-events-none flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FF6B00]" />
                <span>Destaque TecConecta</span>
              </div>

              {/* Navigation Arrows (if more than 1 photo) */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition backdrop-blur-sm shadow-md"
                    title="Foto anterior"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition backdrop-blur-sm shadow-md"
                    title="Próxima foto"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip (if 2 or more photos, up to 5) */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {photos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-16 sm:w-20 h-12 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      idx === activePhotoIndex
                        ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40 scale-105 shadow-md'
                        : isLight
                        ? 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                    title={`Ver foto ${idx + 1}`}
                  >
                    <img
                      src={photoUrl}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7.5px] font-bold text-center text-[#FF6B00] py-0.2">
                        Capa
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* COMPANY HEADER & HEADLINE                                */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className={`font-['Outfit'] text-xl sm:text-2xl font-extrabold tracking-tight leading-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {banner.companyName}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#FF6B00] leading-snug mt-0.5">
                  {banner.headline}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COMPLETE DESCRIPTION                                     */}
          {/* ======================================================== */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/10 text-gray-200'
            }`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Sobre a Empresa & Serviços</span>
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {banner.description || banner.subtext || 'Empresa parceira oficial com destaque no catálogo TecConecta.'}
            </p>
          </div>

          {/* ======================================================== */}
          {/* LOCATION, INSTAGRAM & CONTACT HIGHLIGHTS                */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Address / Location */}
            {banner.address && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Endereço / Local</span>
                  <p className="text-xs font-medium truncate text-gray-200">{banner.address}</p>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#00E5FF] hover:underline font-semibold inline-block mt-0.5"
                    >
                      Abrir no Google Maps &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Instagram */}
            {instagramUrl && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Instagram</span>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-pink-400 hover:underline truncate block"
                  >
                    @{instagramClean}
                  </a>
                </div>
              </div>
            )}

            {/* Category / Verified */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              } ${!banner.address && !instagramUrl ? 'sm:col-span-2' : ''}`}
            >
              <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Verificação</span>
                <p className="text-xs font-semibold text-white">Anunciante Oficial TecConecta</p>
                <span className="text-[10.5px] text-gray-400">Atendimento 100% direto sem taxas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div
          className={`p-4 sm:p-5 border-t shrink-0 flex flex-col sm:flex-row items-center gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080E21] border-white/10'
          }`}
        >
          {/* Big WhatsApp CTA */}
          <a
            href={whatsappUrl}
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#1ebd59] hover:to-[#0f7a6d] text-white font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(37,211,102,0.35)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
            title="Iniciar conversa no WhatsApp com a empresa"
          >
            <MessageCircle className="w-4 h-4 fill-white shrink-0" />
            <span>Falar com {banner.companyName} no WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-4 py-3 rounded-xl border text-xs font-semibold transition ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300 hover:text-white'
            }`}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
