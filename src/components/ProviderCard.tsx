import React, { useState, useEffect } from 'react';
import { MessageCircle, MapPin, Star, ShieldCheck, ImageIcon, Camera, Edit3 } from 'lucide-react';
import { Provider } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getProviderPhoto, generateFallbackBrandImage, CATEGORY_DEFAULT_PHOTOS } from '../utils/imageCompressor';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface ProviderCardProps {
  provider: Provider;
  userCoords?: { lat: number; lng: number } | null;
  onFocusOnMap?: (provider: Provider) => void;
  onOpenReview?: (provider: Provider) => void;
  onEditProfile?: (provider: Provider) => void;
  admWhatsapp?: string;
  isSelected?: boolean;
}

// Calculate Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  userCoords,
  onFocusOnMap,
  onOpenReview,
  onEditProfile,
  admWhatsapp,
  isSelected = false,
}) => {
  const { isLight } = useTheme();

  // Resilient image loading with automatic fallback chain for mobile devices
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getProviderPhoto(provider.imageUrl, provider.category, provider.name)
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getProviderPhoto(provider.imageUrl, provider.category, provider.name));
    setHasError(false);
  }, [provider.imageUrl, provider.category, provider.name]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      // If a category default photo exists and is different from current imgSrc, try that first
      const catPhoto = provider.category ? CATEGORY_DEFAULT_PHOTOS[provider.category] : null;
      if (catPhoto && imgSrc !== catPhoto) {
        setImgSrc(catPhoto);
        return;
      }
      // Fallback to high-tech SVG brand graphic matching TecSoluções neon palette
      setImgSrc(generateFallbackBrandImage(provider.name, provider.category));
    }
  };

  const admContactUrl = buildWhatsAppUrl(
    admWhatsapp || '64999317499',
    `Olá ADM TecSoluções! Sou responsável pelo perfil de "${provider.name}" (WhatsApp: ${provider.whatsapp}) e gostaria de solicitar uma atualização de dados ou de foto.`
  );

  const defaultMessage = `Olá ${provider.name}, vi seu anúncio no TecConecta (DaMaceno Soluções) e gostaria de solicitar um orçamento de ${provider.category}!`;
  const whatsappUrl = buildWhatsAppUrl(provider.whatsapp, defaultMessage);

  const distanceKm = userCoords
    ? calculateDistance(userCoords.lat, userCoords.lng, provider.lat, provider.lng)
    : null;

  return (
    <div
      id={`provider-card-${provider.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl transition-all duration-300 overflow-hidden border ${
        isLight
          ? isSelected
            ? 'bg-white border-[#00B4D8] shadow-[0_4px_25px_rgba(0,180,216,0.25)] ring-2 ring-[#00B4D8]'
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-[#00B4D8]/50'
          : isSelected
          ? 'bg-[#0E1738] border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.25)] ring-1 ring-[#00E5FF]'
          : 'bg-[#0E1738] border-white/10 hover:border-[#00E5FF]/40 hover:shadow-[0_8px_30px_rgba(0,229,255,0.12)]'
      }`}
    >
      {/* 1. Prominent Business Photo Showcase */}
      <div className="relative w-full h-38 sm:h-44 overflow-hidden bg-slate-900 shrink-0">
        <img
          src={imgSrc}
          alt={`Foto de ${provider.name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        {/* Direct "Trocar Foto" action button on the photo */}
        {onEditProfile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditProfile(provider);
            }}
            className="absolute bottom-2 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-[#00E5FF] text-white hover:text-[#0B132B] border border-white/20 hover:border-transparent text-[10px] font-bold backdrop-blur-md shadow-md transition pointer-events-auto"
            title="Trocar a foto de perfil do anunciante"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Trocar Foto</span>
          </button>
        )}

        {/* Top Badges over image */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0B132B]/90 text-[#00E5FF] border border-[#00E5FF]/40 backdrop-blur-md">
              {provider.category}
            </span>
            {provider.badge && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FF6B00]/90 text-white backdrop-blur-md">
                <ShieldCheck className="w-3 h-3" />
                {provider.badge}
              </span>
            )}
          </div>

          {/* Rating Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenReview) onOpenReview(provider);
            }}
            className="flex items-center gap-1 bg-[#0B132B]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-amber-400/40 text-amber-300 text-[11px] font-semibold shrink-0 hover:scale-105 hover:border-amber-400 hover:bg-[#0B132B] transition pointer-events-auto shadow-md group/rate"
            title="Clique para ver avaliações ou avaliar este profissional"
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 group-hover/rate:scale-110 transition-transform" />
            <span className="font-bold">{provider.rating ? provider.rating.toFixed(1) : '5.0'}</span>
            <span className="text-[9px] text-gray-300">({provider.reviewsCount || 1})</span>
          </button>
        </div>

        {/* Proximity / Distance Tag on Bottom Right of Image */}
        {distanceKm !== null && (
          <div className="absolute bottom-2 right-2.5 bg-[#0B132B]/90 text-[#00E5FF] backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#00E5FF]/30">
            ~{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
          </div>
        )}

        {/* Custom photo indicator pill if advertiser provided their own image */}
        {provider.imageUrl && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[9px] text-white/90 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded">
            <ImageIcon className="w-2.5 h-2.5 text-[#00E5FF]" />
            <span>Foto Oficial</span>
          </div>
        )}
      </div>

      {/* 2. Content & Information Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Business / Professional Name */}
          <h3
            className={`font-['Outfit'] text-sm sm:text-base font-bold leading-snug line-clamp-1 transition-colors ${
              isLight
                ? 'text-slate-900 group-hover:text-[#0097A7]'
                : 'text-white group-hover:text-[#00E5FF]'
            }`}
          >
            {provider.name}
          </h3>

          {/* Location Info (Clean, without exposing CEP to public) */}
          <div
            className={`mt-1.5 flex items-center gap-1 text-xs ${
              isLight ? 'text-slate-600' : 'text-gray-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
            <span className="truncate">
              {provider.neighborhood ? `${provider.neighborhood}, ` : ''}
              {provider.city}
            </span>
          </div>

          {/* Optional Street Address if specified */}
          {provider.address && !provider.address.includes('CEP') && (
            <p
              className={`text-[11px] truncate pl-4.5 mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {provider.address}
            </p>
          )}

          {/* Description */}
          {provider.description && (
            <p
              className={`mt-2 text-xs line-clamp-2 leading-relaxed p-2 rounded-xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-white/[0.03] border-white/5 text-gray-300'
              }`}
            >
              {provider.description}
            </p>
          )}
        </div>

        {/* 3. Action Area */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            {/* WhatsApp Direct Action Button */}
            <a
              id={`btn-whatsapp-${provider.id}`}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(37,211,102,0.25)] hover:brightness-110 active:scale-[0.98] transition"
              title="Abrir conversa direta no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>WhatsApp Direto</span>
            </a>

            {/* Direct Rate / Review Button */}
            {onOpenReview && (
              <button
                id={`btn-rate-${provider.id}`}
                type="button"
                onClick={() => onOpenReview(provider)}
                className={`rounded-xl border px-2.5 py-2 transition shrink-0 flex items-center gap-1 text-xs font-semibold ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:border-amber-400'
                }`}
                title="Avaliar serviço deste profissional"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Avaliar</span>
              </button>
            )}

            {/* View on Map button */}
            {onFocusOnMap && (
              <button
                id={`btn-map-focus-${provider.id}`}
                onClick={() => onFocusOnMap(provider)}
                className={`rounded-xl border p-2 transition shrink-0 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-[#0097A7]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 hover:bg-white/10'
                }`}
                title="Ver localização no mapa"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Advertisers notice in fine print */}
          <div
            className={`mt-2 pt-1.5 border-t flex items-center justify-between gap-1 text-[10px] ${
              isLight ? 'border-slate-100 text-slate-500' : 'border-white/5 text-gray-400'
            }`}
          >
            <span className="truncate">É anunciante?</span>
            <div className="flex items-center gap-2 shrink-0">
              {onEditProfile && (
                <button
                  type="button"
                  onClick={() => onEditProfile(provider)}
                  className={`hover:underline font-bold flex items-center gap-1 ${
                    isLight ? 'text-[#0097A7]' : 'text-[#00E5FF]'
                  }`}
                  title="Editar dados e foto de perfil deste anúncio"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Perfil & Foto</span>
                </button>
              )}
              <span className="opacity-40">•</span>
              <a
                href={admContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-gray-400 hover:text-gray-200"
                title="Falar com ADM via WhatsApp"
              >
                Falar com ADM
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
