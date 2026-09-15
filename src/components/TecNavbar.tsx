import React from 'react';
import { PlusCircle, ShieldCheck, Sun, Moon } from 'lucide-react';
import { TecLogo } from './TecLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../context/ThemeContext';

interface TecNavbarProps {
  onOpenRegister: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const TecNavbar: React.FC<TecNavbarProps> = ({
  onOpenRegister,
  onOpenPrivacyPolicy,
}) => {
  const { isLight, toggleTheme } = useTheme();

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 border-b backdrop-blur-xl ${
        isLight
          ? 'bg-white/95 border-slate-200 shadow-sm'
          : 'bg-[#0B132B]/90 border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <TecLogo />
          
          <div
            className={`hidden lg:flex items-center gap-2 pl-4 border-l text-xs ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-gray-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
            <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
              Zero Intermediação • 100% WhatsApp Direto
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Switcher Toggle (Claro / Escuro) */}
          <button
            id="btn-nav-toggle-theme"
            onClick={toggleTheme}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition text-xs font-semibold ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200 hover:text-white'
            }`}
            title={isLight ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
            aria-label="Alternar tema de cores"
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="hidden sm:inline">Claro</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Privacy & Terms Quick Trigger */}
          <button
            id="btn-nav-privacy-policy"
            onClick={onOpenPrivacyPolicy}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-[#0097A7]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/40'
            }`}
            title="Ver Termos e Política de Privacidade"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden sm:inline">Termos</span>
          </button>

          {/* Cadastrar meu Negócio Primary Button */}
          <button
            id="btn-nav-register-business"
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:brightness-110 active:scale-[0.98] transition shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-[#0B132B] shrink-0" />
            <span className="hidden xs:inline sm:hidden">Anunciar</span>
            <span className="hidden sm:inline">Cadastrar Negócio</span>
            <span className="xs:hidden">Anunciar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
