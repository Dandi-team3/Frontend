import { createContext, useContext, useState, type ReactNode } from 'react';
import { CANDIDATES } from '../data/demo';
import { addDays, buildSchedule, formatKoreanDate, todayISO } from '../lib/dates';
import { buildInstallmentPlans, buildPlanSections, buildRoadmapStages, formatWon, type Installment, type PaymentStatus, type PlanSection, type RoadmapStage, type SuccessionStatus, type TaskStatus } from '../lib/succession';
import { useDemo, type Role } from './DemoContext';

type EditedSection = PlanSection & { editedBy: Role | null };
type Plan = { version: number; sections: EditedSection[]; agreed: Record<Role, boolean> };
type TaskState = { status: TaskStatus; feedback: string | null };
type PaymentState = { status: PaymentStatus; paidDate: string | null; memo: string | null };

// 백엔드에 채팅 API가 없어 대화는 메모리에만 남는다. 수락한 제안만 항목 수정(PATCH)에 해당한다.
export type PlanMessage = {
  id: number;
  from: Role;
  kind: 'chat' | 'proposal';
  text: string;
  state: 'pending' | 'accepted' | 'rejected' | 'replaced' | null;
};

export type PendingAction =
  | { type: 'CHECKLIST' | 'PLAN_CREATE' | 'PLAN_AGREE' | 'PLAN_REPLY' | 'ROADMAP_RETRY' | 'PAYMENT_DUE'; title: string; description: string; to: string }
  | { type: 'ROADMAP_APPROVE'; title: string; description: string; taskId: string }
  | { type: 'PAYMENT_CONFIRM'; title: string; description: string; seq: number };

type SuccessionState = {
  accepted: boolean;
  status: SuccessionStatus;
  progressPercent: number;
  nextStep: { title: string; dueDate: string } | null;
  youthName: string;
  plan: Plan | null;
  planAgreedByBoth: boolean;
  generatePlan: () => void;
  planThreads: Record<string, PlanMessage[]>;
  sendPlanMessage: (code: string, kind: PlanMessage['kind'], text: string) => void;
  respondToProposal: (code: string, accept: boolean) => void;
  agreePlan: () => void;
  stages: RoadmapStage[];
  approvedTaskCount: number;
  waitingApprovalCount: number;
  requestTask: (id: string) => void;
  approveTask: (id: string) => void;
  sendBackTask: (id: string, reason: string) => void;
  approveRequestedTasks: () => void;
  installments: Installment[];
  confirmedAmount: number;
  reportPayment: (seq: number, paidDate: string, memo: string) => void;
  confirmPayment: (seq: number) => void;
  pendingActions: PendingAction[];
};

const SuccessionContext = createContext<SuccessionState | null>(null);
const TASK_COUNT = 9;

