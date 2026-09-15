import React, { useState } from 'react';
import { X, CheckCircle2, MapPin, Phone, Briefcase, Building, Sparkles, Navigation, AlertCircle, Search, Loader2 } from 'lucide-react';
import { Provider } from '../types';
import { CATEGORIES } from '../data/categories';
import { saveProvider } from '../services/firebase';
import { fetchAddressByCep } from '../utils/cepGeocoding';
import { ImageUploadField } from './ImageUploadField';
import { normalizeWhatsAppNumber } from '../utils/whatsapp';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProvider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  onOpenPrivacyPolicy: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userCoords,
  onOpenPrivacyPolicy,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Diarista & Limpeza');
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [cep, setCep] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepStatus, setCepStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [city, setCity] = useState('São Paulo - SP');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [lat, setLat] = useState<number>(userCoords?.lat || -23.55052);
  const [lng, setLng] = useState<number>(userCoords?.lng || -46.633308);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format WhatsApp input: (XX) 9XXXX-XXXX, removing any pasted 55 or leading 0
  const handleWhatsappChange = (val: string) => {
    let rawDigits = val.replace(/\D/g, '');
    if (rawDigits.startsWith('0')) {
      rawDigits = rawDigits.replace(/^0+/, '');
    }
    if (rawDigits.startsWith('55') && rawDigits.length > 11) {
      rawDigits = rawDigits.slice(2);
    }
    const digits = rawDigits.slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setWhatsapp(formatted);
  };

  // Search address and coordinates by Brazilian CEP
  const handleCepSearch = async (targetCep?: string) => {
    const raw = (targetCep || cep).replace(/\D/g, '');
    if (raw.length !== 8) {
      setCepStatus({ type: 'error', message: 'Digite um CEP completo com 8 dígitos para localizar.' });
      return;
    }

    setIsSearchingCep(true);
    setCepStatus(null);
    try {
      const res = await fetchAddressByCep(raw);
      setCep(res.cep);
      setCity(`${res.city} - ${res.state}`);
      if (res.neighborhood) setNeighborhood(res.neighborhood);
      if (res.street) {
        setAddress((prev) => (prev && !prev.includes(res.street) ? `${res.street}, ${prev}` : res.street));
      }
      if (res.lat && res.lng) {
        setLat(Number(res.lat.toFixed(6)));
        setLng(Number(res.lng.toFixed(6)));
      }
      setCepStatus({
        type: 'success',
        message: `Localizado: ${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city} - ${res.state}. Geolocalização detectada e fixada no mapa!`
      });
      setLocationNotice(null);
    } catch (err: any) {
      setCepStatus({
        type: 'error',
        message: err.message || 'CEP não encontrado. Preencha a cidade e o endereço manualmente.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    setCep(formatted);
    if (digits.length === 8) {
      handleCepSearch(digits);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocalização não suportada no seu navegador.');
      return;
    }
    setIsLocating(true);
    setLocationNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
        setLocationNotice('Localização atual obtida com sucesso pelo GPS!');
      },
      (err) => {
        setIsLocating(false);
        setLocationNotice('Não foi possível obter o GPS. Coordenadas padrão mantidas.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    const cleanWhatsapp = normalizeWhatsAppNumber(whatsapp);
    if (cleanWhatsapp.length < 10) {
      setErrorMessage('Por favor, informe um WhatsApp válido com DDD (ex: (64) 99999-9999).');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Você deve aceitar os Termos de Uso e Política de Privacidade da TecConecta.');
      return;
    }

    const finalCategory = (isManualCategory || category === '__custom__' || category === 'Outra...') 
      ? (customCategory.trim() || 'Serviços Gerais') 
      : category;

    setIsSubmitting(true);
    try {
      const newProvider: Provider = {
        id: `prov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim(),
        category: finalCategory,
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || `${neighborhood || city}`,
        cep: cep.trim() || undefined,
        lat: Number(lat),
        lng: Number(lng),
        whatsapp: cleanWhatsapp,
        description: description.trim() || `Atendimento de ${finalCategory} em ${city}. Contato direto via WhatsApp!`,
        imageUrl: imageUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        rating: 5.0,
        reviewsCount: 1,
        badge: 'Novo'
      };

      await saveProvider(newProvider);
      setIsSubmitting(false);
      setImageUrl('');
      onSuccess(newProvider);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Erro ao cadastrar. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div
      id="register-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-[0_0_50px_rgba(0,229,255,0.2)] text-[#F4F7F6] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#FF6B00] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center text-[#00E5FF]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                Cadastrar meu Negócio
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                  1 Minuto
                </span>
              </h2>
              <p className="text-xs text-gray-400">Zero intermediação • Conexão 100% direta via WhatsApp</p>
            </div>
          </div>
          <button
            id="btn-close-register-modal"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Nome do Negócio / Profissional */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#00E5FF]" />
              Nome do Negócio ou Profissional *
            </label>
            <input
              id="input-provider-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Eletricista 24h ou Loja Bella Moda"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition"
            />
          </div>

          {/* 2. Categoria e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Categoria Principal *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isManualCategory;
                    setIsManualCategory(next);
                    if (next && !customCategory && category && category !== '__custom__' && category !== 'Outra...') {
                      setCustomCategory(category);
                    }
                  }}
                  className="text-[11px] text-[#00E5FF] hover:underline font-semibold"
                >
                  {isManualCategory ? '📋 Escolher da lista' : '✍️ Digitar manualmente'}
                </button>
              </div>

              {isManualCategory ? (
                <div>
                  <input
                    id="input-provider-custom-category"
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ex: Chaveiro 24h, Vidraçaria, Pet Shop..."
                    className="w-full rounded-xl bg-white/5 border border-[#00E5FF]/40 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Digite o ramo do seu negócio livremente.
                  </p>
                </div>
              ) : (
                <select
                  id="select-provider-category"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsManualCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl bg-[#111B3D] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.name} className="bg-[#0B132B]">
                      {cat.name}
                    </option>
                  ))}
                  <option value="__custom__" className="bg-[#0B132B]">
                    ✍️ Outra categoria (Digitar manualmente)...
                  </option>
                </select>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00E5FF]" />
                WhatsApp com DDD (Somente Números) *
              </label>
              <input
                id="input-provider-whatsapp"
                type="text"
                required
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
            </div>
          </div>

          {/* 3. Localização por CEP (Autocompletar e Geolocalização Automática) */}
          <div className="rounded-xl bg-gradient-to-br from-[#0B132B] to-[#111C3D] border border-[#00E5FF]/25 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                Localizar por CEP (Preenchimento e Geolocalização)
              </label>
              <span className="text-[10px] font-semibold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
                Automático
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="input-provider-cep"
                  type="text"
                  maxLength={9}
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCepSearch();
                    }
                  }}
                  placeholder="00000-000 (Ex: 01310-100)"
                  className="w-full rounded-xl bg-black/40 border border-white/20 px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition"
                />
              </div>

              <button
                type="button"
                id="btn-search-cep"
                onClick={() => handleCepSearch()}
                disabled={isSearchingCep || cep.replace(/\D/g, '').length !== 8}
                className="px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,229,255,0.3)] shrink-0"
              >
                {isSearchingCep ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar CEP</span>
                  </>
                )}
              </button>
            </div>

            {/* CEP Feedback */}
            {cepStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  cepStatus.type === 'success'
                    ? 'bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF]'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                {cepStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#00E5FF]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                )}
                <span className="leading-tight">{cepStatus.message}</span>
              </div>
            )}
          </div>

          {/* 4. Cidade / Bairro / Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#FF6B00]" />
                Cidade / UF *
              </label>
              <input
                id="input-provider-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Bairro Principal *
              </label>
              <input
                id="input-provider-neighborhood"
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Pinheiros, Copacabana, Centro..."
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
              Endereço Comercial ou Ponto de Atendimento (Opcional)
            </label>
            <input
              id="input-provider-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Flores, 120 ou Atendimento em Domicílio"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
            />
          </div>

          {/* Localização GPS / Mapa */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#00E5FF]" />
                Posicionamento no Mapa (Lat / Lng)
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                {isLocating ? 'Detectando...' : 'Usar meu GPS atual'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/30 rounded-lg p-2 border border-white/5 text-gray-300">
                Lat: <span className="text-white font-mono">{lat}</span>
              </div>
              <div className="bg-black/30 rounded-lg p-2 border border-white/5 text-gray-300">
                Lng: <span className="text-white font-mono">{lng}</span>
              </div>
            </div>
            {locationNotice && (
              <p className="text-[11px] text-[#00E5FF]">{locationNotice}</p>
            )}
          </div>

          {/* Descrição curta */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Breve Descrição / Especialidades (Até 250 caracteres)
            </label>
            <textarea
              id="textarea-provider-description"
              rows={2}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Instalações elétricas residenciais rápidas com 10 anos de experiência. Orçamento gratuito sem compromisso!"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition resize-none"
            />
          </div>

          {/* Foto do Negócio / Fachada / Logo */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              label="Foto do Negócio / Fachada / Logo"
              helperText="Insira sua foto agora no cadastro. Após o cadastro concluído, qualquer alteração futura de dados ou fotos é restrita à administração para segurança das informações."
            />
          </div>

          {/* Termos de Uso e Aceitação Obrigatória */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                id="checkbox-terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/10 text-[#00E5FF] focus:ring-[#00E5FF]"
              />
              <span>
                Li e aceito integralmente os{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-[#00E5FF] underline font-semibold hover:text-[#00E5FF]/80"
                >
                  Termos de Uso e Política de Privacidade
                </button>
                , ciente de que o TecConecta não intermedeia pagamentos e isenta-se de garantias sobre serviços prestados.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-provider"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition shadow-[0_0_25px_rgba(0,229,255,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Publicando no Mapa...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar no TecConecta Gratuitamente</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              Seu perfil ficará disponível imediatamente na busca e no mapa.
            </p>
            <p className="text-[10px] text-center text-gray-500 mt-1 max-w-sm mx-auto leading-tight">
              * Para resguardar sua segurança contra alterações indevidas por concorrentes ou terceiros, solicitações futuras de edição ou exclusão cadastral são processadas diretamente com o Administrador via WhatsApp.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
