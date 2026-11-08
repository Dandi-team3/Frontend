import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, TestRoleSwitch } from '../components/SuccessionUi';
import { api, orNull, type Schedule, type SuccessionStatus } from '../lib/api';
import { addDays, formatKoreanDate, todayISO } from '../lib/dates';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './SchedulePage.css';

const NEXT_LINK: Record<SuccessionStatus, { to: string; label: string }> = {
  CHECKLIST: { to: '/succession/checklist', label: '체크리스트 확인하기' },
  PLANNING: { to: '/succession/plan', label: 'AI 승계 계획 보기' },
  APPRENTICE: { to: '/succession/roadmap', label: '수습 로드맵 보기' },
  HANDOVER: { to: '/succession/payments', label: '납입 관리 보기' },
  COMPLETED: { to: '/succession/home', label: '승계 홈으로' },
};

function itemDate({ code, startDate, endDate }: Schedule['items'][number]) {
  if (startDate && startDate !== endDate) return `${formatKoreanDate(startDate)} ~ ${formatKoreanDate(endDate)}`;
  return code === 'CHECKLIST' || code === 'PLAN' ? `~ ${formatKoreanDate(endDate)}` : formatKoreanDate(endDate);
}

export default function SchedulePage() {
  const { me } = useApp();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const { busy, error: actionError, run } = useAction();

  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return summary ? { summary, schedule: await api.schedule(summary.id) } : { summary: null, schedule: null };
  }, [me?.id]);

  if (loading || error || !data) {
    return (
      <FlowLayout title="승계 가일정" backTo="/succession/home" className="schedule-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { summary, schedule } = data;
  if (!summary || !schedule) {
    return (
      <FlowLayout title="승계 가일정" backTo="/offers/current" className="schedule-page">
        <h1 className="flow-title">제안을 수락하면<br />가일정이 만들어져요</h1>
        <p className="flow-desc">은퇴 희망일에서 거꾸로 승계 일정을 계산해 드려요.</p>
        <Link to="/offers/current" className="btn btn-primary block succ-empty-action">제안 보기</Link>
      </FlowLayout>
    );
  }

  const pending = schedule.changeRequests.find((request) => request.status === 'PENDING');
  const canRequest = summary.status !== 'COMPLETED' && !pending;

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      await api.requestScheduleChange(summary.id, newDate, reason.trim() || null);
      setIsRequestOpen(false);
      setReason('');
      await reload();
    });
  };

  const answer = (requestId: number, value: 'approve' | 'reject') => {
    void run(async () => {
      await api.answerScheduleChange(summary.id, requestId, value);
      await reload();
    });
  };

  return (
    <FlowLayout
      title="승계 가일정"
      backTo="/succession/home"
      className="schedule-page"
      footer={<Link to={NEXT_LINK[summary.status].to} className="btn btn-primary block">{NEXT_LINK[summary.status].label}</Link>}
    >
      <h1 className="flow-title">은퇴 희망일에서<br />거꾸로 계산했어요</h1>
      <p className="flow-desc">{summary.shopName} · {summary.ownerName} 사장님 → {summary.youthName} 님</p>

      <div className="schedule-summary">
        <div><span>은퇴 희망일 · 승계 완료</span><strong>{formatKoreanDate(schedule.retireDate)}</strong></div>
        <div className="schedule-countdown"><span>오늘부터</span><strong>{schedule.daysLeft}일</strong></div>
      </div>

      {schedule.warnings.map((warning) => <p key={warning} className="flow-note schedule-warning">{warning}</p>)}

      <ol className="schedule-timeline" aria-label="승계 단계별 가일정">
        {schedule.items.map((item) => (
          <li className={`schedule-stage is-${item.state === 'DONE' ? 'done' : item.state === 'NOW' ? 'current' : 'upcoming'}`} key={item.seq} aria-current={item.state === 'NOW' ? 'step' : undefined}>
            <span className="schedule-stage-date">{itemDate(item)}{item.state === 'NOW' ? ' · 지금 단계' : ''}</span>
            <h2>{item.title}</h2>
            {item.note && <p>{item.note}</p>}
          </li>
        ))}
      </ol>

      <p className="flow-note schedule-note">가일정이에요. 바꾸려면 상대방의 동의가 필요해요.</p>

      {pending && (
        <div className="flow-note schedule-request-status" role="status">
          <strong>은퇴 희망일을 {formatKoreanDate(pending.newRetireDate)}로 바꾸자는 요청이 있어요.</strong>
          {pending.reason && <span>{pending.reason}</span>}
          {pending.mine ? <span>상대방의 답을 기다리고 있어요.</span> : (
            <div className="schedule-request-actions">
              <button type="button" className="succ-small-btn" disabled={busy} onClick={() => answer(pending.id, 'reject')}>거절</button>
              <button type="button" className="succ-small-btn is-primary" disabled={busy} onClick={() => answer(pending.id, 'approve')}>승인</button>
            </div>
          )}
        </div>
      )}
      <ActionError message={actionError} />
      {canRequest && (
        <button
          type="button"
          className="btn btn-outline block schedule-request-open"
          onClick={() => {
            setNewDate(schedule.retireDate);
            setIsRequestOpen(true);
          }}
        >
          일정 바꾸자고 요청하기
        </button>
      )}
      <TestRoleSwitch summary={summary} />

      <FlowDialog open={isRequestOpen} title="은퇴 희망일 변경 요청" onClose={() => setIsRequestOpen(false)}>
        <p>원하는 날짜를 골라 주세요. 상대방이 동의한 뒤에 일정이 바뀌어요.</p>
        <form onSubmit={submitRequest}>
          <label className="flow-label schedule-request-label" htmlFor="schedule-request-date">변경할 은퇴 희망일</label>
          <input id="schedule-request-date" className="flow-input" type="date" value={newDate} min={addDays(todayISO(), 1)} required onChange={(event) => setNewDate(event.target.value)} />
          <label className="flow-label schedule-request-label" htmlFor="schedule-request-reason">이유 (선택)</label>
          <input id="schedule-request-reason" className="flow-input" type="text" value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} />
          <div className="flow-dialog-actions">
            <button type="button" className="btn btn-gray" onClick={() => setIsRequestOpen(false)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={busy || newDate === schedule.retireDate}>변경 요청하기</button>
          </div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
