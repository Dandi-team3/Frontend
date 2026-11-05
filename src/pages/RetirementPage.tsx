import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { addMonths, buildSchedule, formatKoreanDate, todayISO } from '../lib/dates';
import { useDemo } from '../state/DemoContext';
import { earliestRetirementDate } from '../lib/shop';
import './RegistrationPages.css';

const QUICK_DATES = [
  { label: '6개월 뒤', months: 6 },
  { label: '1년 뒤', months: 12 },
  { label: '2년 뒤', months: 24 },
];

export default function RetirementPage() {
  const navigate = useNavigate();
  const { retirementDate, setRetirementDate, setRole, shopDraft } = useDemo();
  const [quickDate, setQuickDate] = useState<number | 'unknown' | null>(
    retirementDate === null ? 'unknown' : null,
  );
  const dateInput = useRef<HTMLInputElement>(null);
  const today = todayISO();
  const planDue = retirementDate ? buildSchedule(retirementDate, shopDraft.apprenticeMonths).planDue : null;
  const earliest = earliestRetirementDate(shopDraft.apprenticeMonths);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRole('owner');
    navigate('/owner/matches');
  };

  const openDatePicker = () => {
    const input = dateInput.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    }
  };

  return (
    <FlowLayout
      title="가게 등록"
      backTo="/owner/terms"
      progress={{ current: 3, total: 3 }}
      className="retirement-page"
      footer={(
        <button type="submit" form="retirement-form" className="btn btn-primary block">
          다음
        </button>
      )}
    >
      <h1 className="flow-title">
        언제 은퇴하고
        <br />
        싶으세요?
      </h1>
      <p className="flow-desc">이 날짜에서 거꾸로 승계 일정을 계산해 드려요</p>

      <form id="retirement-form" className="registration-form" onSubmit={handleSubmit}>
        <div className="registration-field">
          <label className="flow-label" htmlFor="retirement-date">은퇴 희망일</label>
          <div className="retirement-date-control">
            <span className="retirement-date-display" aria-hidden="true">
              {retirementDate ? formatKoreanDate(retirementDate) : '아직 정하지 않았어요'}
            </span>
            <span className="retirement-date-hint" aria-hidden="true">
              날짜 선택
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              ref={dateInput}
              id="retirement-date"
              className="retirement-date-input"
              type="date"
              value={retirementDate ?? ''}
              min={today}
              required={retirementDate !== null}
              aria-describedby="retirement-calculation"
              onClick={openDatePicker}
              onChange={(event) => {
                setQuickDate(null);
                setRetirementDate(event.target.value || null);
              }}
            />
          </div>
        </div>

        <div className="registration-field">
          <p className="flow-label" id="retirement-quick-label">빠르게 고르기</p>
          <div className="registration-chip-list" role="group" aria-labelledby="retirement-quick-label">
            {QUICK_DATES.map(({ label, months }) => (
              <button
                key={months}
                type="button"
                className={`flow-chip${quickDate === months ? ' is-selected' : ''}`}
                aria-pressed={quickDate === months}
                onClick={() => {
                  setQuickDate(months);
                  setRetirementDate(addMonths(today, months));
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className={`flow-chip${quickDate === 'unknown' ? ' is-selected' : ''}`}
              aria-pressed={quickDate === 'unknown'}
              onClick={() => {
                setQuickDate('unknown');
                setRetirementDate(null);
              }}
            >
              아직 몰라요
            </button>
          </div>
        </div>

        <p id="retirement-calculation" className="flow-note retirement-calculation" aria-live="polite">
          {!retirementDate || !planDue
            ? '괜찮아요. 먼저 맞는 청년을 살펴보고, 은퇴 희망일은 나중에 함께 정해도 돼요.'
            : retirementDate < earliest
              ? `[계산 안내] 수습 ${shopDraft.apprenticeMonths}개월과 준비 기간을 확보하려면 ${formatKoreanDate(earliest)} 이후가 좋아요. 먼저 매칭을 살펴보고 날짜를 조율할 수도 있어요.`
              : `[계산 안내] 수습 ${shopDraft.apprenticeMonths}개월을 넣으면 ${formatKoreanDate(planDue)}까지 청년과 승계 계획을 정하는 일정이에요.`}
        </p>
      </form>
    </FlowLayout>
  );
}
