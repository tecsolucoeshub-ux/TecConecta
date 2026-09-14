export interface Provider {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  neighborhood?: string;
  cep?: string;
  lat: number;
  lng: number;
  whatsapp: string; // digits only e.g. "11987654321"
  createdAt: string;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  badge?: string;
  imageUrl?: string; // Photo of business / storefront / service / logo
  editPin?: string; // Optional security PIN defined by provider
}

export interface Review {
  id: string;
  providerId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment?: string;
  serviceDone?: string;
  createdAt: string;
}

export interface SponsoredBanner {
  id: string;
  companyName: string;
  headline: string;
  subtext: string;
  ctaText?: string;
  whatsapp: string; // digits only
  linkUrl?: string;
  badgeText?: string;
  category?: string;
  imageUrl?: string; // Banner / Logo / Showcase photo
  active: boolean;
  createdAt: string;
}

export interface AdminSettings {
  admWhatsapp: string;
  admName: string;
  bannerHeadline: string;
  bannerSubtext: string;
  adminPin: string;
}

export type ViewMode = 'list' | 'map';

export interface CategoryOption {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  city?: string;
}

