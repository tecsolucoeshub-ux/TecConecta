import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Navigation, Sparkles, Filter, CheckCircle2, MessageCircle, AlertCircle, RefreshCw, Compass, Building2, Trash2 } from 'lucide-react';
import { Provider, ViewMode, SponsoredBanner, AdminSettings } from './types';
import { fetchProviders, clearDemoProviders, resetDemoProviders, fetchSponsoredBanners, fetchAdminSettings, DEFAULT_ADMIN_SETTINGS } from './services/firebase';
import { POPULAR_CITIES, CATEGORIES } from './data/categories';
import { TecNavbar } from './components/TecNavbar';
import { TecBrandHero } from './components/TecBrandHero';
import { MonetizationBanner } from './components/MonetizationBanner';
import { EditProfileModal } from './components/EditProfileModal';
import { AdminModal } from './components/AdminModal';
import { ViewSwitcher } from './components/ViewSwitcher';
import { CategoryFilter } from './components/CategoryFilter';
import { ProviderCard } from './components/ProviderCard';
import { InteractiveMap } from './components/InteractiveMap';
import { RegisterModal } from './components/RegisterModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ReviewModal } from './components/ReviewModal';
import { LocalityModal, LocalityInfo } from './components/LocalityModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Footer } from './components/Footer';
import { fetchAddressByCep } from './utils/cepGeocoding';
import { useTheme } from './context/ThemeContext';

