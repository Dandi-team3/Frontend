import { createContext, useContext, useState, type ReactNode } from 'react';
import { CANDIDATES } from '../data/demo';
import { todayISO } from '../lib/dates';
import { buildShopDetails, DEMO_SHOP, EMPTY_SHOP_DRAFT, type ShopDetails, type ShopDraft } from '../lib/shop';

export type YouthProfile = {
  experience: string;
  funds: string;
  loanPlan: string;
  industries: string[];
  regions: string[];
};

type Role = 'owner' | 'successor';
type OfferStatus = 'idle' | 'sent' | 'accepted' | 'rejected';
type DemoState = {
  role: Role;
  setRole: (value: Role) => void;
  retirementDate: string | null;
  setRetirementDate: (value: string | null) => void;
  successionRetirementDate: string | null;
  shopDraft: ShopDraft;
  setShopDraft: (value: ShopDraft) => void;
  shop: ShopDetails;
  offerShop: ShopDetails;
  shopPhoto: File | null;
  setShopPhoto: (value: File | null) => void;
  offerMessage: string;
  setOfferMessage: (value: string) => void;
  youthProfile: YouthProfile;
  setYouthProfile: (value: YouthProfile) => void;
  selectedCandidateId: string;
  setSelectedCandidateId: (value: string) => void;
  offerStatus: OfferStatus;
  setOfferStatus: (value: OfferStatus) => void;
  acceptedDate: string;
  requestedRetirementDate: string | null;
  setRequestedRetirementDate: (value: string | null) => void;
};

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('successor');
  const [retirementDate, setRetirementDate] = useState<string | null>('2027-08-31');
  const [shopDraft, setShopDraft] = useState<ShopDraft>(() => ({ ...EMPTY_SHOP_DRAFT, handoverItems: [] }));
  const [offerSnapshot, setOfferSnapshot] = useState<ShopDetails | null>(null);
  const [successionShop, setSuccessionShop] = useState<ShopDetails | null>(null);
  const [shopPhoto, setShopPhoto] = useState<File | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [youthProfile, setYouthProfile] = useState<YouthProfile>({ experience: '1~3년', funds: '3000', loanPlan: 'loan', industries: ['한식'], regions: ['중구', '남구'] });
  const [selectedCandidateId, setCandidateId] = useState(CANDIDATES[0].id);
  const [offerStatus, updateOfferStatus] = useState<OfferStatus>('idle');
  const [acceptedDate, setAcceptedDate] = useState(todayISO);
  const [requestedRetirementDate, setRequestedRetirementDate] = useState<string | null>(null);
  const shop = buildShopDetails(shopDraft, retirementDate);
  const offerShop = (offerStatus === 'accepted' ? successionShop : offerSnapshot) ?? (role === 'owner' ? shop : DEMO_SHOP);
  const successionRetirementDate = successionShop?.retireDate ?? null;

  const setSelectedCandidateId = (value: string) => {
    if (offerStatus === 'accepted') return;
    if (value !== selectedCandidateId) {
      updateOfferStatus('idle');
      setOfferSnapshot(null);
      setRequestedRetirementDate(null);
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

  return (
    <DemoContext.Provider value={{ role, setRole, retirementDate, setRetirementDate, successionRetirementDate, shopDraft, setShopDraft, shop, offerShop, shopPhoto, setShopPhoto, offerMessage, setOfferMessage, youthProfile, setYouthProfile, selectedCandidateId, setSelectedCandidateId, offerStatus, setOfferStatus, acceptedDate, requestedRetirementDate, setRequestedRetirementDate }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
}
