import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Plus, 
  Minus, 
  LocateFixed, 
  ShieldCheck,
  Compass,
  Check,
  Sparkles
} from 'lucide-react';
import { Provider } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getProviderPhoto } from '../utils/imageCompressor';
import { recordProviderClick } from '../services/firebase';

interface InteractiveMapProps {
  providers: Provider[];
  selectedProvider: Provider | null;
  onSelectProvider: (provider: Provider | null) => void;
  onOpenReview?: (provider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  centerCoords: { lat: number; lng: number };
}

export type MapLayerType = 'streets' | 'hybrid' | 'osm' | 'dark';

interface LayerConfig {
  id: MapLayerType;
  label: string;
  shortLabel: string;
  badge: string;
  url: string;
  attribution: string;
  maxZoom: number;
  maxNativeZoom: number;
  subdomains?: string[] | string;
}

export const MAP_LAYERS: Record<MapLayerType, LayerConfig> = {
  streets: {
    id: 'streets',
    label: 'Ruas & Avenidas (Google Maps)',
    shortLabel: '🗺️ Ruas',
    badge: 'Padrão HD',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 21,
    maxNativeZoom: 20
  },
  hybrid: {
    id: 'hybrid',
    label: 'Satélite Nítido + Ruas (Google Híbrido)',
    shortLabel: '🛰️ Satélite',
    badge: 'Foto Aérea + Ruas',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps & Imagens Aéreas',
    maxZoom: 21,
    maxNativeZoom: 20
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap Brasil',
    shortLabel: '🌐 OpenStreet',
    badge: 'Logradouros',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; Colaboradores OpenStreetMap',
    maxZoom: 20,
    maxNativeZoom: 19
  },
  dark: {
    id: 'dark',
    label: 'Neon Noturno (TecSoluções)',
    shortLabel: '🌙 Noturno',
    badge: 'Dark Moderno',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO & OSM',
    maxZoom: 20,
    maxNativeZoom: 19,
    subdomains: 'abcd'
  }
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
  onOpenReview,
  userCoords,
  centerCoords
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Default to crystal-clear Google Streets & Roads
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Create Leaflet TileLayer with overzooming protection
  const buildTileLayer = (config: LayerConfig): L.TileLayer => {
    const options: L.TileLayerOptions = {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: true
    };
    if (config.subdomains) {
      options.subdomains = config.subdomains;
    }
    return L.tileLayer(config.url, options);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = centerCoords?.lat || -17.7915;
    const initialLng = centerCoords?.lng || -50.9201;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      minZoom: 4,
      maxZoom: 21,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // Add default tile layer (Google Maps Streets)
    const config = MAP_LAYERS[activeLayer];
    const tileLayer = buildTileLayer(config).addTo(map);
    tileLayerRef.current = tileLayer;

    // Markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    // CRITICAL: Leaflet invalidateSize triggers to fix any layout or grid sizing issues
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 350);
    const timer3 = setTimeout(() => map.invalidateSize(), 800);

    // Responsive container resize observer
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer when activeLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = MAP_LAYERS[activeLayer];
    const newTileLayer = buildTileLayer(config).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Update User GPS Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userCoords && userCoords.lat && userCoords.lng) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(0, 229, 255, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #00E5FF; border: 3px solid #FFFFFF; box-shadow: 0 0 14px #00E5FF;"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 6px; text-align: center;">
            <strong style="color: #00E5FF; font-size: 12px; display: block;">📍 Sua Localização Atual</strong>
            <span style="font-size: 11px; color: #64748b;">GPS de referência ativo</span>
          </div>
        `);

      userMarkerRef.current = userMarker;
    }
  }, [userCoords]);

  // Update Provider Markers accurately positioned by their registered CEP
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markersMapRef.current.clear();

    providers.forEach((provider) => {
      if (
        !provider ||
        typeof provider.lat !== 'number' ||
        typeof provider.lng !== 'number' ||
        isNaN(provider.lat) ||
        isNaN(provider.lng) ||
        (provider.lat === 0 && provider.lng === 0)
      ) {
        return;
      }

      const isSelected = selectedProvider?.id === provider.id;
      const photoUrl = getProviderPhoto(provider.imageUrl, provider.category, provider.name);
      
      const pinColor = isSelected ? '#00E5FF' : '#FF6B00';
      const glowEffect = isSelected 
        ? 'box-shadow: 0 0 20px #00E5FF, 0 0 35px rgba(0,229,255,0.7); transform: scale(1.18);' 
        : 'box-shadow: 0 4px 14px rgba(0,0,0,0.5);';
      const borderStyle = isSelected ? 'border: 2.5px solid #FFFFFF;' : 'border: 2px solid rgba(255,255,255,0.9);';

      const customIcon = L.divIcon({
        className: `custom-provider-marker-${provider.id}`,
        html: `
          <div style="position: relative; width: 42px; height: 50px; cursor: pointer; display: flex; flex-direction: column; align-items: center; transition: transform 0.2s ease;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pinColor}; ${borderStyle} ${glowEffect} overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 2;">
              <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
            </div>
            <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid ${pinColor}; margin-top: -2px; z-index: 1;"></div>
          </div>
        `,
        iconSize: [42, 50],
        iconAnchor: [21, 50],
        popupAnchor: [0, -50]
      });

      const marker = L.marker([provider.lat, provider.lng], { 
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 100
      });

      // Build WhatsApp and Navigation URLs
      const whatsappMsg = `Olá ${provider.name}, vi seu anúncio no TecConecta (TecSoluções) e gostaria de solicitar um orçamento!`;
      const whatsappUrl = buildWhatsAppUrl(provider.whatsapp, whatsappMsg);
      const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`;

      const rawAddress = provider.address && provider.address !== 'undefined' && provider.address !== 'null' ? provider.address : '';
      const rawNeighborhood = provider.neighborhood && provider.neighborhood !== 'undefined' && provider.neighborhood !== 'null' ? provider.neighborhood : '';
      
      const cleanCepDigits = (provider.cep || '').replace(/\D/g, '');
      const formattedCep = cleanCepDigits.length === 8 
        ? `${cleanCepDigits.slice(0, 5)}-${cleanCepDigits.slice(5)}` 
        : provider.cep || '';

      const popupHtml = `
        <div style="min-width: 250px; max-width: 295px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 2px;">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <img src="${photoUrl}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0;" />
            <div style="flex: 1; min-width: 0;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; display: inline-block; margin-bottom: 2px;">
                ${provider.category}
              </span>
              <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${provider.name}
              </h4>
              <div style="font-size: 11px; color: #f59e0b; font-weight: 700; margin-top: 2px;">
                ★ ${provider.rating ? provider.rating.toFixed(1) : '5.0'} (${provider.reviewsCount || 1} avaliações)
              </div>
            </div>
          </div>

          <div style="font-size: 11.5px; color: #334155; line-height: 1.4; margin-bottom: 10px; background: #f8fafc; padding: 8px 10px; border-radius: 8px; border-left: 3px solid #00E5FF;">
            <div style="font-weight: 700; color: #0f172a; font-size: 11px; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
              <span>📍 Localização Real pelo CEP</span>
            </div>
            <div>
              ${rawAddress ? `${rawAddress}, ` : ''}${rawNeighborhood ? `${rawNeighborhood}, ` : ''}${provider.city}
            </div>
            ${formattedCep ? `<div style="font-size: 10.5px; color: #0284c7; font-weight: 700; margin-top: 4px;">CEP Cadastrado: ${formattedCep}</div>` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <a 
              href="${whatsappUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              id="map-popup-wa-${provider.id}"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #25D366; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.3);"
            >
              <span>💬 Chamar no WhatsApp</span>
            </a>

            <a 
              href="${googleMapsRouteUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              style="display: flex; align-items: center; justify-content: center; gap: 4px; background: #f1f5f9; color: #334155; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 6px;"
            >
              <span>🧭 Abrir Rota GPS no Google</span>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'tecconecta-custom-popup',
        closeButton: true,
        autoPan: true
      });

      marker.on('click', () => {
        onSelectProvider(provider);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-popup-wa-${provider.id}`);
        if (btn) {
          btn.onclick = () => {
            recordProviderClick(provider.id);
          };
        }
      });

      markersMapRef.current.set(provider.id, marker);
      markersLayer.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [providers, selectedProvider]);

  // Center or Pan with flyTo when Selected Provider or Center Coords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    if (
      selectedProvider &&
      typeof selectedProvider.lat === 'number' &&
      typeof selectedProvider.lng === 'number' &&
      !isNaN(selectedProvider.lat) &&
      !isNaN(selectedProvider.lng)
    ) {
      map.flyTo([selectedProvider.lat, selectedProvider.lng], 16, {
        duration: 1.2
      });

      // Automatically open the popup of the selected provider
      const targetMarker = markersMapRef.current.get(selectedProvider.id);
      if (targetMarker) {
        targetMarker.setZIndexOffset(1000);
        map.once('moveend', () => {
          targetMarker.openPopup();
        });
        setTimeout(() => targetMarker.openPopup(), 600);
      }
    } else if (
      centerCoords &&
      typeof centerCoords.lat === 'number' &&
      typeof centerCoords.lng === 'number' &&
      !isNaN(centerCoords.lat) &&
      !isNaN(centerCoords.lng)
    ) {
      // If no single provider is selected, check if we should fit bounds for the visible providers
      if (providers.length > 1) {
        const validCoords = providers
          .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng) && (p.lat !== 0 || p.lng !== 0))
          .map(p => [p.lat, p.lng] as [number, number]);

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          return;
        }
      }

      map.flyTo([centerCoords.lat, centerCoords.lng], 14, {
        duration: 1.2
      });
    }
  }, [selectedProvider, centerCoords]);

  // Fit all providers in view
  const handleFitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();

    const validCoords = providers
      .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng) && (p.lat !== 0 || p.lng !== 0))
      .map(p => [p.lat, p.lng] as [number, number]);

    if (validCoords.length === 0) {
      if (centerCoords) {
        map.flyTo([centerCoords.lat, centerCoords.lng], 14);
      }
      return;
    }

    const bounds = L.latLngBounds(validCoords);
    if (userCoords) {
      bounds.extend([userCoords.lat, userCoords.lng]);
    }
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  // Center on User GPS
  const handleLocateUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();

    if (userCoords && userCoords.lat && userCoords.lng) {
      map.flyTo([userCoords.lat, userCoords.lng], 16, { duration: 1 });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1 });
        },
        () => {
          console.warn('[TecConecta] Localização desativada ou não autorizada no navegador.');
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#080E21]">
      {/* Actual Leaflet Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing" 
        style={{ minHeight: '520px' }}
      />

      {/* Top Left: Providers Count Badge & Reset Selection */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B132B]/95 border border-white/10 backdrop-blur-md text-xs font-semibold text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span>{providers.length} Anunciantes no CEP/Mapa</span>
        </div>

        {selectedProvider ? (
          <button
            onClick={() => onSelectProvider(null)}
            className="px-2.5 py-1.5 rounded-xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] text-[11px] font-bold hover:bg-[#00E5FF]/30 transition backdrop-blur-md shadow-md"
          >
            Limpar Seleção
          </button>
        ) : (
          <button
            onClick={handleFitAllBounds}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-gray-200 text-[11px] font-semibold hover:bg-white/20 transition backdrop-blur-md shadow-md flex items-center gap-1"
            title="Enquadrar todos os anunciantes na tela"
          >
            <Compass className="w-3 h-3 text-[#00E5FF]" />
            <span>Enquadrar Todos</span>
          </button>
        )}
      </div>

      {/* Top Right: Visible Quick Layer Switcher Toolbar */}
      <div className="absolute top-3 right-3 z-10">
        {/* Desktop / Tablet: Quick Pill Switcher */}
        <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#0B132B]/90 border border-white/15 backdrop-blur-md shadow-2xl gap-1">
          {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((layerKey) => {
            const layer = MAP_LAYERS[layerKey];
            const isActive = activeLayer === layerKey;
            return (
              <button
                key={layerKey}
                id={`btn-map-layer-${layerKey}`}
                onClick={() => setActiveLayer(layerKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00E5FF] text-[#0B132B] shadow-md shadow-[#00E5FF]/30 font-extrabold scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title={layer.label}
              >
                <span>{layer.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Button */}
        <div className="sm:hidden relative">
          <button
            id="btn-map-layer-mobile-toggle"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B132B]/90 border border-white/15 text-[#00E5FF] font-bold text-xs flex items-center gap-1.5 backdrop-blur-md shadow-lg"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{MAP_LAYERS[activeLayer].shortLabel}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-2xl p-2 z-20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 block py-1">
                Visualização do Mapa
              </span>
              {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((layerKey) => {
                const layer = MAP_LAYERS[layerKey];
                const isActive = activeLayer === layerKey;
                return (
                  <button
                    key={layerKey}
                    onClick={() => {
                      setActiveLayer(layerKey);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                      isActive ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{layer.shortLabel}</div>
                      <div className="text-[10px] text-gray-400">{layer.badge}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[#00E5FF]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: GPS Location & Navigation Controls */}
      <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2">
        {/* Locate User GPS */}
        <button
          id="btn-map-locate-gps"
          onClick={handleLocateUser}
          className="p-2.5 rounded-xl bg-[#0B132B]/90 border border-white/10 text-gray-200 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition backdrop-blur-md shadow-lg"
          title="Minha Localização GPS"
        >
          <LocateFixed className="w-4 h-4 text-[#00E5FF]" />
        </button>

        {/* Fit All Bounds */}
        <button
          id="btn-map-fit-bounds"
          onClick={handleFitAllBounds}
          className="p-2.5 rounded-xl bg-[#0B132B]/90 border border-white/10 text-gray-200 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition backdrop-blur-md shadow-lg"
          title="Enquadrar Todos os Prestadores"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0B132B]/90 backdrop-blur-md shadow-lg">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 text-gray-200 hover:text-[#00E5FF] hover:bg-white/5 border-b border-white/10 transition"
            title="Aumentar Zoom (Ruas Detalhadas)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 text-gray-200 hover:text-[#00E5FF] hover:bg-white/5 transition"
            title="Diminuir Zoom"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left: Guarantee Notice */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B132B]/90 border border-[#00E5FF]/30 text-[10px] text-gray-200 backdrop-blur-md shadow-md">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
        <span>Localização Real pelo CEP • TecSoluções</span>
      </div>
    </div>
  );
};
