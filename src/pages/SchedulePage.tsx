import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { CANDIDATES } from '../data/demo';
import { buildSchedule, daysUntil, formatKoreanDate } from '../lib/dates';
import type { SuccessionStatus } from '../lib/succession';
import { useDemo } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';
import './SchedulePage.css';

// 타임라인에서 지금 단계의 위치
const CURRENT_STEP: Record<SuccessionStatus, number> = { CHECKLIST: 1, PLANNING: 2, APPRENTICE: 3, HANDOVER: 4, COMPLETED: 6 };

const NEXT_LINK: Record<SuccessionStatus, { to: string; label: string }> = {
  CHECKLIST: { to: '/succession/checklist', label: '체크리스트 확인하기' },
  PLANNING: { to: '/succession/plan', label: 'AI 승계 계획 보기' },
  APPRENTICE: { to: '/succession/roadmap', label: '수습 로드맵 보기' },
  HANDOVER: { to: '/succession/payments', label: '납입 관리 보기' },
  COMPLETED: { to: '/succession/home', label: '승계 홈으로' },
};

export default function SchedulePage() {
  const { offerShop: shop, selectedCandidateId, offerStatus, acceptedDate } = useDemo();
  const { status } = useSuccession();
  const accepted = offerStatus === 'accepted';
  const retirementDate = shop.retireDate;
  const candidate = CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0];
  const schedule = retirementDate ? buildSchedule(retirementDate, shop.trainingMonths) : null;
  const insufficientTime = schedule && schedule.checklistDue < acceptedDate;

  const currentStep = accepted ? CURRENT_STEP[status] : -1;
  const stepState = (index: number) => (index < currentStep ? 'done' : index === currentStep ? 'current' : 'upcoming');
  const steps: { date: string; title: string; description?: string }[] = schedule && retirementDate ? [
    { date: accepted ? formatKoreanDate(acceptedDate) : '제안을 수락하면 시작해요', title: '제안 수락' },
    { date: `~ ${formatKoreanDate(schedule.checklistDue)}`, title: '체크리스트 확인', description: '건물주 동의, 채무, 자금, 근로계약' },
    { date: `~ ${formatKoreanDate(schedule.planDue)}`, title: 'AI 승계 계획 동의 · 계약금', description: '인수 금액의 10%' },
    { date: `${formatKoreanDate(schedule.trainingStart)} ~ ${formatKoreanDate(schedule.trainingEnd)}`, title: `수습 ${shop.trainingMonths}개월`, description: `${shop.workHours} · 단계마다 사장님 승인` },
    { date: formatKoreanDate(schedule.handoverStart), title: '운영권 넘겨받기 시작', description: '정한 근무 조건에 맞춰 운영을 이어받아요' },
    { date: formatKoreanDate(retirementDate), title: '잔금 납입 · 승계 완료' },
  ] : [];
  const timeline = steps.map((step, index) => ({
    ...step,
    state: accepted && index === 0 ? 'done' : stepState(index),
    date: stepState(index) === 'current' && accepted ? `${step.date} · 지금 단계` : step.date,
  }));

  return (
    <FlowLayout
      title="승계 가일정"
      backTo={accepted ? '/succession/home' : '/offers/current'}
      className="schedule-page"
      footer={accepted && retirementDate ? (
        <Link to={NEXT_LINK[status].to} className="btn btn-primary block">{NEXT_LINK[status].label}</Link>
      ) : undefined}
    >
      <h1 className="flow-title">은퇴 희망일에서<br />거꾸로 계산했어요</h1>
      <p className="flow-desc">{shop.name} · {shop.owner ? `${shop.owner} 사장님` : '사장님'} → {candidate.name} 님</p>

      {retirementDate && schedule ? (
        <>
          <div className="schedule-summary">
            <div><span>은퇴 희망일 · 승계 완료</span><strong>{formatKoreanDate(retirementDate)}</strong></div>
            <div className="schedule-countdown"><span>오늘부터</span><strong>{daysUntil(retirementDate)}일</strong></div>
          </div>

          {insufficientTime && <p className="flow-note schedule-warning">준비 기간이 짧아 일부 일정이 지났어요. 두 사람이 은퇴 희망일과 수습 기간을 함께 조율해 주세요.</p>}

          <ol className="schedule-timeline" aria-label="승계 단계별 가일정">
            {timeline.map((step) => (
              <li className={`schedule-stage is-${step.state}`} key={step.title} aria-current={step.state === 'current' ? 'step' : undefined}>
                <span className="schedule-stage-date">{step.date}</span>
                <h2>{step.title}</h2>
                {step.description && <p>{step.description}</p>}
              </li>
            ))}
          </ol>

          <p className="flow-note schedule-note">예시 가일정이에요.</p>
        </>
      ) : (
        <div className="flow-note schedule-note">
          <p>은퇴 희망일을 정하면 승계 일정을 계산해 드려요.</p>
          <Link to="/owner/register" className="schedule-date-link">은퇴 희망일 정하기</Link>
        </div>
      )}
    </FlowLayout>
  );
}
