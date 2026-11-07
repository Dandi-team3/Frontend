import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { addMonths, buildSchedule, formatKoreanDate, todayISO } from '../lib/dates';
import { api } from '../lib/api';
import { earliestRetirementDate, toShopRequest } from '../lib/shop';
import { useAction } from '../lib/useApi';
import { useApp, useShopDraftLoader } from '../state/AppContext';
import './RegistrationPages.css';

const QUICK_DATES = [
  { label: '6개월 뒤', months: 6 },
  { label: '1년 뒤', months: 12 },
  { label: '2년 뒤', months: 24 },
];

export default function RetirementPage() {
  const navigate = useNavigate();
  const { retirementDate, setRetirementDate, shopDraft, refreshMe } = useApp();
  useShopDraftLoader();
  const [quickDate, setQuickDate] = useState<number | null>(null);
  const { busy, error, run } = useAction();
  const dateInput = useRef<HTMLInputElement>(null);
  const today = todayISO();
  const planDue = retirementDate ? buildSchedule(retirementDate, shopDraft.apprenticeMonths).planDue : null;
  const earliest = earliestRetirementDate(shopDraft.apprenticeMonths);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!retirementDate) return;
    if (!shopDraft.name.trim() || !shopDraft.category || !shopDraft.district.trim() || !shopDraft.askingPrice) {
      navigate('/owner/shop');
      return;
    }
    void run(async () => {
      // 여러 단계에 나눠 입력한 가게 정보를 한 번에 저장한다.
      await api.saveShop(toShopRequest(shopDraft, retirementDate));
      await refreshMe();
      navigate('/owner/matches');
    });
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
        <>
          {error && <p className="flow-error" role="alert">{error}</p>}
          <button type="submit" form="retirement-form" className="btn btn-primary block" disabled={busy || !retirementDate}>
            다음
          </button>
        </>
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
              {retirementDate ? formatKoreanDate(retirementDate) : '날짜를 골라 주세요'}
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
              required
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
          </div>
        </div>

        <p id="retirement-calculation" className="flow-note retirement-calculation" aria-live="polite">
          {!retirementDate || !planDue
            ? '은퇴 희망일을 정해야 가게를 저장하고 맞는 청년을 찾을 수 있어요.'
            : retirementDate < earliest
              ? `[계산 안내] 수습 ${shopDraft.apprenticeMonths}개월과 준비 기간을 확보하려면 ${formatKoreanDate(earliest)} 이후로 골라 주세요.`
              : `[계산 안내] 수습 ${shopDraft.apprenticeMonths}개월을 넣으면 ${formatKoreanDate(planDue)}까지 청년과 승계 계획을 정하는 일정이에요.`}
        </p>
      </form>
    </FlowLayout>
  );
}
