import { addDays, todayISO } from '../lib/dates';

export type ShopDetails = {
  name: string; owner: string; category: string; mainMenu: string; district: string;
  address: string; openedYear: string; amount: number | null; includedItems: string[];
  included: string; trainingMonths: number; workHours: string; earlyMorning: boolean; retireDate: string | null;
};

// 둘러보기용 자료는 실제 등록·제안 API 데이터와 분리한다.
const CATALOG_SHOP: ShopDetails = {
  name: '남문 손칼국수', owner: '김순자', category: '한식', mainMenu: '칼국수', district: '중구',
  address: '남산동', openedYear: '1987', amount: 4800, includedItems: ['권리금', '주방 설비', '레시피'],
  included: '권리금 · 주방 설비 · 레시피', trainingMonths: 6, workHours: '오전 5시 ~ 오후 3시',
  earlyMorning: true, retireDate: null,
};

export type ListedShop = {
  id: string;
  image: { src: string; alt: string; position?: string };
  details: ShopDetails;
  story: string;
  highlights: string[];
  menus: { name: string; price: number }[];
  tags: string[];
  matchReasons: string[];
  matchScore: number;
};

const retireDate = addDays(todayISO(), 365);

export const SHOPS: ListedShop[] = [
  {
    id: 'nammun', details: { ...CATALOG_SHOP, retireDate },
    image: { src: '/images/shops/vintage-dining-room.jpg', alt: '큰 창과 테이블이 있는 오래된 식당 내부', position: 'center 58%' },
    story: '1987년부터 남산동 골목을 지켜 온 손칼국수 가게예요. 매일 아침 직접 반죽하고 끓인 국물로 이웃들의 한 끼를 챙겨 왔어요. 오랜 단골들과 다음 이야기를 이어갈 분을 기다려요.',
    highlights: ['직접 반죽하는 손칼국수', '골목에서 오래 만난 단골들', '사장님과 함께 배우는 6개월'],
    menus: [{ name: '손칼국수', price: 8000 }, { name: '잔치국수', price: 7000 }],
    tags: ['한식', '손칼국수', '중구'], matchReasons: ['면 요리와 가게 운영을 함께 배울 수 있어요', '대구 중구에서 이어갈 가게를 찾는 분께 맞아요'], matchScore: 92,
  },
  {
    id: 'dalseong-bap',
    image: { src: '/images/shops/restaurant-interior.jpg', alt: '클래식한 장식과 바가 있는 식당 내부', position: 'center 55%' },
    details: { ...CATALOG_SHOP, name: '달성 밥상', owner: '이정희', category: '한식', mainMenu: '가정식 백반', district: '남구', address: '대명동', openedYear: '1994', amount: 3500, includedItems: ['주방 설비', '레시피', '가게 이름·간판'], included: '주방 설비 · 레시피 · 가게 이름·간판', workHours: '오전 9시 ~ 오후 6시', earlyMorning: false, trainingMonths: 4, retireDate },
    story: '직장인과 동네 주민들이 점심마다 찾아온 작은 백반집이에요. 제철 재료로 매일 다른 반찬을 내고, 손님 한 분 한 분의 입맛을 기억하며 가게를 지켜 왔어요.',
    highlights: ['제철 반찬으로 차리는 백반', '꾸준히 찾아오는 점심 손님', '오전 9시부터 시작하는 하루'],
    menus: [{ name: '오늘의 백반', price: 9000 }, { name: '제육 한 상', price: 11000 }],
    tags: ['한식', '백반', '남구'], matchReasons: ['낮 시간에 운영하는 한식 가게예요', '백반 조리와 단골 응대를 함께 배워요'], matchScore: 86,
  },
  {
    id: 'suseong-coffee',
    image: { src: '/images/shops/cafe-interior.jpg', alt: '나무 테이블과 메뉴판이 있는 카페 내부', position: 'center 48%' },
    details: { ...CATALOG_SHOP, name: '수성 골목다방', owner: '박영수', category: '카페', mainMenu: '드립커피', district: '수성구', address: '범어동', openedYear: '2001', amount: 2800, includedItems: ['주방 설비', '운영 노하우'], included: '주방 설비 · 운영 노하우', workHours: '오전 10시 ~ 오후 7시', earlyMorning: false, trainingMonths: 3, retireDate },
    story: '동네 사람들의 이야기가 쌓인 작은 다방이에요. 천천히 내리는 커피와 조용한 자리가 오래 사랑받았어요. 익숙한 공간에 새로운 취향을 더해 줄 분과 만나고 싶어요.',
    highlights: ['동네와 함께한 커피 공간', '커피 장비와 운영법 전달', '새로운 메뉴를 더할 여유'],
    menus: [{ name: '드립커피', price: 5000 }, { name: '카페라테', price: 5500 }],
    tags: ['카페', '커피', '수성구'], matchReasons: ['카페 운영을 희망하는 분께 맞아요', '새벽 근무 없이 커피와 운영법을 배울 수 있어요'], matchScore: 81,
  },
];

export function getShopById(id: string) {
  return SHOPS.find((shop) => shop.id === id);
}
