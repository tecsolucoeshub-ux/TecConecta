import React, { useState, useMemo, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MessageCircle, MapPin, Star, Navigation, ExternalLink, Key, Layers, Compass, Plus, Minus, LocateFixed } from 'lucide-react';
import { Provider } from '../types';

interface InteractiveMapProps {
  providers: Provider[];
  selectedProvider: Provider | null;
  onSelectProvider: (provider: Provider | null) => void;
  onOpenReview?: (provider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  centerCoords: { lat: number; lng: number };
}

// Controller component to smoothly pan the map whenever center changes
const MapRecenterController: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng]);
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
  onOpenReview,
  userCoords,
  centerCoords,
}) => {
  // Read key from environment or default to user provided Google Maps API key
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC9Qg-9yjovYIOTci6pzwBboUIAXRwLjdA';
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('tecconecta_custom_maps_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const effectiveKey = customKey.trim() || envKey.trim();

  // Fallback map state for when key is absent
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSaveKey = (k: string) => {
    setCustomKey(k);
    localStorage.setItem('tecconecta_custom_maps_key', k);
    setShowKeyInput(false);
  };

  // Pre-calculate bounds / center
  const mapCenter = useMemo(() => {
    if (selectedProvider) {
      return { lat: selectedProvider.lat, lng: selectedProvider.lng };
    }
    if (userCoords) {
      return { lat: userCoords.lat, lng: userCoords.lng };
    }
    return centerCoords;
  }, [selectedProvider, userCoords, centerCoords]);

  // When an effective Google Maps API Key is present, render the official Google Maps JS API via @vis.gl/react-google-maps
  if (effectiveKey) {
    return (
      <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#080E21]">
        {/* Top Info Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#00E5FF]/30 text-xs text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="font-semibold">Google Maps Ativo</span>
          <span className="text-gray-400">({providers.length} locais)</span>
        </div>

        {/* Change Key Option */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1.5 bg-[#0B132B]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] font-semibold text-gray-300 hover:text-white hover:border-[#00E5FF]/40 transition shadow-lg"
          >
            <Key className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Configurar Chave</span>
          </button>
        </div>

        {showKeyInput && (
          <div className="absolute top-14 right-4 z-20 w-80 p-4 rounded-xl bg-[#0B132B] border border-[#00E5FF]/40 shadow-2xl text-xs space-y-2">
            <span className="font-bold text-white block">Chave Google Maps API</span>
            <input
              type="text"
              placeholder="Cole sua chave aqui..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-[#00E5FF]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveKey(customKey)}
                className="flex-1 bg-[#00E5FF] text-[#0B132B] font-bold py-1.5 rounded-lg"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowKeyInput(false)}
                className="bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <APIProvider apiKey={effectiveKey} libraries={['places', 'marker', 'geometry']} language="pt-BR" region="BR">
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={13}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <MapRecenterController center={mapCenter} />

            {/* User GPS location marker */}
            {userCoords && (
              <AdvancedMarker position={userCoords} title="Minha Localização">
                <div className="relative flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#00E5FF]/30 animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-[#00E5FF] border-2 border-white shadow-[0_0_10px_#00E5FF]" />
                </div>
              </AdvancedMarker>
            )}

            {/* Provider Markers */}
            {providers.map((p) => {
              const isSelected = selectedProvider?.id === p.id;
              return (
                <AdvancedMarker
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  onClick={() => onSelectProvider(p)}
                  title={p.name}
                >
                  <Pin
                    background={isSelected ? '#00E5FF' : '#FF6B00'}
                    borderColor={isSelected ? '#FFFFFF' : '#0B132B'}
                    glyphColor="#0B132B"
                    scale={isSelected ? 1.3 : 1.0}
                  />
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow for Selected Provider */}
            {selectedProvider && (
              <InfoWindow
                position={{ lat: selectedProvider.lat, lng: selectedProvider.lng }}
                onCloseClick={() => onSelectProvider(null)}
              >
                <div className="p-2 max-w-xs text-gray-900 font-['Plus_Jakarta_Sans']">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {selectedProvider.category}
                    </span>
                    {onOpenReview ? (
                      <button
                        type="button"
                        onClick={() => onOpenReview(selectedProvider)}
                        className="text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-auto transition"
                        title="Ver avaliações ou avaliar serviço"
                      >
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{selectedProvider.rating ? selectedProvider.rating.toFixed(1) : '5.0'}</span>
                        <span className="text-[9px] text-gray-500">★ Avaliar</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5 ml-auto">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {selectedProvider.rating ? selectedProvider.rating.toFixed(1) : '5.0'}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                    {selectedProvider.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{selectedProvider.neighborhood || selectedProvider.city}</span>
                  </p>
                  {selectedProvider.description && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                      {selectedProvider.description}
                    </p>
                  )}
                  <div className="mt-2.5 pt-2 border-t border-gray-200">
                    <a
                      href={`https://wa.me/55${selectedProvider.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${selectedProvider.name}, vi seu anúncio no TecConecta (DaMaceno Soluções) e gostaria de informações sobre ${selectedProvider.category}!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // Graceful interactive local map viewer when VITE_GOOGLE_MAPS_API_KEY is not yet supplied
  // Converts lat/lng coordinates to visual canvas space around centerCoords
  const scale = 450 * Math.pow(1.3, zoomLevel - 13);
  const centerX = 400 + mapPan.x;
  const centerY = 300 + mapPan.y;

  return (
    <div
      id="interactive-map-container"
      className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#070D1E] select-none flex flex-col"
    >
      {/* Top Banner: Notice & Google Maps Key Assistant */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#00E5FF]/30 text-xs text-white shadow-xl pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="font-bold font-['Outfit']">Mapa Interativo TecConecta</span>
          <span className="text-gray-400">({providers.length} profissionais geolocalizados)</span>
        </div>

        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="flex items-center gap-1.5 bg-[#0B132B]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-xs font-semibold text-gray-200 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition shadow-xl pointer-events-auto"
        >
          <Key className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Ativar Google Maps Oficial</span>
        </button>
      </div>

      {/* Google Maps Key Setup Modal Popover */}
      {showKeyInput && (
        <div className="absolute top-16 right-4 z-30 w-84 p-4 rounded-2xl bg-[#0B132B] border border-[#00E5FF]/40 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#00E5FF]" />
              Conectar Google Maps API
            </h4>
            <button onClick={() => setShowKeyInput(false)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            Para exibir as imagens de satélite e ruas oficiais do Google Maps, insira sua chave do Google Maps Platform ou use o <strong>Maps Demo Key</strong> gratuito:
          </p>
          <input
            type="text"
            placeholder="Cole sua API Key aqui..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#00E5FF]"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#00E5FF] hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Obter Maps Demo Key (Grátis)
            </a>
            <button
              onClick={() => handleSaveKey(customKey)}
              className="px-4 py-1.5 rounded-lg bg-[#00E5FF] text-[#0B132B] font-bold text-xs hover:brightness-110 transition"
            >
              Salvar Chave
            </button>
          </div>
        </div>
      )}

      {/* Interactive Map Visual Stage */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y });
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          setMapPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* Background Technological Grid & Radar Rings */}
        <div className="absolute inset-0 bg-[#070D1E] overflow-hidden">
          {/* Subtle street / circuit grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(to right, #00E5FF 1px, transparent 1px)`,
              backgroundSize: `${35 * Math.pow(1.2, zoomLevel - 13)}px ${35 * Math.pow(1.2, zoomLevel - 13)}px`,
              backgroundPosition: `${centerX}px ${centerY}px`,
            }}
          />

          {/* Central Radial Beacon Rings */}
          <div
            className="absolute pointer-events-none rounded-full border border-[#00E5FF]/20"
            style={{
              width: `${scale * 0.5}px`,
              height: `${scale * 0.5}px`,
              left: `${centerX - (scale * 0.25)}px`,
              top: `${centerY - (scale * 0.25)}px`,
            }}
          />
          <div
            className="absolute pointer-events-none rounded-full border border-[#FF6B00]/15"
            style={{
              width: `${scale * 0.9}px`,
              height: `${scale * 0.9}px`,
              left: `${centerX - (scale * 0.45)}px`,
              top: `${centerY - (scale * 0.45)}px`,
            }}
          />
        </div>

        {/* User Location Radar Dot */}
        {userCoords && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${centerX + (userCoords.lng - mapCenter.lng) * scale * 1.5}px`,
              top: `${centerY - (userCoords.lat - mapCenter.lat) * scale * 1.5}px`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#00E5FF]/25 animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-[#00E5FF] border-2 border-white shadow-[0_0_15px_#00E5FF]" />
            </div>
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
              Você está aqui
            </span>
          </div>
        )}

        {/* Interactive Provider Pins */}
        {providers.map((p) => {
          const isSelected = selectedProvider?.id === p.id;
          const px = centerX + (p.lng - mapCenter.lng) * scale * 1.5;
          const py = centerY - (p.lat - mapCenter.lat) * scale * 1.5;

          return (
            <div
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectProvider(p);
              }}
              className={`absolute z-10 -translate-x-1/2 -translate-y-full cursor-pointer transition-transform duration-200 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-115'
              }`}
              style={{ left: `${px}px`, top: `${py}px` }}
            >
              {/* Category Pin Badge */}
              <div
                className={`relative flex flex-col items-center group`}
              >
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-xl transition-all border ${
                    isSelected
                      ? 'bg-[#00E5FF] text-[#0B132B] font-extrabold border-white shadow-[0_0_20px_#00E5FF]'
                      : 'bg-[#0B132B] text-white font-semibold border-[#00E5FF]/50 hover:border-[#FF6B00]'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0B132B]' : 'text-[#FF6B00]'}`} />
                  <span className="text-[11px] whitespace-nowrap max-w-[110px] truncate">{p.name.split(' ')[0]}</span>
                </div>

                {/* Arrow Pointer */}
                <div
                  className={`w-2 h-2 rotate-45 -mt-1 ${
                    isSelected ? 'bg-[#00E5FF]' : 'bg-[#0B132B] border-r border-b border-[#00E5FF]/50'
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* Info Box for Selected Provider in Fallback View */}
        {selectedProvider && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-[#0B132B]/95 border border-[#00E5FF]/50 shadow-[0_0_40px_rgba(0,229,255,0.25)] p-4 text-white backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                      {selectedProvider.category}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{selectedProvider.rating ? selectedProvider.rating.toFixed(1) : '5.0'}</span>
                    </span>
                  </div>
                  <h4 className="font-['Outfit'] font-bold text-base text-white mt-1">
                    {selectedProvider.name}
                  </h4>
                  <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
                    <span>
                      {selectedProvider.neighborhood ? `${selectedProvider.neighborhood}, ` : ''}
                      {selectedProvider.city}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => onSelectProvider(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {selectedProvider.description && (
                <p className="text-xs text-gray-300 mt-2 line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">
                  {selectedProvider.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
                <a
                  href={`https://wa.me/55${selectedProvider.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${selectedProvider.name}, vi seu anúncio no TecConecta (DaMaceno Soluções) e gostaria de solicitar um orçamento para ${selectedProvider.category}!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Conversar no WhatsApp</span>
                </a>
                {onOpenReview && (
                  <button
                    type="button"
                    onClick={() => onOpenReview(selectedProvider)}
                    className="px-3 py-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
                    title="Avaliar este prestador"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Avaliar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls (Zoom & Reset) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
          className="w-8 h-8 rounded-lg bg-[#0B132B]/90 border border-white/15 text-white flex items-center justify-center hover:border-[#00E5FF] transition shadow-lg"
          title="Aumentar Zoom"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 1, 9))}
          className="w-8 h-8 rounded-lg bg-[#0B132B]/90 border border-white/15 text-white flex items-center justify-center hover:border-[#00E5FF] transition shadow-lg"
          title="Diminuir Zoom"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setMapPan({ x: 0, y: 0 });
            setZoomLevel(13);
          }}
          className="w-8 h-8 rounded-lg bg-[#0B132B]/90 border border-white/15 text-white flex items-center justify-center hover:border-[#00E5FF] transition shadow-lg"
          title="Centralizar"
        >
          <Compass className="w-4 h-4 text-[#00E5FF]" />
        </button>
      </div>
    </div>
  );
};
