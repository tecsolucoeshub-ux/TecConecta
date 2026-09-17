import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Check,
  Users,
  Settings,
  MessageCircle,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Search,
  CheckCircle2,
  Presentation,
  Play
} from 'lucide-react';
import { SponsoredBanner, AdminSettings, Provider } from '../types';
import { CATEGORIES } from '../data/categories';
import { saveSponsoredBanner, deleteSponsoredBanner, saveAdminSettings } from '../services/firebase';
import { ImageUploadField } from './ImageUploadField';
import { normalizeWhatsAppNumber, validateWhatsAppNumber } from '../utils/whatsapp';
import { ProjectPresentationModal } from './ProjectPresentationModal';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  banners: SponsoredBanner[];
  adminSettings: AdminSettings;
  providers: Provider[];
  onBannersUpdated: (banners: SponsoredBanner[]) => void;
  onSettingsUpdated: (settings: AdminSettings) => void;
  onDeleteProvider: (id: string) => void;
  onEditProvider?: (provider: Provider) => void;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const SESSION_AUTH_KEY = 'tecconecta_admin_session_auth';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  banners,
  adminSettings,
  providers,
  onBannersUpdated,
  onSettingsUpdated,
  onDeleteProvider,
  onEditProvider,
  onAuthChange,
}) => {
  // Authentication & Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // First-time setup state (when master password is not yet personalized)
  const isDefaultPassword = !adminSettings.adminPin || adminSettings.adminPin === '' || adminSettings.adminPin === 'admin123';
  const [isSetupMode, setIsSetupMode] = useState<boolean>(isDefaultPassword);
  const [setupNewPassword, setSetupNewPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  // Active Tab: 'banners' | 'settings' | 'providers' | 'presentation'
  const [activeTab, setActiveTab] = useState<'banners' | 'settings' | 'providers' | 'presentation'>('banners');

  // Presentation Modal State (Exclusive for Authenticated ADM)
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Search filter for providers tab
  const [providerSearch, setProviderSearch] = useState('');

  // New Banner Form State
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [headline, setHeadline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [bannerWhatsapp, setBannerWhatsapp] = useState('');
  const [badgeText, setBadgeText] = useState('Empresa Patrocinada');
  const [category, setCategory] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerSaving, setBannerSaving] = useState(false);

  // Settings form state
  const [admWhatsapp, setAdmWhatsapp] = useState(adminSettings.admWhatsapp);
  const [admName, setAdmName] = useState(adminSettings.admName);
  const [bannerHeadline, setBannerHeadline] = useState(adminSettings.bannerHeadline);
  const [bannerSubtext, setBannerSubtext] = useState(adminSettings.bannerSubtext);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Deletion state (safe inline confirmation without window.confirm)
  const [bannerIdToDelete, setBannerIdToDelete] = useState<string | null>(null);
  const [providerIdToDelete, setProviderIdToDelete] = useState<string | null>(null);

  // Change password form in settings
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  useEffect(() => {
    setAdmWhatsapp(adminSettings.admWhatsapp);
    setAdmName(adminSettings.admName);
    setBannerHeadline(adminSettings.bannerHeadline);
    setBannerSubtext(adminSettings.bannerSubtext);
  }, [adminSettings]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const currentSavedPin = adminSettings.adminPin || 'admin123';
    // Allow either the configured password or the initial setup
    if (passwordInput.trim() === currentSavedPin || (currentSavedPin === 'admin123' && passwordInput.trim() === 'admin123')) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      onAuthChange?.(true);
      setPasswordInput('');
    } else {
      setAuthError('Senha de acesso incorreta. Verifique e tente novamente.');
    }
  };

  // Handle First Time Master Password Setup
  const handleFirstTimeSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (setupNewPassword.length < 4) {
      setAuthError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (setupNewPassword !== setupConfirmPassword) {
      setAuthError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    const updated: AdminSettings = {
      ...adminSettings,
      adminPin: setupNewPassword.trim(),
    };

    saveAdminSettings(updated);
    onSettingsUpdated(updated);
    setIsAuthenticated(true);
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
    onAuthChange?.(true);
    setIsSetupMode(false);
    setSetupNewPassword('');
    setSetupConfirmPassword('');
  };

  // Logout / Lock Admin Panel
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    onAuthChange?.(false);
    setPasswordInput('');
    setAuthError(null);
  };

  // Change Password from inside Settings tab
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);

    if (newMasterPassword.length < 4) {
      setPasswordChangeError('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }

    if (newMasterPassword !== confirmMasterPassword) {
      setPasswordChangeError('A confirmação de senha não confere.');
      return;
    }

    const updated: AdminSettings = {
      ...adminSettings,
      adminPin: newMasterPassword.trim(),
    };

    saveAdminSettings(updated);
    onSettingsUpdated(updated);
    setPasswordChangeSuccess(true);
    setNewMasterPassword('');
    setConfirmMasterPassword('');
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  // Create Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !headline.trim() || !bannerWhatsapp.trim()) {
      alert('Preencha os campos obrigatórios do banner.');
      return;
    }

    const val = validateWhatsAppNumber(bannerWhatsapp);
    if (!val.isValid) {
      alert(val.error || 'WhatsApp do banner inválido.');
      return;
    }

    setBannerSaving(true);
    try {
      const newBanner: SponsoredBanner = {
        id: `banner-${Date.now()}`,
        companyName: companyName.trim(),
        headline: headline.trim(),
        subtext: subtext.trim() || 'Entre em contato pelo WhatsApp.',
        whatsapp: val.normalized,
        badgeText: badgeText.trim() || 'Patrocinador',
        category: category.trim() || 'Comércio Local',
        imageUrl: bannerImageUrl.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString()
      };

      await saveSponsoredBanner(newBanner);
      const updated = [newBanner, ...banners];
      onBannersUpdated(updated);
      setIsCreatingBanner(false);

      // Reset form
      setCompanyName('');
      setHeadline('');
      setSubtext('');
      setBannerWhatsapp('');
      setBadgeText('Empresa Patrocinada');
      setCategory('');
      setBannerImageUrl('');
    } catch (e) {
      console.error(e);
      alert('Erro ao criar banner patrocinado.');
    } finally {
      setBannerSaving(false);
    }
  };

  // Promote an existing provider directly to a sponsored banner
  const handlePromoteToBanner = (p: Provider) => {
    setCompanyName(p.name);
    setBannerWhatsapp(p.whatsapp);
    setHeadline(`${p.name} - Atendimento Especializado`);
    setSubtext(p.description || `Serviço profissional de ${p.category} em ${p.city}. Contato direto via WhatsApp!`);
    setBadgeText('Patrocinador Oficial');
    setCategory(p.category);
    setBannerImageUrl(p.imageUrl || '');
    setIsCreatingBanner(true);
    setActiveTab('banners');
  };

  // Toggle Banner
  const handleToggleBanner = async (banner: SponsoredBanner) => {
    const updated: SponsoredBanner = { ...banner, active: !banner.active };
    await saveSponsoredBanner(updated);
    const list = banners.map(b => (b.id === banner.id ? updated : b));
    onBannersUpdated(list);
  };

  // Delete Banner (safe without iframe-blocked confirm())
  const handleConfirmDeleteBanner = async (id: string) => {
    try {
      setBannerIdToDelete(null);
      await deleteSponsoredBanner(id);
      const list = banners.filter(b => b.id !== id);
      onBannersUpdated(list);
    } catch (e) {
      console.error('Error deleting banner:', e);
    }
  };

  // Delete Provider (safe without iframe-blocked confirm())
  const handleConfirmDeleteProvider = (id: string) => {
    setProviderIdToDelete(null);
    onDeleteProvider(id);
  };

  // Save General Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateWhatsAppNumber(admWhatsapp);
    if (!val.isValid) {
      alert(val.error || 'WhatsApp do Administrador inválido.');
      return;
    }
    const updated: AdminSettings = {
      ...adminSettings,
      admWhatsapp: val.normalized,
      admName: admName.trim(),
      bannerHeadline: bannerHeadline.trim(),
      bannerSubtext: bannerSubtext.trim(),
    };
    saveAdminSettings(updated);
    onSettingsUpdated(updated);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  // Filter providers in admin view
  const filteredProviders = providers.filter(p => {
    if (!providerSearch.trim()) return true;
    const term = providerSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.whatsapp.includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-[#0F1B3E] to-[#080E21] border border-[#00E5FF]/30 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,229,255,0.15)] my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#FF6B00]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Outfit'] text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Painel ADM • DaMaceno Soluções
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                  Acesso Restrito
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Gestão segura de anunciantes, moderação de perfis e configurações
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPresentationOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-xs font-['Outfit'] transition hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                  title="Abrir Apresentação do Projeto (Modo Slides Pitch Deck)"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Apresentação do Projeto</span>
                  <span className="sm:hidden">Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                  title="Bloquear e sair da sessão administrativa"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bloquear</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Barrier */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto py-6 w-full space-y-5 overflow-y-auto">
            {/* Setup Mode: Admin defines custom password */}
            {isSetupMode ? (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-[#00E5FF]/20 border border-[#FF6B00]/40 flex items-center justify-center mx-auto text-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                    Definir Senha de Administrador
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Por segurança, crie sua senha mestra exclusiva para proteger o acesso administrativo ao TecConecta.
                  </p>
                </div>

                <form onSubmit={handleFirstTimeSetup} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Nova Senha de ADM:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={setupNewPassword}
                        onChange={(e) => setSetupNewPassword(e.target.value)}
                        placeholder="Digite sua senha de segurança"
                        required
                        className="w-full rounded-xl bg-white/5 border border-white/20 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Confirmar Senha:
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                      className="w-full rounded-xl bg-white/5 border border-white/20 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition"
                    />
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-sm font-['Outfit'] transition hover:brightness-110 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  >
                    Salvar Senha e Acessar Painel
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSetupMode(false);
                        setAuthError(null);
                      }}
                      className="text-xs text-gray-400 hover:text-white underline"
                    >
                      Já possui uma senha? Fazer login
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Standard Secure Login */
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                    Acesso Restrito ao Administrador
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Digite sua senha para desbloquear as ferramentas administrativas.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3 text-left">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      required
                      className="w-full text-center tracking-wider font-mono rounded-xl bg-white/5 border border-white/20 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF] pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-extrabold text-sm font-['Outfit'] transition shadow-[0_0_20px_rgba(0,229,255,0.25)]"
                  >
                    Entrar no Painel ADM
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSetupMode(true);
                        setAuthError(null);
                      }}
                      className="text-xs text-gray-400 hover:text-[#00E5FF] underline"
                    >
                      Configurar ou redefinir senha mestra
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Private Hint for Admin Shortcuts */}
            <div className="mb-4 p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-start gap-2.5 text-xs text-gray-300 shrink-0">
              <Key className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#00E5FF]">Atalhos de Acesso Rápido para você (ADM):</strong>
                <p className="mt-0.5 text-gray-400 leading-tight">
                  O botão público de ADM foi ocultado dos visitantes. Você pode abrir este painel a qualquer momento usando as teclas <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-white font-mono font-bold">Ctrl + Shift + A</kbd> (ou <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-white font-mono font-bold">Alt + A</kbd>), adicionando <code className="text-[#00E5FF]">#admin</code> na URL, ou clicando no ponto <code className="text-white">•</code> junto ao copyright no rodapé.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('banners')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'banners'
                    ? 'bg-[#FF6B00] text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Banners Patrocinados ({banners.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('providers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'providers'
                    ? 'bg-[#00E5FF] text-[#0B132B] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Prestadores ({providers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurações & Senha</span>
              </button>

              <button
                onClick={() => setActiveTab('presentation')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'presentation'
                    ? 'bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Apresentação do Projeto</span>
              </button>
            </div>

            {/* Tab Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Tab 1: Sponsored Banners Management */}
              {activeTab === 'banners' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white font-['Outfit']">
                        Empresas Patrocinadas Cadastradas
                      </h3>
                      <p className="text-xs text-gray-400">
                        Banners de empresas parceiras que contrataram destaque com você fora da plataforma.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCreatingBanner(!isCreatingBanner)}
                      className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#0B132B] font-bold text-xs font-['Outfit'] flex items-center gap-1.5 hover:bg-[#00E5FF]/90 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isCreatingBanner ? 'Fechar' : 'Novo Patrocinador'}</span>
                    </button>
                  </div>

                  {/* Create New Banner Form */}
                  {isCreatingBanner && (
                    <form onSubmit={handleCreateBanner} className="p-4 rounded-xl bg-white/5 border border-[#00E5FF]/40 space-y-3">
                      <h4 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Cadastrar Empresa Patrocinada
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Nome da Empresa *</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ex: Farmácia São Bento"
                            required
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">WhatsApp da Empresa *</label>
                          <input
                            type="text"
                            value={bannerWhatsapp}
                            onChange={(e) => setBannerWhatsapp(e.target.value)}
                            placeholder="Ex: 64999317499"
                            required
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-300 mb-1">Título / Chamada no Banner (Headline) *</label>
                          <input
                            type="text"
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            placeholder="Ex: Entrega Grátis em até 30 Minutos em Todo o Bairro"
                            required
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-300 mb-1">Subtítulo / Descrição</label>
                          <input
                            type="text"
                            value={subtext}
                            onChange={(e) => setSubtext(e.target.value)}
                            placeholder="Ex: Medicamentos, perfumaria e conveniência com atendimento direto no WhatsApp."
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Texto do Selo</label>
                          <input
                            type="text"
                            value={badgeText}
                            onChange={(e) => setBadgeText(e.target.value)}
                            placeholder="Ex: Empresa Parceira ou Patrocinador Oficial"
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Ramo / Categoria</label>
                          <input
                            type="text"
                            list="admin-banner-categories"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ex: Farmácia & Saúde, Chaveiro 24h..."
                            className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                          />
                          <datalist id="admin-banner-categories">
                            {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                              <option key={c.id} value={c.name} />
                            ))}
                          </datalist>
                        </div>

                        <div className="sm:col-span-2">
                          <ImageUploadField
                            value={bannerImageUrl}
                            onChange={setBannerImageUrl}
                            label="Foto / Logo / Fachada do Patrocinador (Banner)"
                            helperText="Esta foto aparecerá em destaque no topo do TecConecta e chamará mais clientes."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingBanner(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-gray-300"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={bannerSaving}
                          className="px-4 py-1.5 rounded-lg bg-[#FF6B00] text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{bannerSaving ? 'Salvando...' : 'Cadastrar e Ativar Banner'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Banners List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {banners.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Nenhum banner patrocinado cadastrado.</p>
                    ) : (
                      banners.map((b) => (
                        <div
                          key={b.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                            b.active
                              ? 'bg-white/5 border-white/15'
                              : 'bg-white/[0.02] border-white/5 opacity-50'
                          }`}
                        >
                          {b.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40">
                              <img
                                src={b.imageUrl}
                                alt={b.companyName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs truncate">
                                {b.companyName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#00E5FF] font-semibold">
                                {b.badgeText || 'Patrocinador'}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {b.active ? 'Ativo no App' : 'Pausado'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-300 truncate mt-0.5">{b.headline}</p>
                            <span className="text-[10px] text-gray-400">WhatsApp: {b.whatsapp}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleBanner(b)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
                            >
                              {b.active ? 'Pausar' : 'Ativar'}
                            </button>

                            {bannerIdToDelete === b.id ? (
                              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-red-950/80 border border-red-500/40">
                                <span className="text-[10px] text-red-300 font-bold pl-1">Excluir?</span>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDeleteBanner(b.id)}
                                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBannerIdToDelete(null)}
                                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] transition"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setBannerIdToDelete(b.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition"
                                title="Excluir este banner"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Providers Management (Exclusive to ADM) */}
              {activeTab === 'providers' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white font-['Outfit']">
                        Gestão de Negócios Cadastrados ({providers.length})
                      </h3>
                      <p className="text-xs text-gray-400">
                        Edição restrita ao ADM para prevenir que concorrentes alterem cadastros alheios.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        placeholder="Buscar prestador..."
                        className="w-full rounded-xl bg-white/5 border border-white/15 pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {filteredProviders.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhum prestador encontrado com o termo digitado.</p>
                    ) : (
                      filteredProviders.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-white/20 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40 relative">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white/5 text-[10px] text-center px-1">
                                  Sem foto
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <strong className="text-white text-xs sm:text-sm">{p.name}</strong>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border border-[#00E5FF]/30">
                                  {p.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-1 flex-wrap">
                                <span>📍 {p.city}{p.cep ? ` (CEP: ${p.cep})` : ''}</span>
                                <span>•</span>
                                <span>WhatsApp: {p.whatsapp}</span>
                              </div>
                              {p.description && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5 max-w-md">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handlePromoteToBanner(p)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/35 text-[#00E5FF] text-xs font-semibold transition"
                              title="Destacar os dados e foto deste anunciante no banner"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                              <span>No Banner</span>
                            </button>

                            {onEditProvider && (
                              <button
                                onClick={() => onEditProvider(p)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-semibold transition"
                                title="Editar dados ou foto deste prestador"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar / Foto</span>
                              </button>
                            )}

                            {providerIdToDelete === p.id ? (
                              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-red-950/80 border border-red-500/40">
                                <span className="text-[10px] text-red-300 font-bold pl-1">Excluir?</span>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDeleteProvider(p.id)}
                                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProviderIdToDelete(null)}
                                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] transition"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setProviderIdToDelete(p.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition"
                                title="Excluir perfil do prestador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Settings & Password Change */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Section A: Security & Change Master Password */}
                  <form onSubmit={handleChangePassword} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-[#00E5FF]">
                      <Key className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Alterar Senha do Administrador
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400">
                      Atualize sua senha mestra de acesso para a que você desejar a qualquer momento.
                    </p>

                    {passwordChangeSuccess && (
                      <div className="p-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-xs text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Senha mestra atualizada e salva com sucesso!</span>
                      </div>
                    )}

                    {passwordChangeError && (
                      <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordChangeError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          Nova Senha de ADM:
                        </label>
                        <input
                          type="password"
                          value={newMasterPassword}
                          onChange={(e) => setNewMasterPassword(e.target.value)}
                          placeholder="Digite nova senha"
                          required
                          className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          Confirmar Nova Senha:
                        </label>
                        <input
                          type="password"
                          value={confirmMasterPassword}
                          onChange={(e) => setConfirmMasterPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          required
                          className="w-full rounded-lg bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B132B] font-bold text-xs font-['Outfit'] transition flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Salvar Nova Senha</span>
                      </button>
                    </div>
                  </form>

                  {/* Section B: Department Contact & Monetization Text */}
                  <form onSubmit={handleSaveSettings} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#FF6B00]" />
                      <span>Dados de Contato & Publicidade</span>
                    </h4>

                    {settingsSuccess && (
                      <div className="p-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-xs text-green-300 flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Dados de contato salvos com sucesso!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          WhatsApp do ADM (com DDD) *
                        </label>
                        <input
                          type="text"
                          value={admWhatsapp}
                          onChange={(e) => setAdmWhatsapp(e.target.value)}
                          placeholder="Ex: 64999317499"
                          required
                          className="w-full rounded-xl bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          Nome do Responsável / Departamento
                        </label>
                        <input
                          type="text"
                          value={admName}
                          onChange={(e) => setAdmName(e.target.value)}
                          placeholder="Ex: DaMaceno Soluções Administrativo"
                          className="w-full rounded-xl bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-300 mb-1">
                          Título do Banner Padrão (Espaço Publicitário)
                        </label>
                        <input
                          type="text"
                          value={bannerHeadline}
                          onChange={(e) => setBannerHeadline(e.target.value)}
                          placeholder="Anuncie Sua Empresa Aqui"
                          className="w-full rounded-xl bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-300 mb-1">
                          Subtítulo do Banner Padrão
                        </label>
                        <input
                          type="text"
                          value={bannerSubtext}
                          onChange={(e) => setBannerSubtext(e.target.value)}
                          placeholder="Entre em contato com o departamento administrativo"
                          className="w-full rounded-xl bg-[#0B132B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-bold text-xs font-['Outfit'] flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar Informações</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 4: Project Presentation Overview & Pitch Deck Launcher */}
              {activeTab === 'presentation' && (
                <div className="space-y-4">
                  {/* Hero Presentation Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F1B3E] to-[#0B132B] border border-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 uppercase tracking-wider font-['Outfit']">
                          Material Executivo
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          8 Slides Interativos
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white font-['Outfit']">
                        Apresentação Comercial & Técnica do TecConecta
                      </h3>
                      <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                        Este deck executivo foi criado para você demonstrar a investidores, parceiros locais e clientes o valor da plataforma, nossa estratégia de monetização e o diferencial da TecSoluções.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPresentationOpen(true)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-xs sm:text-sm font-['Outfit'] transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.4)] shrink-0"
                    >
                      <Play className="w-4 h-4 fill-[#0B132B]" />
                      <span>Abrir Apresentação (Tela Cheia)</span>
                    </button>
                  </div>

                  {/* Summary of the 8 Slides in the Deck */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Roteiro dos Slides Disponíveis:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] font-bold text-xs flex items-center justify-center shrink-0">
                            01
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Visão Geral & Proposta</div>
                            <div className="text-[11px] text-gray-400">Hub inteligente de serviços locais sem burocracia</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#00E5FF]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] font-bold text-xs flex items-center justify-center shrink-0">
                            02
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Diagnóstico de Mercado</div>
                            <div className="text-[11px] text-gray-400">Dores de clientes e comissões abusivas tradicionais</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#FF6B00]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] font-bold text-xs flex items-center justify-center shrink-0">
                            03
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">A Solução TecConecta</div>
                            <div className="text-[11px] text-gray-400">Busca por linguagem natural e GPS em tempo real</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#00E5FF]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] font-bold text-xs flex items-center justify-center shrink-0">
                            04
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Autonomia do Prestador</div>
                            <div className="text-[11px] text-gray-400">Cadastro em 60s via CEP e 100% do lucro ao autônomo</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#FF6B00]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] font-bold text-xs flex items-center justify-center shrink-0">
                            05
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Modelo de Negócio</div>
                            <div className="text-[11px] text-gray-400">Monetização por banners e vitrine institucional TecSoluções</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#00E5FF]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] font-bold text-xs flex items-center justify-center shrink-0">
                            06
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Governança & Painel ADM</div>
                            <div className="text-[11px] text-gray-400">Painel invisível ao público e gestão segura de anunciantes</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#FF6B00]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] font-bold text-xs flex items-center justify-center shrink-0">
                            07
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Engenharia & Stack</div>
                            <div className="text-[11px] text-gray-400">React 18, TypeScript, Firestore e Google Maps</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#00E5FF]" />
                      </div>

                      <div
                        onClick={() => setIsPresentationOpen(true)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] font-bold text-xs flex items-center justify-center shrink-0">
                            08
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">Roadmap & Próximos Passos</div>
                            <div className="text-[11px] text-gray-400">Expansão de cidades, selo verificado e agente IA</div>
                          </div>
                        </div>
                        <Play className="w-3 h-3 text-[#FF6B00]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Presentation Modal (Exclusively accessible by Authenticated ADM) */}
      {isPresentationOpen && (
        <ProjectPresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
        />
      )}
    </div>
  );
};
