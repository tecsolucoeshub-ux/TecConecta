import React from 'react';
import { MessageCircle, MapPin, Star, ShieldCheck, ImageIcon } from 'lucide-react';
import { Provider } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getProviderPhoto } from '../utils/imageCompressor';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface ProviderCardProps {
  provider: Provider;
  userCoords?: { lat: number; lng: number } | null;
  onFocusOnMap?: (provider: Provider) => void;
  onOpenReview?: (provider: Provider) => void;
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
  admWhatsapp,
  isSelected = false,
}) => {
  const { isLight } = useTheme();

  const admContactUrl = buildWhatsAppUrl(
    admWhatsapp || '64999317499',
    `Olá ADM TecSoluções! Sou responsável pelo perfil cadastrado de "${provider.name}" (WhatsApp: ${provider.whatsapp}) e gostaria de solicitar uma atualização de dados cadastrais ou de foto.`
  );

  const defaultMessage = `Olá ${provider.name}, vi seu anúncio no TecConecta da DaMaceno Soluções e gostaria de solicitar um orçamento de ${provider.category}!`;
  const whatsappUrl = buildWhatsAppUrl(provider.whatsapp, defaultMessage);

  const distanceKm = userCoords
    ? calculateDistance(userCoords.lat, userCoords.lng, provider.lat, provider.lng)
    : null;

  const photoUrl = getProviderPhoto(provider.imageUrl, provider.category);

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
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-900/60 shrink-0">
        <img
          src={photoUrl}
          alt={`Foto de ${provider.name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top Badges over image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#0B132B]/85 text-[#00E5FF] border border-[#00E5FF]/40 backdrop-blur-md">
              {provider.category}
            </span>
            {provider.badge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FF6B00]/90 text-white backdrop-blur-md">
                <ShieldCheck className="w-3 h-3" />
                {provider.badge}
              </span>
            )}
          </div>

          {/* Rating Pill (Clickable to evaluate or view reviews) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenReview) onOpenReview(provider);
            }}
            className="flex items-center gap-1 bg-[#0B132B]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-400/40 text-amber-300 text-xs font-semibold shrink-0 hover:scale-105 hover:border-amber-400 hover:bg-[#0B132B] transition pointer-events-auto shadow-md group/rate"
            title="Clique para ver avaliações da comunidade ou avaliar este profissional"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover/rate:scale-110 transition-transform" />
            <span className="font-bold">{provider.rating ? provider.rating.toFixed(1) : '5.0'}</span>
            <span className="text-[10px] text-gray-300">({provider.reviewsCount || 1})</span>
          </button>
        </div>

        {/* Proximity / Distance Tag on Bottom Right of Image */}
        {distanceKm !== null && (
          <div className="absolute bottom-2.5 right-3 bg-[#0B132B]/90 text-[#00E5FF] backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold border border-[#00E5FF]/30">
            ~{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
          </div>
        )}

        {/* Custom photo indicator pill if advertiser provided their own image */}
        {provider.imageUrl && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[9.5px] text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
            <ImageIcon className="w-3 h-3 text-[#00E5FF]" />
            <span>Foto Oficial</span>
          </div>
        )}
      </div>

      {/* 2. Content & Information Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Business / Professional Name */}
          <h3
            className={`font-['Outfit'] text-base sm:text-lg font-bold leading-snug line-clamp-2 transition-colors ${
              isLight
                ? 'text-slate-900 group-hover:text-[#0097A7]'
                : 'text-white group-hover:text-[#00E5FF]'
            }`}
          >
            {provider.name}
          </h3>

          {/* Location Info */}
          <div
            className={`mt-2 flex items-center gap-1.5 text-xs ${
              isLight ? 'text-slate-600' : 'text-gray-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
            <span className="truncate">
              {provider.neighborhood ? `${provider.neighborhood}, ` : ''}
              {provider.city}
            </span>
          </div>

          {provider.address && (
            <p
              className={`mt-0.5 text-[11px] truncate pl-5 ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {provider.address} {provider.cep ? `• CEP ${provider.cep}` : ''}
            </p>
          )}

          {/* Description */}
          {provider.description && (
            <p
              className={`mt-3 text-xs line-clamp-2 leading-relaxed p-2.5 rounded-xl border ${
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
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            {/* WhatsApp Direct Action Button */}
            <a
              id={`btn-whatsapp-${provider.id}`}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:brightness-110 active:scale-[0.98] transition"
              title="Abrir conversa direta no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span>WhatsApp Direto</span>
            </a>

            {/* Direct Rate / Review Button */}
            {onOpenReview && (
              <button
                id={`btn-rate-${provider.id}`}
                type="button"
                onClick={() => onOpenReview(provider)}
                className={`rounded-xl border px-3 py-2.5 transition shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:border-amber-400'
                }`}
                title="Avaliar serviço ou ver depoimentos desta empresa"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                <span className="hidden sm:inline font-bold">Avaliar</span>
              </button>
            )}

            {/* View on Map button */}
            {onFocusOnMap && (
              <button
                id={`btn-map-focus-${provider.id}`}
                onClick={() => onFocusOnMap(provider)}
                className={`rounded-xl border p-2.5 transition shrink-0 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-[#0097A7]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 hover:bg-white/10'
                }`}
                title="Ver localização no mapa"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advertisers notice in fine print (letras miúdas) */}
          <div
            className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-1 text-[10.5px] ${
              isLight ? 'border-slate-100 text-slate-500' : 'border-white/5 text-gray-400'
            }`}
          >
            <span className="truncate">É anunciante e precisa alterar dados ou foto?</span>
            <a
              href={admContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline font-semibold shrink-0 ${
                isLight ? 'text-[#0097A7]' : 'text-[#00E5FF]'
              }`}
              title="Solicitar alteração de dados ou foto com a administração via WhatsApp"
            >
              Falar com ADM
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
