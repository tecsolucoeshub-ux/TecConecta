import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Provider, SponsoredBanner, AdminSettings } from '../types';
import { SEED_PROVIDERS } from '../data/seedProviders';
import firebaseConfig from '../../firebase-applet-config.json';
import { normalizeWhatsAppNumber } from '../utils/whatsapp';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// ----------------------------------------------------
// FIREBASE SYNCHRONOUS INITIALIZATION
// ----------------------------------------------------
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

let authInstance: any = null;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('[TecConecta] Firebase Auth não inicializado ou indisponível:', e);
}
export const auth = authInstance;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? true,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[TecConecta] Conexão com Firestore Cloud verificada com sucesso.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[TecConecta] Cliente Firestore operando em modo offline.');
    } else {
      console.log('[TecConecta] Resposta de conexão do Firestore:', error);
    }
    return false;
  }
}
testConnection().catch(() => {});

// ----------------------------------------------------
// LOCAL STORAGE KEYS & DATA HELPERS
// ----------------------------------------------------
const LOCAL_STORAGE_KEY = 'tecconecta_providers_v1';
const LOCAL_STORAGE_BANNERS_KEY = 'tecconecta_sponsored_banners_v1';
const LOCAL_STORAGE_ADMIN_KEY = 'tecconecta_admin_settings_v1';
const LOCAL_STORAGE_DELETED_KEY = 'tecconecta_deleted_providers_v1';
const LOCAL_STORAGE_DEMO_CLEARED_KEY = 'tecconecta_demo_cleared_v1';

// Known initial demo/mock provider IDs
export const DEMO_PROVIDER_IDS = new Set<string>([
  'prov-001', 'prov-002', 'prov-003', 'prov-004', 'prov-005',
  'prov-006', 'prov-007', 'prov-008', 'prov-009', 'prov-010'
]);

/**
 * Checks if a provider is an example/demo mock advertiser
 */
export function isDemoProvider(p: { id: string } | null | undefined): boolean {
  if (!p || !p.id) return false;
  // TecSoluções is the official company profile - NOT a mock advertiser
  if (p.id === 'prov-tecsolucoes') return false;
  if (DEMO_PROVIDER_IDS.has(p.id)) return true;
  if (p.id.startsWith('seed-') || p.id.startsWith('demo-')) return true;
  if (/^prov-0\d+$/.test(p.id)) return true;
  return false;
}

/**
 * Retrieves the set of permanently deleted provider IDs
 */
export function getDeletedProviderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set<string>(parsed);
      }
    }
  } catch (e) {
    console.warn('Error reading deleted provider ids:', e);
  }
  return new Set<string>();
}

/**
 * Permanently records a provider ID as deleted locally and in Firestore
 */
export async function markProviderAsDeleted(id: string): Promise<void> {
  const set = getDeletedProviderIds();
  set.add(id);
  const arr = Array.from(set);
  localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(arr));

  try {
    await setDoc(doc(db, 'settings', 'deleted_providers'), {
      ids: arr,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[TecConecta] Falha ao registrar id excluído no Firestore:', err);
  }
}

/**
 * Unmarks a provider as deleted (used when re-creating/saving with same ID)
 */
export function unmarkProviderAsDeleted(id: string): void {
  const set = getDeletedProviderIds();
  if (set.has(id)) {
    set.delete(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  }
}

/**
 * Synchronizes deleted provider IDs list from Firestore Cloud
 */
export async function syncDeletedIdsFromCloud(): Promise<void> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'deleted_providers'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data?.ids)) {
        const localSet = getDeletedProviderIds();
        data.ids.forEach((id: string) => localSet.add(id));
        localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(localSet)));
      }
    }
  } catch (err) {
    console.warn('[TecConecta] Could not sync deleted provider IDs from cloud:', err);
  }
}

