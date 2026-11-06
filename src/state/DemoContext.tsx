import { createContext, useContext, useState, type ReactNode } from 'react';
import { CANDIDATES, CHECKLIST_ITEMS } from '../data/demo';
import { todayISO } from '../lib/dates';
import { buildShopDetails, DEMO_SHOP, EMPTY_SHOP_DRAFT, SHOP_CATEGORIES, type ShopDetails, type ShopDraft } from '../lib/shop';

export type YouthProfile = {
  experience: string;
  funds: string;
  loanPlan: string;
  industries: string[];
  regions: string[];
};

export type Role = 'owner' | 'successor';
export type PersonalInfo = { name: string; age: string; phone: string; email: string };
export function hasRequiredPersonalInfo(info: PersonalInfo) {
  const age = Number(info.age);
  return Boolean(info.name.trim() && /^\d+$/.test(info.age)
    && Number.isInteger(age) && age >= 15 && age <= 100);
}
type OfferStatus = 'idle' | 'sent' | 'accepted' | 'rejected';
type DemoState = {
  role: Role;
  setRole: (value: Role) => void;
  personalInfo: PersonalInfo;
  setPersonalInfo: (value: PersonalInfo) => void;
  onboardingComplete: Record<Role, boolean>;
  completeOnboarding: (role: Role) => boolean;
  retirementDate: string | null;
  setRetirementDate: (value: string | null) => void;
  successionRetirementDate: string | null;
  shopDraft: ShopDraft;
  setShopDraft: (value: ShopDraft) => void;
  shop: ShopDetails;
  offerShop: ShopDetails;
  shopPhotos: File[];
  setShopPhotos: (value: File[]) => void;
  offerMessage: string;
  setOfferMessage: (value: string) => void;
  youthProfile: YouthProfile;
  setYouthProfile: (value: YouthProfile) => void;
  selectedCandidateId: string;
  setSelectedCandidateId: (value: string) => void;
  offerStatus: OfferStatus;
  setOfferStatus: (value: OfferStatus) => void;
  acceptedDate: string;
  checklistConfirms: Record<Role, string[]>;
  toggleChecklistItem: (id: string) => void;
  confirmChecklistAsOther: () => void;
  checklistDone: boolean;
};

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('successor');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ name: '', age: '', phone: '', email: '' });
  const [onboardingComplete, setOnboardingComplete] = useState<Record<Role, boolean>>({ owner: false, successor: false });
  const [retirementDate, setRetirementDate] = useState<string | null>('2027-08-31');
  const [shopDraft, setShopDraft] = useState<ShopDraft>(() => ({ ...EMPTY_SHOP_DRAFT, handoverItems: [] }));
  const [offerSnapshot, setOfferSnapshot] = useState<ShopDetails | null>(null);
  const [successionShop, setSuccessionShop] = useState<ShopDetails | null>(null);
  const [shopPhotos, setShopPhotos] = useState<File[]>([]);
  const [offerMessage, setOfferMessage] = useState('');
  const [youthProfile, setYouthProfile] = useState<YouthProfile>({ experience: '', funds: '', loanPlan: '', industries: [], regions: [] });
  const [selectedCandidateId, setCandidateId] = useState(CANDIDATES[0].id);
  const [offerStatus, updateOfferStatus] = useState<OfferStatus>('idle');
  const [acceptedDate, setAcceptedDate] = useState(todayISO);
  const [checklistConfirms, setChecklistConfirms] = useState<Record<Role, string[]>>({ owner: [], successor: [] });
  const checklistDone = CHECKLIST_ITEMS.every(({ id }) => checklistConfirms.owner.includes(id) && checklistConfirms.successor.includes(id));
  const shop = buildShopDetails(shopDraft, retirementDate);
  const offerShop = (offerStatus === 'accepted' ? successionShop : offerSnapshot) ?? (role === 'owner' ? shop : DEMO_SHOP);
  const successionRetirementDate = successionShop?.retireDate ?? null;

  const completeOnboarding = (targetRole: Role) => {
    const basicInfoReady = hasRequiredPersonalInfo(personalInfo);
    const roleInfoReady = targetRole === 'owner'
      ? Boolean(shopDraft.ownerName.trim() && shopDraft.name.trim() && SHOP_CATEGORIES.includes(shopDraft.category)
        && shopDraft.district.trim() && /^\d+$/.test(shopDraft.askingPrice)
        && Number.isSafeInteger(Number(shopDraft.askingPrice)) && Number(shopDraft.askingPrice) > 0
        && Number(shopDraft.askingPrice) <= 2_147_483_647)
      : Boolean(youthProfile.experience && /^\d+$/.test(youthProfile.funds)
        && Number.isSafeInteger(Number(youthProfile.funds)) && Number(youthProfile.funds) >= 0
        && youthProfile.loanPlan && youthProfile.industries.length && youthProfile.regions.length);
    if (!basicInfoReady || !roleInfoReady) return false;
    setOnboardingComplete((previous) => ({ ...previous, [targetRole]: true }));
    return true;
  };

  const setSelectedCandidateId = (value: string) => {
    if (offerStatus === 'accepted') return;
    if (value !== selectedCandidateId) {
      updateOfferStatus('idle');
      setOfferSnapshot(null);
    }
    setCandidateId(value);
  };

  const setOfferStatus = (value: OfferStatus) => {
    if (value === 'sent') setOfferSnapshot(shop);
    if (value === 'accepted') {
      if (offerShop.retireDate === null || offerStatus === 'accepted') return;
      setAcceptedDate(todayISO());
      setSuccessionShop({ ...offerShop, includedItems: [...offerShop.includedItems] });
    }
    updateOfferStatus(value);
  };

  const toggleChecklistItem = (id: string) => {
    const mine = checklistConfirms[role];
    setChecklistConfirms({ ...checklistConfirms, [role]: mine.includes(id) ? mine.filter((item) => item !== id) : [...mine, id] });
  };

  // 서버 연동 전까지 상대방의 확인을 대신하는 예시 동작.
  const confirmChecklistAsOther = () => {
    const other: Role = role === 'owner' ? 'successor' : 'owner';
    setChecklistConfirms({ ...checklistConfirms, [other]: CHECKLIST_ITEMS.map(({ id }) => id) });
  };

  return (
    <DemoContext.Provider value={{ checklistConfirms, toggleChecklistItem, confirmChecklistAsOther, checklistDone, role, setRole, personalInfo, setPersonalInfo, onboardingComplete, completeOnboarding, retirementDate, setRetirementDate, successionRetirementDate, shopDraft, setShopDraft, shop, offerShop, shopPhotos, setShopPhotos, offerMessage, setOfferMessage, youthProfile, setYouthProfile, selectedCandidateId, setSelectedCandidateId, offerStatus, setOfferStatus, acceptedDate }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
}
