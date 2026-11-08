export const API_BASE_URL = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
const TOKEN_KEY = 'mullyeobatgi.token';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* 브라우저 저장이 불가능하면 무시한다. */ }
}

function saveToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 저장할 수 없는 환경이면 새로고침 뒤 다시 로그인한다.
  }
}

/** token을 넘기면 저장된 로그인 대신 그 토큰으로 호출한다. */
async function request<T>(path: string, method = 'GET', body?: unknown, token = readToken()): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK', '서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.', 0);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { code?: string; message?: string } | null;
    if (response.status === 401 && token === readToken()) {
      clearToken();
      if (window.location.pathname !== '/') window.location.assign('/');
    }
    throw new ApiError(error?.code ?? String(response.status), error?.message ?? '요청을 처리하지 못했어요.', response.status);
  }
  const text = await response.text();
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; }
  catch { throw new ApiError('INVALID_RESPONSE', '서버 응답을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요.', response.status); }
}

/** 아직 없는 자원(404)은 null로 받는다. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type ServerRole = 'OWNER' | 'YOUTH';

export type Me = {
  id: number;
  name: string;
  role: ServerRole | null;
  hasShop: boolean;
  hasYouthProfile: boolean;
  successionId: number | null;
  successionStatus: string | null;
};

export type ShopRequest = {
  name: string;
  category: string;
  mainMenu: string | null;
  district: string;
  address: string | null;
  openedYear: number | null;
  monthlySales: number | null;
  askingPrice: number;
  handoverItems: string | null;
  retireDate: string;
  apprenticeMonths: number;
  workHours: string | null;
  earlyMorning: boolean;
  message: string | null;
};
export type ShopResponse = ShopRequest & { id: number; ownerId: number; ownerName: string };

export type Experience = 'NONE' | 'UNDER_1Y' | 'ONE_TO_3Y' | 'OVER_3Y';
export type YouthProfileRequest = {
  age: number | null;
  experience: Experience;
  experienceDetail: string | null;
  fundsReady: number;
  loanPlanned: boolean;
  loanAmount: number;
  preferredCategories: string[];
  preferredDistricts: string[];
  earlyMorningOk: boolean;
  intro: string | null;
};
export type YouthProfileResponse = YouthProfileRequest & { id: number; userId: number; name: string; experienceLabel: string };

export type OfferStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'EXPIRED' | 'CLOSED';

export type YouthCandidate = {
  youthId: number;
  name: string;
  age: number | null;
  experienceLabel: string;
  experienceDetail: string | null;
  fundsReady: number;
  score: number;
  breakdown: { name: string; points: number; max: number; level: string }[];
  reasons: { type: 'GOOD' | 'CAUTION'; text: string }[];
  aiComment: string | null;
  offerId: number | null;
  offerStatus: OfferStatus | null;
};

export type ShopCandidate = {
  shopId: number;
  shopName: string;
  ownerName: string;
  category: string;
  mainMenu: string | null;
  district: string;
  openedYear: number | null;
  askingPrice: number;
  retireDate: string;
  score: number;
  breakdown: { name: string; points: number; max: number; level: string }[];
  reasons: { type: 'GOOD' | 'CAUTION'; text: string }[];
};

export type Offer = {
  id: number;
  status: OfferStatus;
  price: number;
  message: string | null;
  matchScore: number | null;
  expiresAt: string;
  createdAt: string;
  shopId: number;
  shopName: string;
  category: string;
  mainMenu: string | null;
  district: string;
  openedYear: number | null;
  handoverItems: string | null;
  retireDate: string;
  apprenticeMonths: number;
  workHours: string | null;
  ownerId: number;
  ownerName: string;
  youthId: number;
  youthName: string;
  successionId: number | null;
};

export type SuccessionStatus = 'CHECKLIST' | 'PLANNING' | 'APPRENTICE' | 'HANDOVER' | 'COMPLETED';
export type ActionType = 'CHECKLIST' | 'PLAN_CREATE' | 'PLAN_AGREE' | 'ROADMAP_APPROVE' | 'ROADMAP_RETRY' | 'PAYMENT_CONFIRM' | 'PAYMENT_DUE' | 'SCHEDULE_CHANGE';

export type SuccessionSummary = {
  id: number;
  status: SuccessionStatus;
  statusLabel: string;
  mySide: ServerRole;
  shopId: number;
  shopName: string;
  ownerId: number;
  ownerName: string;
  youthId: number;
  youthName: string;
  price: number;
  retireDate: string;
  daysLeft: number;
  progressPercent: number;
  checklist: { done: number; total: number };
  planCreated: boolean;
  planAgreedByBoth: boolean;
  roadmap: { done: number; total: number };
  payments: { done: number; total: number };
  nextStep: { title: string; dueDate: string } | null;
  pendingActions: { type: ActionType; title: string; description: string; targetId: number | null }[];
};

export type ChangeRequest = { id: number; requestedBy: ServerRole; newRetireDate: string; reason: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string; mine: boolean };
export type Schedule = {
  retireDate: string;
  daysLeft: number;
  items: { seq: number; code: string; title: string; note: string | null; startDate: string | null; endDate: string; state: 'DONE' | 'NOW' | 'UPCOMING' }[];
  warnings: string[];
  changeRequests: ChangeRequest[];
};

export type ChecklistItem = { id: number; seq: number; code: string; title: string; description: string; ownerConfirmed: boolean; youthConfirmed: boolean; done: boolean; confirmedByMe: boolean; ownerNote?: string | null; youthNote?: string | null; ownerConfirmedAt?: string | null; youthConfirmedAt?: string | null };
export type Checklist = { mySide: ServerRole; doneCount: number; total: number; completed: boolean; items: ChecklistItem[] };

export type PlanSection = { id: number; seq: number; code: string; title: string; content: string; editedBy: ServerRole | null; editedByName: string | null; editedAt?: string | null };
export type Plan = { id: number; version: number; generatedBy: 'AI' | 'TEMPLATE'; mySide: ServerRole; ownerAgreed: boolean; youthAgreed: boolean; agreedByBoth: boolean; ownerAgreedAt?: string | null; youthAgreedAt?: string | null; sections: PlanSection[]; disclaimer: string };

export type RoadmapTask = { id: number; seq: number; title: string; status: 'TODO' | 'REQUESTED' | 'APPROVED'; memo: string | null; feedback: string | null; requestedAt: string | null; decidedAt: string | null };
export type RoadmapStage = { id: number; seq: number; title: string; description: string; startDate: string; endDate: string; state: 'DONE' | 'NOW' | 'LOCKED'; approvedCount: number; tasks: RoadmapTask[] };
export type Roadmap = { currentStage: number | null; approvedCount: number; taskCount: number; waitingApprovalCount: number; stages: RoadmapStage[] };

export type Installment = { id: number; seq: number; label: string; amount: number; dueDate: string; status: 'SCHEDULED' | 'REPORTED' | 'CONFIRMED'; paidDate: string | null; memo: string | null; reportedAt?: string | null; confirmedAt?: string | null; overdue: boolean };
export type Payments = { total: number; confirmedAmount: number; waitingConfirmAmount: number; remainingAmount: number; paidPercent: number; installments: Installment[]; notice: string };

const succession = (id: number) => `/api/successions/${id}`;

export const api = {
  /** 저장된 로그인은 바꾸지 않고 토큰만 받는다. */
  issueToken: (name: string, role: ServerRole) => request<{ token: string; me: Me }>('/api/auth/dev-login', 'POST', { name, role }, null),
  login: async (name: string, role: ServerRole, expectedId?: number) => {
    const { token, me: account } = await api.issueToken(name, role);
    if (expectedId !== undefined && account.id !== expectedId) throw new ApiError('DEMO_ACCOUNT_MISMATCH', '제안을 받은 청년과 이 개발용 계정이 달라요. 받는 분의 계정을 확인해 주세요.', 409);
    const me = account.role === null
      ? await request<Me>('/api/me/role', 'PUT', { role }, token)
      : account;
    if (me.role !== role) throw new ApiError('DEMO_ROLE_MISMATCH', '이 이름으로 선택한 역할에 들어갈 수 없어요. 다른 시연 이름으로 다시 시도해 주세요.', 409);
    saveToken(token);
    return me;
  },
  loginWithToken: async (token: string) => {
    if (!token.trim()) throw new ApiError('OAUTH_TOKEN_MISSING', '카카오 로그인 정보가 없어요. 다시 로그인해 주세요.', 400);
    const me = await request<Me>('/api/me', 'GET', undefined, token);
    saveToken(token);
    return me;
  },
  me: () => request<Me>('/api/me'),
  setRole: (role: ServerRole) => request<Me>('/api/me/role', 'PUT', { role }),
  logout: async () => {
    try { await request<void>('/api/auth/logout', 'POST'); }
    catch (cause) { if (!(cause instanceof ApiError) || cause.status !== 401) throw cause; }
    clearToken();
  },

  shop: () => request<ShopResponse>('/api/owner/shop'),
  saveShop: (body: ShopRequest) => request<ShopResponse>('/api/owner/shop', 'PUT', body),
  youthProfile: () => request<YouthProfileResponse>('/api/youth/profile'),
  saveYouthProfile: (body: YouthProfileRequest) => request<YouthProfileResponse>('/api/youth/profile', 'PUT', body),

  ownerMatches: () => request<YouthCandidate[]>('/api/owner/matches'),
  youthMatches: () => request<ShopCandidate[]>('/api/youth/matches'),
  offers: () => request<Offer[]>('/api/offers'),
  offer: (id: number) => request<Offer>(`/api/offers/${id}`),
  propose: (youthId: number, message: string | null) => request<Offer>('/api/offers', 'POST', { youthId, message }),
  acceptOffer: (id: number, token?: string) => request<Offer>(`/api/offers/${id}/accept`, 'POST', undefined, token),
  rejectOffer: (id: number) => request<Offer>(`/api/offers/${id}/reject`, 'POST'),
  cancelOffer: (id: number) => request<Offer>(`/api/offers/${id}/cancel`, 'POST'),

  currentSuccession: () => request<SuccessionSummary>('/api/successions/current'),

  schedule: (id: number) => request<Schedule>(`${succession(id)}/schedule`),
  requestScheduleChange: (id: number, retireDate: string, reason: string | null) => request<Schedule>(`${succession(id)}/schedule/change-requests`, 'POST', { retireDate, reason }),
  answerScheduleChange: (id: number, requestId: number, answer: 'approve' | 'reject') => request<Schedule>(`${succession(id)}/schedule/change-requests/${requestId}/${answer}`, 'POST'),

  checklist: (id: number) => request<Checklist>(`${succession(id)}/checklist`),
  confirmChecklist: (id: number, itemId: number, note: string | null = null) => request<Checklist>(`${succession(id)}/checklist/${itemId}/confirm`, 'POST', note === null ? undefined : { note }),
  cancelChecklist: (id: number, itemId: number) => request<Checklist>(`${succession(id)}/checklist/${itemId}/confirm`, 'DELETE'),

  plan: (id: number) => request<Plan>(`${succession(id)}/plan`),
  generatePlan: (id: number) => request<Plan>(`${succession(id)}/plan`, 'POST'),
  editPlanSection: (id: number, sectionId: number, content: string) => request<Plan>(`${succession(id)}/plan/sections/${sectionId}`, 'PATCH', { content }),
  agreePlan: (id: number) => request<Plan>(`${succession(id)}/plan/agree`, 'POST'),

  roadmap: (id: number) => request<Roadmap>(`${succession(id)}/roadmap`),
  requestTask: (id: number, taskId: number, memo: string | null = null) => request<Roadmap>(`${succession(id)}/roadmap/tasks/${taskId}/request`, 'POST', memo === null ? undefined : { memo }),
  approveTask: (id: number, taskId: number) => request<Roadmap>(`${succession(id)}/roadmap/tasks/${taskId}/approve`, 'POST'),
  sendBackTask: (id: number, taskId: number, reason: string) => request<Roadmap>(`${succession(id)}/roadmap/tasks/${taskId}/send-back`, 'POST', { reason }),

  payments: (id: number) => request<Payments>(`${succession(id)}/payments`),
  reportPayment: (id: number, installmentId: number, paidDate: string, memo: string | null) => request<Payments>(`${succession(id)}/payments/${installmentId}/report`, 'POST', { paidDate, memo }),
  confirmPayment: (id: number, installmentId: number) => request<Payments>(`${succession(id)}/payments/${installmentId}/confirm`, 'POST'),
};