// Helper to remove any duplicate provider instances and normalize phone numbers
export function deduplicateProviders(list: Provider[]): Provider[] {
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNamesCities = new Set<string>();

  return list.filter((p) => {
    if (!p || !p.id) return false;
    // Update legacy seed placeholder phone number if still present
    if (
      (p.id === 'prov-tecsolucoes' || p.id === 'prov-1') &&
      p.whatsapp &&
      (p.whatsapp === '64999999999' || p.whatsapp === '6499999999' || p.whatsapp === '11999999999')
    ) {
      p.whatsapp = '64999317499';
    }
    if (p.id === 'prov-tecsolucoes') {
      p.lat = -17.8082;
      p.lng = -50.9328;
      p.cep = '75912-182';
      if (!p.imageUrl || !p.imageUrl.trim()) {
        p.imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      }
    }
    if (p.whatsapp) {
      p.whatsapp = normalizeWhatsAppNumber(p.whatsapp);
    }
    const cleanPhone = (p.whatsapp || '').replace(/\D/g, '');
    const cleanName = (p.name || '').trim().toLowerCase();
    const cleanCity = (p.city || '').trim().toLowerCase();
    const nameCity = cleanName && cleanCity ? `${cleanName}::${cleanCity}` : '';

    if (seenIds.has(p.id)) return false;
    if (cleanPhone && cleanPhone.length >= 8 && seenPhones.has(cleanPhone)) return false;
    if (nameCity && seenNamesCities.has(nameCity)) return false;

    seenIds.add(p.id);
    if (cleanPhone && cleanPhone.length >= 8) seenPhones.add(cleanPhone);
    if (nameCity) seenNamesCities.add(nameCity);
    return true;
  });
}

