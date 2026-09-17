import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TecConecta ErrorBoundary capturou uma falha:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B132B] text-[#F4F7F6] p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#0F1B3E] border border-[#00E5FF]/30 p-6 sm:p-8 text-center shadow-[0_0_40px_rgba(0,229,255,0.2)] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 flex items-center justify-center mx-auto text-[#FF6B00]">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-['Outfit'] text-white">
                Ops! Ocorreu uma instabilidade
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Detectamos uma falha pontual no carregamento. O sistema foi protegido contra travamentos e você pode continuar navegando normalmente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
              >
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-xs transition hover:brightness-110 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

