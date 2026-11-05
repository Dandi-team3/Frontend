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

export const SHOP = {
  name: '남문 손칼국수', owner: '김순자', since: '1987년부터', category: '칼국수', location: '중구 남산동',
  amount: 4800, included: '권리금 · 주방 설비 · 레시피', trainingMonths: 6,
  workHours: '새벽 5시 ~ 오후 3시', message: '국물 맛만 지켜 주면 다 넘겨줄게요.\n단골들 얼굴부터 익혀요.',
};
