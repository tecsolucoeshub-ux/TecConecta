import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Briefcase, 
  Sparkles, 
  Navigation, 
  AlertCircle, 
  Search, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Building2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Provider } from '../types';
import { CATEGORIES } from '../data/categories';
import { saveProvider } from '../services/firebase';
import { fetchAddressByCep } from '../utils/cepGeocoding';
import { ImageUploadField } from './ImageUploadField';
import { normalizeWhatsAppNumber, validateWhatsAppNumber, buildWhatsAppUrl } from '../utils/whatsapp';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProvider: Provider) => void;
  userCoords?: { lat: number; lng: number } | null;
  onOpenPrivacyPolicy: () => void;
}

type AuthMethod = 'google' | 'email';
type BusinessProfileType = 'autonomo' | 'mei' | 'empresa_grande';

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userCoords,
  onOpenPrivacyPolicy,
}) => {
  // Auth & Identification
  const [authMethod, setAuthMethod] = useState<AuthMethod>('google');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUserName, setGoogleUserName] = useState('');

  // Business Type Selection (Autônomo vs MEI vs Grande Empresa)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileType>('autonomo');

  // Business Profile Info
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
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time WhatsApp validator
  const whatsappValidation = useMemo(() => validateWhatsAppNumber(whatsapp), [whatsapp]);

  // Keep coordinates updated if user coordinates are acquired or change
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setLat(userCoords.lat);
      setLng(userCoords.lng);
    }
  }, [userCoords?.lat, userCoords?.lng]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Early return ONLY after all React Hooks have been declared
  if (!isOpen) return null;

  // Simulate or execute Google Account Connection
  const handleConnectGoogle = () => {
    // Acquire Google account identity
    const simulatedGoogleEmail = ownerEmail.trim() || 'profissional.conecta@gmail.com';
    const simulatedGoogleName = name.trim() || 'Profissional Conectado';
    setIsGoogleConnected(true);
    setOwnerEmail(simulatedGoogleEmail);
    setGoogleUserName(simulatedGoogleName);
    if (!name) setName(simulatedGoogleName);
  };

  // Format WhatsApp input: (XX) 9XXXX-XXXX
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
        message: `Localizado: ${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city} - ${res.state}.`
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

    // Filter check: Large corporations are rejected!
    if (businessProfile === 'empresa_grande') {
      setErrorMessage('O TecConecta é exclusivo para profissionais autônomos e MEIs. Empresas médias ou grandes não são aceitas.');
      return;
    }

    if (!ownerEmail.trim()) {
      setErrorMessage('Informe seu e-mail ou conecte com sua conta Google para gerenciar seu anúncio.');
      return;
    }

    if (!whatsappValidation.isValid) {
      setErrorMessage(whatsappValidation.error || 'Por favor, informe um WhatsApp válido com DDD (ex: (64) 99931-7499).');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Você deve aceitar os Termos de Uso e Política de Privacidade da TecConecta (TecSoluções).');
      return;
    }

    if (!declarationAccepted) {
      setErrorMessage('Você deve confirmar a declaração de que atua como Profissional Autônomo ou MEI.');
      return;
    }

    const finalCategory = (isManualCategory || category === '__custom__' || category === 'Outra...') 
      ? (customCategory.trim() || 'Serviços Gerais') 
      : category;

    setIsSubmitting(true);

    try {
      const newProvider: Provider = {
        id: `provider-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        category: finalCategory,
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || undefined,
        cep: cep.replace(/\D/g, '') || undefined,
        lat: lat || -23.55052,
        lng: lng || -46.633308,
        whatsapp: whatsappValidation.normalized,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        rating: 5.0,
        reviewsCount: 1,
        badge: businessProfile === 'mei' ? 'MEI Verificado' : 'Autônomo',
        businessType: businessProfile === 'mei' ? 'mei' : 'autonomo',
        ownerEmail: ownerEmail.trim(),
        ownerAuthMethod: authMethod,
        clicksCount: 0,
        createdAt: new Date().toISOString()
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
      <div className="relative w-full max-w-xl max-h-[92vh] my-auto flex flex-col rounded-2xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-[0_0_50px_rgba(0,229,255,0.2)] text-[#F4F7F6] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#FF6B00] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center text-[#00E5FF]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                Cadastrar no TecConecta
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                  Exclusivo Autônomos & MEIs
                </span>
              </h2>
              <p className="text-xs text-gray-400">Plataforma oficial da TecSoluções • Conexão direta via WhatsApp</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Identificação do Responsável (Google ou E-mail) */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00E5FF]" />
              Identificação do Responsável (Google ou E-mail)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Opção Google */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  handleConnectGoogle();
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                  authMethod === 'google' && isGoogleConnected
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleConnected ? 'Conta Google Conectada ✓' : 'Continuar com Google'}</span>
              </button>

              {/* Opção E-mail */}
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                  authMethod === 'email'
                    ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]'
                    : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Usar E-mail</span>
              </button>
            </div>

            {/* Campo de e-mail */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                E-mail para controle do anúncio:
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
            </div>
          </div>

          {/* 2. Seleção de Perfil e Bloqueio de Empresas Grandes */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                Classificação da sua Atuação *
              </span>
              <span className="text-[10px] text-[#00E5FF] font-semibold">Exclusivo Autônomo / MEI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Opção 1: Autônomo */}
              <div
                onClick={() => setBusinessProfile('autonomo')}
                className={`p-2.5 rounded-xl border cursor-pointer transition text-left ${
                  businessProfile === 'autonomo'
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🧑‍🔧</span>
                  <strong className="text-xs text-white">Autônomo</strong>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Trabalhador independente sem CNPJ ou com CPF.
                </p>
              </div>

              {/* Opção 2: MEI */}
              <div
                onClick={() => setBusinessProfile('mei')}
                className={`p-2.5 rounded-xl border cursor-pointer transition text-left ${
                  businessProfile === 'mei'
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💼</span>
                  <strong className="text-xs text-white">MEI</strong>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Microempreendedor Individual (até 1 colaborador).
                </p>
              </div>

              {/* Opção 3: Empresa Média/Grande (Bloqueada) */}
              <div
                onClick={() => setBusinessProfile('empresa_grande')}
                className={`p-2.5 rounded-xl border cursor-pointer transition text-left ${
                  businessProfile === 'empresa_grande'
                    ? 'bg-red-500/20 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🏢</span>
                  <strong className="text-xs text-white">Empresa Grande</strong>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Sociedades LTDA, S.A., redes ou franquias.
                </p>
              </div>
            </div>

            {/* Aviso de Inelegibilidade se selecionar Empresa Grande */}
            {businessProfile === 'empresa_grande' && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300 block">Cadastro Não Elegível para Empresas Grandes:</strong>
                  <p className="mt-0.5 text-[11px] text-red-200/90 leading-relaxed">
                    A proposta do TecConecta (TecSoluções) é fortalecer especificamente prestadores autônomos e MEIs locais. Médias e grandes empresas podem solicitar anúncios especiais diretamente com a administração através do banner patrocinado.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Nome do Negócio / Profissional */}
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
              placeholder="Ex: João Eletricista ou Maria Confeiteira MEI"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition"
            />
          </div>

          {/* 4. Categoria e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Categoria *
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
                  {isManualCategory ? '📋 Lista' : '✍️ Digitar'}
                </button>
              </div>

              {isManualCategory ? (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ex: Técnico em Ar Condicionado"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsManualCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl bg-[#080E21] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.name} className="bg-[#080E21] text-white">
                      {cat.name}
                    </option>
                  ))}
                  <option value="__custom__" className="bg-[#080E21] text-[#00E5FF] font-bold">
                    + Outra categoria (digitar)...
                  </option>
                </select>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp para Contato Direto *
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                placeholder="(64) 99931-7499"
                className={`w-full rounded-xl bg-white/5 border px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition ${
                  whatsapp && !whatsappValidation.isValid
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-white/15 focus:border-[#00E5FF]'
                }`}
              />
              {whatsapp && !whatsappValidation.isValid && (
                <p className="text-[11px] text-red-400 mt-1">{whatsappValidation.error}</p>
              )}
            </div>
          </div>

          {/* 5. CEP e Localização */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                CEP & Cidade (Geolocalização do Anúncio) *
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>{isLocating ? 'Obtendo GPS...' : 'Usar meu GPS atual'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="CEP (ex: 75900-000)"
                  maxLength={9}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition pr-8"
                />
                {isSearchingCep && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00E5FF] absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade - UF"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
              />
            </div>

            {cepStatus && (
              <p className={`text-[11px] mt-1.5 ${cepStatus.type === 'success' ? 'text-[#00E5FF]' : 'text-red-400'}`}>
                {cepStatus.message}
              </p>
            )}
            {locationNotice && (
              <p className="text-[11px] text-[#00E5FF] mt-1.5">{locationNotice}</p>
            )}
          </div>

          {/* 6. Descrição e Foto */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Descrição dos Serviços
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva brevemente os diferenciais, horários e serviços prestados..."
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
            />
          </div>

          {/* 7. Upload de Foto com compressão automática */}
          <ImageUploadField
            label="Foto do Perfil ou Trabalho (Opcional)"
            value={imageUrl}
            onChange={setImageUrl}
          />

          {/* 8. Declaração MEI/Autônomo e Termos Legais */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-[#00E5FF]"
              />
              <span>
                <strong>Declaração de Enquadramento:</strong> Declaro sob as penas da lei que sou profissional autônomo ou MEI e não possuo quadro societário ou porte de média/grande empresa.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-[#00E5FF]"
              />
              <span>
                Li e aceito os{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-[#00E5FF] hover:underline font-semibold inline"
                >
                  Termos de Uso e Política de Privacidade
                </button>{' '}
                da TecSoluções.
              </span>
            </label>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || businessProfile === 'empresa_grande'}
              className={`w-full py-3 rounded-xl font-['Outfit'] font-bold text-sm transition flex items-center justify-center gap-2 ${
                businessProfile === 'empresa_grande'
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] hover:brightness-110 shadow-[0_0_25px_rgba(0,229,255,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando Anúncio...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Anúncio no TecConecta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
