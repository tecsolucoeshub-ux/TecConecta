import React, { useState } from 'react';
import { X, MapPin, Search, Navigation, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { fetchAddressByCep } from '../utils/cepGeocoding';
import { POPULAR_CITIES } from '../data/categories';

export interface LocalityInfo {
  label: string;
  lat: number;
  lng: number;
  cep?: string;
  source: 'gps' | 'cep' | 'city';
}

interface LocalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: LocalityInfo | null;
  onSelectLocality: (locality: LocalityInfo) => void;
  onClearLocality: () => void;
}

export const LocalityModal: React.FC<LocalityModalProps> = ({
  isOpen,
  onClose,
  currentLocality,
  onSelectLocality,
  onClearLocality,
}) => {
  const [cepInput, setCepInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCepSearch = async () => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) {
      setErrorMsg('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    try {
      const res = await fetchAddressByCep(clean);
      onSelectLocality({
        label: `${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city} - ${res.state}`,
        lat: res.lat,
        lng: res.lng,
        cep: res.cep,
        source: 'cep'
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao consultar o CEP. Verifique os dígitos e tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setIsLocatingGPS(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        onSelectLocality({
          label: 'Minha Localização Atual (GPS)',
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          source: 'gps'
        });
        onClose();
      },
      (err) => {
        setIsLocatingGPS(false);
        setErrorMsg('Permissão de GPS negada ou tempo esgotado. Use a busca por CEP ou escolha uma cidade.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div
      id="locality-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-[0_0_50px_rgba(0,229,255,0.2)] text-[#F4F7F6] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white font-['Outfit'] text-base">Definir Minha Região</h3>
              <p className="text-xs text-gray-400">Localize negócios e serviços no seu bairro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Locality Banner if set */}
          {currentLocality && (
            <div className="p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                <div className="truncate">
                  <span className="text-gray-400 block text-[10px]">Região ativa atual:</span>
                  <span className="font-semibold text-white truncate block">{currentLocality.label}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClearLocality();
                  onClose();
                }}
                className="text-[11px] font-bold text-red-400 hover:underline shrink-0"
              >
                Remover
              </button>
            </div>
          )}

          {/* Option 1: Search by CEP */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#00E5FF]" />
              Buscar pelo seu CEP (Preenchimento e Geolocalização)
            </label>
            <div className="flex gap-2">
              <input
                id="input-locality-cep"
                type="text"
                maxLength={9}
                value={cepInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                  let formatted = digits;
                  if (digits.length > 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
                  setCepInput(formatted);
                  if (digits.length === 8) {
                    setErrorMsg(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCepSearch();
                  }
                }}
                placeholder="Ex: 01310-100"
                className="flex-1 rounded-xl bg-black/40 border border-white/20 px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
              <button
                type="button"
                onClick={handleCepSearch}
                disabled={isSearching || cepInput.replace(/\D/g, '').length !== 8}
                className="px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Option 2: Use Current GPS */}
          <div>
            <button
              type="button"
              onClick={handleGPS}
              disabled={isLocatingGPS}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#00E5FF]/40"
            >
              <Navigation className={`w-3.5 h-3.5 text-[#00E5FF] ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? 'Obtendo GPS...' : 'Usar meu GPS atual (1 clique)'}</span>
            </button>
          </div>

          {/* Option 3: Major Brazilian Cities */}
          <div className="pt-2 border-t border-white/10">
            <label className="text-[11px] font-semibold text-gray-400 mb-2 block flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#FF6B00]" />
              Ou selecione uma cidade principal:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    onSelectLocality({
                      label: city.name,
                      lat: city.lat,
                      lng: city.lng,
                      source: 'city'
                    });
                    onClose();
                  }}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#00E5FF] transition border border-transparent hover:border-[#00E5FF]/30 truncate"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
