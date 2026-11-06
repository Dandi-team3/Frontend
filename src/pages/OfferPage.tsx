import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import ShopPhotoPicker from '../components/ShopPhotoPicker';
import { CANDIDATES } from '../data/demo';
import { addDays, formatKoreanDate, todayISO } from '../lib/dates';
import { useDemo } from '../state/DemoContext';
import { validateShopDraft, type ShopValidationIssue } from '../lib/shop';
import './OfferPage.css';

export default function OfferPage() {
  const navigate = useNavigate();
  const { role, shopDraft, retirementDate: draftRetirementDate, offerShop: shop, selectedCandidateId, offerStatus, setOfferStatus, shopPhotos, setShopPhotos, offerMessage, setOfferMessage } = useDemo();
  const retirementDate = shop.retireDate;
  const ownerLabel = shop.owner ? `${shop.owner} 사장님` : '사장님';
  const location = shop.district && shop.address.includes(shop.district)
    ? shop.address
    : [shop.district, shop.address].filter(Boolean).join(' ');
  const shopMeta = [shop.openedYear ? `${shop.openedYear}년부터` : '', shop.category, shop.mainMenu, location].filter(Boolean).join(' · ');
  const [decision, setDecision] = useState<'accept' | 'reject' | 'send' | null>(null);
  const [sendIssue, setSendIssue] = useState<ShopValidationIssue | null>(null);
  const candidate = CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0];
  const isOwner = role === 'owner';
  const isResolved = offerStatus === 'accepted' || offerStatus === 'rejected';
  const deadline = formatKoreanDate(addDays(todayISO(), 14)).replace(/^\d+년 /, '');
  const canAccept = retirementDate !== null;

  const validateBeforeSend = () => {
    const issue = validateShopDraft(shopDraft, draftRetirementDate);
    setSendIssue(issue);
    return issue === null;
  };

  const confirmDecision = () => {
    if (decision === 'accept' && canAccept) {
      setOfferStatus('accepted');
      navigate('/succession/schedule');
    } else if (decision === 'reject') {
      setOfferStatus('rejected');
    } else if (decision === 'send') {
      if (!validateBeforeSend()) {
        setDecision(null);
        return;
      }
      setOfferStatus('sent');
    }
    setDecision(null);
  };

  const footer = isOwner ? (
    <>
      {sendIssue && <p className="flow-error" role="alert">{sendIssue.message}{' '}<Link to={sendIssue.to}>정보 입력하기</Link></p>}
      {offerStatus === 'sent' && <p className="offer-status" role="status">예시 제안을 보냈어요. 청년의 답변을 기다리고 있어요.</p>}
      {offerStatus === 'accepted' ? (
        <Link to="/succession/schedule" className="btn btn-primary block">승계 가일정 보기</Link>
      ) : (
        <button type="button" className="btn btn-primary block" disabled={offerStatus === 'sent' || offerStatus === 'rejected'} onClick={() => { if (validateBeforeSend()) setDecision('send'); }}>
          {offerStatus === 'sent' ? '제안 보냈어요' : offerStatus === 'rejected' ? '거절된 제안이에요' : '승계 제안하기'}
        </button>
      )}
      {offerStatus === 'sent' && (
        <button
          type="button"
          className="btn btn-outline block"
          onClick={() => {
            setOfferStatus('accepted');
            navigate('/succession/schedule');
          }}
        >
          예시: 청년이 수락한 걸로 하기
        </button>
      )}
    </>
  ) : isResolved ? (
    <>
      <p className="offer-status" role="status">{offerStatus === 'accepted' ? '제안을 수락했어요.' : '제안을 거절했어요.'}</p>
      <Link to={offerStatus === 'accepted' ? '/succession/schedule' : '/education'} className="btn btn-primary block">
        {offerStatus === 'accepted' ? '승계 가일정 보기' : '받은 제안으로 돌아가기'}
      </Link>
    </>
  ) : (
    <>
      {!canAccept && <p className="flow-caption">은퇴 희망일을 정한 뒤 승계를 시작할 수 있어요.</p>}
      <div className="offer-actions">
        <button type="button" className="btn btn-outline" onClick={() => setDecision('reject')}>거절</button>
        <button type="button" className="btn btn-primary" disabled={!canAccept} onClick={() => setDecision('accept')}>수락하기</button>
      </div>
    </>
  );

  return (
    <FlowLayout title={isOwner ? '가게 물려주기 제안' : '받은 제안'} backTo={isOwner ? '/owner/matches' : '/education'} footer={footer} className="offer-page">
      {!isOwner && !isResolved && <span className="offer-badge offer-deadline">{deadline}까지 답해 주세요</span>}
      <h1 className="flow-title offer-title">
        {isOwner ? <>{candidate.name} 님에게<br />승계를 제안해 보세요</> : <>{ownerLabel}이<br />승계를 제안했어요</>}
      </h1>

      <ShopPhotoPicker files={shopPhotos} onChange={setShopPhotos} editable={isOwner} />

      <div className="offer-shop-heading">
        <h2>{shop.name}</h2>
        <span className="offer-badge">적합도 {candidate.score}점</span>
      </div>
      <p className="offer-shop-meta">{shopMeta}</p>
      {isOwner && <Link to="/owner/shop" className="offer-edit-link">가게 정보 수정</Link>}

      <section className="offer-card" aria-labelledby="offer-details-heading">
        <div className="offer-card-heading">
          <h2 id="offer-details-heading">{isOwner ? '물려줄 내용' : '제안 내용'}</h2>
          {isOwner && <Link to="/owner/terms" className="offer-edit-link">승계 조건 수정</Link>}
        </div>
        <dl className="offer-details">
          <div><dt>{isOwner ? '받을 금액' : '인수 금액'}</dt><dd><strong>{shop.amount === null ? '금액 미정' : `${shop.amount.toLocaleString('ko-KR')}만 원`}</strong></dd></div>
          <div><dt>{isOwner ? '함께 넘길 것' : '포함'}</dt><dd>{shop.included}</dd></div>
          <div><dt>은퇴 희망일</dt><dd>{retirementDate ? formatKoreanDate(retirementDate) : '함께 정할 예정이에요'}</dd></div>
          <div><dt>{isOwner ? '배우는 기간' : '수습 기간'}</dt><dd>{shop.trainingMonths}개월</dd></div>
          <div><dt>근무 시간</dt><dd>{shop.workHours}</dd></div>
        </dl>
      </section>

      <section className="offer-card offer-message" aria-labelledby="offer-message-heading">
        <h2 id="offer-message-heading">
          {isOwner ? <label htmlFor="offer-message">승계제안자에게 남길 말</label> : '승계제안자에게 남길 말'}
        </h2>
        {isOwner ? (
          <>
            <textarea
              id="offer-message"
              className="offer-message-input"
              value={offerMessage}
              onChange={(event) => setOfferMessage(event.target.value)}
              placeholder="가게를 이어받을 분께 전하고 싶은 말을 적어 주세요."
              maxLength={500}
              rows={5}
              aria-describedby="offer-message-count"
            />
            <p id="offer-message-count" className="offer-message-count">{offerMessage.length} / 500자</p>
          </>
        ) : (
          <p className="offer-message-content">{offerMessage.trim() || '남긴 말이 없어요.'}</p>
        )}
      </section>

      <p className="flow-note offer-note">
        수락하면 은퇴 희망일에서 거꾸로 계산한 가일정을 확인할 수 있어요. 가게와 금액, 제안은 예시예요.
      </p>

      <FlowDialog open={decision !== null} title={decision === 'accept' ? '승계 제안을 수락할까요?' : decision === 'reject' ? '이 제안을 거절할까요?' : '승계를 제안할까요?'} onClose={() => setDecision(null)}>
        <p>
          {decision === 'accept'
            ? `${shop.name}의 제안 내용을 확인하셨나요? 예시 제안을 수락하면 승계 가일정으로 이동해요.`
            : decision === 'reject'
              ? '거절한 예시 제안은 이 화면에서 다시 수락할 수 없어요.'
              : `${candidate.name} 님에게 위 조건으로 예시 제안을 보내요.`}
        </p>
        <div className="flow-dialog-actions">
          <button type="button" className="btn btn-gray" onClick={() => setDecision(null)}>돌아가기</button>
          <button type="button" className="btn btn-primary" onClick={confirmDecision}>{decision === 'accept' ? '수락하기' : decision === 'reject' ? '거절하기' : '제안 보내기'}</button>
        </div>
      </FlowDialog>
    </FlowLayout>
  );
}
