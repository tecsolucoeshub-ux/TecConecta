import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Trash2, MapPin, Search, AlertTriangle, MessageCircle, Building2, Phone, Sparkles, RefreshCw, CheckCircle2, ExternalLink } from 'lucide-react';
import { Provider } from '../types';
import { CATEGORIES } from '../data/categories';
import { updateProvider, deleteProvider } from '../services/firebase';
import { fetchAddressByCep } from '../utils/cepGeocoding';
import { ImageUploadField } from './ImageUploadField';
import { normalizeWhatsAppNumber, validateWhatsAppNumber, buildWhatsAppUrl, formatWhatsAppForDisplay } from '../utils/whatsapp';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProvider: Provider | null;
  allProviders: Provider[];
  onUpdated: (updated: Provider) => void;
  onDeleted: (providerId: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  targetProvider,
  allProviders,
  onUpdated,
  onDeleted
}) => {
  // Search state if no provider was directly passed
  const [lookupPhone, setLookupPhone] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(targetProvider);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);

  // Status & loading
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepStatusMessage, setCepStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time WhatsApp validator for editor
  const whatsappValidation = useMemo(() => validateWhatsAppNumber(whatsapp), [whatsapp]);

  const handleWhatsappChange = (val: string) => {
    let raw = val.replace(/\D/g, '');
    if (raw.startsWith('0')) raw = raw.replace(/^0+/, '');
    if (raw.startsWith('55') && raw.length > 11) raw = raw.slice(2);
    const digits = raw.slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setWhatsapp(formatted);
  };

  // Sync state when targetProvider or modal opens
  useEffect(() => {
    if (targetProvider) {
      setSelectedProvider(targetProvider);
      populateForm(targetProvider);
    } else {
      // Check if user has a previously registered business on this device
      try {
        const lastCreatedId = localStorage.getItem('tecconecta_last_created_id');
        if (lastCreatedId) {
          const found = allProviders.find(p => p.id === lastCreatedId);
          if (found) {
            setSelectedProvider(found);
            populateForm(found);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      setSelectedProvider(null);
    }
  }, [targetProvider, isOpen, allProviders]);

  const populateForm = (p: Provider) => {
    setName(p.name);
    const isStandard = CATEGORIES.some(
      (c) => c.id !== 'all' && c.name.trim().toLowerCase() === (p.category || '').trim().toLowerCase()
    );
    if (isStandard) {
      setCategory(p.category);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setCategory('__custom__');
      setIsCustomCategory(true);
      setCustomCategory(p.category || '');
    }
    setCep(p.cep || '');
    setAddress(p.address);
    setNeighborhood(p.neighborhood || '');
    setCity(p.city);
    setWhatsapp(formatWhatsAppForDisplay(p.whatsapp));
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setLat(p.lat);
    setLng(p.lng);
    setConfirmDelete(false);
    setErrorMessage(null);
    setCepStatusMessage(null);
  };

  if (!isOpen) return null;

  // Search profile by phone or name
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const clean = lookupPhone.replace(/\D/g, '');
    const term = lookupPhone.toLowerCase().trim();

    const found = allProviders.find(p => {
      const matchPhone = clean && p.whatsapp.replace(/\D/g, '').includes(clean);
      const matchName = term && p.name.toLowerCase().includes(term);
      return matchPhone || matchName;
    });

    if (found) {
      setSelectedProvider(found);
      populateForm(found);
    } else {
      setLookupError('Nenhum anúncio encontrado com este telefone ou nome. Verifique o número digitado.');
    }
  };

  // CEP lookup
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepStatusMessage('Digite os 8 dígitos do CEP para buscar.');
      return;
    }

    setIsSearchingCep(true);
    setCepStatusMessage(null);
    try {
      const result = await fetchAddressByCep(cleanCep);
      if (result.street) setAddress(result.street);
      if (result.neighborhood) setNeighborhood(result.neighborhood);
      if (result.city) setCity(result.city);
      setLat(result.lat);
      setLng(result.lng);
      setCepStatusMessage(`Localizado: ${result.city} (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
    } catch (err: any) {
      setCepStatusMessage(err.message || 'Não foi possível buscar o CEP automaticamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || 'Serviços Gerais')
      : category;

    if (!name.trim() || !finalCategory || !city.trim() || !whatsapp.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (Nome, Categoria, Cidade, WhatsApp).');
      return;
    }

    if (!whatsappValidation.isValid) {
      setErrorMessage(whatsappValidation.error || 'WhatsApp inválido. Digite o DDD + número (ex: (64) 99931-7499).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await updateProvider(selectedProvider.id, {
        name: name.trim(),
        category: finalCategory,
        cep: cep.trim() || undefined,
        address: address.trim() || 'Atendimento Local',
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim(),
        whatsapp: whatsappValidation.normalized,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        lat,
        lng
      });

      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações do prestador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete profile
  const handleDelete = async () => {
    if (!selectedProvider) return;
    setIsDeleting(true);
    try {
      await deleteProvider(selectedProvider.id);
      onDeleted(selectedProvider.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir perfil.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#0E1B40] to-[#0B132B] border border-white/20 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-white flex items-center gap-2">
                Edição de Cadastro • Painel ADM
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                  Moderação
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Edite os dados cadastrais ou remova o perfil conforme solicitado pelo anunciante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Lookup by WhatsApp if no provider selected */}
        {!selectedProvider ? (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <p>
                Para editar ou excluir seu cadastro, digite o <strong>número do WhatsApp</strong> com DDD (ou o nome do seu negócio) que você utilizou no cadastro.
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  WhatsApp com DDD ou Nome do Negócio:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    placeholder="Ex: 11987654321 ou Nome da Loja"
                    className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-bold text-xs font-['Outfit'] flex items-center gap-1.5 transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>Localizar</span>
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                  {lookupError}
                </div>
              )}
            </form>

            {/* Quick list of recent or registered businesses */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Ou selecione na lista de cadastros:
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {allProviders.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p);
                      populateForm(p);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00E5FF]/40 text-xs text-white flex items-center justify-between transition"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-gray-400 text-[11px] ml-2">({p.city} • {p.category})</span>
                    </div>
                    <span className="text-[#00E5FF] font-semibold text-[11px] shrink-0">Editar &rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Edit Form */
          <form onSubmit={handleSave} className="space-y-4">
            {/* Header info about the current business being edited */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-gray-300">Editando:</span>
                <strong className="text-white">{selectedProvider.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="text-[11px] text-[#00E5FF] hover:underline"
              >
                Trocar perfil
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome do Negócio ou Profissional *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                />
              </div>

              {/* Categoria */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Categoria de Atuação *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomCategory;
                      setIsCustomCategory(next);
                      if (next && !customCategory && category && category !== '__custom__') {
                        setCustomCategory(category);
                      }
                    }}
                    className="text-[11px] text-[#00E5FF] hover:underline font-semibold"
                  >
                    {isCustomCategory ? '📋 Escolher da lista' : '✍️ Digitar manualmente'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <div>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ex: Chaveiro 24h, Vidraçaria, Pet Shop..."
                      required
                      className="w-full rounded-xl bg-white/5 border border-[#00E5FF]/50 px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Categoria personalizada inserida manualmente pelo ADM.
                    </p>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        if (!customCategory) setCustomCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    required
                    className="w-full rounded-xl bg-[#111B3D] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">✍️ Outra categoria (Inserir manualmente)...</option>
                  </select>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">
                    WhatsApp com DDD *
                  </label>
                  {whatsapp && whatsappValidation.isValid && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Válido
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  placeholder="Ex: (64) 99931-7499"
                  required
                  className={`w-full rounded-xl bg-white/5 border px-3 py-2 text-xs sm:text-sm text-white focus:outline-none transition ${
                    whatsapp && !whatsappValidation.isValid
                      ? 'border-amber-500/60 focus:border-amber-400'
                      : whatsapp && whatsappValidation.isValid
                      ? 'border-emerald-500/60 focus:border-emerald-400'
                      : 'border-white/15 focus:border-[#00E5FF]'
                  }`}
                />

                {/* Real-time feedback and direct link test */}
                {whatsapp ? (
                  whatsappValidation.isValid ? (
                    <div className="mt-1.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Válido: <strong>+55 {whatsappValidation.formatted}</strong>
                        </span>
                      </div>
                      <a
                        href={buildWhatsAppUrl(whatsappValidation.normalized, 'Olá! Teste de abertura direta pelo TecConecta.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[10px] transition shadow"
                        title="Testar abertura direta no seu WhatsApp"
                      >
                        <span>Testar link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-400 mt-1">
                      {whatsappValidation.error}
                    </p>
                  )
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ex: (64) 99931-7499. Salvo no padrão oficial WhatsApp wa.me direto.
                  </p>
                )}
              </div>

              {/* CEP */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  CEP do Negócio (Localização)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                  />
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isSearchingCep}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingCep ? 'animate-spin' : ''}`} />
                    <span>{isSearchingCep ? 'Buscando' : 'Atualizar'}</span>
                  </button>
                </div>
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                />
              </div>

              {/* Endereço */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Endereço ou Ponto de Referência
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                />
              </div>

              {/* Descrição */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Descrição dos Serviços Oferecidos
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00E5FF] transition resize-none"
                />
              </div>

              {/* Foto do Negócio / Fachada / Logo */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <ImageUploadField
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Foto do Negócio / Fachada / Logo"
                  helperText="Dê visibilidade máxima ao seu negócio trocando ou adicionando uma foto atraente."
                />
              </div>
            </div>

            {cepStatusMessage && (
              <p className="text-xs text-[#00E5FF] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{cepStatusMessage}</span>
              </p>
            )}

            {/* Danger Zone: Excluir Perfil */}
            <div className="pt-3 border-t border-white/10">
              {!confirmDelete ? (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir meu perfil permanentemente</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-bold text-xs font-['Outfit'] flex items-center gap-1.5 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-red-300 block mb-0.5">
                        Confirmar exclusão definitiva do perfil?
                      </strong>
                      <p className="text-red-200/80">
                        O seu perfil, telefone e localização serão removidos do mapa e da busca do TecConecta.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir Perfil'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