// Haversine distance calculator for proximity sorting
function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export default function App() {
  const { isLight } = useTheme();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Active Locality (via CEP, City, or GPS persistence)
  const [activeLocality, setActiveLocality] = useState<LocalityInfo | null>(() => {
    try {
      const saved = localStorage.getItem('tecconecta_active_locality');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLocalityModalOpen, setIsLocalityModalOpen] = useState(false);
  const [isSearchingCepInline, setIsSearchingCepInline] = useState(false);

  // Selected Provider on Map / Card
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Sponsored Banners & Admin Settings for Monetization
  const [banners, setBanners] = useState<SponsoredBanner[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [providerToReview, setProviderToReview] = useState<Provider | null>(null);

  const handleOpenReview = (provider: Provider) => {
    setProviderToReview(provider);
    setIsReviewOpen(true);
  };

  const handleReviewSubmitted = (updatedProvider: Provider) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === updatedProvider.id ? updatedProvider : p))
    );
    if (selectedProvider && selectedProvider.id === updatedProvider.id) {
      setSelectedProvider(updatedProvider);
    }
  };

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [providersData, bannersData] = await Promise.all([
          fetchProviders(),
          fetchSponsoredBanners()
        ]);
        setProviders(providersData);
        setBanners(bannersData);
        setAdminSettings(fetchAdminSettings());
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Listen for cross-component updates
    const handleProviderAdded = (event: CustomEvent<Provider>) => {
      const newP = event.detail;
      const cleanPhone = (newP.whatsapp || '').replace(/\D/g, '');
      const cleanName = (newP.name || '').trim().toLowerCase();
      const cleanCity = (newP.city || '').trim().toLowerCase();
      setProviders((prev) => {
        const filtered = prev.filter((p) => {
          if (p.id === newP.id) return false;
          if (cleanPhone && p.whatsapp.replace(/\D/g, '') === cleanPhone) return false;
          if (cleanName && cleanCity && p.name.trim().toLowerCase() === cleanName && p.city.trim().toLowerCase() === cleanCity) return false;
          return true;
        });
        return [newP, ...filtered];
      });
    };
    const handleProviderUpdated = (event: CustomEvent<Provider>) => {
      setProviders((prev) => prev.map((p) => (p.id === event.detail.id ? event.detail : p)));
    };
    const handleProviderDeleted = (event: CustomEvent<{ id: string }>) => {
      setProviders((prev) => prev.filter((p) => p.id !== event.detail.id));
    };
    const handleBannersUpdated = (event: CustomEvent<SponsoredBanner[]>) => {
      setBanners(event.detail);
    };
    const handleAdminUpdated = (event: CustomEvent<AdminSettings>) => {
      setAdminSettings(event.detail);
    };

    window.addEventListener('tecconecta:provider_added' as any, handleProviderAdded);
    window.addEventListener('tecconecta:provider_updated' as any, handleProviderUpdated);
    window.addEventListener('tecconecta:provider_deleted' as any, handleProviderDeleted);
    window.addEventListener('tecconecta:banners_updated' as any, handleBannersUpdated);
    window.addEventListener('tecconecta:admin_settings_updated' as any, handleAdminUpdated);

    // Hidden trigger 1: Secret keyboard shortcut (Ctrl+Shift+A or Alt+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Hidden trigger 2: Hash trigger in URL (#admin or #adm)
    const handleHashCheck = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#adm') {
        setIsAdminOpen(true);
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashCheck);
    handleHashCheck();

    return () => {
      window.removeEventListener('tecconecta:provider_added' as any, handleProviderAdded);
      window.removeEventListener('tecconecta:provider_updated' as any, handleProviderUpdated);
      window.removeEventListener('tecconecta:provider_deleted' as any, handleProviderDeleted);
      window.removeEventListener('tecconecta:banners_updated' as any, handleBannersUpdated);
      window.removeEventListener('tecconecta:admin_settings_updated' as any, handleAdminUpdated);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  // Set or clear locality
  const handleSelectLocality = (loc: LocalityInfo) => {
    setActiveLocality(loc);
    localStorage.setItem('tecconecta_active_locality', JSON.stringify(loc));
    setSelectedProvider(null);
    setLocationStatus(`Região focada: ${loc.label}`);
    setTimeout(() => setLocationStatus(null), 4000);
  };

  const handleClearLocality = () => {
    setActiveLocality(null);
    localStorage.removeItem('tecconecta_active_locality');
    setSelectedCity('all');
    setLocationStatus('Mostrando prestadores de todo o Brasil');
    setTimeout(() => setLocationStatus(null), 3000);
  };

  // City selector change
  const handleSelectCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    if (cityName === 'all') {
      if (activeLocality?.source === 'city') {
        handleClearLocality();
      }
    } else {
      const found = POPULAR_CITIES.find(c => c.name.toLowerCase().includes(cityName.toLowerCase()));
      if (found) {
        const loc: LocalityInfo = {
          label: found.name,
          lat: found.lat,
          lng: found.lng,
          source: 'city'
        };
        handleSelectLocality(loc);
      }
    }
  };

  // Inline CEP detection in the search bar
  const detectedCepInSearch = useMemo(() => {
    const digits = searchQuery.replace(/\D/g, '');
    return digits.length === 8 ? digits : null;
  }, [searchQuery]);

  const handleApplySearchCep = async () => {
    if (!detectedCepInSearch) return;
    setIsSearchingCepInline(true);
    try {
      const res = await fetchAddressByCep(detectedCepInSearch);
      const loc: LocalityInfo = {
        label: `${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city} - ${res.state}`,
        lat: res.lat,
        lng: res.lng,
        cep: res.cep,
        source: 'cep'
      };
      handleSelectLocality(loc);
      setToastMessage(`Região atualizada para ${loc.label}!`);
      setTimeout(() => setToastMessage(null), 4000);
      setSearchQuery('');
    } catch (e: any) {
      setToastMessage(e.message || 'Erro ao localizar CEP.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSearchingCepInline(false);
    }
  };

  // Clear demo data
  const handleClearDemoData = () => {
    const updated = clearDemoProviders();
    setProviders(updated);
    setToastMessage('Dados de exemplo removidos. Apenas cadastros reais são exibidos.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetDemoData = () => {
    const updated = resetDemoProviders();
    setProviders(updated);
    setToastMessage('Exemplos de demonstração restaurados.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Request user GPS (non-intrusive)
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocalização não disponível no navegador.');
      return;
    }
    setIsLocating(true);
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setUserCoords(coords);
        handleSelectLocality({
          label: 'Minha Localização Atual (GPS)',
          lat: coords.lat,
          lng: coords.lng,
          source: 'gps'
        });
        setIsLocating(false);
        setLocationStatus('GPS ativado! Prestadores ordenados por proximidade.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Permissão de GPS negada. Use a busca por CEP para definir sua localização.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Reference coordinates for sorting and distance
  const referenceCoords = useMemo(() => {
    if (userCoords) return userCoords;
    if (activeLocality) return { lat: activeLocality.lat, lng: activeLocality.lng };
    return null;
  }, [userCoords, activeLocality]);

  // Unique custom categories registered across all providers
  const customCategories = useMemo(() => {
    const standardNames = new Set(CATEGORIES.map((c) => c.name.trim().toLowerCase()));
    const customs = new Set<string>();
    providers.forEach((p) => {
      if (p.category && !standardNames.has(p.category.trim().toLowerCase())) {
        customs.add(p.category.trim());
      }
    });
    return Array.from(customs);
  }, [providers]);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let result = providers.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // City filter - If user is actively typing a service query, allow broad matching without locking/fixing search
      if (selectedCity !== 'all' && !searchQuery.trim() && !p.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }

      // Search query (matches name, category, city, neighborhood, description, cep)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchCity = p.city.toLowerCase().includes(q);
        const matchNeighborhood = p.neighborhood?.toLowerCase().includes(q) || false;
        const matchAddress = p.address?.toLowerCase().includes(q) || false;
        const matchDesc = p.description?.toLowerCase().includes(q) || false;
        const matchCep = p.cep?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || false;

        if (!matchName && !matchCategory && !matchCity && !matchNeighborhood && !matchAddress && !matchDesc && !matchCep) {
          return false;
        }
      }

      return true;
    });

    // Proximity sort if reference coordinates (GPS or active CEP/locality) are available
    if (referenceCoords) {
      result.sort((a, b) => {
        const distA = calcDist(referenceCoords.lat, referenceCoords.lng, a.lat, a.lng);
        const distB = calcDist(referenceCoords.lat, referenceCoords.lng, b.lat, b.lng);
        return distA - distB;
      });
    }

    // Deduplicate to guarantee twin cards never render
    const seenIds = new Set<string>();
    const seenPhones = new Set<string>();
    const seenNameCities = new Set<string>();
    const uniqueResult: Provider[] = [];

    for (const p of result) {
      if (seenIds.has(p.id)) continue;
      const phone = (p.whatsapp || '').replace(/\D/g, '');
      const cleanName = (p.name || '').trim().toLowerCase();
      const cleanCity = (p.city || '').trim().toLowerCase();
      const nameCity = cleanName && cleanCity ? `${cleanName}::${cleanCity}` : '';

      if (phone && phone.length >= 8 && seenPhones.has(phone)) continue;
      if (nameCity && seenNameCities.has(nameCity)) continue;

      seenIds.add(p.id);
      if (phone && phone.length >= 8) seenPhones.add(phone);
      if (nameCity) seenNameCities.add(nameCity);
      uniqueResult.push(p);
    }

    return uniqueResult;
  }, [providers, selectedCategory, selectedCity, searchQuery, referenceCoords]);

  // Center coordinates for map view
  const mapCenterCoords = useMemo(() => {
    if (selectedProvider) return { lat: selectedProvider.lat, lng: selectedProvider.lng };
    if (userCoords) return userCoords;
    if (activeLocality) return { lat: activeLocality.lat, lng: activeLocality.lng };
    if (filteredProviders.length > 0) {
      return { lat: filteredProviders[0].lat, lng: filteredProviders[0].lng };
    }
    return { lat: -23.55052, lng: -46.633308 }; // São Paulo default
  }, [selectedProvider, userCoords, activeLocality, filteredProviders]);

  const handleProviderCreated = (newP: Provider) => {
    const cleanPhone = (newP.whatsapp || '').replace(/\D/g, '');
    const cleanName = (newP.name || '').trim().toLowerCase();
    const cleanCity = (newP.city || '').trim().toLowerCase();

    setProviders((prev) => {
      const filtered = prev.filter((p) => {
        if (p.id === newP.id) return false;
        if (cleanPhone && p.whatsapp.replace(/\D/g, '') === cleanPhone) return false;
        if (cleanName && cleanCity && p.name.trim().toLowerCase() === cleanName && p.city.trim().toLowerCase() === cleanCity) return false;
        return true;
      });
      return [newP, ...filtered];
    });

    setSelectedProvider(newP);
    // Focus locality immediately on the newly registered business
    handleSelectLocality({
      label: `${newP.neighborhood ? newP.neighborhood + ', ' : ''}${newP.city}`,
      lat: newP.lat,
      lng: newP.lng,
      cep: newP.cep,
      source: 'cep'
    });
    setToastMessage(`Negócio "${newP.name}" cadastrado com sucesso! Já está visível na sua região.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleFocusOnMap = (p: Provider) => {
    setSelectedProvider(p);
    setViewMode('map');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isLight ? 'bg-[#F4F7F6] text-[#0B132B]' : 'bg-[#0B132B] text-[#F4F7F6]'}`}>
      {/* Top Navbar with DaMaceno Soluções identity & PWA install */}
      <TecNavbar
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div
          id="toast-notification"
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-[0_0_30px_rgba(0,229,255,0.4)] animate-bounce ${
            isLight
              ? 'bg-white border-[#00E5FF] text-slate-800'
              : 'bg-[#0E1B40] border-[#00E5FF] text-white'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-[#00E5FF] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Official Brand Hero Banner (DaMaceno Soluções / TecConecta) */}
      <TecBrandHero
        onOpenRegister={() => setIsRegisterOpen(true)}
        onExplore={() => {
          const el = document.getElementById('search-controls-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Monetization Banner (Sponsored Companies & "Anuncie Sua Empresa Aqui" CTA) */}
      <MonetizationBanner
        banners={banners}
        adminSettings={adminSettings}
      />

      {/* Hero / Control Section */}
      <section
        id="search-controls-section"
        className={`relative pt-6 pb-4 border-b transition-colors duration-200 ${
          isLight
            ? 'bg-gradient-to-b from-slate-100 to-slate-200/60 border-slate-200'
            : 'bg-gradient-to-b from-[#0F1B3E] to-[#0B132B] border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Headline & Value Prop */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-xs font-semibold text-[#00E5FF] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Zero Intermediação • 100% WhatsApp Direto</span>
              </div>
              <h2 className={`font-['Outfit'] text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Buscar prestadores e serviços <span className="text-[#00E5FF]">sem limitações</span>
              </h2>
              <p className={`text-xs sm:text-sm max-w-2xl mt-1 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                Encontre diaristas, eletricistas, encanadores, mecânicos e comércios locais. Negocie diretamente pelo WhatsApp sem taxas.
              </p>
            </div>

            {/* View Switcher: Modo Lista vs Modo Mapa */}
            <div className="shrink-0">
              <ViewSwitcher
                viewMode={viewMode}
                onChangeView={setViewMode}
                count={filteredProviders.length}
              />
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar serviço, nome, bairro ou digite um CEP..."
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-white/5 border-white/15 text-white placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="sm:col-span-3 relative">
              <select
                id="select-city"
                value={selectedCity}
                onChange={(e) => handleSelectCityChange(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#00E5FF] transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#111B3D] border-white/15 text-white'
                }`}
              >
                <option value="all">Todas as Cidades</option>
                {POPULAR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Locality & CEP Button */}
            <div className="sm:col-span-2">
              <button
                id="btn-open-locality-modal"
                onClick={() => setIsLocalityModalOpen(true)}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition truncate ${
                  activeLocality?.source === 'cep'
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                    : 'bg-white/5 border-white/15 text-gray-300 hover:text-white hover:border-[#00E5FF]/40'
                }`}
                title="Definir endereço ou CEP de pesquisa"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                <span className="truncate">
                  {activeLocality ? (activeLocality.cep ? `CEP ${activeLocality.cep}` : 'Região Ativa') : 'Buscar CEP'}
                </span>
              </button>
            </div>

            {/* GPS Proximity Button */}
            <div className="sm:col-span-2">
              <button
                id="btn-gps-locate"
                onClick={handleRequestGPS}
                disabled={isLocating}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition ${
                  userCoords
                    ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.25)]'
                    : 'bg-white/5 border-white/15 text-gray-300 hover:text-white hover:border-white/30'
                }`}
                title="Ativar ordenação por proximidade do seu GPS"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Obtendo...' : userCoords ? 'GPS Ativo' : 'Meu GPS'}</span>
              </button>
            </div>
          </div>

          {/* Quick CEP Suggestion if detected in search input */}
          {detectedCepInSearch && (
            <div className="p-2.5 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-white">
                  Detectamos o CEP <strong className="font-mono text-[#00E5FF]">{detectedCepInSearch}</strong> na busca.
                </span>
              </div>
              <button
                onClick={handleApplySearchCep}
                disabled={isSearchingCepInline}
                className="px-3 py-1 rounded-lg bg-[#00E5FF] text-[#0B132B] font-bold text-xs hover:bg-[#00E5FF]/90 transition"
              >
                {isSearchingCepInline ? 'Localizando...' : 'Focar nesta região agora'}
              </button>
            </div>
          )}

          {locationStatus && (
            <p className="text-xs text-[#00E5FF] flex items-center gap-1.5 animate-fadeIn">
              <Navigation className="w-3.5 h-3.5" />
              <span>{locationStatus}</span>
            </p>
          )}

          {/* Category Pills Filter */}
          <div className="pt-1">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              customCategories={customCategories}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="font-['Outfit'] font-bold text-sm sm:text-base text-white">
              {viewMode === 'list' ? 'Prestadores Encontrados' : 'Mapa de Localização'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              {filteredProviders.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            {providers.some((p) => p.id.startsWith('seed-')) ? (
              <button
                onClick={handleClearDemoData}
                title="Mostrar apenas estabelecimentos cadastrados reais"
                className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Ocultar cadastros de teste</span>
              </button>
            ) : (
              <button
                onClick={handleResetDemoData}
                title="Restaurar prestadores de demonstração"
                className="text-[11px] text-gray-400 hover:text-[#00E5FF] flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Restaurar exemplos</span>
              </button>
            )}

            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-[#00E5FF] hover:underline"
              >
                Limpar categoria
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#FF6B00] hover:underline"
              >
                Limpar busca
              </button>
            )}
          </div>
        </div>

        {/* View Mode 1: List View */}
        {viewMode === 'list' && (
          <div>
            {filteredProviders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Nenhum prestador encontrado
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Tente buscar com outro termo ou selecionar outra categoria.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedCity('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition"
                >
                  Restaurar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    userCoords={referenceCoords}
                    onFocusOnMap={handleFocusOnMap}
                    onOpenReview={handleOpenReview}
                    isSelected={selectedProvider?.id === provider.id}
                    admWhatsapp={adminSettings.admWhatsapp}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Interactive Google Map View */}
        {viewMode === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[620px]">
            {/* Side Drawer: Quick List of Local Providers */}
            <div className="hidden lg:flex lg:col-span-4 flex-col h-full rounded-2xl bg-[#080E21] border border-white/10 overflow-hidden">
              <div className={`p-3.5 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/5'}`}>
                <span className={`text-xs font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Profissionais no Radar ({filteredProviders.length})
                </span>
                <span className="text-[10px] text-gray-400">Clique para focar no mapa</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {filteredProviders.map((p) => {
                  const isSel = selectedProvider?.id === p.id;
                  const distanceKm = referenceCoords
                    ? calcDist(referenceCoords.lat, referenceCoords.lng, p.lat, p.lng)
                    : null;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`p-3 rounded-xl cursor-pointer transition border ${
                        isSel
                          ? isLight
                            ? 'bg-cyan-50/80 border-[#00E5FF] shadow-sm'
                            : 'bg-[#0E1B40] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-[#00E5FF]/40 hover:bg-slate-50'
                          : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#00E5FF]">{p.category}</span>
                        <div className="flex items-center gap-1.5">
                          {distanceKm !== null && (
                            <span className="text-[10px] font-bold text-[#00E5FF] bg-[#00E5FF]/15 px-1.5 py-0.5 rounded">
                              ~{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReview(p);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                            title="Ver avaliações ou avaliar serviço"
                          >
                            ★ {p.rating ? p.rating.toFixed(1) : '5.0'}
                          </button>
                        </div>
                      </div>
                      <h4 className={`font-bold text-xs line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</h4>
                      <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        {p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city}
                      </p>
                      <div className={`mt-2 flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                        <a
                          href={`https://wa.me/55${p.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá ${p.name}, vi seu anúncio no TecConecta (DaMaceno Soluções)!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-[#25D366] flex items-center gap-1 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReview(p);
                            }}
                            className="text-[10px] text-amber-400 hover:underline font-semibold"
                          >
                            Avaliar
                          </button>
                          <button
                            onClick={() => setSelectedProvider(p)}
                            className="text-[10px] text-[#00E5FF] hover:underline font-semibold"
                          >
                            No Mapa &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Map Component */}
            <div className="col-span-1 lg:col-span-8 h-full">
              <InteractiveMap
                providers={filteredProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={setSelectedProvider}
                onOpenReview={handleOpenReview}
                userCoords={referenceCoords}
                centerCoords={mapCenterCoords}
              />
            </div>
          </div>
        )}
      </main>

      {/* Locality & CEP Selector Modal */}
      <LocalityModal
        isOpen={isLocalityModalOpen}
        onClose={() => setIsLocalityModalOpen(false)}
        currentLocality={activeLocality}
        onSelectLocality={handleSelectLocality}
        onClearLocality={handleClearLocality}
      />

      {/* Simplified Provider Registration Modal (1 Minuto) */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleProviderCreated}
        userCoords={referenceCoords}
        onOpenPrivacyPolicy={() => {
          setIsPrivacyPolicyOpen(true);
        }}
      />

      {/* Mandatory Privacy Policy & Legal Terms Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />

      {/* Edit or Delete Provider Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => {
          setIsEditProfileOpen(false);
          setProviderToEdit(null);
        }}
        targetProvider={providerToEdit}
        allProviders={providers}
        onUpdated={(updated) => {
          setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          if (selectedProvider?.id === updated.id) {
            setSelectedProvider(updated);
          }
          setToastMessage(`Perfil de "${updated.name}" atualizado com sucesso!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onDeleted={(deletedId) => {
          setProviders((prev) => prev.filter((p) => p.id !== deletedId));
          if (selectedProvider?.id === deletedId) {
            setSelectedProvider(null);
          }
          setToastMessage('Perfil excluído com sucesso.');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Admin Management Modal for Sponsored Banners & Settings */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        banners={banners}
        adminSettings={adminSettings}
        providers={providers}
        onBannersUpdated={(updated) => setBanners(updated)}
        onSettingsUpdated={(updated) => setAdminSettings(updated)}
        onDeleteProvider={(deletedId) => {
          setProviders((prev) => prev.filter((p) => p.id !== deletedId));
          if (selectedProvider?.id === deletedId) {
            setSelectedProvider(null);
          }
          setToastMessage('Perfil excluído pela administração.');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onEditProvider={(p) => {
          setProviderToEdit(p);
          setIsEditProfileOpen(true);
        }}
      />

      {/* Community Ratings & Reviews Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        provider={providerToReview}
        onClose={() => {
          setIsReviewOpen(false);
          setProviderToReview(null);
        }}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* PWA Offline Banner */}
      <OfflineIndicator />

      {/* Official Footer with DaMaceno Soluções branding & legal disclaimers */}
      <Footer
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        admWhatsapp={adminSettings.admWhatsapp}
      />
    </div>
  );
}
