import type { ShopRequest, ShopResponse } from './api';
import { addDays, addMonths, todayISO } from './dates';

export const SHOP_CATEGORIES = ['한식', '양식', '중식', '일식', '카페'];
export const HANDOVER_ITEMS = ['권리금', '주방 설비', '레시피', '상호·간판', '거래처·단골', '운영 노하우'];

const ITEM_SEPARATOR = ' · ';

export type ShopDraft = {
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
  // 화면에 없는 값도 수정 때 지워지지 않게 유지한다.
  monthlySales: number | null;
  message: string | null;
};

export const EMPTY_SHOP_DRAFT: ShopDraft = {
  name: '', category: '', mainMenu: '', district: '', address: '', openedYear: '',
  askingPrice: '', handoverItems: [], otherHandoverItems: '', apprenticeMonths: 6,
  workStart: '05:00', workEnd: '15:00', earlyMorning: true, monthlySales: null, message: null,
};

export function formatWon(manwon: number) {
  return `${manwon.toLocaleString('ko-KR')}만 원`;
}

export function earliestRetirementDate(apprenticeMonths: number, from = todayISO()) {
  return addDays(addMonths(from, apprenticeMonths + 2), 24);
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
  return `${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}시${minutes ? ` ${minutes}분` : ''}`;
}

/** 저장된 근무 시간 글자에서 시간을 읽는다. 읽을 수 없으면 null이다. */
function parseTime(value: string) {
  const match = value.match(/(새벽|오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (!match) return null;
  const hour = Number(match[2]) % 12 + (match[1] === '오후' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${String(Number(match[3] ?? 0)).padStart(2, '0')}`;
}

export function toShopRequest(draft: ShopDraft, retireDate: string): ShopRequest {
  const start = formatTime(draft.workStart);
  const end = formatTime(draft.workEnd);
  return {
    name: draft.name.trim(),
    category: draft.category,
    mainMenu: draft.mainMenu.trim() || null,
    district: draft.district.trim(),
    address: draft.address.trim() || null,
    openedYear: draft.openedYear ? Number(draft.openedYear) : null,
    monthlySales: draft.monthlySales,
    askingPrice: Number(draft.askingPrice),
    handoverItems: [...draft.handoverItems, draft.otherHandoverItems.trim()].filter(Boolean).join(ITEM_SEPARATOR) || null,
    retireDate,
    apprenticeMonths: draft.apprenticeMonths,
    workHours: start && end ? `${start} ~ ${draft.workEnd < draft.workStart ? '다음 날 ' : ''}${end}` : null,
    earlyMorning: draft.earlyMorning,
    message: draft.message,
  };
}

export function fromShopResponse(shop: ShopResponse): ShopDraft {
  const items = (shop.handoverItems ?? '').split(/\s*·\s*/).filter(Boolean);
  const [start, end] = (shop.workHours ?? '').split('~').map(parseTime);
  return {
    name: shop.name,
    category: shop.category,
    mainMenu: shop.mainMenu ?? '',
    district: shop.district,
    address: shop.address ?? '',
    openedYear: shop.openedYear ? String(shop.openedYear) : '',
    askingPrice: shop.askingPrice ? String(shop.askingPrice) : '',
    handoverItems: items.filter((item) => HANDOVER_ITEMS.includes(item)),
    otherHandoverItems: items.filter((item) => !HANDOVER_ITEMS.includes(item)).join(ITEM_SEPARATOR),
    apprenticeMonths: shop.apprenticeMonths,
    workStart: start ?? EMPTY_SHOP_DRAFT.workStart,
    workEnd: end ?? EMPTY_SHOP_DRAFT.workEnd,
    earlyMorning: shop.earlyMorning,
    monthlySales: shop.monthlySales,
    message: shop.message,
  };
}
