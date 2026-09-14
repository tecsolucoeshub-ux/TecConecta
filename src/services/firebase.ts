import { Provider, SponsoredBanner, AdminSettings } from '../types';
import { SEED_PROVIDERS } from '../data/seedProviders';
import firebaseConfig from '../firebase-applet-config.json';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY = 'tecconecta_providers_v1';

// Helper to remove any duplicate provider instances (guaranteeing 1 banner/card per advertiser)
function deduplicateProviders(list: Provider[]): Provider[] {
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  return list.filter((p) => {
    if (!p || !p.id) return false;
    const cleanPhone = (p.whatsapp || '').replace(/\D/g, '');
    if (seenIds.has(p.id)) return false;
    if (cleanPhone && cleanPhone.length >= 8 && seenPhones.has(cleanPhone)) return false;
    seenIds.add(p.id);
    if (cleanPhone && cleanPhone.length >= 8) seenPhones.add(cleanPhone);
    return true;
  });
}

// Synchronous local state loader
function getStoredProviders(): Provider[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_PROVIDERS));
      return SEED_PROVIDERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_PROVIDERS));
      return SEED_PROVIDERS;
    }
    const unique = deduplicateProviders(parsed);
    if (unique.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unique));
    }
    return unique;
  } catch (err) {
    console.warn('Could not read from localStorage, using seed providers:', err);
    return SEED_PROVIDERS;
  }
}

// Check if Firebase config is available
let firestoreDb: any = null;

async function initFirebaseIfAvailable() {
  try {
    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const app = initializeApp(firebaseConfig);
      firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log('TecConecta: Firebase Firestore connected successfully.');
    } else {
      console.info('TecConecta: Operating in standalone local repository mode.');
    }
  } catch (e) {
    console.info('TecConecta: Operating in standalone local repository mode.', e);
  }
}

// Trigger lazy initialization
initFirebaseIfAvailable();

export async function fetchProviders(): Promise<Provider[]> {
  const path = 'providers';
  if (firestoreDb) {
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const q = query(collection(firestoreDb, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const remoteList: Provider[] = [];
      snapshot.forEach(doc => {
        remoteList.push({ id: doc.id, ...doc.data() } as Provider);
      });
      if (remoteList.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteList));
        return remoteList;
      }
    } catch (error) {
      console.warn('Firestore fetch fallback to local store:', error);
      // fallback to local storage
    }
  }
  return getStoredProviders();
}

export async function saveProvider(provider: Provider): Promise<Provider> {
  const path = `providers/${provider.id}`;
  // 1. Always update local storage first with deduplication to prevent double banners
  const current = getStoredProviders();
  const cleanPhone = (provider.whatsapp || '').replace(/\D/g, '');
  const filtered = current.filter(
    (p) => p.id !== provider.id && (!cleanPhone || p.whatsapp.replace(/\D/g, '') !== cleanPhone)
  );
  const updated = [provider, ...filtered];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  // 2. Persist to Firestore if available
  if (firestoreDb) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestoreDb, 'providers', provider.id), provider);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Trigger cross-component event
  window.dispatchEvent(new CustomEvent('tecconecta:provider_added', { detail: provider }));

  return provider;
}

export async function updateProvider(id: string, updates: Partial<Provider>): Promise<Provider> {
  const path = `providers/${id}`;
  const current = getStoredProviders();
  const existing = current.find(p => p.id === id);
  if (!existing) {
    throw new Error('Prestador não encontrado para atualização.');
  }

  const updated: Provider = {
    ...existing,
    ...updates,
    id // preserve id
  };

  const updatedList = current.map(p => (p.id === id ? updated : p));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

  if (firestoreDb) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(firestoreDb, 'providers', id), updates);
    } catch (error) {
      console.warn('Firestore update fallback to local store:', error);
    }
  }

  window.dispatchEvent(new CustomEvent('tecconecta:provider_updated', { detail: updated }));
  return updated;
}

export async function deleteProvider(id: string): Promise<boolean> {
  const current = getStoredProviders();
  const filtered = current.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

  if (firestoreDb) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(firestoreDb, 'providers', id));
    } catch (error) {
      console.warn('Firestore delete fallback to local store:', error);
    }
  }

  window.dispatchEvent(new CustomEvent('tecconecta:provider_deleted', { detail: { id } }));
  return true;
}

export function clearDemoProviders(): Provider[] {
  const current = getStoredProviders();
  const filtered = current.filter(p => !p.id.startsWith('seed-'));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function resetDemoProviders(): Provider[] {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_PROVIDERS));
  return SEED_PROVIDERS;
}

// ----------------------------------------------------
// SPONSORED BANNERS & MONETIZATION MANAGEMENT
// ----------------------------------------------------
const LOCAL_STORAGE_BANNERS_KEY = 'tecconecta_sponsored_banners_v1';
const LOCAL_STORAGE_ADMIN_KEY = 'tecconecta_admin_settings_v1';

export const SEED_BANNERS: SponsoredBanner[] = [
  {
    id: 'banner-seed-1',
    companyName: 'DaMaceno Soluções Cloud & Dev',
    headline: 'Transformação Digital & Automação Inteligente',
    subtext: 'Sistemas web sob medida, automação no WhatsApp e consultoria em IA para sua empresa.',
    ctaText: 'Falar com Especialista',
    whatsapp: '11999999999',
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

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  admWhatsapp: '11999999999',
  admName: 'Departamento Administrativo DaMaceno Soluções',
  bannerHeadline: 'Anuncie Sua Empresa Aqui',
  bannerSubtext: 'Entre em contato com o departamento administrativo e destaque sua marca para milhares de clientes locais.',
  adminPin: 'admin123'
};

export function fetchAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
    if (raw) {
      return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading admin settings:', e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('tecconecta:admin_settings_updated', { detail: settings }));
}

export async function fetchSponsoredBanners(): Promise<SponsoredBanner[]> {
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

  // Seed default banners only on initial setup when key is not set
  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(SEED_BANNERS));
  return SEED_BANNERS;
}

export async function saveSponsoredBanner(banner: SponsoredBanner): Promise<SponsoredBanner> {
  const current = await fetchSponsoredBanners();
  const existingIdx = current.findIndex(b => b.id === banner.id);
  let updatedList: SponsoredBanner[];
  if (existingIdx >= 0) {
    updatedList = current.map(b => (b.id === banner.id ? banner : b));
  } else {
    updatedList = [banner, ...current];
  }

  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updatedList));

  if (firestoreDb) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestoreDb, 'banners', banner.id), banner);
    } catch (e) {
      console.warn('Firestore banner write fallback to local store:', e);
    }
  }

  window.dispatchEvent(new CustomEvent('tecconecta:banners_updated', { detail: updatedList }));
  return banner;
}

export async function deleteSponsoredBanner(id: string): Promise<boolean> {
  const current = await fetchSponsoredBanners();
  const filtered = current.filter(b => b.id !== id);
  localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(filtered));

  if (firestoreDb) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(firestoreDb, 'banners', id));
    } catch (e) {
      console.warn('Firestore banner delete fallback to local store:', e);
    }
  }

  window.dispatchEvent(new CustomEvent('tecconecta:banners_updated', { detail: filtered }));
  return true;
}


