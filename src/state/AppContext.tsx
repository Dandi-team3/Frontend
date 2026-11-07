import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, orNull, readToken, type Me, type ServerRole, type YouthCandidate, type YouthProfileRequest } from '../lib/api';
import { EMPTY_SHOP_DRAFT, fromShopResponse, type ShopDraft } from '../lib/shop';

export type Role = 'owner' | 'successor';

type AppState = {
  me: Me | null;
  role: Role | null;
  login: (name: string, role: ServerRole) => Promise<Me>;
  refreshMe: () => Promise<void>;
  // 여러 화면에 나눠 입력하는 등록 내용. 마지막 단계에서 서버에 저장한다.
  shopDraft: ShopDraft;
  setShopDraft: (value: ShopDraft) => void;
  shopDraftOwnerId: number | null;
  setShopDraftOwnerId: (value: number | null) => void;
  retirementDate: string | null;
  setRetirementDate: (value: string | null) => void;
  // 사진 저장 API가 없어 이 브라우저 메모리에만 둔다.
  shopPhotos: File[];
  setShopPhotos: (value: File[]) => void;
  offerMessage: string;
  setOfferMessage: (value: string) => void;
  selectedYouth: YouthCandidate | null;
  setSelectedYouth: (value: YouthCandidate | null) => void;
};

export const EMPTY_YOUTH_PROFILE: YouthProfileRequest = {
  age: null, experience: 'ONE_TO_3Y', experienceDetail: null, fundsReady: 0, loanPlanned: true, loanAmount: 0,
  preferredCategories: ['한식'], preferredDistricts: ['중구'], earlyMorningOk: true, intro: null,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(() => !readToken());
  const [shopDraft, setShopDraft] = useState<ShopDraft>(() => ({ ...EMPTY_SHOP_DRAFT, handoverItems: [] }));
  const [shopDraftOwnerId, setShopDraftOwnerId] = useState<number | null>(null);
  const [retirementDate, setRetirementDate] = useState<string | null>('2027-08-31');
  const [shopPhotos, setShopPhotos] = useState<File[]>([]);
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<YouthCandidate | null>(null);

  useEffect(() => {
    if (!readToken()) return;
    api.me().then(setMe).catch(() => setMe(null)).finally(() => setReady(true));
  }, []);

  const login = useCallback(async (name: string, role: ServerRole) => {
    const next = await api.login(name, role);
    setMe(next);
    return next;
  }, []);

  const refreshMe = useCallback(async () => {
    setMe(await api.me());
  }, []);

  if (!ready) return null;

  const value: AppState = {
    me,
    role: me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null,
    login, refreshMe,
    shopDraft, setShopDraft, shopDraftOwnerId, setShopDraftOwnerId, retirementDate, setRetirementDate,
    shopPhotos, setShopPhotos, offerMessage, setOfferMessage, selectedYouth, setSelectedYouth,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

/** 등록 화면 어디로 들어와도 지금 로그인한 사장님의 가게 정보가 입력칸에 있게 한다. */
export function useShopDraftLoader() {
  const { me, shopDraftOwnerId, setShopDraftOwnerId, setShopDraft, setRetirementDate } = useApp();

  useEffect(() => {
    if (!me || shopDraftOwnerId === me.id) return;
    setShopDraftOwnerId(me.id);
    setShopDraft({ ...EMPTY_SHOP_DRAFT, handoverItems: [] });
    if (!me.hasShop) return;
    void orNull(api.shop()).then((shop) => {
      if (!shop) return;
      setShopDraft(fromShopResponse(shop));
      setRetirementDate(shop.retireDate);
    }).catch(() => {
      // 불러오지 못하면 새로 입력할 수 있게 둔다.
    });
  }, [me, shopDraftOwnerId, setShopDraftOwnerId, setShopDraft, setRetirementDate]);
}
