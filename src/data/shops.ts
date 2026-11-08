import { api, orNull, type Offer, type ShopCandidate, type ShopResponse } from '../lib/api';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

export type ShopDetails = {
  name: string;
  owner: string;
  category: string;
  mainMenu: string;
  district: string;
  address: string;
  openedYear: string;
  amount: number | null;
  included: string | null;
  trainingMonths: number | null;
  workHours: string | null;
  earlyMorning: boolean | null;
  retireDate: string | null;
  message: string | null;
};

export type ListedShop = {
  id: string;
  source: 'own' | 'match' | 'offer';
  image: { src: string; alt: string; position?: string };
  details: ShopDetails;
  tags: string[];
  matchScore: number | null;
  breakdown: ShopCandidate['breakdown'];
  reasons: ShopCandidate['reasons'];
};

export function isShopId(value: string | null | undefined): value is string {
  return Boolean(value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0);
}

function atmospherePhoto(category: string, id: number): ListedShop['image'] {
  if (category === '카페') return { src: '/images/shops/cafe-interior.jpg', alt: '가게 분위기 참고용 카페 내부 사진', position: 'center 48%' };
  return id % 2
    ? { src: '/images/shops/vintage-dining-room.jpg', alt: '가게 분위기 참고용 식당 내부 사진', position: 'center 58%' }
    : { src: '/images/shops/restaurant-interior.jpg', alt: '가게 분위기 참고용 식당 내부 사진', position: 'center 55%' };
}

function knownNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function listedShopFromCandidate(shop: ShopCandidate): ListedShop {
  return {
    id: String(shop.shopId), source: 'match', image: atmospherePhoto(shop.category, shop.shopId),
    details: {
      name: shop.shopName, owner: shop.ownerName, category: shop.category, mainMenu: shop.mainMenu ?? '',
      district: shop.district, address: '', openedYear: shop.openedYear == null ? '' : String(shop.openedYear),
      amount: knownNumber(shop.askingPrice), retireDate: shop.retireDate ?? null,
      included: null, trainingMonths: null, workHours: null, earlyMorning: null, message: null,
    },
    tags: [shop.category, shop.district].filter(Boolean),
    matchScore: knownNumber(shop.score), breakdown: shop.breakdown ?? [], reasons: shop.reasons ?? [],
  };
}

export function listedShopFromOwn(shop: ShopResponse): ListedShop {
  return {
    id: String(shop.id), source: 'own', image: atmospherePhoto(shop.category, shop.id),
    details: {
      name: shop.name, owner: shop.ownerName, category: shop.category, mainMenu: shop.mainMenu ?? '',
      district: shop.district, address: shop.address ?? '', openedYear: shop.openedYear == null ? '' : String(shop.openedYear),
      amount: knownNumber(shop.askingPrice), included: shop.handoverItems,
      trainingMonths: knownNumber(shop.apprenticeMonths), workHours: shop.workHours,
      earlyMorning: shop.earlyMorning, retireDate: shop.retireDate ?? null, message: shop.message,
    },
    tags: [shop.category, shop.district].filter(Boolean), matchScore: null, breakdown: [], reasons: [],
  };
}

export function listedShopFromOffer(offer: Offer): ListedShop {
  return {
    id: String(offer.shopId), source: 'offer', image: atmospherePhoto(offer.category, offer.shopId),
    details: {
      name: offer.shopName, owner: offer.ownerName, category: offer.category, mainMenu: offer.mainMenu ?? '',
      district: offer.district, address: '', openedYear: offer.openedYear == null ? '' : String(offer.openedYear),
      amount: knownNumber(offer.price), included: offer.handoverItems, trainingMonths: knownNumber(offer.apprenticeMonths),
      workHours: offer.workHours, earlyMorning: null, retireDate: offer.retireDate ?? null, message: offer.message,
    },
    tags: [offer.category, offer.district].filter(Boolean), matchScore: knownNumber(offer.matchScore), breakdown: [], reasons: [],
  };
}

/** 공개 탐색 API가 없으므로 청년은 서버의 후보 목록, 사장님은 본인 가게만 표시한다. */
export function useShopListings() {
  const { me, role } = useApp();
  const result = useLoad(async () => {
    if (!me) return { viewerId: null, shops: [] as ListedShop[], profileMissing: false };
    if (role === 'owner') {
      const shop = await orNull(api.shop());
      return { viewerId: me.id, shops: shop ? [listedShopFromOwn(shop)] : [], profileMissing: false };
    }
    if (!me.hasYouthProfile) return { viewerId: me.id, shops: [] as ListedShop[], profileMissing: true };
    const candidates = await orNull(api.youthMatches());
    return { viewerId: me.id, shops: (candidates ?? []).map(listedShopFromCandidate), profileMissing: candidates === null };
  }, [me?.id, role, me?.hasShop, me?.hasYouthProfile]);
  return { ...result, loading: result.loading || Boolean(result.data && result.data.viewerId !== (me?.id ?? null)) };
}
