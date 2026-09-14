import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF]/20 to-[#FF6B00]/20 border border-[#00E5FF]/40 px-3.5 py-1.5 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/30 transition-all shadow-sm"
        title="Instalar TecConecta no seu aparelho"
      >
        <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 px-3.5 py-1.5 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/25 transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#0B132B] border border-[#00E5FF]/30 p-6 shadow-2xl text-[#F4F7F6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#00E5FF]" />
                  Instalar no iOS (iPhone/iPad)
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima na barra inferior).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Role a tela e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito para acessar o app com 1 toque!</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#00E5FF] py-2.5 text-xs font-bold text-[#0B132B] hover:bg-[#00E5FF]/90 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