// Synchronous local state loader with strict deleted-ID filtering
export function getStoredProviders(): Provider[] {
  try {
    const deletedIds = getDeletedProviderIds();
    const isDemoCleared = localStorage.getItem(LOCAL_STORAGE_DEMO_CLEARED_KEY) === 'true';
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((p: Provider) => {
          if (!p || !p.id) return false;
          if (deletedIds.has(p.id)) return false;
          if (isDemoCleared && isDemoProvider(p)) return false;
          return true;
        });
        const unique = deduplicateProviders(filtered);
        return unique;
      }
    }

    // First visit ever on a clean browser: only seed initial if demo was never cleared
    if (!isDemoCleared) {
      const initial = SEED_PROVIDERS.filter((p) => !deletedIds.has(p.id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    return [];
  } catch (err) {
    console.warn('Could not read from localStorage, using empty providers:', err);
    return [];
  }
}

// Helper to strip undefined values so Firestore never rejects payloads
export function sanitizeForFirestore(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        clean[key] = value.map(item => sanitizeForFirestore(item));
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// ----------------------------------------------------
// CLOUD SEEDING HELPERS
// ----------------------------------------------------
let isSeedingProviders = false;
async function seedInitialProvidersIfEmpty() {
  if (isSeedingProviders) return;
  const isDemoCleared = localStorage.getItem(LOCAL_STORAGE_DEMO_CLEARED_KEY) === 'true';
  if (isDemoCleared) {
    // If demo has been cleared, only ensure TecSoluções official profile is present
    try {
      const tecSolucoes = SEED_PROVIDERS.find(p => p.id === 'prov-tecsolucoes');
      if (tecSolucoes) {
        await setDoc(doc(db, 'providers', tecSolucoes.id), sanitizeForFirestore(tecSolucoes), { merge: true });
      }
    } catch (e) {
      console.warn('Could not seed official profile:', e);
    }
    return;
  }

  isSeedingProviders = true;
  try {
    console.log('[TecConecta] Base de prestadores na nuvem vazia. Semeando prestadores verificados iniciais...');
    const local = getStoredProviders();
    const listToSeed = local.length > 0 ? local : SEED_PROVIDERS;
    for (const p of listToSeed) {
      await setDoc(doc(db, 'providers', p.id), sanitizeForFirestore(p), { merge: true });
    }
    console.log('[TecConecta] Prestadores verificados sincronizados com o Firestore Cloud.');
  } catch (e) {
    console.warn('[TecConecta] Falha ao semear prestadores no Firestore:', e);
  } finally {
    isSeedingProviders = false;
  }
}

let isSeedingBanners = false;
async function seedInitialBannersIfEmpty() {
  if (isSeedingBanners) return;
  isSeedingBanners = true;
  try {
    console.log('[TecConecta] Base de banners na nuvem vazia. Semeando banners patrocinados iniciais...');
    for (const b of SEED_BANNERS) {
      await setDoc(doc(db, 'banners', b.id), sanitizeForFirestore(b), { merge: true });
    }
    console.log('[TecConecta] Banners patrocinados sincronizados com o Firestore Cloud.');
  } catch (e) {
    console.warn('[TecConecta] Falha ao semear banners no Firestore:', e);
  } finally {
    isSeedingBanners = false;
  }
}

// ----------------------------------------------------
// REALTIME SUBSCRIPTIONS (MULTI-DEVICE LIVE SYNC)
// ----------------------------------------------------

/**
 * Subscribe to real-time updates for providers.
 * Calls callback immediately with local cache, then updates on every cloud change.
 */
export function subscribeToProviders(
  callback: (providers: Provider[]) => void,
  onError?: (err: any) => void
): () => void {
  // Emit local cache immediately for zero-delay UI rendering
  const cached = getStoredProviders();
  callback(cached);

  const providersRef = collection(db, 'providers');

  // Asynchronously synchronize deleted provider IDs so this client never resurrects them
  syncDeletedIdsFromCloud();

  const unsubscribe = onSnapshot(
    providersRef,
    (snapshot) => {
      const deletedIds = getDeletedProviderIds();
      const isDemoCleared = localStorage.getItem(LOCAL_STORAGE_DEMO_CLEARED_KEY) === 'true';

      if (snapshot.empty) {
        if (!isDemoCleared) {
          seedInitialProvidersIfEmpty();
        }
        callback(getStoredProviders());
        return;
      }

      const remoteList: Provider[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Provider;
        const id = docSnap.id;
        // Never restore if marked as deleted or if demo was cleared and is a demo provider
        if (deletedIds.has(id)) return;
        if (isDemoCleared && isDemoProvider({ id })) return;

        remoteList.push({ ...data, id });
      });

      // Sort by createdAt descending
      remoteList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      const unique = deduplicateProviders(remoteList);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unique));
      callback(unique);

      // Auto-heal: ONLY sync genuine user-created local profiles (never demo, never deleted)
      const remoteIds = new Set(snapshot.docs.map((d) => d.id));
      const unsyncedLocals = cached.filter(
        (p) =>
          !remoteIds.has(p.id) &&
          !deletedIds.has(p.id) &&
          !isDemoProvider(p)
      );
      if (unsyncedLocals.length > 0) {
        console.log(`[TecConecta] Sincronizando ${unsyncedLocals.length} anunciantes locais pendentes com a nuvem...`);
        unsyncedLocals.forEach((p) => {
          setDoc(doc(db, 'providers', p.id), sanitizeForFirestore(p), { merge: true }).catch(console.warn);
        });
      }
    },
    (error) => {
      console.warn('[TecConecta] Snapshot error in providers:', error);
      onError?.(error);
      callback(getStoredProviders());
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to real-time updates for sponsored banners.
 */
export function subscribeToBanners(
  callback: (banners: SponsoredBanner[]) => void,
  onError?: (err: any) => void
): () => void {
  const cached = getStoredBanners();
  if (cached.length > 0) {
    callback(cached);
  }

  const bannersRef = collection(db, 'banners');

  const unsubscribe = onSnapshot(
    bannersRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialBannersIfEmpty();
        callback(getStoredBanners());
        return;
      }

      const remoteList: SponsoredBanner[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SponsoredBanner;
        remoteList.push({ ...data, id: docSnap.id });
      });

      remoteList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(remoteList));
      callback(remoteList);
    },
    (error) => {
      console.warn('[TecConecta] Snapshot error in banners:', error);
      onError?.(error);
      callback(getStoredBanners());
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to real-time admin settings.
 */
export function subscribeToAdminSettings(
  callback: (settings: AdminSettings) => void
): () => void {
  const cached = fetchAdminSettings();
  callback(cached);

  const ref = doc(db, 'settings', 'general');

  const unsubscribe = onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        const remote = { ...DEFAULT_ADMIN_SETTINGS, ...(docSnap.data() as AdminSettings) };
        localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(remote));
        callback(remote);
      } else {
        // Initialize default in Firestore
        setDoc(ref, sanitizeForFirestore(DEFAULT_ADMIN_SETTINGS), { merge: true }).catch(console.warn);
      }
    },
    (error) => {
      console.warn('[TecConecta] Snapshot error in admin settings:', error);
    }
  );

  return unsubscribe;
}

