export type Candidate = {
  id: string;
  name: string;
  age: number;
  career: string;
  score: number;
  metrics: { label: string; value: number; level: string }[];
  reasons: string[];
  caution?: string;
  summary: string;
  profile: { label: string; value: string }[];
};

export const CANDIDATES: Candidate[] = [
  {
    id: 'doyoon', name: '이도윤', age: 29, career: '한식 주방 2년', score: 92,
    metrics: [{ label: '경력', value: 90, level: '높음' }, { label: '자금', value: 60, level: '보통' }, { label: '조건', value: 92, level: '높음' }],
    reasons: ['면 요리를 배우고 싶어 해요', '새벽 5시 근무가 가능해요', '중구에서 가게를 찾고 있어요'],
    caution: '대출 계획이 있어 인수 자금 준비 상황을 함께 확인해 주세요',
    summary: '면 요리와 중구의 오래된 가게에 관심이 많아요',
    profile: [
      { label: '경력 상세', value: '한식 주방 2년' },
      { label: '준비 자금', value: '3,000만 원' },
      { label: '대출 계획', value: '1,800만 원 검토 중' },
      { label: '희망 업종', value: '한식' },
      { label: '희망 지역', value: '중구 · 남구' },
      { label: '근무 조건', value: '새벽 근무 가능' },
    ],
  },
  {
    id: 'seoyeon', name: '박서연', age: 33, career: '분식집 운영 4년', score: 84,
    metrics: [{ label: '경력', value: 95, level: '높음' }, { label: '자금', value: 100, level: '높음' }, { label: '조건', value: 55, level: '보통' }],
    reasons: ['분식집을 4년 동안 운영했어요', '인수 자금을 준비해 두었어요'],
    caution: '희망 지역이 수성구라 중구 근무가 가능한지 확인해 주세요',
    summary: '자금은 충분하지만 희망 지역이 수성구예요',
    profile: [
      { label: '경력 상세', value: '분식집 운영 4년' },
      { label: '준비 자금', value: '5,000만 원' },
      { label: '대출 계획', value: '대출 없음' },
      { label: '희망 업종', value: '한식' },
      { label: '희망 지역', value: '수성구' },
      { label: '근무 조건', value: '새벽 근무 가능' },
    ],
  },
  {
    id: 'minjae', name: '최민재', age: 26, career: '경력 1년 미만', score: 71,
    metrics: [{ label: '경력', value: 40, level: '보통' }, { label: '자금', value: 50, level: '보통' }, { label: '조건', value: 85, level: '높음' }],
    reasons: ['홀·주방 보조 경험이 있어요', '한식 가게 운영을 배우고 싶어 해요', '중구에서 가게를 찾고 있어요'],
    caution: '주방 경험이 8개월이며, 인수 자금은 검토 중인 대출을 포함해 확인이 필요해요',
    summary: '요식업을 배우며 오래 함께할 가게를 찾고 있어요',
    profile: [
      { label: '경력 상세', value: '홀·주방 보조 8개월' },
      { label: '준비 자금', value: '1,500만 원' },
      { label: '대출 계획', value: '2,000만 원 검토 중' },
      { label: '희망 업종', value: '한식 · 카페' },
      { label: '희망 지역', value: '중구' },
      { label: '근무 조건', value: '새벽 근무 어려움' },
    ],
  },
];

type ChecklistContext = { youthName: string; price: string; months: number };

// 백엔드 ChecklistItem.defaults와 같은 내용. 연동 시 checklist 응답으로 바꾼다.
export const CHECKLIST_ITEMS: { id: string; title: string; description: (context: ChecklistContext) => string }[] = [
  { id: 'LANDLORD', title: '건물주 동의', description: ({ youthName }) => `임대차 계약을 ${youthName} 님 이름으로 넘겨도 되는지 건물주에게 확인해요` },
  { id: 'DEBT', title: '채무와 미납금', description: () => '가게 대출, 밀린 세금·공과금이 없는지 확인해요' },
  { id: 'FUNDS', title: '인수 자금', description: ({ price }) => `인수 금액 ${price}을 어떻게 마련할지 확인해요` },
  { id: 'LABOR', title: '수습 근로계약', description: ({ months }) => `수습 ${months}개월 동안의 근무 시간과 급여를 정해요` },
  { id: 'STAFF', title: '직원 고용 승계', description: () => '지금 일하는 직원이 계속 일할지 정해요' },
  { id: 'LICENSE', title: '영업 신고 명의 변경', description: () => '영업 신고와 사업자 등록을 바꾸는 날짜를 정해요' },
];

export const SHOP = {
  name: '남문 손칼국수', owner: '김순자', since: '1987년부터', category: '칼국수', location: '중구 남산동',
  amount: 4800, included: '권리금 · 주방 설비 · 레시피', trainingMonths: 6,
  workHours: '새벽 5시 ~ 오후 3시', message: '국물 맛만 지켜 주면 다 넘겨줄게요.\n단골들 얼굴부터 익혀요.',
};
