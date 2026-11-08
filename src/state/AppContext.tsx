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
  isDemoMode: boolean;
  beginDemoMode: () => void;
  demoNames: Record<Role, string>;
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
  login: (name: string, role: ServerRole, expectedId?: number) => Promise<Me>;
  signInWithToken: (token: string) => Promise<Me>;
  chooseRole: (role: ServerRole) => Promise<Me>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  shopLoading: boolean;
  shopLoadError: string | null;
  reloadShop: () => Promise<void>;
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
const DEMO_MODE_KEY = 'mullyeobatgi.demo-mode';
const DEMO_NAMES_KEY = 'mullyeobatgi.demo-names';
function readDemoMode() {
  try { return import.meta.env.DEV && sessionStorage.getItem(DEMO_MODE_KEY) === 'true'; }
  catch { return false; }
}
function readDemoNames(): Record<Role, string> {
  const defaults = { owner: '김순자', successor: '이도윤' };
  if (!import.meta.env.DEV) return defaults;
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(DEMO_NAMES_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    const fields = saved as Record<string, unknown>;
    return { owner: typeof fields.owner === 'string' && fields.owner.trim() ? fields.owner : defaults.owner,
      successor: typeof fields.successor === 'string' && fields.successor.trim() ? fields.successor : defaults.successor };
  } catch { return defaults; }
}
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
  const [ready, setReady] = useState(() => !readToken() || window.location.pathname === '/oauth/callback');
  const [pendingRole, setPendingRole] = useState<Role>('successor');
  const [isDemoMode, setIsDemoMode] = useState(readDemoMode);
  const [demoNames, setDemoNames] = useState(readDemoNames);
  const [personalInfo, updatePersonalInfo] = useState<PersonalInfo>(blankInfo);
  const personalInfoRef = useRef(personalInfo);
  const [completed, setCompleted] = useState<Record<Role, boolean>>({ owner: false, successor: false });
  const [youthDraft, setYouthDraft] = useState<YouthProfileRequest>(() => ({ ...EMPTY_YOUTH_PROFILE, preferredCategories: [], preferredDistricts: [] }));
  const [youthDraftText, setYouthDraftText] = useState({ funds: '', loan: '' });
  const [shopDraft, setShopDraft] = useState<ShopDraft>(() => ({ ...EMPTY_SHOP_DRAFT, handoverItems: [] }));
  const [shopDraftOwnerId, setShopDraftOwnerId] = useState<number | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopLoadError, setShopLoadError] = useState<string | null>(null);
  const shopRequestId = useRef(0);
  const [retirementDate, setRetirementDate] = useState<string | null>(null);
  const [shopPhotos, setShopPhotos] = useState<File[]>([]);
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<YouthCandidate | null>(null);

  const rememberDemoAccount = useCallback((account: Me) => {
    if (!import.meta.env.DEV || !account.role) return;
    const role: Role = account.role === 'OWNER' ? 'owner' : 'successor';
    setDemoNames((previous) => {
      const next = { ...previous, [role]: account.name };
      try { sessionStorage.setItem(DEMO_NAMES_KEY, JSON.stringify(next)); } catch { /* 현재 화면에서만 유지한다. */ }
      return next;
    });
  }, []);
  const beginDemoMode = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setIsDemoMode(true);
    try { sessionStorage.setItem(DEMO_MODE_KEY, 'true'); } catch { /* 새로고침 전까지 유지한다. */ }
  }, []);
  const endDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoNames({ owner: '김순자', successor: '이도윤' });
    try {
      sessionStorage.removeItem(DEMO_MODE_KEY);
      sessionStorage.removeItem(DEMO_NAMES_KEY);
    } catch { /* 저장되지 않은 개발용 설정은 무시한다. */ }
  }, []);

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
      shopRequestId.current += 1;
      setShopLoading(false);
      setShopLoadError(null);
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
    if (!readToken() || window.location.pathname === '/oauth/callback') return;
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
  const login = useCallback(async (name: string, role: ServerRole, expectedId?: number) => {
    if (!import.meta.env.DEV || !isDemoMode) throw new Error('개발용 확인 화면에서 다시 시작해 주세요.');
    const next = await api.login(name, role, expectedId);
    applyMe(next);
    rememberDemoAccount(next);
    await loadSavedAge(next);
    return next;
  }, [applyMe, loadSavedAge, isDemoMode, rememberDemoAccount]);
  const signInWithToken = useCallback(async (token: string) => {
    const next = await api.loginWithToken(token);
    endDemoMode();
    applyMe(next);
    await loadSavedAge(next);
    return next;
  }, [applyMe, loadSavedAge, endDemoMode]);
  const chooseRole = useCallback(async (role: ServerRole) => {
    const next = await api.setRole(role);
    applyMe(next);
    return next;
  }, [applyMe]);
  const logout = useCallback(async () => {
    await api.logout();
    endDemoMode();
    const id = meRef.current?.id;
    if (id != null) {
      try { sessionStorage.removeItem(supplementKey(id)); } catch { /* 저장되지 않은 보조 정보는 무시한다. */ }
    }
    meRef.current = null;
    setMe(null);
    const empty = blankInfo();
    personalInfoRef.current = empty;
    updatePersonalInfo(empty);
    setPendingRole('successor');
    setCompleted({ owner: false, successor: false });
    setYouthDraft({ ...EMPTY_YOUTH_PROFILE, preferredCategories: [], preferredDistricts: [] });
    setYouthDraftText({ funds: '', loan: '' });
    setShopDraft({ ...EMPTY_SHOP_DRAFT, handoverItems: [] });
    setShopDraftOwnerId(null);
    shopRequestId.current += 1;
    setShopLoading(false);
    setShopLoadError(null);
    setRetirementDate(null);
    setShopPhotos([]);
    setOfferMessage('');
    setSelectedYouth(null);
  }, [endDemoMode]);
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
  const reloadShop = useCallback(async () => {
    const account = meRef.current;
    if (!account || account.role !== 'OWNER') return;
    const id = ++shopRequestId.current;
    const token = readToken();
    setShopLoading(true);
    setShopLoadError(null);
    try {
      const shop = account.hasShop ? await api.shop() : null;
      if (id !== shopRequestId.current || readToken() !== token || meRef.current?.id !== account.id) return;
      setShopDraft(shop ? fromShopResponse(shop) : { ...EMPTY_SHOP_DRAFT, handoverItems: [] });
      setRetirementDate(shop?.retireDate ?? null);
      setShopDraftOwnerId(account.id);
    } catch (cause) {
      if (id === shopRequestId.current && readToken() === token && meRef.current?.id === account.id) {
        setShopLoadError(cause instanceof Error ? cause.message : '가게 정보를 불러오지 못했어요. 다시 시도해 주세요.');
      }
    } finally {
      if (id === shopRequestId.current) setShopLoading(false);
    }
  }, []);
  if (!ready) return <div className="app"><p role="status" style={{ padding: 24 }}>내 정보를 불러오고 있어요.</p></div>;
  const role: Role | null = me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null;
  const basicReady = hasRequiredPersonalInfo(personalInfo, role);
  const onboardingComplete = {
    owner: Boolean(basicReady && me?.role === 'OWNER' && (completed.owner || me.hasShop)),
    successor: Boolean(basicReady && me?.role === 'YOUTH' && (completed.successor || me.hasYouthProfile)),
  };
  const value: AppState = {
    me, role, isDemoMode, beginDemoMode, demoNames, pendingRole, setPendingRole, personalInfo, setPersonalInfo, onboardingComplete, completeOnboarding,
    youthDraft, setYouthDraft, youthDraftText, setYouthDraftText,
    login, signInWithToken, chooseRole, logout, refreshMe, shopLoading, shopLoadError, reloadShop,
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
export function useShopDraftLoader() {
  const { me, shopDraftOwnerId, shopLoading, shopLoadError, reloadShop } = useApp();
  useEffect(() => {
    if (me?.role === 'OWNER' && shopDraftOwnerId !== me.id && !shopLoading && !shopLoadError) void reloadShop();
  }, [me?.id, me?.role, shopDraftOwnerId, shopLoading, shopLoadError, reloadShop]);
}