// ----------------------------------------------------
// PROVIDERS CRUD OPERATIONS
// ----------------------------------------------------

export async function fetchProviders(): Promise<Provider[]> {
  try {
    const snapshot = await getDocs(collection(db, 'providers'));
    if (!snapshot.empty) {
      const remoteList: Provider[] = [];
      snapshot.forEach(docSnap => {
        remoteList.push({ ...docSnap.data(), id: docSnap.id } as Provider);
      });
      remoteList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      const unique = deduplicateProviders(remoteList);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unique));
      return unique;
    } else {
      seedInitialProvidersIfEmpty();
    }
  } catch (error) {
    console.warn('[TecConecta] Firestore fetch fallback to local store:', error);
  }
  return getStoredProviders();
}

export async function saveProvider(provider: Provider): Promise<Provider> {
  // Always normalize phone number to DDD + digits format
  if (provider.whatsapp) {
    provider.whatsapp = normalizeWhatsAppNumber(provider.whatsapp);
  }

  // 1. Immediately update local storage for optimistic responsiveness
  unmarkProviderAsDeleted(provider.id);
  const current = getStoredProviders();
  const cleanPhone = (provider.whatsapp || '').replace(/\D/g, '');
  const cleanName = (provider.name || '').trim().toLowerCase();
  const cleanCity = (provider.city || '').trim().toLowerCase();

  const filtered = current.filter((p) => {
    if (p.id === provider.id) return false;
    const pPhone = (p.whatsapp || '').replace(/\D/g, '');
    if (cleanPhone && pPhone && cleanPhone === pPhone) return false;
    if (cleanName && cleanCity && p.name.trim().toLowerCase() === cleanName && p.city.trim().toLowerCase() === cleanCity) {
      return false;
    }
    return true;
  });

  const updated = deduplicateProviders([provider, ...filtered]);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  // 2. Persist to Firestore CLOUD with await and strict error catching
  try {
    const docRef = doc(db, 'providers', provider.id);
    await setDoc(docRef, sanitizeForFirestore(provider), { merge: true });
    console.log(`[TecConecta] Anunciante ${provider.name} (${provider.id}) gravado no Firestore Cloud.`);
  } catch (error) {
    console.error('[TecConecta] Erro ao salvar anunciante no Firestore Cloud:', error);
    throw error;
  }

  // 3. Trigger cross-component event
  window.dispatchEvent(new CustomEvent('tecconecta:provider_added', { detail: provider }));
  return provider;
}

