import React from 'react';
import { ShieldCheck, MessageCircle, Heart, Sparkles, MapPin } from 'lucide-react';
import { TecLogo } from './TecLogo';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface FooterProps {
  onOpenPrivacyPolicy: () => void;
  onOpenAdmin?: () => void;
  admWhatsapp?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacyPolicy,
  onOpenAdmin,
  admWhatsapp,
}) => {
  const admContactUrl = buildWhatsAppUrl(
    admWhatsapp || '64999317499',
    'Olá ADM TecSoluções! Sou um anunciante cadastrado no TecConecta e gostaria de solicitar uma alteração ou exclusão de dados do meu perfil.'
  );
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#080E21] text-[#F4F7F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand Info */}
          <div className="space-y-3">
            <TecLogo />
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              O <strong>TecConecta</strong> é a plataforma tecnológica de geolocalização e conexão direta desenvolvida pela <strong>TecSoluções</strong>. Eliminamos intermediários e burocracias para fortalecer o comércio e os profissionais autônomos do seu bairro.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00E5FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tecnologia moderna para conexões humanas reais.</span>
            </div>
          </div>

          {/* Guidelines & Terms Disclaimer */}
          <div className="space-y-2.5">
            <h4 className="font-['Outfit'] text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
              Transparência & Segurança
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Não intermediamos transações financeiras, não cobramos taxas e isentamo-nos expressamente de garantias sobre orçamentos ou serviços contratados. Toda negociação é 100% direta entre cliente e prestador via WhatsApp.
            </p>
            <button
              onClick={onOpenPrivacyPolicy}
              className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1 mt-1"
            >
              Ler Termos de Uso e Política de Privacidade &rarr;
            </button>
          </div>

          {/* Quick Links & ADM Contact */}
          <div className="space-y-3">
            <h4 className="font-['Outfit'] text-sm font-bold text-white">
              Para Autônomos e MEIs
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Exclusivo para profissionais autônomos e microempreendedores individuais. Cadastro único no topo da página, 100% grátis e sem comissões.
            </p>
            <a
              href={admContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#00E5FF]/40 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Suporte ao Anunciante</span>
            </a>
          </div>
        </div>

        {/* Advertisers Fine-Print Security Notice (Letras Miúdas) */}
        <div className="mt-8 pt-4 border-t border-white/5">
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-4xl">
            <strong className="text-gray-300 font-semibold">* Aviso aos anunciantes cadastrados:</strong> Com o objetivo de assegurar a integridade das informações e prevenir alterações indevidas por terceiros ou concorrentes, toda e qualquer edição de dados ou alteração de fotos é de acesso exclusivo da administração. Caso necessite atualizar número, endereço, fotos ou serviços de seu negócio,{' '}
            <a
              href={admContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00E5FF] hover:underline font-semibold"
            >
              entre em contato diretamente com a administração pelo WhatsApp
            </a>
            .
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>© {new Date().getFullYear()} TecConecta. Criado e mantido por TecSoluções. Todos os direitos reservados.</span>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-gray-600 hover:text-gray-400 transition cursor-default p-0.5 select-none"
                title=""
                aria-label=""
              >
                •
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={onOpenPrivacyPolicy} className="hover:text-white transition">
              Política de Privacidade
            </button>
            <button onClick={onOpenPrivacyPolicy} className="hover:text-white transition">
              Isenção de Responsabilidade
            </button>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-gray-500 hover:text-[#00E5FF] transition flex items-center gap-1 font-medium"
                title="Acesso ao Painel do Administrador (Ctrl+Shift+A)"
              >
                <span>Painel ADM</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
