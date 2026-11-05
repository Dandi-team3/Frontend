import { SHOP } from '../data/demo';
import { addDays, addMonths, formatKoreanDate, todayISO } from './dates';

export const SHOP_CATEGORIES = ['한식', '양식', '중식', '일식', '카페'];
export const HANDOVER_ITEMS = ['권리금', '주방 설비', '레시피', '상호·간판', '거래처·단골', '운영 노하우'];

export type ShopDraft = {
  ownerName: string;
  name: string;
  category: string;
  mainMenu: string;
  district: string;
  address: string;
  openedYear: string;
  askingPrice: string;
  handoverItems: string[];
  otherHandoverItems: string;
  apprenticeMonths: number;
  workStart: string;
  workEnd: string;
  earlyMorning: boolean;
};

export type ShopDetails = {
  name: string;
  owner: string;
  category: string;
  mainMenu: string;
  district: string;
  address: string;
  openedYear: string;
  amount: number | null;
  includedItems: string[];
  included: string;
  trainingMonths: number;
  workHours: string;
  earlyMorning: boolean;
  retireDate: string | null;
};

export const EMPTY_SHOP_DRAFT: ShopDraft = {
  ownerName: '', name: '', category: '', mainMenu: '', district: '', address: '', openedYear: '',
  askingPrice: '', handoverItems: [], otherHandoverItems: '', apprenticeMonths: 6,
  workStart: '05:00', workEnd: '15:00', earlyMorning: true,
};

export type ShopValidationIssue = { message: string; to: string };

export function earliestRetirementDate(apprenticeMonths: number, from = todayISO()) {
  return addDays(addMonths(from, apprenticeMonths + 2), 24);
}

export function validateShopDraft(draft: ShopDraft, retireDate: string | null): ShopValidationIssue | null {
  if (!draft.ownerName.trim() || !draft.name.trim() || !draft.district.trim() || !SHOP_CATEGORIES.includes(draft.category)) {
    return { message: '사장님 이름과 가게 이름, 업종, 지역을 먼저 입력해 주세요.', to: '/owner/shop' };
  }
  if (draft.openedYear && (!/^\d{4}$/.test(draft.openedYear) || Number(draft.openedYear) < 1900 || Number(draft.openedYear) > 2100)) {
    return { message: '개업 연도를 1900년부터 2100년 사이로 입력해 주세요.', to: '/owner/shop' };
  }
  const price = Number(draft.askingPrice);
  if (!/^\d+$/.test(draft.askingPrice) || !Number.isInteger(price) || price <= 0 || price > 2_147_483_647) {
    return { message: '희망 인수 금액을 0보다 큰 정수로 입력해 주세요.', to: '/owner/terms' };
  }
  const included = [...draft.handoverItems, draft.otherHandoverItems.trim()].filter(Boolean).join(' · ');
  if (included.length > 200 || !Number.isInteger(draft.apprenticeMonths) || draft.apprenticeMonths < 3 || draft.apprenticeMonths > 12) {
    return { message: '포함 항목은 200자 이하, 수습 기간은 3~12개월로 입력해 주세요.', to: '/owner/terms' };
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(draft.workStart) || !timePattern.test(draft.workEnd) || draft.workStart === draft.workEnd) {
    return { message: '서로 다른 근무 시작 시간과 종료 시간을 입력해 주세요.', to: '/owner/terms' };
  }
  if (!retireDate) return { message: '제안을 보내려면 은퇴 희망일을 먼저 정해 주세요.', to: '/owner/register' };
  const earliest = earliestRetirementDate(draft.apprenticeMonths);
  if (retireDate < earliest) {
    return { message: `수습 ${draft.apprenticeMonths}개월과 준비 기간을 확보하려면 ${formatKoreanDate(earliest)} 이후로 은퇴 희망일을 정해 주세요.`, to: '/owner/register' };
  }
  return null;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
  return `${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}시${minutes ? ` ${minutes}분` : ''}`;
}

export function buildShopDetails(draft: ShopDraft, retireDate: string | null): ShopDetails {
  const includedItems = [...draft.handoverItems, draft.otherHandoverItems.trim()].filter(Boolean);
  const price = Number(draft.askingPrice);
  const start = formatTime(draft.workStart);
  const end = formatTime(draft.workEnd);
  return {
    name: draft.name.trim() || '내 가게',
    owner: draft.ownerName.trim(),
    category: draft.category || '업종 미선택',
    mainMenu: draft.mainMenu.trim(),
    district: draft.district.trim(),
    address: draft.address.trim(),
    openedYear: draft.openedYear,
    amount: Number.isSafeInteger(price) && price > 0 ? price : null,
    includedItems,
    included: includedItems.length ? includedItems.join(' · ') : '선택한 항목 없음',
    trainingMonths: draft.apprenticeMonths,
    workHours: start && end ? `${start} ~ ${draft.workEnd < draft.workStart ? '다음 날 ' : ''}${end}` : '근무 시간 미정',
    earlyMorning: draft.earlyMorning,
    retireDate,
  };
}

// 청년 화면을 직접 열었을 때 확인할 수 있는 받은 제안 예시.
export const DEMO_SHOP: ShopDetails = buildShopDetails({
  ownerName: SHOP.owner, name: SHOP.name, category: '한식', mainMenu: '칼국수', district: '중구', address: '남산동', openedYear: '1987',
  askingPrice: String(SHOP.amount), handoverItems: ['권리금', '주방 설비', '레시피'], otherHandoverItems: '',
  apprenticeMonths: SHOP.trainingMonths, workStart: '05:00', workEnd: '15:00', earlyMorning: true,
}, '2027-08-31');