export async function updateProvider(id: string, updates: Partial<Provider>): Promise<Provider> {
  if (updates.whatsapp) {
    updates.whatsapp = normalizeWhatsAppNumber(updates.whatsapp);
  }
  const current = getStoredProviders();
  const existing = current.find(p => p.id === id);
  if (!existing) {
    throw new Error('Prestador não encontrado para atualização.');
  }

  const updated: Provider = {
    ...existing,
    ...updates,
    id
  };

  const updatedList = current.map(p => (p.id === id ? updated : p));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

  try {
    const docRef = doc(db, 'providers', id);
    await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });
    console.log(`[TecConecta] Anunciante ${id} atualizado no Firestore Cloud.`);
  } catch (error) {
    console.error('[TecConecta] Erro ao atualizar anunciante no Firestore Cloud:', error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent('tecconecta:provider_updated', { detail: updated }));
  return updated;
}

export async function deleteProvider(id: string): Promise<boolean> {
  // 1. Remove from local cache immediately
  const current = getStoredProviders();
  const filtered = current.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

  // 2. Permanently record as deleted (local set and cloud tombstone)
  await markProviderAsDeleted(id);

  // 3. Delete document from Firestore Cloud
  try {
    const docRef = doc(db, 'providers', id);
    await deleteDoc(docRef);
    console.log(`[TecConecta] Anunciante ${id} removido definitivamente do Firestore Cloud.`);
  } catch (error) {
    console.error('[TecConecta] Erro ao remover anunciante no Firestore Cloud:', error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent('tecconecta:provider_deleted', { detail: { id } }));
  return true;
}

/**
 * Permanently removes all fictitious/demo advertisers from local storage and Firestore Cloud.
 */
export async function clearDemoProviders(): Promise<Provider[]> {
  localStorage.setItem(LOCAL_STORAGE_DEMO_CLEARED_KEY, 'true');
  const current = getStoredProviders();

  // Find all demo provider IDs to delete
  const demoIdsToDelete = new Set<string>();
  current.forEach((p) => {
    if (isDemoProvider(p)) demoIdsToDelete.add(p.id);
  });
  SEED_PROVIDERS.forEach((p) => {
    if (isDemoProvider(p)) demoIdsToDelete.add(p.id);
  });

  // Mark all as deleted locally & cloud
  const localDeleted = getDeletedProviderIds();
  demoIdsToDelete.forEach((id) => localDeleted.add(id));
  localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(localDeleted)));

  const remaining = current.filter((p) => !demoIdsToDelete.has(p.id));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));

  // Asynchronously delete all demo docs from Firestore
  try {
    const deletePromises = Array.from(demoIdsToDelete).map((id) =>
      deleteDoc(doc(db, 'providers', id)).catch((err) => {
        console.warn(`[TecConecta] Erro ao excluir doc demo ${id}:`, err);
      })
    );
    await Promise.all(deletePromises);

    await setDoc(doc(db, 'settings', 'deleted_providers'), {
      ids: Array.from(localDeleted),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[TecConecta] ${demoIdsToDelete.size} anunciantes fictícios excluídos com sucesso da nuvem.`);
  } catch (err) {
    console.warn('[TecConecta] Erro ao sincronizar remoção de demo com Firestore:', err);
  }

  window.dispatchEvent(new CustomEvent('tecconecta:demo_cleared', { detail: { remaining } }));
  return remaining;
}

/**
 * Restores sample demonstration providers if requested by the user
 */
export async function resetDemoProviders(): Promise<Provider[]> {
  localStorage.removeItem(LOCAL_STORAGE_DEMO_CLEARED_KEY);
  const deletedSet = getDeletedProviderIds();

  // Unmark demo IDs from deletion
  SEED_PROVIDERS.forEach((p) => {
    deletedSet.delete(p.id);
  });
  localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(deletedSet)));

  const current = getStoredProviders();
  const combined = deduplicateProviders([...current, ...SEED_PROVIDERS]);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));

  // Re-seed to Firestore
  try {
    for (const p of SEED_PROVIDERS) {
      await setDoc(doc(db, 'providers', p.id), sanitizeForFirestore(p), { merge: true });
    }
    await setDoc(doc(db, 'settings', 'deleted_providers'), {
      ids: Array.from(deletedSet),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[TecConecta] Erro ao restaurar demonstracao na nuvem:', err);
  }

  return combined;
}

// ----------------------------------------------------
// SPONSORED BANNERS & MONETIZATION MANAGEMENT
// ----------------------------------------------------
export const SEED_BANNERS: SponsoredBanner[] = [
  {
    id: 'banner-seed-1',
    companyName: 'TecSoluções Cloud & IA',
    headline: 'Transformação Digital & Automação Inteligente',
    subtext: 'Sistemas web sob medida, automação no WhatsApp e consultoria em IA para sua empresa.',
    ctaText: 'Falar com Especialista',
    whatsapp: '64999317499',
    badgeText: 'Patrocinador Oficial',
    category: 'Tecnologia & Inovação',
    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'banner-seed-2',
    companyName: 'Rede Farma Mais',
    headline: 'Entrega Rápida de Medicamentos no seu Bairro',
    subtext: 'Peça suas receitas e produtos de conveniência direto no WhatsApp sem filas.',
    ctaText: 'Pedir no WhatsApp',
    whatsapp: '11988887777',
    badgeText: 'Empresa Parceira',
    category: 'Saúde & Farmácia',
    imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80',
    active: true,
    createdAt: '2026-01-15T00:00:00Z'
  }
];

function getStoredBanners(): SponsoredBanner[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BANNERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading sponsored banners from local storage:', e);
  }
  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(SEED_BANNERS));
  return SEED_BANNERS;
}

export async function fetchSponsoredBanners(): Promise<SponsoredBanner[]> {
  try {
    const snapshot = await getDocs(collection(db, 'banners'));
    if (!snapshot.empty) {
      const remoteList: SponsoredBanner[] = [];
      snapshot.forEach(docSnap => {
        remoteList.push({ ...docSnap.data(), id: docSnap.id } as SponsoredBanner);
      });
      remoteList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(remoteList));
      return remoteList;
    } else {
      seedInitialBannersIfEmpty();
    }
  } catch (e) {
    console.warn('[TecConecta] Firestore banner fetch fallback to local:', e);
  }
  return getStoredBanners();
}

export async function saveSponsoredBanner(banner: SponsoredBanner): Promise<SponsoredBanner> {
  const current = getStoredBanners();
  const existingIdx = current.findIndex(b => b.id === banner.id);
  let updatedList: SponsoredBanner[];
  if (existingIdx >= 0) {
    updatedList = current.map(b => (b.id === banner.id ? banner : b));
  } else {
    updatedList = [banner, ...current];
  }

  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updatedList));

  try {
    const docRef = doc(db, 'banners', banner.id);
    await setDoc(docRef, sanitizeForFirestore(banner), { merge: true });
    console.log(`[TecConecta] Banner ${banner.companyName} (${banner.id}) salvo no Firestore Cloud.`);
  } catch (e) {
    console.error('[TecConecta] Erro ao salvar banner no Firestore Cloud:', e);
    throw e;
  }

  window.dispatchEvent(new CustomEvent('tecconecta:banners_updated', { detail: updatedList }));
  return banner;
}

export async function deleteSponsoredBanner(id: string): Promise<boolean> {
  const current = getStoredBanners();
  const filtered = current.filter(b => b.id !== id);
  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(filtered));

  try {
    const docRef = doc(db, 'banners', id);
    await deleteDoc(docRef);
    console.log(`[TecConecta] Banner ${id} removido do Firestore Cloud.`);
  } catch (e) {
    console.error('[TecConecta] Erro ao excluir banner no Firestore Cloud:', e);
    throw e;
  }

  window.dispatchEvent(new CustomEvent('tecconecta:banners_updated', { detail: filtered }));
  return true;
}

// ----------------------------------------------------
// ADMIN SETTINGS & PLATFORM CONFIGURATION
// ----------------------------------------------------
export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  admWhatsapp: '64999317499',
  admName: 'Departamento Administrativo TecSoluções',
  bannerHeadline: 'Anuncie Sua Empresa Aqui',
  bannerSubtext: 'Entre em contato com o departamento administrativo e destaque sua marca para milhares de clientes locais.',
  adminPin: 'admin123'
};

function getStoredAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
    if (raw) {
      const parsed = { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
      if (parsed.admWhatsapp === '11999999999' || parsed.admWhatsapp.includes('99999999')) {
        parsed.admWhatsapp = '64999317499';
        localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading admin settings:', e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function fetchAdminSettings(): AdminSettings {
  return getStoredAdminSettings();
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(settings));

  try {
    const ref = doc(db, 'settings', 'general');
    await setDoc(ref, sanitizeForFirestore(settings), { merge: true });
    console.log('[TecConecta] Configurações de administração sincronizadas no Firestore Cloud.');
  } catch (error) {
    console.error('[TecConecta] Erro ao sincronizar configurações de administração:', error);
  }

  window.dispatchEvent(new CustomEvent('tecconecta:admin_settings_updated', { detail: settings }));
}

// ----------------------------------------------------
// CLICK & ENGAGEMENT ANALYTICS TRACKING
// ----------------------------------------------------
export async function recordProviderClick(id: string): Promise<number> {
  const current = getStoredProviders();
  const target = current.find(p => p.id === id);
  const newClicks = (target?.clicksCount || 0) + 1;
  const updatedList = current.map(p => p.id === id ? { ...p, clicksCount: newClicks } : p);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

  try {
    const docRef = doc(db, 'providers', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, { clicksCount: increment(1) });
    } else if (target) {
      await setDoc(docRef, sanitizeForFirestore({ ...target, clicksCount: newClicks }), { merge: true });
    }
  } catch (e) {
    console.warn('[TecConecta] Firestore provider click fallback to local store:', e);
  }

  window.dispatchEvent(new CustomEvent('tecconecta:provider_clicked', { detail: { id, clicksCount: newClicks } }));
  return newClicks;
}

export async function recordBannerClick(id: string): Promise<number> {
  const current = getStoredBanners();
  const target = current.find(b => b.id === id);
  const newClicks = (target?.clicksCount || 0) + 1;
  const updatedList = current.map(b => b.id === id ? { ...b, clicksCount: newClicks } : p => p);
  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updatedList));

  try {
    const docRef = doc(db, 'banners', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, { clicksCount: increment(1) });
    } else if (target) {
      await setDoc(docRef, sanitizeForFirestore({ ...target, clicksCount: newClicks }), { merge: true });
    }
  } catch (e) {
    console.warn('[TecConecta] Firestore banner click fallback to local store:', e);
  }

  window.dispatchEvent(new CustomEvent('tecconecta:banners_updated', { detail: updatedList }));
  return newClicks;
}

// ----------------------------------------------------
// FORCE CLOUD SYNC ALL (MANUAL OR ON-DEMAND)
// ----------------------------------------------------
export async function syncAllLocalToCloud(): Promise<{ providersCount: number; bannersCount: number }> {
  let providersCount = 0;
  let bannersCount = 0;

  const localProviders = getStoredProviders();
  for (const p of localProviders) {
    try {
      await setDoc(doc(db, 'providers', p.id), sanitizeForFirestore(p), { merge: true });
      providersCount++;
    } catch (e) {
      console.warn('Sync provider failed:', p.id, e);
    }
  }

  const localBanners = getStoredBanners();
  for (const b of localBanners) {
    try {
      await setDoc(doc(db, 'banners', b.id), sanitizeForFirestore(b), { merge: true });
      bannersCount++;
    } catch (e) {
      console.warn('Sync banner failed:', b.id, e);
    }
  }

  const localSettings = getStoredAdminSettings();
  try {
    await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore(localSettings), { merge: true });
  } catch (e) {
    console.warn('Sync settings failed:', e);
  }

  return { providersCount, bannersCount };
}


