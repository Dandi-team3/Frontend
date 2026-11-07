import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, ProgressBar, Tag, TestRoleSwitch } from '../components/SuccessionUi';
import { api, orNull } from '../lib/api';
import { formatKoreanDate, todayISO } from '../lib/dates';
import { formatWon } from '../lib/shop';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

const DUE_NOTES: Record<number, string> = { 3: ' · 수습 마칠 때', 4: ' · 승계 완료' };

export default function PaymentsPage() {
  const { me } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [installmentId, setInstallmentId] = useState(0);
  const [paidDate, setPaidDate] = useState(todayISO);
  const [memo, setMemo] = useState('');
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, payments: summary ? await orNull(api.payments(summary.id)) : null };
  }, [me?.id]);

  if (loading || error || !data) {
    return (
      <FlowLayout title="납입 관리" backTo="/succession/home" className="payments-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { summary, payments } = data;
  if (!summary || !payments) {
    return (
      <FlowLayout title="납입 관리" backTo={summary ? '/succession/home' : '/succession/schedule'} className="payments-page">
        <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
        <p className="flow-desc">두 분이 승계 계획에 동의하면 납입 일정이 만들어져요.</p>
        <Link to="/succession/plan" className="btn btn-primary block succ-empty-action">AI 승계 계획 보기</Link>
      </FlowLayout>
    );
  }

  const isOwner = summary.mySide === 'OWNER';
  const recorded = payments.installments.filter((item) => item.status !== 'SCHEDULED');
  const scheduled = payments.installments.filter((item) => item.status === 'SCHEDULED');

  const openForm = () => {
    setInstallmentId(scheduled[0].id);
    setPaidDate(todayISO());
    setMemo('');
    setIsFormOpen(true);
  };

  const handleReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      await api.reportPayment(summary.id, installmentId, paidDate, memo.trim() || null);
      setIsFormOpen(false);
      await reload();
    });
  };

  const footer = !isOwner && scheduled.length > 0
    ? <button type="button" className="btn btn-primary block" onClick={openForm}>납입 기록 추가하기</button>
    : <Link to="/succession/home" className="btn btn-primary block">승계 홈으로</Link>;

  return (
    <FlowLayout title="납입 관리" backTo="/succession/home" footer={footer} className="payments-page">
      <section className="succ-card is-tinted pay-remaining" aria-label="남은 금액">
        <span className="pay-label">남은 금액</span>
        <strong>{formatWon(payments.remainingAmount)}</strong>
        <ProgressBar label="낸 금액 비율" percent={payments.paidPercent} large />
        <div className="pay-remaining-foot">
          <span>낸 금액 {formatWon(payments.confirmedAmount)}</span>
          <span>전체 {formatWon(payments.total)}</span>
        </div>
      </section>

      <div className="succ-cards">
        {recorded.length > 0 && (
          <section className="succ-card pay-group" aria-label="납입 기록">
            <h2>납입 기록</h2>
            {recorded.map((item) => (
              <div key={item.id} className="pay-row">
                <div className="succ-row succ-row-top">
                  <div><strong>{item.label}</strong><small>{item.paidDate ? formatKoreanDate(item.paidDate) : ''}{item.memo ? ` · ${item.memo}` : ''}</small></div>
                  <div className="pay-right">
                    <strong>{formatWon(item.amount)}</strong>
                    {item.status === 'CONFIRMED' ? <Tag kind="filled">사장님 확인</Tag> : <Tag kind="dashed">사장님 확인 전</Tag>}
                  </div>
                </div>
                {isOwner && item.status === 'REPORTED' && (
                  <button type="button" className="succ-small-btn is-primary pay-confirm" disabled={busy} aria-label={`${item.label} 받았어요`} onClick={() => void run(async () => { await api.confirmPayment(summary.id, item.id); await reload(); })}>받았어요</button>
                )}
              </div>
            ))}
          </section>
        )}

        {scheduled.length > 0 && (
          <section className="succ-card pay-group" aria-label="남은 일정">
            <h2>남은 일정</h2>
            {scheduled.map((item) => (
              <div key={item.id} className="pay-row">
                <div className="succ-row succ-row-top">
                  <div><strong>{item.label}</strong><small>{formatKoreanDate(item.dueDate)}{DUE_NOTES[item.seq] ?? ''}</small></div>
                  <div className="pay-right">
                    <strong>{formatWon(item.amount)}</strong>
                    <Tag kind="outline">{item.overdue ? '날짜 지남' : '예정'}</Tag>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      <ActionError message={actionError} />
      <p className="flow-note succ-note">{payments.notice}</p>
      <TestRoleSwitch summary={summary} />

      <FlowDialog open={isFormOpen} title="납입 기록 추가" onClose={() => setIsFormOpen(false)}>
        <form className="pay-form" onSubmit={handleReport}>
          <label className="flow-label" htmlFor="pay-item">낸 항목</label>
          <select id="pay-item" className="flow-input" value={installmentId} onChange={(event) => setInstallmentId(Number(event.target.value))}>
            {scheduled.map((item) => <option key={item.id} value={item.id}>{item.label} · {formatWon(item.amount)}</option>)}
          </select>
          <label className="flow-label" htmlFor="pay-date">보낸 날짜</label>
          <input id="pay-date" className="flow-input" type="date" value={paidDate} max={todayISO()} required onChange={(event) => setPaidDate(event.target.value)} />
          <label className="flow-label" htmlFor="pay-memo">메모 (선택)</label>
          <input id="pay-memo" className="flow-input" type="text" value={memo} maxLength={300} placeholder="예: 국민은행 계좌 이체" onChange={(event) => setMemo(event.target.value)} />
          <div className="flow-dialog-actions">
            <button type="button" className="btn btn-gray" onClick={() => setIsFormOpen(false)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>기록하기</button>
          </div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
