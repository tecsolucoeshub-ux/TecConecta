import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Presentation,
  Sparkles,
  MapPin,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  Users,
  Building2,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ProjectPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Slide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export const ProjectPresentationModal: React.FC<ProjectPresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalSlides = 8;

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Reset to slide 0 when reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  // Slide content definitions
  const slides: Slide[] = [
    // Slide 1: Cover
    {
      id: 1,
      tag: 'VISÃO GERAL & PROPOSTA',
      title: 'TecConecta: Hub Inteligente de Serviços Locais',
      subtitle: 'Desenvolvido pela TecSoluções para conectar clientes e prestadores com agilidade, geolocalização e zero burocracia.',
      badgeColor: '#00E5FF',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0F1B3E]/80 border border-[#00E5FF]/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-white font-bold text-sm">Conexão Instantânea</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Contato direto em 1 clique via WhatsApp, sem cadastro prévio para o cliente e sem taxas sobre os serviços.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1B3E]/80 border border-[#FF6B00]/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-white font-bold text-sm">Geolocalização em Tempo Real</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Ordenação inteligente por proximidade com cálculo de distância (GPS ou CEP) e mapa interativo integrado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1B3E]/80 border border-[#00E5FF]/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#FF6B00]/20 border border-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-white font-bold text-sm">Marca & Governança</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Painel ADM privativo, monetização por banners patrocinados e conformidade rigorosa com a LGPD.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00E5FF]"></span>
              </span>
              <span className="text-xs sm:text-sm text-gray-300 font-medium">
                Status Atual: <strong className="text-white">Aplicação 100% Funcional e em Nuvem</strong>
              </span>
            </div>
            <span className="text-xs text-[#00E5FF] font-semibold px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30">
              TecSoluções Hub
            </span>
          </div>
        </div>
      ),
    },

    // Slide 2: The Problem
    {
      id: 2,
      tag: 'DIAGNÓSTICO DE MERCADO',
      title: 'O Problema que Estamos Resolvendo',
      subtitle: 'O mercado tradicional de contratação de serviços locais é ineficiente, caro e frustrante tanto para quem busca quanto para quem trabalha.',
      badgeColor: '#FF6B00',
      icon: Users,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span>Dores do Cliente (Contratante)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Dificuldade para saber quem atende com rapidez no seu bairro ou condomínio.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Formulários longos e intermediação cansativa antes de poder conversar com o profissional.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Falta de transparência e demora nas respostas de cotações em marketplaces comuns.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span>Dores do Prestador de Serviço</span>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span>Plataformas tradicionais cobram comissões abusivas de 15% a 30% do valor do serviço.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span>Cobrança por pacotes de moedas/créditos apenas para enviar um orçamento sem garantia.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span>Pouca visibilidade para autônomos locais frente a grandes empresas.</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-[#00E5FF]/15 to-[#FF6B00]/15 border border-[#00E5FF]/30 text-center">
            <p className="text-xs sm:text-sm text-gray-200">
              💡 <strong className="text-white">A Oportunidade:</strong> Criar uma ponte direta entre cliente e prestador através da ferramenta que todo brasileiro já tem no bolso: o <strong className="text-[#00E5FF]">WhatsApp</strong> com <strong className="text-[#FF6B00]">geolocalização</strong>.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 3: The Solution
    {
      id: 3,
      tag: 'A SOLUÇÃO TECSOLUÇÕES',
      title: 'TecConecta: Simples, Rápido e Direto',
      subtitle: 'Eliminamos todo o ruído para entregar exatamente o que o usuário quer: achar quem resolve o problema perto dele.',
      badgeColor: '#00E5FF',
      icon: Zap,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Busca Inteligente Unificada</span>
            </div>
            <p className="text-xs text-gray-300">
              A barra de pesquisa pesquisa simultaneamente por profissão, tipo de serviço, nome do negócio e palavras-chave descritivas com tolerância a acentos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#FF6B00] font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>Raio de Proximidade em Km</span>
            </div>
            <p className="text-xs text-gray-300">
              Calcula a distância exata em quilômetros em relação ao GPS atual ou ao CEP digitado, destacando prestadores mais próximos primeiro.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
              <Layers className="w-4 h-4" />
              <span>Modo Lista ou Mapa Interativo</span>
            </div>
            <p className="text-xs text-gray-300">
              O usuário pode alternar a qualquer momento entre cards detalhados ou um mapa com pinos georreferenciados e atalho direto para o Street View.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Disparo Automático no WhatsApp</span>
            </div>
            <p className="text-xs text-gray-300">
              Abre a conversa no WhatsApp já com mensagem contextualizada, identificando a origem TecConecta e facilitando o início da negociação.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 4: Autonomous Provider Experience
    {
      id: 4,
      tag: 'EXPERIÊNCIA DO PRESTADOR',
      title: 'Autonomia Total para o Profissional',
      subtitle: 'Sem processos burocráticos: cadastro em menos de 60 segundos com preenchimento automático.',
      badgeColor: '#FF6B00',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
              <span className="text-2xl font-black text-[#00E5FF] font-['Outfit']">60s</span>
              <h4 className="text-white text-xs font-bold">Cadastro Ultrarrápido</h4>
              <p className="text-[11px] text-gray-400">
                Apenas nome, WhatsApp, ramo de atuação e CEP.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
              <span className="text-2xl font-black text-[#FF6B00] font-['Outfit']">CEP</span>
              <h4 className="text-white text-xs font-bold">Autocompletar ViaCEP</h4>
              <p className="text-[11px] text-gray-400">
                Endereço, bairro e cidade preenchidos automaticamente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
              <span className="text-2xl font-black text-emerald-400 font-['Outfit']">100%</span>
              <h4 className="text-white text-xs font-bold">Valor para o Prestador</h4>
              <p className="text-[11px] text-gray-400">
                Zero porcentagem cobrada sobre os orçamentos fechados.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/10 space-y-2.5">
            <h4 className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              <span>Gerenciamento de Perfil com Validação por WhatsApp</span>
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              O prestador pode editar suas informações ou remover seu cadastro a qualquer instante. Para segurança, a plataforma exige confirmação pelo número de WhatsApp cadastrado, assegurando respeito integral à <strong>LGPD</strong> e privacidade dos dados.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 5: Business Model & Monetization
    {
      id: 5,
      tag: 'MODELO DE NEGÓCIO',
      title: 'Monetização Sustentável & Geração de Valor',
      subtitle: 'Como a TecSoluções monetiza a plataforma sem onerar o usuário comum ou o prestador autônomo.',
      badgeColor: '#00E5FF',
      icon: TrendingUp,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-[#FF6B00]/30 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6B00]/10 rounded-bl-full pointer-events-none"></div>
            <div className="text-[#FF6B00] font-bold text-xs uppercase tracking-wider">Pilar 1</div>
            <h4 className="text-white font-bold text-sm">Banners Patrocinados</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Empresas parceiras e marcas contratam destaque rotativo no topo da página. O ADM cadastra e ativa esses anúncios diretamente pelo painel com 1 clique.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-[#00E5FF]/30 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5FF]/10 rounded-bl-full pointer-events-none"></div>
            <div className="text-[#00E5FF] font-bold text-xs uppercase tracking-wider">Pilar 2</div>
            <h4 className="text-white font-bold text-sm">Vitrine TecSoluções</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Posicionamento estratégico como autoridade em tecnologia. A plataforma gera leads qualificados para contratação de automações, IA e softwares da TecSoluções.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1B3E] border border-white/20 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full pointer-events-none"></div>
            <div className="text-gray-300 font-bold text-xs uppercase tracking-wider">Pilar 3</div>
            <h4 className="text-white font-bold text-sm">Destaques Regionais</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Potencial para planos de impulsionamento local (selo de destaque para prestadores que desejam aparecer prioritariamente em suas cidades).
            </p>
          </div>
        </div>
      ),
    },

    // Slide 6: Secure Admin Governance
    {
      id: 6,
      tag: 'SEGURANÇA & GOVERNANÇA',
      title: 'Painel Administrativo Privado e Discreto',
      subtitle: 'Controle total da plataforma nas mãos do administrador, sem expor opções administrativas aos visitantes comuns.',
      badgeColor: '#FF6B00',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span>
                <span>Acesso Seguro e Oculto</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Nenhum botão de administrador fica visível para o público comum. O ADM acessa usando o atalho confidencial <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]">Ctrl+Shift+A</kbd> ou por credencial protegida com senha mestra criptografada.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]"></span>
                <span>Gestão Completa de Banners</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Cadastro imediato de patrocinadores com título, foto, botão de WhatsApp e badge personalizado. Qualquer prestador pode ser promovido a patrocinador com 1 clique.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Moderação de Cadastros</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Visualização de todos os prestadores ativos com contador, busca e exclusão segura com confirmação inline contra cliques acidentais.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Configurações Institucionais</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Edição em tempo real do WhatsApp de suporte da TecSoluções, slogans do banner e troca da senha mestra com persistência imediata na nuvem.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 7: Technology Stack
    {
      id: 7,
      tag: 'ENGENHARIA & ARQUITETURA',
      title: 'Tecnologias Robustas e Prontas para Escala',
      subtitle: 'Construído seguindo as melhores práticas de desenvolvimento moderno, alta performance e tolerância a falhas.',
      badgeColor: '#00E5FF',
      icon: Cpu,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0F1B3E] border border-white/10 text-center space-y-1">
            <span className="text-xs font-bold text-[#00E5FF]">Frontend</span>
            <div className="text-white font-extrabold text-sm">React 18 & TS</div>
            <p className="text-[11px] text-gray-400">TypeScript estrito e Tailwind CSS</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F1B3E] border border-white/10 text-center space-y-1">
            <span className="text-xs font-bold text-[#FF6B00]">Banco de Dados</span>
            <div className="text-white font-extrabold text-sm">Cloud Firestore</div>
            <p className="text-[11px] text-gray-400">Tempo real e escalabilidade global</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F1B3E] border border-white/10 text-center space-y-1">
            <span className="text-xs font-bold text-emerald-400">Geolocalização</span>
            <div className="text-white font-extrabold text-sm">Google Maps & GPS</div>
            <p className="text-[11px] text-gray-400">Cálculo Haversine & ViaCEP</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F1B3E] border border-white/10 text-center space-y-1">
            <span className="text-xs font-bold text-indigo-400">Resiliência</span>
            <div className="text-white font-extrabold text-sm">Error Boundary</div>
            <p className="text-[11px] text-gray-400">Proteção contra falhas em runtime</p>
          </div>

          <div className="col-span-2 sm:col-span-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              <span>Código modularizado, responsivo em smartphones, tablets e computadores.</span>
            </div>
            <span className="text-gray-400 font-mono text-[11px]">
              Port: 3000 | Container Cloud Run
            </span>
          </div>
        </div>
      ),
    },

    // Slide 8: Strategic Roadmap
    {
      id: 8,
      tag: 'VISÃO DE FUTURO',
      title: 'Próximos Passos & Oportunidades',
      subtitle: 'O TecConecta foi projetado para crescer e incorporar novas soluções de inteligência da TecSoluções.',
      badgeColor: '#FF6B00',
      icon: Award,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                Fase 1 • Concluída
              </span>
              <h4 className="text-white font-bold text-xs sm:text-sm">Plataforma Operacional</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Hub lançado com busca inteligente, geolocalização, mapa interativo, cadastro instantâneo e monetização por banners.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] uppercase tracking-wider">
                Fase 2 • Em Expansão
              </span>
              <h4 className="text-white font-bold text-xs sm:text-sm">Selo Verificado & Cidades</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Expansão para novos municípios e sistema de selo de recomendação para prestadores verificados pela TecSoluções.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] uppercase tracking-wider">
                Fase 3 • Inovação
              </span>
              <h4 className="text-white font-bold text-xs sm:text-sm">Assistente de IA Integrado</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Agente inteligente da TecSoluções para ajudar o cliente a diagnosticar o problema e sugerir o profissional mais indicado.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] font-extrabold text-center space-y-1 shadow-[0_0_30px_rgba(0,229,255,0.3)]">
            <h3 className="text-base sm:text-lg font-['Outfit']">
              TecConecta • O Futuro das Conexões Locais
            </h3>
            <p className="text-xs opacity-90 font-medium">
              Tecnologia descomplicada, impacto comunitário e crescimento comercial sustentável.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Early return if modal is not open
  if (!isOpen) return null;

  const current = slides[currentSlide];
  const IconComponent = current.icon;
  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-3xl bg-[#0B132B] border border-[#00E5FF]/40 shadow-[0_0_60px_rgba(0,229,255,0.25)] text-[#F4F7F6] overflow-hidden my-auto">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00E5FF] via-[#00E5FF] to-[#FF6B00] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#FF6B00] flex items-center justify-center text-[#0B132B] shadow-[0_0_15px_rgba(0,229,255,0.4)]">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit']">
                  Apresentação do Projeto
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 font-semibold">
                  Privativo ADM
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                TecConecta • TecSoluções Pitch Deck
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar apresentação"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6">
          {/* Header of the Current Slide */}
          <div className="space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: `${current.badgeColor}25`, border: `1px solid ${current.badgeColor}60` }}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span
                className="text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: current.badgeColor }}
              >
                {current.tag}
              </span>
              <span className="text-xs text-gray-500 ml-auto font-mono">
                {currentSlide + 1} / {totalSlides}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
              {current.subtitle}
            </p>
          </div>

          {/* Slide Dynamic Interactive Content */}
          <div className="min-h-[240px] flex flex-col justify-center">
            {current.content}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              currentSlide === 0
                ? 'opacity-40 cursor-not-allowed text-gray-500 bg-white/5'
                : 'text-white bg-white/10 hover:bg-white/20 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Slide Dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto px-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 transition-all rounded-full ${
                  idx === currentSlide
                    ? 'w-6 bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.6)]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlide < totalSlides - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-[#0B132B] text-xs font-black transition hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(0,229,255,0.3)] font-['Outfit']"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0B132B] text-xs font-black transition hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(0,229,255,0.4)] font-['Outfit']"
              >
                <span>Concluir</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
