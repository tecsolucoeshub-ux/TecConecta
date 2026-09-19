import { Review, Provider } from '../types';
import { updateProvider, db, sanitizeForFirestore } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, setDoc } from 'firebase/firestore';

const LOCAL_STORAGE_REVIEWS_KEY = 'tecconecta_reviews_v1';
const LOCAL_STORAGE_USER_REVIEWS_KEY = 'tecconecta_user_evaluated_providers_v1';

// Seed community reviews for initial businesses to establish genuine realism
const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    providerId: 'prov-001',
    authorName: 'Rodrigo Mendonça',
    rating: 5,
    serviceDone: 'Troca de fiação e quadro de disjuntores',
    comment: 'O Marcos foi super pontual e atencioso. Explicou tudo que precisava trocar e deixou a instalação impecável e segura. Recomendo de olhos fechados!',
    createdAt: '2026-03-05T14:20:00Z'
  },
  {
    id: 'rev-002',
    providerId: 'prov-001',
    authorName: 'Patrícia Alencar',
    rating: 5,
    serviceDone: 'Instalação de chuveiro elétrico',
    comment: 'Chegou rápido, fez um serviço limpo e cobrou um valor super justo. Muito profissional.',
    createdAt: '2026-03-08T09:10:00Z'
  },
  {
    id: 'rev-003',
    providerId: 'prov-002',
    authorName: 'Juliana Costa',
    rating: 5,
    serviceDone: 'Faxina completa residencial',
    comment: 'A Dona Maria é sensacional! Casa ficou com um cheirinho maravilhoso, tudo nos mínimos detalhes. Com certeza vou chamar sempre.',
    createdAt: '2026-03-06T18:00:00Z'
  },
  {
    id: 'rev-004',
    providerId: 'prov-003',
    authorName: 'Felipe Santana',
    rating: 5,
    serviceDone: 'Pintura da sala e corredor',
    comment: 'Pintor muito cuidadoso, cobriu todos os móveis e o acabamento das paredes ficou perfeito sem nenhuma marca.',
    createdAt: '2026-03-07T11:45:00Z'
  },
  {
    id: 'rev-005',
    providerId: 'prov-004',
    authorName: 'Cláudia Ramos',
    rating: 5,
    serviceDone: 'Localização e conserto de vazamento',
    comment: 'Encontrou o vazamento sem precisar quebrar a parede inteira. Economizou muito dinheiro pra mim!',
    createdAt: '2026-03-09T16:30:00Z'
  }
];

function getAllStoredReviews(): Review[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    return parsed;
  } catch (e) {
    console.warn('Error reading reviews from localStorage:', e);
    return SEED_REVIEWS;
  }
}

/**
 * Fetch all reviews for a specific provider
 */
export async function fetchReviewsForProvider(providerId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const remoteReviews: Review[] = [];
    snapshot.forEach((d) => {
      remoteReviews.push({ id: d.id, ...d.data() } as Review);
    });
    if (remoteReviews.length > 0) {
      // Sync local cache
      const allStored = getAllStoredReviews();
      const otherReviews = allStored.filter((r) => r.providerId !== providerId);
      localStorage.setItem(
        LOCAL_STORAGE_REVIEWS_KEY,
        JSON.stringify([...remoteReviews, ...otherReviews])
      );
      return remoteReviews;
    }
  } catch (e) {
    console.warn('Firestore fetch reviews fallback to local:', e);
  }

  // Fallback to local storage
  const all = getAllStoredReviews();
  return all
    .filter((r) => r.providerId === providerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Check if the user on this browser has already submitted a review for this provider
 */
export function hasUserReviewedProvider(providerId: string): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_REVIEWS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(providerId);
  } catch {
    return false;
  }
}

function markUserReviewedProvider(providerId: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_REVIEWS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(providerId)) {
      list.push(providerId);
      localStorage.setItem(LOCAL_STORAGE_USER_REVIEWS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Error marking user review:', e);
  }
}

/**
 * Submit a real customer review and recalculate provider's average rating fairly
 */
export async function submitProviderReview(
  provider: Provider,
  rating: number,
  authorName: string,
  comment?: string,
  serviceDone?: string
): Promise<{ review: Review; updatedProvider: Provider }> {
  const sanitizedRating = Math.max(1, Math.min(5, Math.round(rating * 10) / 10));
  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    providerId: provider.id,
    authorName: authorName.trim() || 'Cliente Verificado',
    rating: sanitizedRating,
    comment: comment?.trim() || undefined,
    serviceDone: serviceDone?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  // 1. Get all current reviews for this provider to compute fair weighted average
  const existingReviews = await fetchReviewsForProvider(provider.id);
  const updatedReviewsList = [newReview, ...existingReviews];

  // Mathematical rating calculation
  let newAverage: number;
  let newCount: number;

  if (existingReviews.length > 0) {
    const sumRatings = updatedReviewsList.reduce((acc, r) => acc + r.rating, 0);
    newCount = updatedReviewsList.length;
    newAverage = Math.round((sumRatings / newCount) * 10) / 10;
  } else {
    // Provider might have had an initial baseline rating (e.g. 5.0 with 1 review)
    const prevRating = provider.rating || 5.0;
    const prevCount = provider.reviewsCount || 1;
    newCount = prevCount + 1;
    newAverage = Math.round(((prevRating * prevCount + sanitizedRating) / newCount) * 10) / 10;
  }

  // 2. Persist review to local storage
  const allReviews = getAllStoredReviews();
  localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify([newReview, ...allReviews]));
  markUserReviewedProvider(provider.id);

  // 3. Persist review to Firestore
  try {
    await setDoc(doc(db, 'reviews', newReview.id), sanitizeForFirestore(newReview), { merge: true });
    console.log(`[TecConecta] Avaliação ${newReview.id} salva no Firestore Cloud.`);
  } catch (e) {
    console.warn('Firestore review set error:', e);
  }

  // 4. Update provider's official rating and count
  const updatedProvider = await updateProvider(provider.id, {
    rating: newAverage,
    reviewsCount: newCount
  });

  // 5. Dispatch global events
  window.dispatchEvent(
    new CustomEvent('tecconecta:review_added', {
      detail: { review: newReview, provider: updatedProvider }
    })
  );

  return { review: newReview, updatedProvider };
}
