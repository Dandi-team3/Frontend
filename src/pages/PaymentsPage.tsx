import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { DemoRoleSwitch, ProgressBar, Tag } from '../components/SuccessionUi';
import { formatKoreanDate, todayISO } from '../lib/dates';
import { formatWon } from '../lib/succession';
import { useDemo } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';

const DUE_NOTES: Record<number, string> = { 3: ' · 수습 마칠 때', 4: ' · 승계 완료' };

export default function PaymentsPage() {
  const { role, offerShop: shop } = useDemo();
  const { accepted, planAgreedByBoth, installments, confirmedAmount, reportPayment, confirmPayment } = useSuccession();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [seq, setSeq] = useState(1);
  const [paidDate, setPaidDate] = useState(todayISO);
  const [memo, setMemo] = useState('');

  if (!planAgreedByBoth) {
    return (
      <FlowLayout title="납입 관리" backTo={accepted ? '/succession/home' : '/succession/schedule'} className="payments-page">
        <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
        <p className="flow-desc">두 분이 승계 계획에 동의하면 납입 일정이 만들어져요.</p>
        <Link to="/succession/plan" className="btn btn-primary block succ-empty-action">AI 승계 계획 보기</Link>
      </FlowLayout>
    );
  }

  const total = shop.amount ?? 0;
  const recorded = installments.filter((item) => item.status !== 'SCHEDULED');
  const scheduled = installments.filter((item) => item.status === 'SCHEDULED');
  const openForm = () => {
    setSeq(scheduled[0].seq);
    setPaidDate(todayISO());
    setMemo('');
    setIsFormOpen(true);
  };
  const handleReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reportPayment(seq, paidDate, memo.trim());
    setIsFormOpen(false);
  };

  const footer = role === 'successor' && scheduled.length > 0
    ? <button type="button" className="btn btn-primary block" onClick={openForm}>납입 기록 추가하기</button>
    : undefined;

  return (
    <FlowLayout title="납입 관리" backTo="/succession/home" footer={footer} className="payments-page">
      <section className="succ-card is-tinted pay-remaining" aria-label="남은 금액">
        <span className="pay-label">남은 금액</span>
        <strong>{formatWon(total - confirmedAmount)}</strong>
        <ProgressBar label="낸 금액 비율" percent={total ? confirmedAmount / total * 100 : 0} large />
        <div className="pay-remaining-foot">
          <span>낸 금액 {formatWon(confirmedAmount)}</span>
          <span>전체 {formatWon(total)}</span>
        </div>
      </section>

      <div className="succ-cards">
        {recorded.length > 0 && (
          <section className="succ-card pay-group" aria-label="납입 기록">
            <h2>납입 기록</h2>
            {recorded.map((item) => (
              <div key={item.seq} className="pay-row">
                <div className="succ-row succ-row-top">
                  <div><strong>{item.label}</strong><small>{item.paidDate ? formatKoreanDate(item.paidDate) : ''}{item.memo ? ` · ${item.memo}` : ''}</small></div>
                  <div className="pay-right">
                    <strong>{formatWon(item.amount)}</strong>
                    {item.status === 'CONFIRMED' ? <Tag kind="filled">사장님 확인</Tag> : <Tag kind="dashed">사장님 확인 전</Tag>}
                  </div>
                </div>
                {role === 'owner' && item.status === 'REPORTED' && (
                  <button type="button" className="succ-small-btn is-primary pay-confirm" aria-label={`${item.label} 받았어요`} onClick={() => confirmPayment(item.seq)}>받았어요</button>
                )}
              </div>
            ))}
          </section>
        )}

        {scheduled.length > 0 && (
          <section className="succ-card pay-group" aria-label="남은 일정">
            <h2>남은 일정</h2>
            {scheduled.map((item) => (
              <div key={item.seq} className="pay-row">
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

      <p className="flow-note succ-note">물려받기는 돈을 직접 보내지 않아요. 계좌로 보낸 뒤 기록하면 사장님이 받았는지 확인해요. 금액은 예시예요.</p>
      <DemoRoleSwitch />

      <FlowDialog open={isFormOpen} title="납입 기록 추가" onClose={() => setIsFormOpen(false)}>
        <form className="pay-form" onSubmit={handleReport}>
          <label className="flow-label" htmlFor="pay-seq">낸 항목</label>
          <select id="pay-seq" className="flow-input" value={seq} onChange={(event) => setSeq(Number(event.target.value))}>
            {scheduled.map((item) => <option key={item.seq} value={item.seq}>{item.label} · {formatWon(item.amount)}</option>)}
          </select>
          <label className="flow-label" htmlFor="pay-date">보낸 날짜</label>
          <input id="pay-date" className="flow-input" type="date" value={paidDate} max={todayISO()} required onChange={(event) => setPaidDate(event.target.value)} />
          <label className="flow-label" htmlFor="pay-memo">메모 (선택)</label>
          <input id="pay-memo" className="flow-input" type="text" value={memo} maxLength={300} placeholder="예: 국민은행 계좌 이체" onChange={(event) => setMemo(event.target.value)} />
          <div className="flow-dialog-actions">
            <button type="button" className="btn btn-gray" onClick={() => setIsFormOpen(false)}>취소</button>
            <button type="submit" className="btn btn-primary">기록하기</button>
          </div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
