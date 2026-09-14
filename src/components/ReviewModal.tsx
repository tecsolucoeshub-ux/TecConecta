import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  MessageCircle,
  ThumbsUp,
  ShieldCheck,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Provider, Review } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  fetchReviewsForProvider,
  submitProviderReview,
  hasUserReviewedProvider
} from '../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  provider: Provider | null;
  onClose: () => void;
  onReviewSubmitted?: (updatedProvider: Provider) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Péssimo • Serviço com graves problemas',
  2: 'Regular • Ficou abaixo do esperado',
  3: 'Bom • Cumpriu o combinado',
  4: 'Muito Bom • Trabalho caprichado e confiável',
  5: 'Excelente • Impecável, pontual e muito recomendado!'
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  provider,
  onClose,
  onReviewSubmitted
}) => {
  const { isLight } = useTheme();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Form states
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState('');
  const [serviceDone, setServiceDone] = useState('');
  const [comment, setComment] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'rate' | 'list'>('rate');

  // Check if current device already reviewed
  const alreadyReviewed = provider ? hasUserReviewedProvider(provider.id) : false;

  useEffect(() => {
    if (isOpen && provider) {
      setIsLoadingReviews(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      setSelectedRating(5);
      setHoverRating(0);

      fetchReviewsForProvider(provider.id)
        .then((data) => {
          setReviews(data);
          // If already reviewed or has lots of reviews, start on rate or list
          if (alreadyReviewed && data.length > 0) {
            setActiveTab('list');
          } else {
            setActiveTab('rate');
          }
        })
        .finally(() => setIsLoadingReviews(false));
    }
  }, [isOpen, provider]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    if (!authorName.trim()) {
      setErrorMessage('Por favor, informe seu nome ou como deseja se identificar.');
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setErrorMessage('Por favor, selecione de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { review, updatedProvider } = await submitProviderReview(
        provider,
        selectedRating,
        authorName.trim(),
        comment.trim() || undefined,
        serviceDone.trim() || undefined
      );

      setReviews((prev) => [review, ...prev]);
      setSuccessMessage(
        `Obrigado pela sua avaliação! Sua nota ajudou a atualizar a média de "${provider.name}" para ${updatedProvider.rating?.toFixed(1)} estrelas.`
      );
      setComment('');
      setServiceDone('');

      if (onReviewSubmitted) {
        onReviewSubmitted(updatedProvider);
      }

      // Switch to list view after 1.5 seconds to see the new review
      setTimeout(() => {
        setActiveTab('list');
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao registrar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayRating = hoverRating || selectedRating;

  return (
    <div
      id="review-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-cyan-900/10'
            : 'bg-[#0B132B] border-[#00E5FF]/30 text-[#F4F7F6] shadow-[0_0_50px_rgba(0,229,255,0.2)]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-start justify-between border-b px-6 py-4.5 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#00E5FF] p-0.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 uppercase tracking-wider">
                  Avaliação Justa & Transparente
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {provider.category}
                </span>
              </div>
              <h2 className="text-lg font-bold font-['Outfit'] mt-0.5 leading-tight">
                {provider.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                : 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title="Fechar janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Score Summary Pill */}
        <div
          className={`px-6 py-3 border-b flex items-center justify-between gap-4 text-xs ${
            isLight ? 'bg-amber-50/70 border-amber-200/70' : 'bg-[#FF6B00]/10 border-[#FF6B00]/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-400 text-base font-extrabold">
              <Star className="w-5 h-5 fill-amber-400" />
              <span>{provider.rating ? provider.rating.toFixed(1) : '5.0'}</span>
            </div>
            <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>
              de 5.0 • Média baseada em{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                {provider.reviewsCount || reviews.length || 1} avaliações reais
              </strong>
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-lg p-0.5 bg-black/20 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('rate')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                activeTab === 'rate'
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ★ Avaliar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                activeTab === 'list'
                  ? 'bg-[#00E5FF] text-[#0B132B] shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Depoimentos</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 font-mono">
                {reviews.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Tab 1: Submit a Review */}
          {activeTab === 'rate' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Success Notification */}
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Avaliação computada com sucesso!</p>
                    <p className="mt-0.5 text-emerald-200/90">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {alreadyReviewed && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    isLight
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>
                    Você já avaliou este prestador recentemente. Você pode enviar outra avaliação caso tenha contratado um novo serviço.
                  </span>
                </div>
              )}

              {/* Interactive Star Rating Selector */}
              <div
                className={`p-4 rounded-xl border text-center transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#111C3D] border-[#00E5FF]/25'
                }`}
              >
                <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Quantas estrelas este serviço merece? *
                </label>

                {/* 5 Interactive Stars */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentDisplayRating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setSelectedRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 sm:p-2 rounded-xl transition transform hover:scale-125 focus:outline-none"
                        title={`${starValue} de 5 estrelas`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : isLight
                              ? 'text-slate-300 fill-slate-200'
                              : 'text-gray-600 fill-transparent'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Label explaining score */}
                <p className="text-xs font-bold text-amber-400 mt-2 min-h-[18px]">
                  {RATING_LABELS[currentDisplayRating]}
                </p>
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Seu Nome ou Como Deseja se Identificar *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: João Silva, Maria de Santana ou Cliente Local..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#00B4D8]'
                      : 'bg-white/5 border-white/15 text-white placeholder-gray-500 focus:border-[#00E5FF]'
                  }`}
                />
              </div>

              {/* Service Done (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Qual serviço ou atendimento foi realizado? (Opcional)
                </label>
                <input
                  type="text"
                  value={serviceDone}
                  onChange={(e) => setServiceDone(e.target.value)}
                  placeholder="Ex: Instalação de chuveiro, Pintura de sala, Faxina pós-obra..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#00B4D8]'
                      : 'bg-white/5 border-white/15 text-white placeholder-gray-500 focus:border-[#00E5FF]'
                  }`}
                />
              </div>

              {/* Testimonial / Comment */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Seu Depoimento / Comentário (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi o atendimento, pontualidade, honestidade e qualidade do serviço para ajudar outros clientes..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#00B4D8]'
                      : 'bg-white/5 border-white/15 text-white placeholder-gray-500 focus:border-[#00E5FF]'
                  }`}
                />
              </div>

              {/* Fairness Guarantee Notice */}
              <div
                className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                  isLight
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
                    : 'bg-[#00E5FF]/5 border-[#00E5FF]/20 text-gray-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <span>
                  <strong>Avaliação 100% Real:</strong> Sua nota é recalculada matematicamente com base em todas as opiniões da comunidade, incentivando os melhores profissionais da cidade.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    isLight
                      ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      : 'border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold text-xs shadow-[0_0_20px_rgba(255,107,0,0.35)] transition transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Gravando Avaliação...' : 'Confirmar & Publicar Avaliação'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Community Reviews List */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Depoimentos de Clientes ({reviews.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('rate')}
                  className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1"
                >
                  <Star className="w-3.5 h-3.5 fill-[#00E5FF]" />
                  <span>Deixar Minha Avaliação</span>
                </button>
              </div>

              {isLoadingReviews ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Carregando avaliações da comunidade...
                </div>
              ) : reviews.length === 0 ? (
                <div
                  className={`py-8 px-4 rounded-xl border text-center space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Star className="w-8 h-8 text-amber-400/40 mx-auto" />
                  <p className="text-xs font-bold text-white">Nenhum depoimento por escrito ainda.</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Se você já contratou {provider.name}, seja o primeiro a deixar um comentário sobre a sua experiência!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rate')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0B132B] font-bold text-xs shadow-md transition"
                  >
                    Avaliar Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#111C3D] border-white/10 hover:border-[#00E5FF]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {rev.authorName}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verificado
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-amber-400 ml-1">
                            {rev.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {rev.serviceDone && (
                        <div className="text-[10.5px] text-[#00E5FF] font-medium mb-1">
                          Serviço: {rev.serviceDone}
                        </div>
                      )}

                      {rev.comment && (
                        <p
                          className={`text-xs leading-relaxed ${
                            isLight ? 'text-slate-700' : 'text-gray-300'
                          }`}
                        >
                          "{rev.comment}"
                        </p>
                      )}

                      <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
