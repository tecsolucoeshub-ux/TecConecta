import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MessageCircle, 
  MapPin, 
  Star, 
  Navigation, 
  Layers, 
  Plus, 
  Minus, 
  LocateFixed, 
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Provider } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getProviderPhoto } from '../utils/imageCompressor';
import { useTheme } from '../context/ThemeContext';
import { recordProviderClick } from '../services/firebase';

interface InteractiveMapProps {
  providers: Provider[];
  selectedProvider: Provider | null;
  onSelectProvider: (provider: Provider | null) => void;
  onOpenReview?: (provider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  centerCoords: { lat: number; lng: number };
}

type MapLayerType = 'dark' | 'light' | 'satellite';

const TILE_LAYERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 19
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics',
    maxZoom: 18
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
  const { isLight } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>(isLight ? 'light' : 'dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Sync default layer with theme changes unless user explicitly switched
  useEffect(() => {
    if (activeLayer !== 'satellite') {
      setActiveLayer(isLight ? 'light' : 'dark');
    }
  }, [isLight]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = centerCoords?.lat || -17.7915;
    const initialLng = centerCoords?.lng || -50.9234;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false, // We use custom high-tech neon controls
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // Add initial tile layer
    const config = TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: 'abcd'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
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

    const config = TILE_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: 'abcd'
    }).addTo(map);

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
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(0, 229, 255, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #00E5FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px #00E5FF;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 6px; text-align: center;">
            <strong style="color: #00E5FF; font-size: 12px; display: block;">📍 Sua Localização</strong>
            <span style="font-size: 11px; color: #888;">GPS ativo com precisão</span>
          </div>
        `);

      userMarkerRef.current = userMarker;
    }
  }, [userCoords]);

  // Update Provider Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    providers.forEach((provider) => {
      const isSelected = selectedProvider?.id === provider.id;
      const photoUrl = getProviderPhoto(provider.imageUrl, provider.category, provider.name);
      
      const pinColor = isSelected ? '#00E5FF' : '#FF6B00';
      const glowEffect = isSelected ? 'box-shadow: 0 0 18px #00E5FF, 0 0 30px rgba(0,229,255,0.6); transform: scale(1.15);' : 'box-shadow: 0 4px 12px rgba(0,0,0,0.5);';
      const borderStyle = isSelected ? 'border: 2px solid #FFFFFF;' : 'border: 1.5px solid rgba(255,255,255,0.8);';

      const customIcon = L.divIcon({
        className: `custom-provider-marker-${provider.id}`,
        html: `
          <div style="position: relative; width: 38px; height: 46px; cursor: pointer; display: flex; flex-direction: column; align-items: center; transition: transform 0.2s ease;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${pinColor}; ${borderStyle} ${glowEffect} overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 2;">
              <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${pinColor}; margin-top: -2px; z-index: 1;"></div>
          </div>
        `,
        iconSize: [38, 46],
        iconAnchor: [19, 46],
        popupAnchor: [0, -46]
      });

      const marker = L.marker([provider.lat, provider.lng], { icon: customIcon });

      // Build WhatsApp message
      const whatsappMsg = `Olá ${provider.name}, vi seu anúncio no TecConecta (TecSoluções) e gostaria de solicitar um orçamento!`;
      const whatsappUrl = buildWhatsAppUrl(provider.whatsapp, whatsappMsg);
      const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`;

      const popupHtml = `
        <div style="min-width: 230px; max-width: 270px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 2px;">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <img src="${photoUrl}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;" />
            <div style="flex: 1; min-width: 0;">
              <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 2px;">
                ${provider.category}
              </span>
              <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${provider.name}
              </h4>
              <div style="font-size: 11px; color: #f59e0b; font-weight: 700; margin-top: 2px;">
                ★ ${provider.rating ? provider.rating.toFixed(1) : '5.0'} (${provider.reviewsCount || 1} avaliações)
              </div>
            </div>
          </div>

          <div style="font-size: 11px; color: #64748b; line-height: 1.3; margin-bottom: 10px; background: #f8fafc; padding: 6px; border-radius: 6px;">
            📍 ${provider.neighborhood ? `${provider.neighborhood}, ` : ''}${provider.city}
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <a 
              href="${whatsappUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              id="map-popup-wa-${provider.id}"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #25D366; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 7px 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.3);"
            >
              <span>💬 Chamar no WhatsApp</span>
            </a>

            <a 
              href="${googleMapsRouteUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              style="display: flex; align-items: center; justify-content: center; gap: 4px; background: #f1f5f9; color: #334155; text-decoration: none; font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px;"
            >
              <span>🧭 Abrir Rota GPS</span>
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
        // Track clicks when user presses the popup's WhatsApp link
        const btn = document.getElementById(`map-popup-wa-${provider.id}`);
        if (btn) {
          btn.onclick = () => {
            recordProviderClick(provider.id);
          };
        }
      });

      if (isSelected) {
        marker.openPopup();
      }

      markersLayer.addLayer(marker);
    });
  }, [providers, selectedProvider]);

  // Center or Pan to Selected Provider
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedProvider && selectedProvider.lat && selectedProvider.lng) {
      map.flyTo([selectedProvider.lat, selectedProvider.lng], 16, {
        duration: 1.2
      });
    } else if (centerCoords && centerCoords.lat && centerCoords.lng) {
      map.panTo([centerCoords.lat, centerCoords.lng]);
    }
  }, [selectedProvider, centerCoords]);

  // Fit all providers in view
  const handleFitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || providers.length === 0) return;

    const bounds = L.latLngBounds(providers.map((p) => [p.lat, p.lng]));
    if (userCoords) {
      bounds.extend([userCoords.lat, userCoords.lng]);
    }
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  // Center on User GPS
  const handleLocateUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userCoords && userCoords.lat && userCoords.lng) {
      map.flyTo([userCoords.lat, userCoords.lng], 15, { duration: 1 });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 });
        },
        () => {
          alert('Localização desativada ou não autorizada no navegador.');
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#080E21]">
      {/* Actual Leaflet Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing" 
        style={{ minHeight: '520px' }}
      />

      {/* Top Left: Providers Count Badge & Status */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B132B]/90 border border-white/10 backdrop-blur-md text-xs font-semibold text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span>{providers.length} Prestadores no Mapa</span>
        </div>

        {selectedProvider && (
          <button
            onClick={() => onSelectProvider(null)}
            className="px-2.5 py-1 rounded-xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] text-[11px] font-bold hover:bg-[#00E5FF]/30 transition backdrop-blur-md"
          >
            Limpar Seleção
          </button>
        )}
      </div>

      {/* Top Right: Layer Switcher Button */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <button
            id="btn-map-layer-switcher"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2 rounded-xl bg-[#0B132B]/90 border border-white/10 text-gray-200 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition backdrop-blur-md shadow-lg"
            title="Alterar Estilo do Mapa"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-2xl p-2 z-20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 block py-1">
                Visualização
              </span>
              <button
                onClick={() => {
                  setActiveLayer('dark');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                  activeLayer === 'dark' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>Neon Noturno (Dark)</span>
                {activeLayer === 'dark' && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
              </button>
              <button
                onClick={() => {
                  setActiveLayer('light');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                  activeLayer === 'light' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>Mapa Claro (Positron)</span>
                {activeLayer === 'light' && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
              </button>
              <button
                onClick={() => {
                  setActiveLayer('satellite');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                  activeLayer === 'satellite' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>Satélite Real</span>
                {activeLayer === 'satellite' && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: Quick Navigation & Zoom Controls */}
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
            title="Aumentar Zoom"
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

      {/* Bottom Left: Guarantee Notice of Zero API Keys / Zero Interruption */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B132B]/85 border border-[#00E5FF]/20 text-[10px] text-gray-300 backdrop-blur-md">
        <ShieldCheck className="w-3 h-3 text-[#00E5FF]" />
        <span>Mapa Autônomo TecSoluções • 100% Funcional sem falhas de API</span>
      </div>
    </div>
  );
};
