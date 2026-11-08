import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, orNull, readToken, type Me, type ServerRole, type YouthCandidate, type YouthProfileRequest } from '../lib/api';
import { EMPTY_SHOP_DRAFT, fromShopResponse, type ShopDraft } from '../lib/shop';

export type Role = 'owner' | 'successor';
export type PersonalInfo = { name: string; age: string; phone: string; email: string };
export function hasRequiredPersonalInfo(info: PersonalInfo, role?: Role | null) {
  const age = Number(info.age);
  return Boolean(info.name.trim() && /^\d+$/.test(info.age) && Number.isInteger(age)
    && age >= 15 && age <= (role === 'successor' ? 80 : 100));
}

type AppState = {
  me: Me | null;
  role: Role | null;
  pendingRole: Role;
  setPendingRole: (value: Role) => void;
  personalInfo: PersonalInfo;
  setPersonalInfo: (value: PersonalInfo) => void;
  onboardingComplete: Record<Role, boolean>;
  completeOnboarding: (role: Role) => boolean;
  youthDraft: YouthProfileRequest;
  setYouthDraft: (value: YouthProfileRequest) => void;
  youthDraftText: { funds: string; loan: string };
  setYouthDraftText: (value: { funds: string; loan: string }) => void;
  login: (name: string, role: ServerRole) => Promise<Me>;
  refreshMe: () => Promise<void>;
  shopDraft: ShopDraft;
  setShopDraft: (value: ShopDraft) => void;
  shopDraftOwnerId: number | null;
  setShopDraftOwnerId: (value: number | null) => void;
  retirementDate: string | null;
  setRetirementDate: (value: string | null) => void;
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
const blankInfo = (): PersonalInfo => ({ name: '', age: '', phone: '', email: '' });
const supplementKey = (id: number) => 'mullyeobatgi.profile.' + id;
function readSupplement(me: Me): PersonalInfo {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(supplementKey(me.id)) ?? 'null');
    const fields = saved && typeof saved === 'object' ? saved as Record<string, unknown> : {};
    return { name: me.name, age: typeof fields.age === 'string' ? fields.age : '',
      phone: typeof fields.phone === 'string' ? fields.phone : '', email: typeof fields.email === 'string' ? fields.email : '' };
  } catch { return { ...blankInfo(), name: me.name }; }
}
function saveSupplement(id: number, info: PersonalInfo) {
  try { sessionStorage.setItem(supplementKey(id), JSON.stringify({ age: info.age, phone: info.phone, email: info.email })); }
  catch { /* 브라우저 저장을 허용하지 않으면 현재 화면에서만 유지한다. */ }
}
const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const meRef = useRef<Me | null>(null);
  const [ready, setReady] = useState(() => !readToken());
  const [pendingRole, setPendingRole] = useState<Role>('successor');
  const [personalInfo, updatePersonalInfo] = useState<PersonalInfo>(blankInfo);
  const personalInfoRef = useRef(personalInfo);
  const [completed, setCompleted] = useState<Record<Role, boolean>>({ owner: false, successor: false });
  const [youthDraft, setYouthDraft] = useState<YouthProfileRequest>(() => ({ ...EMPTY_YOUTH_PROFILE, preferredCategories: [], preferredDistricts: [] }));
  const [youthDraftText, setYouthDraftText] = useState({ funds: '', loan: '' });
  const [shopDraft, setShopDraft] = useState<ShopDraft>(() => ({ ...EMPTY_SHOP_DRAFT, handoverItems: [] }));
  const [shopDraftOwnerId, setShopDraftOwnerId] = useState<number | null>(null);
  const [retirementDate, setRetirementDate] = useState<string | null>(null);
  const [shopPhotos, setShopPhotos] = useState<File[]>([]);
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<YouthCandidate | null>(null);

  const setPersonalInfo = useCallback((value: PersonalInfo) => {
    const account = meRef.current;
    const next = { ...value, name: account?.name ?? value.name };
    personalInfoRef.current = next;
    updatePersonalInfo(next);
    if (account) saveSupplement(account.id, next);
  }, []);
  const applyMe = useCallback((next: Me) => {
    const changedAccount = meRef.current?.id !== next.id;
    meRef.current = next;
    setMe(next);
    if (next.role) setPendingRole(next.role === 'OWNER' ? 'owner' : 'successor');
    if (changedAccount) {
      const info = readSupplement(next);
      personalInfoRef.current = info;
      updatePersonalInfo(info);
      setCompleted({ owner: false, successor: false });
      setYouthDraft({ ...EMPTY_YOUTH_PROFILE, preferredCategories: [], preferredDistricts: [] });
      setYouthDraftText({ funds: '', loan: '' });
      setShopDraft({ ...EMPTY_SHOP_DRAFT, handoverItems: [] });
      setShopDraftOwnerId(null);
      setRetirementDate(null);
      setShopPhotos([]);
      setOfferMessage('');
      setSelectedYouth(null);
    }
  }, []);
  const loadSavedAge = useCallback(async (account: Me) => {
    if (account.role !== 'YOUTH' || !account.hasYouthProfile) return;
    try {
      const profile = await orNull(api.youthProfile());
      if (profile?.age != null && meRef.current?.id === account.id) {
        setPersonalInfo({ ...personalInfoRef.current, age: String(profile.age) });
      }
    } catch { /* 등록 화면에서 불러오기 오류를 표시한다. */ }
  }, [setPersonalInfo]);
  useEffect(() => {
    if (!readToken()) return;
    const token = readToken();
    let active = true;
    void api.me().then(async (next) => {
      if (!active || readToken() !== token) return;
      applyMe(next);
      await loadSavedAge(next);
    }).catch(() => {
      if (active) { meRef.current = null; setMe(null); }
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [applyMe, loadSavedAge]);
  const login = useCallback(async (name: string, role: ServerRole) => {
    const next = await api.login(name, role);
    applyMe(next);
    await loadSavedAge(next);
    return next;
  }, [applyMe, loadSavedAge]);
  const refreshMe = useCallback(async () => {
    const token = readToken();
    const next = await api.me();
    if (readToken() === token) applyMe(next);
  }, [applyMe]);
  const completeOnboarding = useCallback((role: Role) => {
    if (!hasRequiredPersonalInfo(personalInfoRef.current, role)) return false;
    setCompleted((previous) => ({ ...previous, [role]: true }));
    return true;
  }, []);
  if (!ready) return <div className="app"><p role="status" style={{ padding: 24 }}>내 정보를 불러오고 있어요.</p></div>;
  const role: Role | null = me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null;
  const basicReady = hasRequiredPersonalInfo(personalInfo, role);
  const onboardingComplete = {
    owner: Boolean(basicReady && me?.role === 'OWNER' && (completed.owner || me.hasShop)),
    successor: Boolean(basicReady && me?.role === 'YOUTH' && (completed.successor || me.hasYouthProfile)),
  };
  const value: AppState = {
    me, role, pendingRole, setPendingRole, personalInfo, setPersonalInfo, onboardingComplete, completeOnboarding,
    youthDraft, setYouthDraft, youthDraftText, setYouthDraftText,
    login, refreshMe, shopDraft, setShopDraft, shopDraftOwnerId, setShopDraftOwnerId, retirementDate, setRetirementDate,
    shopPhotos, setShopPhotos, offerMessage, setOfferMessage, selectedYouth, setSelectedYouth,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
export function useShopDraftLoader() {
  const { me, shopDraftOwnerId, setShopDraftOwnerId, setShopDraft, setRetirementDate } = useApp();
  useEffect(() => {
    if (!me || me.role !== 'OWNER' || shopDraftOwnerId === me.id) return;
    const token = readToken();
    setShopDraftOwnerId(me.id);
    setShopDraft({ ...EMPTY_SHOP_DRAFT, handoverItems: [] });
    if (me.hasShop) {
      void orNull(api.shop()).then((shop) => {
        if (readToken() !== token || !shop) return;
        setShopDraft(fromShopResponse(shop));
        setRetirementDate(shop.retireDate);
      }).catch(() => { /* 등록 화면에서 다시 입력할 수 있다. */ });
    }
  }, [me?.id, me?.role, me?.hasShop, shopDraftOwnerId, setShopDraftOwnerId, setShopDraft, setRetirementDate]);
}