export function SuccessionProvider({ children }: { children: ReactNode }) {
  const { role, offerStatus, offerShop: shop, selectedCandidateId, checklistConfirms, checklistDone } = useDemo();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planThreads, setPlanThreads] = useState<Record<string, PlanMessage[]>>({});
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [paymentStates, setPaymentStates] = useState<Record<number, PaymentState>>({});

  const accepted = offerStatus === 'accepted' && shop.retireDate !== null;
  const youthName = (CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0]).name;
  const planAgreedByBoth = plan !== null && plan.agreed.owner && plan.agreed.successor;

  let foundCurrent = false;
  const stages: RoadmapStage[] = accepted && planAgreedByBoth ? buildRoadmapStages(shop).map((stage) => {
    const tasks = stage.tasks.map((title, index) => {
      const id = `${stage.seq}-${index + 1}`;
      return { id, title, status: taskStates[id]?.status ?? 'TODO' as TaskStatus, feedback: taskStates[id]?.feedback ?? null };
    });
    const approvedCount = tasks.filter((task) => task.status === 'APPROVED').length;
    const isDone = approvedCount === tasks.length;
    const state = isDone ? 'DONE' as const : foundCurrent ? 'LOCKED' as const : 'NOW' as const;
    if (!isDone) foundCurrent = true;
    return { ...stage, state, approvedCount, tasks };
  }) : [];
  const allTasks = stages.flatMap((stage) => stage.tasks);
  const approvedTaskCount = allTasks.filter((task) => task.status === 'APPROVED').length;
  const waitingApprovalCount = allTasks.filter((task) => task.status === 'REQUESTED').length;

  const today = todayISO();
  const installments: Installment[] = accepted && planAgreedByBoth ? buildInstallmentPlans(shop).map((item) => {
    const state = paymentStates[item.seq];
    const status = state?.status ?? 'SCHEDULED';
    return { ...item, status, paidDate: state?.paidDate ?? null, memo: state?.memo ?? null, overdue: status === 'SCHEDULED' && item.dueDate < today };
  }) : [];
  const confirmedAmount = installments.filter((item) => item.status === 'CONFIRMED').reduce((sum, item) => sum + item.amount, 0);
  const price = shop.amount ?? 0;

  const status: SuccessionStatus = planAgreedByBoth
    ? (approvedTaskCount < TASK_COUNT ? 'APPRENTICE' : installments.every((item) => item.status === 'CONFIRMED') ? 'COMPLETED' : 'HANDOVER')
    : checklistDone ? 'PLANNING' : 'CHECKLIST';

  const checklistCount = checklistConfirms.owner.filter((id) => checklistConfirms.successor.includes(id)).length;
  const progressPercent = {
    CHECKLIST: 10 + Math.round(checklistCount / 6 * 10),
    PLANNING: plan ? 30 : 25,
    APPRENTICE: 35 + Math.round(approvedTaskCount / TASK_COUNT * 45),
    HANDOVER: 85 + (price ? Math.round(confirmedAmount / price * 10) : 0),
    COMPLETED: 100,
  }[status];

  let nextStep: SuccessionState['nextStep'] = null;
  if (accepted && status !== 'COMPLETED') {
    const schedule = buildSchedule(shop.retireDate!, shop.trainingMonths);
    nextStep = {
      CHECKLIST: { title: '체크리스트 확인', dueDate: schedule.checklistDue },
      PLANNING: { title: 'AI 승계 계획 동의 · 계약금', dueDate: schedule.planDue },
      APPRENTICE: { title: '수습 마무리', dueDate: schedule.trainingEnd },
      HANDOVER: { title: '잔금 납입 · 승계 완료', dueDate: shop.retireDate! },
    }[status];
  }

  const otherName = role === 'owner' ? `${youthName} 님` : `${shop.owner} 사장님`.trim();
  const pendingActions: PendingAction[] = [];
  if (accepted) {
    const myUnchecked = 6 - checklistConfirms[role].length;
    if (status === 'CHECKLIST' && myUnchecked > 0) pendingActions.push({ type: 'CHECKLIST', title: '체크리스트 확인', description: `확인할 항목이 ${myUnchecked}개 남았어요`, to: '/succession/checklist' });
    if (status === 'PLANNING' && !plan) pendingActions.push({ type: 'PLAN_CREATE', title: '승계 계획 만들기', description: '체크리스트를 모두 확인했어요. AI 승계 계획 초안을 만들어 보세요', to: '/succession/plan' });
    if (status === 'PLANNING' && plan) {
      for (const section of plan.sections) {
        const proposal = planThreads[section.code]?.find((message) => message.state === 'pending' && message.from !== role);
        if (proposal) pendingActions.push({ type: 'PLAN_REPLY', title: '조건 제안', description: `${otherName}이 '${section.title}' 조건을 제안했어요`, to: '/succession/plan' });
      }
    }
    if (status === 'PLANNING' && plan && !plan.agreed[role]) pendingActions.push({ type: 'PLAN_AGREE', title: '승계 계획 동의', description: '계획을 읽고 고치거나 동의해 주세요', to: '/succession/plan' });
    for (const task of allTasks) {
      if (role === 'owner' && task.status === 'REQUESTED') pendingActions.push({ type: 'ROADMAP_APPROVE', title: '수습 단계 승인 요청', description: `${otherName}이 '${task.title}'를 마쳤다고 해요`, taskId: task.id });
      if (role === 'successor' && task.status === 'TODO' && task.feedback) pendingActions.push({ type: 'ROADMAP_RETRY', title: '다시 해 보기', description: `'${task.title}': ${task.feedback}`, to: '/succession/roadmap' });
    }
    for (const item of installments) {
      if (role === 'owner' && item.status === 'REPORTED') pendingActions.push({ type: 'PAYMENT_CONFIRM', title: '납입 확인', description: `${otherName}이 ${item.label} ${formatWon(item.amount)}을 보냈다고 기록했어요`, seq: item.seq });
      if (role === 'successor' && item.status === 'SCHEDULED' && item.dueDate <= addDays(today, 7)) pendingActions.push({ type: 'PAYMENT_DUE', title: '납입일이 다가와요', description: `${item.label} ${formatWon(item.amount)}, ${formatKoreanDate(item.dueDate)}까지예요`, to: '/succession/payments' });
    }
  }

  const value: SuccessionState = {
    accepted, status, progressPercent, nextStep, youthName, plan, planAgreedByBoth,
    generatePlan: () => {
      setPlan({ version: 1, sections: buildPlanSections(shop, youthName).map((section) => ({ ...section, editedBy: null })), agreed: { owner: false, successor: false } });
    },
    planThreads,
    sendPlanMessage: (code, kind, text) => {
      const thread = (planThreads[code] ?? []).map((message) => (kind === 'proposal' && message.state === 'pending' ? { ...message, state: 'replaced' as const } : message));
      setPlanThreads({ ...planThreads, [code]: [...thread, { id: thread.length, from: role, kind, text, state: kind === 'proposal' ? 'pending' : null }] });
    },
    respondToProposal: (code, accept) => {
      const thread = planThreads[code] ?? [];
      const proposal = thread.find((message) => message.state === 'pending');
      if (!plan || !proposal) return;
      setPlanThreads({ ...planThreads, [code]: thread.map((message) => (message === proposal ? { ...message, state: accept ? 'accepted' as const : 'rejected' as const } : message)) });
      if (!accept) return;
      // 수락한 쪽이 항목을 고친 것으로 본다. 백엔드와 같이 상대방(제안한 쪽)의 동의만 풀린다.
      const other: Role = role === 'owner' ? 'successor' : 'owner';
      setPlan({
        version: plan.version + 1,
        sections: plan.sections.map((section) => (section.code === code ? { ...section, content: proposal.text, editedBy: role } : section)),
        agreed: { ...plan.agreed, [other]: false },
      });
    },
    agreePlan: () => { if (plan) setPlan({ ...plan, agreed: { ...plan.agreed, [role]: true } }); },
    stages, approvedTaskCount, waitingApprovalCount,
    requestTask: (id) => setTaskStates({ ...taskStates, [id]: { status: 'REQUESTED', feedback: null } }),
    approveTask: (id) => setTaskStates({ ...taskStates, [id]: { status: 'APPROVED', feedback: null } }),
    sendBackTask: (id, reason) => setTaskStates({ ...taskStates, [id]: { status: 'TODO', feedback: reason } }),
    // 서버 연동 전까지 사장님의 승인을 대신하는 예시 동작.
    approveRequestedTasks: () => {
      const next = { ...taskStates };
      for (const task of allTasks) {
        if (task.status === 'REQUESTED') next[task.id] = { status: 'APPROVED', feedback: null };
      }
      setTaskStates(next);
    },
    installments, confirmedAmount,
    reportPayment: (seq, paidDate, memo) => setPaymentStates({ ...paymentStates, [seq]: { status: 'REPORTED', paidDate, memo: memo || null } }),
    confirmPayment: (seq) => setPaymentStates({ ...paymentStates, [seq]: { ...paymentStates[seq], status: 'CONFIRMED' } }),
    pendingActions,
  };

  return <SuccessionContext.Provider value={value}>{children}</SuccessionContext.Provider>;
}

export function useSuccession() {
  const context = useContext(SuccessionContext);
  if (!context) throw new Error('useSuccession must be used within SuccessionProvider');
  return context;
}
