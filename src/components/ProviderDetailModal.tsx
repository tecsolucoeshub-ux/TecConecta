import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Sparkles,
  MapPin,
  Instagram,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Navigation,
  Briefcase
} from 'lucide-react';
import { Provider } from '../types';
import { useTheme } from '../context/ThemeContext';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { recordProviderClick } from '../services/firebase';
import { getProviderPhoto } from '../utils/imageCompressor';

interface ProviderDetailModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReview?: (provider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  admWhatsapp?: string;
}

// Calculate Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  isOpen,
  onClose,
  onOpenReview,
  userCoords,
  admWhatsapp = '64999317499',
}) => {
  const { isLight } = useTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Gather photos: prefer provider.photos array, fallback to imageUrl or category fallback
  const photos: string[] = useMemo(() => {
    if (!provider) return [];
    if (provider.photos && Array.isArray(provider.photos) && provider.photos.length > 0) {
      const valid = provider.photos.filter((p) => typeof p === 'string' && p.trim().length > 0);
      if (valid.length > 0) return valid;
    }
    if (provider.imageUrl && provider.imageUrl.trim().length > 0) {
      return [provider.imageUrl.trim()];
    }
    return [getProviderPhoto(undefined, provider.category, provider.name)];
  }, [provider]);

  // Reset active photo index when provider changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [provider?.id]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !provider) {
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

  const defaultMessage = `Olá ${provider.name}, vi seu perfil completo no TecConecta (TecSoluções) e gostaria de solicitar um orçamento de ${provider.category}!`;
  const whatsappUrl = buildWhatsAppUrl(provider.whatsapp, defaultMessage);

  const handleWhatsAppClick = () => {
    recordProviderClick(provider.id);
  };

  const distanceKm =
    userCoords && typeof provider.lat === 'number' && typeof provider.lng === 'number' && !isNaN(provider.lat) && !isNaN(provider.lng)
      ? calculateDistance(userCoords.lat, userCoords.lng, provider.lat, provider.lng)
      : null;

  const googleMapsRouteUrl =
    typeof provider.lat === 'number' && typeof provider.lng === 'number' && !isNaN(provider.lat) && !isNaN(provider.lng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${provider.name} ${provider.city}`)}`;

  const instagramClean = provider.instagram
    ? provider.instagram.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '').trim()
    : null;
  const instagramUrl = instagramClean ? `https://instagram.com/${instagramClean}` : null;

  const admContactUrl = buildWhatsAppUrl(
    admWhatsapp,
    `Olá ADM TecSoluções! Sou responsável pelo anúncio de "${provider.name}" (WhatsApp: ${provider.whatsapp}) e gostaria de solicitar alteração de dados/fotos mediante taxa de manutenção da plataforma.`
  );

  return (
    <div
      id="provider-detail-modal-backdrop"
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
            <span className="font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 text-[9px] sm:text-[10px] shrink-0">
              {provider.category}
            </span>
            <span
              className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md ${
                provider.businessType === 'mei'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {provider.businessType === 'mei' ? '💼 MEI Verificado' : '🧑‍🔧 Autônomo'}
            </span>
            {provider.badge && (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[9.5px] font-semibold px-2 py-0.5 rounded-md bg-[#FF6B00]/90 text-white">
                <ShieldCheck className="w-3 h-3" />
                {provider.badge}
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
                alt={`${provider.name} - Foto ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Photo Counter Badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/20 pointer-events-none">
                {activePhotoIndex + 1} de {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
              </div>

              {/* Verified Pill */}
              <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded-xl bg-black/75 backdrop-blur-sm text-[10px] font-extrabold text-[#00E5FF] border border-[#00E5FF]/40 pointer-events-none flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FF6B00]" />
                <span>Perfil Verificado TecConecta</span>
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
          {/* TITLE, REVIEWS & BUSINESS IDENTITY                       */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white leading-tight">
                {provider.name}
              </h2>

              {/* Review / Rating Button */}
              {onOpenReview && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenReview(provider);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0 transition"
                  title="Clique para avaliar este profissional"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{provider.rating ? provider.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-[10px] text-gray-300">({provider.reviewsCount || 1} avaliações)</span>
                </button>
              )}
            </div>

            {/* Location & GPS Proximity */}
            <div className="flex items-center gap-2 text-xs text-gray-300 flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-200">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span className="font-medium">
                  {provider.neighborhood ? `${provider.neighborhood}, ` : ''}
                  {provider.city}
                </span>
              </div>
              {distanceKm !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[10px] font-bold">
                  <Navigation className="w-2.5 h-2.5" />
                  {distanceKm < 1 ? `A ${Math.round(distanceKm * 1000)}m de você` : `A ${distanceKm.toFixed(1)} km de você`}
                </span>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* DESCRIPTION & SERVICES                                   */}
          {/* ======================================================== */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-white/[0.03] border-white/10 text-gray-200'
            }`}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Sobre o Profissional e Serviços</span>
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {provider.description ||
                `Profissional qualificado em ${provider.category} atuando em ${provider.city}. Entre em contato diretamente para solicitar orçamentos, disponibilidade e informações completas.`}
            </p>
          </div>

          {/* ======================================================== */}
          {/* PHYSICAL LOCATION / ROUTE                                */}
          {/* ======================================================== */}
          {provider.address && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block font-semibold">Endereço / Ponto de Atendimento:</strong>
                  <span className="text-gray-300">{provider.address}</span>
                  {provider.neighborhood && <span className="text-gray-400"> • {provider.neighborhood}</span>}
                </div>
              </div>

              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition shrink-0"
                title="Abrir rota no Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Traçar Rota no GPS</span>
              </a>
            </div>
          )}

          {/* ======================================================== */}
          {/* SOCIAL & DIGITAL PRESENCE                                */}
          {/* ======================================================== */}
          {instagramUrl && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FD1D1D] to-[#E1306C] flex items-center justify-center text-white shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Instagram Oficial</span>
                  <span className="text-[11px] text-gray-400">@{instagramClean}</span>
                </div>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E1306C]/20 hover:bg-[#E1306C]/30 border border-[#E1306C]/40 text-[#E1306C] text-xs font-bold transition"
              >
                <span>Acessar Instagram</span>
              </a>
            </div>
          )}

          {/* ======================================================== */}
          {/* CALL TO ACTIONS (WHATSAPP & REVIEW)                      */}
          {/* ======================================================== */}
          <div className="pt-2 space-y-2.5">
            <a
              id={`detail-whatsapp-btn-${provider.id}`}
              href={whatsappUrl}
              onClick={handleWhatsAppClick}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.35)] hover:brightness-110 active:scale-[0.99] transition"
            >
              <MessageCircle className="w-5 h-5 fill-white shrink-0" />
              <span>Chamar no WhatsApp Direto</span>
            </a>

            {onOpenReview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReview(provider);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Avaliar Atendimento deste Profissional</span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* ADVERTISER MANAGEMENT NOTICE (EXCLUSIVELY VIA ADM)       */}
          {/* ======================================================== */}
          <div
            className={`pt-3.5 border-t text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-gray-400'
            }`}
          >
            <span>É anunciante? Alterações cadastrais e de fotos são feitas exclusivamente pelo ADM:</span>
            <a
              href={admContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#00E5FF] hover:underline shrink-0"
              title="Solicitar alterações de fotos ou dados com a administração da TecSoluções"
            >
              Falar com ADM (WhatsApp)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
