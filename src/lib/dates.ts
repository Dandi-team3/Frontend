export function todayISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatKoreanDate(value: string): string {
  const date = parseDate(value);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function addMonths(value: string, months: number): string {
  const date = parseDate(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toISO(date);
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function daysUntil(value: string, from = todayISO()): number {
  const utc = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.max(0, Math.round((utc(value) - utc(from)) / 86_400_000));
}

// 백엔드 TimelinePlanner와 같은 역산. 연동 시 schedule 응답을 사용한다.
export function buildSchedule(retirementDate: string, apprenticeMonths = 6) {
  const handoverStart = addMonths(addDays(retirementDate, 1), -2);
  const trainingEnd = addDays(handoverStart, -1);
  const trainingStart = addMonths(handoverStart, -apprenticeMonths);
  const planDue = addDays(trainingStart, -12);
  return {
    trainingStart,
    trainingEnd,
    checklistDue: addDays(planDue, -5),
    planDue,
    handoverStart,
  };
}
