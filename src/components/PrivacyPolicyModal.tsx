import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Ban } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="privacy-policy-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0B132B] border border-[#00E5FF]/30 shadow-[0_0_40px_rgba(0,229,255,0.15)] text-[#F4F7F6] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                Termos de Uso e Política de Privacidade
              </h2>
              <p className="text-xs text-gray-400">TecConecta • DaMaceno Soluções</p>
            </div>
          </div>
          <button
            id="btn-close-privacy-policy"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-gray-300 leading-relaxed custom-scrollbar">
          {/* Important Highlight Notice */}
          <div className="rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 p-4 flex gap-3 text-amber-200">
            <AlertTriangle className="w-6 h-6 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-white block text-sm mb-1">Aviso Fundamental aos Usuários e Prestadores</strong>
              O <strong>TecConecta</strong> é uma vitrine e catálogo geolocalizado desenvolvido pela <strong>DaMaceno Soluções</strong> para facilitar a conexão direta entre cidadãos locais e profissionais/lojas. Nós <strong>não cobramos comissões, não processamos pagamentos e não intermediamos contratos</strong>.
            </div>
          </div>

          {/* Section 1: Natureza do Serviço e Zero Intermediação */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              1. Natureza do Serviço e Zero Intermediação
            </h3>
            <p>
              O <strong>TecConecta</strong> atua unicamente como uma plataforma tecnológica e catálogo geográfico digital. Todas as conversas, orçamentos, cotações, execuções e pagamentos ocorrem de forma <strong>100% direta entre o cliente e o prestador via WhatsApp</strong> ou contato presencial, sem nenhuma interferência, custódia de fundos ou taxa administrativa por parte da DaMaceno Soluções.
            </p>
          </section>

          {/* Section 2: Aceitação Integral dos Termos */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              2. Aceitação Integral das Diretrizes
            </h3>
            <p>
              O simples acesso, navegação, cadastro de negócio ou envio de mensagens a prestadores disponíveis no aplicativo <strong>implica a aceitação irrestrita e integral de todos os presentes termos e diretrizes de privacidade</strong>. Caso não concorde com qualquer termo aqui disposto, solicitamos que não utilize a plataforma.
            </p>
          </section>

          {/* Section 3: Responsabilidade Exclusiva dos Usuários */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF6B00]" />
              3. Responsabilidade Exclusiva pelas Interações Comerciais
            </h3>
            <p>
              <strong>O usuário (cliente ou prestador) assume total e irrestrita responsabilidade</strong> por todas as negociações, tratativas comerciais, conferência de idoneidade, verificação prévia de referências, cumprimento de prazos, fixação de valores e quaisquer transações financeiras realizadas fora ou por intermédio das informações obtidas no aplicativo.
            </p>
            <p className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
              Recomendamos sempre exigir nota fiscal, orçamentos detalhados por escrito e adotar medidas de cautela antes de contratar ou efetuar pagamentos antecipados a qualquer prestador autônomo ou loja.
            </p>
          </section>

          {/* Section 4: Isenção Total de Garantias */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#00E5FF]" />
              4. Isenção de Garantias sobre Serviços Prestados
            </h3>
            <p>
              A <strong>DaMaceno Soluções e a equipe do TecConecta isentam-se expressamente de quaisquer garantias</strong> — sejam elas implícitas ou explícitas — quanto à qualidade, segurança, legalidade, pontualidade, acabamento ou conformidade dos serviços ou produtos fornecidos pelos prestadores cadastrados. A plataforma não possui vínculo empregatício, societário ou representação comercial com nenhum dos anunciantes.
            </p>
          </section>

          {/* Section 5: Direito Soberano de Suspensão de Contas */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-400" />
              5. Direito de Suspensão e Moderação de Contas
            </h3>
            <p>
              A plataforma <strong>reserva-se o direito soberano de suspender, banir ou remover sumariamente cadastros, anúncios ou perfis</strong> que violem estas diretrizes, veiculem dados fraudulentos, propaguem conteúdos ilícitos, infrinjam direitos de terceiros ou recebam denúncias fundamentadas de conduta desonesta ou abusiva, sem necessidade de aviso prévio ou indenização.
            </p>
          </section>

          {/* Section 6: Privacidade e Dados Cadastrais */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              6. Privacidade, Dados Públicos e Localização
            </h3>
            <p>
              Ao cadastrar seu negócio, o profissional autoriza expressamente a divulgação pública de seu nome fantasia/comercial, categoria de atuação, cidade, bairro e número de WhatsApp no mapa e na lista para fins exclusivos de contato por clientes interessados. Dados de geolocalização do usuário são processados localmente em seu navegador apenas para calcular distâncias e exibir o mapa da sua região.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            TecConecta • Desenvolvido com excelência por <strong>DaMaceno Soluções</strong>
          </span>
          <button
            id="btn-understand-privacy-policy"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#0B132B] font-bold text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          >
            Li e Concordo com os Termos
          </button>
        </div>
      </div>
    </div>
  );
};
