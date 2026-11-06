import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { CANDIDATES } from '../data/demo';
import { addDays, buildSchedule, daysUntil, formatKoreanDate, todayISO } from '../lib/dates';
import { useDemo } from '../state/DemoContext';
import './SchedulePage.css';

export default function SchedulePage() {
  const { offerShop: shop, selectedCandidateId, offerStatus, acceptedDate, requestedRetirementDate, setRequestedRetirementDate } = useDemo();
  const accepted = offerStatus === 'accepted';
  const retirementDate = shop.retireDate;
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [newDate, setNewDate] = useState(retirementDate ?? '');
  const requestInput = useRef<HTMLInputElement>(null);
  const candidate = CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0];
  const schedule = retirementDate ? buildSchedule(retirementDate, shop.trainingMonths) : null;
  const insufficientTime = schedule && schedule.checklistDue < acceptedDate;

  const handleChangeRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = requestInput.current;
    if (!input || !input.reportValidity()) return;
    if (newDate === retirementDate) {
      input.setCustomValidity('현재 은퇴 희망일과 다른 날짜를 골라 주세요.');
      input.reportValidity();
      return;
    }
    setRequestedRetirementDate(newDate);
    setIsRequestOpen(false);
  };

  const timeline = schedule && retirementDate ? [
    { date: accepted ? formatKoreanDate(acceptedDate) : '제안을 수락하면 시작해요', title: '제안 수락', state: accepted ? 'done' : 'upcoming' },
    { date: `~ ${formatKoreanDate(schedule.checklistDue)}${accepted ? ' · 지금 단계' : ''}`, title: '체크리스트 확인', description: '건물주 동의, 채무, 자금, 근로계약', state: accepted ? 'current' : 'upcoming' },
    { date: `~ ${formatKoreanDate(schedule.planDue)}`, title: 'AI 승계 계획 동의 · 계약금', description: '인수 금액의 10%', state: 'upcoming' },
    { date: `${formatKoreanDate(schedule.trainingStart)} ~ ${formatKoreanDate(schedule.trainingEnd)}`, title: `수습 ${shop.trainingMonths}개월`, description: `${shop.workHours} · 단계마다 사장님 승인`, state: 'upcoming' },
    { date: formatKoreanDate(schedule.handoverStart), title: '운영권 넘겨받기 시작', description: '정한 근무 조건에 맞춰 운영을 이어받아요', state: 'upcoming' },
    { date: formatKoreanDate(retirementDate), title: '잔금 납입 · 승계 완료', state: 'upcoming' },
  ] : [];

  return (
    <FlowLayout
      title="승계 가일정"
      backTo="/offers/current"
      className="schedule-page"
      footer={retirementDate && (
        <button type="button" className="btn btn-outline block" disabled={!accepted || requestedRetirementDate !== null} onClick={() => setIsRequestOpen(true)}>
          {requestedRetirementDate ? '변경 요청을 보냈어요' : '일정 바꾸자고 요청하기'}
        </button>
      )}
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

          <p className="flow-note schedule-note">예시 가일정이에요. 일정을 바꾸려면 상대방의 동의가 필요해요.</p>
          {!accepted && <p className="flow-caption schedule-caption">제안을 수락하면 일정 변경을 요청할 수 있어요.</p>}
          {requestedRetirementDate && (
            <div className="flow-note schedule-request-status" role="status">
              <strong>{formatKoreanDate(requestedRetirementDate)}로 변경을 요청했어요.</strong>
              <span>상대방의 동의를 기다리고 있어요. 승인 전까지 기존 일정이 유지돼요.</span>
            </div>
          )}
        </>
      ) : (
        <div className="flow-note schedule-note">
          <p>은퇴 희망일을 정하면 승계 일정을 계산해 드려요.</p>
          <Link to="/owner/register" className="schedule-date-link">은퇴 희망일 정하기</Link>
        </div>
      )}

      <FlowDialog open={isRequestOpen} title="은퇴 희망일 변경 요청" onClose={() => setIsRequestOpen(false)}>
        <p>원하는 날짜를 골라 주세요. 상대방이 동의한 뒤에 일정이 바뀌어요.</p>
        <form onSubmit={handleChangeRequest}>
          <label className="flow-label schedule-request-label" htmlFor="schedule-request-date">변경할 은퇴 희망일</label>
          <input ref={requestInput} id="schedule-request-date" className="flow-input" type="date" value={newDate} min={addDays(todayISO(), 1)} required onChange={(event) => { event.target.setCustomValidity(''); setNewDate(event.target.value); }} />
          <div className="flow-dialog-actions">
            <button type="button" className="btn btn-gray" onClick={() => setIsRequestOpen(false)}>취소</button>
            <button type="submit" className="btn btn-primary">변경 요청하기</button>
          </div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
