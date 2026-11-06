// 백엔드 PlanTemplate·RoadmapFactory·PaymentFactory·SuccessionService와 같은 규칙. 연동 시 API 응답으로 바꾼다.
import { addDays, addMonths, buildSchedule, formatKoreanDate } from './dates';
import type { ShopDetails } from './shop';

export type SuccessionStatus = 'CHECKLIST' | 'PLANNING' | 'APPRENTICE' | 'HANDOVER' | 'COMPLETED';

export const STATUS_LABELS: Record<SuccessionStatus, string> = {
  CHECKLIST: '체크리스트 확인',
  PLANNING: '승계 계획 동의',
  APPRENTICE: '수습',
  HANDOVER: '운영권 넘겨받기',
  COMPLETED: '승계 완료',
};

export type PlanSection = { code: string; title: string; content: string };

export type TaskStatus = 'TODO' | 'REQUESTED' | 'APPROVED';
export type StageState = 'DONE' | 'NOW' | 'LOCKED';
export type RoadmapTask = { id: string; title: string; status: TaskStatus; feedback: string | null };
export type RoadmapStage = { seq: number; title: string; description: string; startDate: string; endDate: string; state: StageState; approvedCount: number; tasks: RoadmapTask[] };

export type PaymentStatus = 'SCHEDULED' | 'REPORTED' | 'CONFIRMED';
export type Installment = { seq: number; label: string; amount: number; dueDate: string; status: PaymentStatus; paidDate: string | null; memo: string | null; overdue: boolean };

export function formatWon(manwon: number) {
  return `${manwon.toLocaleString('ko-KR')}만 원`;
}

function hasBatchim(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

const eulReul = (word: string) => `${word}${hasBatchim(word) ? '을' : '를'}`;
const waGwa = (word: string) => `${word}${hasBatchim(word) ? '과' : '와'}`;

export function buildInstallmentPlans(shop: ShopDetails) {
  const price = shop.amount ?? 0;
  const schedule = buildSchedule(shop.retireDate!, shop.trainingMonths);
  const deposit = Math.round(price * 0.1);
  const interim = Math.round(price * 0.3);
  return [
    { seq: 1, label: '계약금', amount: deposit, dueDate: schedule.planDue },
    { seq: 2, label: '중도금 1차', amount: interim, dueDate: buildStagePeriods(schedule.trainingStart, shop.trainingMonths)[1].startDate },
    { seq: 3, label: '중도금 2차', amount: interim, dueDate: schedule.trainingEnd },
    { seq: 4, label: '잔금', amount: price - deposit - interim * 2, dueDate: shop.retireDate! },
  ];
}

export function buildPlanSections(shop: ShopDetails, youthName: string): PlanSection[] {
  const schedule = buildSchedule(shop.retireDate!, shop.trainingMonths);
  const owner = `${shop.owner} 사장님`.trim();
  const youth = `${youthName} 님`;
  const items = shop.includedItems.length ? shop.includedItems.join(', ') : '가게 운영에 필요한 것';
  const menu = shop.mainMenu || '대표 메뉴';
  const pay = buildInstallmentPlans(shop);
  return [
    { code: 'ACQUISITION', title: '인수 조건', content: `${eulReul(items)} ${formatWon(shop.amount ?? 0)}에 넘겨받아요. 계약금 ${formatWon(pay[0].amount)}은 ${formatKoreanDate(schedule.planDue)}까지, 중도금 ${formatWon(pay[1].amount)}씩 두 번과 잔금 ${formatWon(pay[3].amount)}은 일정에 맞춰 나눠 내요.` },
    { code: 'APPRENTICE', title: '수습 계획', content: `${formatKoreanDate(schedule.trainingStart)}부터 ${shop.trainingMonths}개월 동안 3단계로 배워요. 근무 시간은 ${shop.workHours}${hasBatchim(shop.workHours) ? '이에요' : '예요'}. 단계를 마치면 ${youth}이 완료를 요청하고 ${owner}이 승인해요.` },
    { code: 'HANDOVER', title: '운영권 넘기기', content: `${formatKoreanDate(schedule.handoverStart)}부터 ${youth}이 가게를 운영하고, ${owner}은 ${formatKoreanDate(shop.retireDate!)}까지 곁에서 도와요. 잔금을 내면 승계가 끝나요.` },
    { code: 'RECIPE', title: '레시피와 단골', content: `${menu} 레시피와 단골 손님 관계를 수습 기간에 함께 넘겨요. ${owner}이 단골 손님에게 2대 사장님을 직접 소개해요.` },
    { code: 'EXIT', title: '그만두게 되면', content: '수습 중 한쪽이 그만두면 계약금을 뺀 납입 금액을 2주 안에 돌려줘요. 자세한 조건은 실제 계약서에서 정해요.' },
  ];
}

function buildStagePeriods(trainingStart: string, months: number) {
  let start = trainingStart;
  return [0, 1, 2].map((index) => {
    const next = addMonths(start, Math.floor(months / 3) + (index < months % 3 ? 1 : 0));
    const period = { startDate: start, endDate: addDays(next, -1) };
    start = next;
    return period;
  });
}

export function buildRoadmapStages(shop: ShopDetails) {
  const schedule = buildSchedule(shop.retireDate!, shop.trainingMonths);
  const periods = buildStagePeriods(schedule.trainingStart, shop.trainingMonths);
  const menu = shop.mainMenu || '대표 메뉴';
  return [
    { seq: 1, title: '주방 익히기', description: '재료 손질, 주방 동선, 거래처와 단골 익히기', ...periods[0], tasks: ['재료 손질과 주방 동선 익히기', '거래처에 인사드리기', '단골 손님 얼굴과 이름 익히기'] },
    { seq: 2, title: '혼자 만들기', description: `${waGwa(menu)} 밑재료를 혼자 만들기`, ...periods[1], tasks: [`${menu} 혼자 만들기`, '밑재료 혼자 준비하기', '점심 장사 혼자 보기'] },
    { seq: 3, title: '가게 운영', description: '장부, 거래처 주문, 하루 운영 맡기', ...periods[2], tasks: ['사장님과 장부·정산 같이 보기', '거래처 주문 혼자 하기', '하루 운영 혼자 맡기'] },
  ];
}
