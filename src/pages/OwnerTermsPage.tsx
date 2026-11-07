import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { HANDOVER_ITEMS } from '../lib/shop';
import { useApp, useShopDraftLoader } from '../state/AppContext';
import './OwnerTermsPage.css';

const MAX_ASKING_PRICE = 2_147_483_647;
const APPRENTICE_MONTHS = Array.from({ length: 10 }, (_, index) => index + 3);

function formatPrice(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function priceValidationMessage(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return '인수 금액을 0보다 큰 정수로 입력해 주세요.';
  if (Number(value) > MAX_ASKING_PRICE) return '인수 금액은 2,147,483,647만 원 이하로 입력해 주세요.';
  return '';
}

export default function OwnerTermsPage() {
  const navigate = useNavigate();
  const { shopDraft, setShopDraft } = useApp();
  useShopDraftLoader();
  const priceInput = useRef<HTMLInputElement>(null);
  const endTimeInput = useRef<HTMLInputElement>(null);
  const otherItemsInput = useRef<HTMLTextAreaElement>(null);
  const [priceError, setPriceError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [itemsError, setItemsError] = useState('');
  const combinedItems = [...shopDraft.handoverItems, shopDraft.otherHandoverItems.trim()]
    .filter(Boolean)
    .join(' · ');
  const isOvernight = Boolean(shopDraft.workStart && shopDraft.workEnd && shopDraft.workEnd < shopDraft.workStart);

  const clearTimeError = () => {
    endTimeInput.current?.setCustomValidity('');
    setTimeError('');
  };

  const toggleHandoverItem = (item: string) => {
    setShopDraft({
      ...shopDraft,
      handoverItems: shopDraft.handoverItems.includes(item)
        ? shopDraft.handoverItems.filter((current) => current !== item)
        : [...shopDraft.handoverItems, item],
    });
    otherItemsInput.current?.setCustomValidity('');
    setItemsError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = priceValidationMessage(shopDraft.askingPrice);
    if (validationMessage) {
      setPriceError(validationMessage);
      priceInput.current?.setCustomValidity(validationMessage);
      priceInput.current?.reportValidity();
      return;
    }
    if (combinedItems.length > 200) {
      const message = '포함 항목은 기타 내용을 합쳐 200자 이하로 입력해 주세요.';
      setItemsError(message);
      otherItemsInput.current?.setCustomValidity(message);
      otherItemsInput.current?.reportValidity();
      return;
    }
    if (shopDraft.workStart === shopDraft.workEnd) {
      const message = '근무 시작 시간과 종료 시간을 다르게 입력해 주세요.';
      setTimeError(message);
      endTimeInput.current?.setCustomValidity(message);
      endTimeInput.current?.reportValidity();
      return;
    }
    setPriceError('');
    setItemsError('');
    setTimeError('');
    navigate('/owner/register');
  };

  return (
    <FlowLayout
      title="가게 등록"
      backTo="/owner/shop"
      progress={{ current: 2, total: 3 }}
      className="owner-terms-page"
      footer={(
        <button type="submit" form="owner-terms-form" className="btn btn-primary block">
          다음
        </button>
      )}
    >
      <h1 className="flow-title">어떤 조건으로<br />가게를 물려주실 건가요?</h1>
      <p className="flow-desc">인수 금액과 함께 물려줄 것, 배워 갈 시간을 알려 주세요.</p>

      <form id="owner-terms-form" className="owner-terms-form" onSubmit={handleSubmit}>
        <div className="owner-terms-field">
          <label className="flow-label" htmlFor="shop-asking-price">희망 인수 금액</label>
          <div className="owner-terms-money">
            <input
              ref={priceInput}
              id="shop-asking-price"
              className="flow-input owner-terms-price"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatPrice(shopDraft.askingPrice)}
              placeholder="예: 4,800"
              pattern="[0-9,]+"
              maxLength={13}
              required
              aria-invalid={Boolean(priceError) || undefined}
              aria-describedby={priceError ? 'shop-price-unit shop-price-error' : 'shop-price-unit'}
              onInvalid={() => setPriceError(priceValidationMessage(shopDraft.askingPrice))}
              onChange={(event) => {
                const value = event.target.value.replace(/,/g, '');
                if (!/^\d*$/.test(value)) return;
                event.target.setCustomValidity('');
                setPriceError('');
                setShopDraft({ ...shopDraft, askingPrice: value.replace(/^0+(?=\d)/, '') });
              }}
            />
            <span id="shop-price-unit" className="owner-terms-unit">만 원</span>
          </div>
          {priceError && <p id="shop-price-error" className="flow-error" role="alert">{priceError}</p>}
        </div>

        <fieldset className="owner-terms-fieldset">
          <legend className="flow-label">인수 금액에 포함할 항목</legend>
          <div className="owner-terms-chip-list">
            {HANDOVER_ITEMS.map((item) => (
              <label key={item} className={`flow-chip owner-terms-choice${shopDraft.handoverItems.includes(item) ? ' is-selected' : ''}`}>
                <input
                  className="visually-hidden"
                  type="checkbox"
                  name="handover-items"
                  value={item}
                  checked={shopDraft.handoverItems.includes(item)}
                  onChange={() => toggleHandoverItem(item)}
                />
                {item}
              </label>
            ))}
          </div>
          <p className="flow-caption owner-terms-hint">여러 개 골라도 돼요. 선택하지 않으면 포함 항목이 없는 것으로 표시해요.</p>
          <label className="flow-label owner-terms-other-label" htmlFor="shop-other-items">그 밖에 물려줄 것 <span>(선택)</span></label>
          <textarea
            ref={otherItemsInput}
            id="shop-other-items"
            className="flow-input owner-terms-other"
            value={shopDraft.otherHandoverItems}
            maxLength={120}
            rows={3}
            placeholder="예: 직접 만든 메뉴판, 가게에서 사용하던 집기"
            aria-invalid={Boolean(itemsError) || undefined}
            aria-describedby={itemsError ? 'shop-items-count shop-items-error' : 'shop-items-count'}
            onChange={(event) => {
              event.target.setCustomValidity('');
              setItemsError('');
              setShopDraft({ ...shopDraft, otherHandoverItems: event.target.value });
            }}
          />
          <p id="shop-items-count" className="flow-caption owner-terms-count">기타 내용 {shopDraft.otherHandoverItems.length}/120자 · 포함 항목 전체 {combinedItems.length}/200자</p>
          {itemsError && <p id="shop-items-error" className="flow-error" role="alert">{itemsError}</p>}
        </fieldset>

        <div className="owner-terms-field">
          <label className="flow-label" htmlFor="shop-apprentice-months">함께 배울 수습 기간</label>
          <select
            id="shop-apprentice-months"
            className="flow-input"
            value={shopDraft.apprenticeMonths}
            required
            onChange={(event) => setShopDraft({ ...shopDraft, apprenticeMonths: Number(event.target.value) })}
          >
            {APPRENTICE_MONTHS.map((months) => <option key={months} value={months}>{months}개월</option>)}
          </select>
          <p className="flow-caption owner-terms-hint">이 기간을 기준으로 은퇴 희망일에서 승계 일정을 계산해요.</p>
        </div>

        <fieldset className="owner-terms-fieldset" aria-describedby="shop-work-hours-note">
          <legend className="flow-label">함께 일할 시간</legend>
          <div className="owner-terms-time-row">
            <div>
              <label className="owner-terms-time-label" htmlFor="shop-work-start">시작 시간</label>
              <input
                id="shop-work-start"
                className="flow-input"
                type="time"
                value={shopDraft.workStart}
                required
                onChange={(event) => {
                  clearTimeError();
                  setShopDraft({ ...shopDraft, workStart: event.target.value });
                }}
              />
            </div>
            <span className="owner-terms-time-divider" aria-hidden="true">~</span>
            <div>
              <label className="owner-terms-time-label" htmlFor="shop-work-end">종료 시간</label>
              <input
                ref={endTimeInput}
                id="shop-work-end"
                className="flow-input"
                type="time"
                value={shopDraft.workEnd}
                required
                aria-invalid={Boolean(timeError) || undefined}
                aria-describedby={timeError ? 'shop-work-hours-note shop-work-hours-error' : 'shop-work-hours-note'}
                onChange={(event) => {
                  clearTimeError();
                  setShopDraft({ ...shopDraft, workEnd: event.target.value });
                }}
              />
            </div>
          </div>
          <p id="shop-work-hours-note" className="flow-caption owner-terms-hint">{isOvernight ? '종료 시간은 다음 날로 계산해요.' : '자정을 넘기는 근무도 입력할 수 있어요.'}</p>
          {timeError && <p id="shop-work-hours-error" className="flow-error" role="alert">{timeError}</p>}
          <label className="owner-terms-early-morning">
            <input type="checkbox" checked={shopDraft.earlyMorning} onChange={(event) => setShopDraft({ ...shopDraft, earlyMorning: event.target.checked })} />
            <span>새벽 근무가 필요해요</span>
          </label>
        </fieldset>
      </form>
    </FlowLayout>
  );
}
