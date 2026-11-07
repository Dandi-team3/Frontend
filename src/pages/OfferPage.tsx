import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import ShopPhotoPicker from '../components/ShopPhotoPicker';
import { ActionError, asCounterpart, LoadStatus } from '../components/SuccessionUi';
import { api, orNull, type Offer, type OfferStatus } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { formatWon } from '../lib/shop';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './OfferPage.css';

const CLOSED_LABELS: Partial<Record<OfferStatus, string>> = {
  REJECTED: '청년이 거절한 제안이에요.',
  CANCELED: '거둬들인 제안이에요.',
  EXPIRED: '답변 기한이 지난 제안이에요.',
  CLOSED: '다른 승계가 시작되어 닫힌 제안이에요.',
};

function latest(offers: Offer[]) {
  return [...offers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export default function OfferPage() {
  const navigate = useNavigate();
  const { me, role, selectedYouth, shopPhotos, setShopPhotos, offerMessage, setOfferMessage, refreshMe } = useApp();
  const isOwner = role === 'owner';
  const [decision, setDecision] = useState<'accept' | 'reject' | 'send' | null>(null);
  const { busy, error: actionError, run } = useAction();

  const { data, error, loading, reload } = useLoad(async () => {
    const offers = await api.offers();
    const shop = isOwner ? await orNull(api.shop()) : null;
    if (!isOwner) return { shop, offer: offers.find((item) => item.status === 'PROPOSED') ?? latest(offers) };
    const mine = selectedYouth ? offers.filter((item) => item.youthId === selectedYouth.youthId) : offers;
    return { shop, offer: latest(mine) };
  }, [me?.id, selectedYouth?.youthId]);

  const backTo = isOwner ? '/owner/matches' : '/successor/register';
  const title = isOwner ? '승계 제안' : '받은 제안';

  if (loading || error || !data) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { shop, offer } = data;

  if (!isOwner && !offer) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <h1 className="flow-title">아직 받은 제안이<br />없어요</h1>
        <p className="flow-desc">사장님이 승계를 제안하면 여기에 나타나요.</p>
        <button type="button" className="btn btn-outline block succ-empty-action" onClick={() => void reload()}>새로고침</button>
      </FlowLayout>
    );
  }

  if (isOwner && !offer && !selectedYouth) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <h1 className="flow-title">제안할 청년을<br />골라 주세요</h1>
        <p className="flow-desc">매칭 화면에서 청년을 고르면 승계를 제안할 수 있어요.</p>
        <Link to="/owner/matches" className="btn btn-primary block succ-empty-action">매칭 보기</Link>
      </FlowLayout>
    );
  }

  // 아직 보내지 않았거나, 거절 등으로 끝나 다시 보낼 수 있는 제안은 내 가게 정보를 보여 준다.
  const isActive = offer?.status === 'PROPOSED' || offer?.status === 'ACCEPTED';
  const showOffer = offer && (isActive || !isOwner) ? offer : null;
  const view = {
    shopName: showOffer?.shopName ?? shop?.name ?? '',
    ownerName: showOffer?.ownerName ?? shop?.ownerName ?? '',
    category: showOffer?.category ?? shop?.category,
    mainMenu: showOffer?.mainMenu ?? shop?.mainMenu,
    location: showOffer?.district ?? (shop?.address && shop.address.includes(shop.district) ? shop.address : [shop?.district, shop?.address].filter(Boolean).join(' ')),
    openedYear: showOffer?.openedYear ?? shop?.openedYear,
    price: showOffer?.price ?? shop?.askingPrice ?? 0,
    handoverItems: showOffer?.handoverItems ?? shop?.handoverItems,
    retireDate: showOffer?.retireDate ?? shop?.retireDate,
    apprenticeMonths: showOffer?.apprenticeMonths ?? shop?.apprenticeMonths,
    workHours: showOffer?.workHours ?? shop?.workHours,
  };
  const youthName = selectedYouth?.name ?? offer?.youthName ?? '';
  const score = showOffer?.matchScore ?? selectedYouth?.score;
  const shopMeta = [view.openedYear ? `${view.openedYear}년부터` : '', view.category, view.mainMenu, view.location].filter(Boolean).join(' · ');
  const deadline = offer ? formatKoreanDate(offer.expiresAt.slice(0, 10)).replace(/^\d+년 /, '') : '';

  const goToSchedule = async () => {
    await refreshMe();
    navigate('/succession/schedule');
  };

  const confirmDecision = () => {
    void run(async () => {
      if (decision === 'send' && selectedYouth) await api.propose(selectedYouth.youthId, offerMessage.trim() || null);
      if (decision === 'reject' && offer) await api.rejectOffer(offer.id);
      if (decision === 'accept' && offer) {
        await api.acceptOffer(offer.id);
        await goToSchedule();
        return;
      }
      await reload();
    }).finally(() => setDecision(null));
  };

  const acceptAsYouth = () => {
    if (!offer) return;
    void run(async () => {
      await asCounterpart(offer.youthName, 'YOUTH', (token) => api.acceptOffer(offer.id, token));
      await goToSchedule();
    });
  };

  const footer = isOwner ? (
    <>
      <ActionError message={actionError} />
      {offer?.status === 'PROPOSED' && <p className="offer-status" role="status">제안을 보냈어요. {deadline}까지 청년의 답변을 기다려요.</p>}
      {offer && !isActive && CLOSED_LABELS[offer.status] && <p className="offer-status" role="status">{CLOSED_LABELS[offer.status]}</p>}
      {offer?.status === 'ACCEPTED' ? (
        <Link to="/succession/schedule" className="btn btn-primary block">승계 가일정 보기</Link>
      ) : (
        <button type="button" className="btn btn-primary block" disabled={busy || offer?.status === 'PROPOSED' || !selectedYouth} onClick={() => setDecision('send')}>
          {offer?.status === 'PROPOSED' ? '제안 보냈어요' : '승계 제안하기'}
        </button>
      )}
      {import.meta.env.DEV && offer?.status === 'PROPOSED' && (
        <button type="button" className="btn btn-outline block" disabled={busy} onClick={acceptAsYouth}>테스트: 청년이 수락한 걸로 하기</button>
      )}
    </>
  ) : offer?.status === 'PROPOSED' ? (
    <>
      <ActionError message={actionError} />
      <div className="offer-actions">
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setDecision('reject')}>거절</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => setDecision('accept')}>수락하기</button>
      </div>
    </>
  ) : (
    <>
      <p className="offer-status" role="status">{offer?.status === 'ACCEPTED' ? '제안을 수락했어요.' : offer?.status === 'REJECTED' ? '제안을 거절했어요.' : '닫힌 제안이에요.'}</p>
      <Link to={offer?.status === 'ACCEPTED' ? '/succession/schedule' : '/successor'} className="btn btn-primary block">
        {offer?.status === 'ACCEPTED' ? '승계 가일정 보기' : '청년 화면으로 돌아가기'}
      </Link>
    </>
  );

  const canEdit = isOwner && !isActive;

  return (
    <FlowLayout title={title} backTo={backTo} footer={footer} className="offer-page">
      {!isOwner && offer?.status === 'PROPOSED' && <span className="offer-badge offer-deadline">{deadline}까지 답해 주세요</span>}
      <h1 className="flow-title offer-title">
        {isOwner ? <>{youthName} 님에게<br />승계를 제안해 보세요</> : <>{view.ownerName} 사장님이<br />승계를 제안했어요</>}
      </h1>

      <ShopPhotoPicker files={shopPhotos} onChange={setShopPhotos} editable={isOwner} />

      <div className="offer-shop-heading">
        <h2>{view.shopName}</h2>
        {score != null && <span className="offer-badge">적합도 {score}점</span>}
      </div>
      <p className="offer-shop-meta">{shopMeta}</p>
      {canEdit && <Link to="/owner/shop" className="offer-edit-link">가게 정보 수정</Link>}

      <section className="offer-card" aria-labelledby="offer-details-heading">
        <div className="offer-card-heading">
          <h2 id="offer-details-heading">제안 내용</h2>
          {canEdit && <Link to="/owner/terms" className="offer-edit-link">승계 조건 수정</Link>}
        </div>
        <dl className="offer-details">
          <div><dt>인수 금액</dt><dd><strong>{formatWon(view.price)}</strong></dd></div>
          <div><dt>포함</dt><dd>{view.handoverItems || '선택한 항목 없음'}</dd></div>
          <div><dt>은퇴 희망일</dt><dd>{view.retireDate ? formatKoreanDate(view.retireDate) : '-'}</dd></div>
          <div><dt>수습 기간</dt><dd>{view.apprenticeMonths}개월</dd></div>
          <div><dt>근무 시간</dt><dd>{view.workHours || '-'}</dd></div>
        </dl>
      </section>

      <section className="offer-card offer-message" aria-labelledby="offer-message-heading">
        <h2 id="offer-message-heading">
          {canEdit ? <label htmlFor="offer-message">청년에게 남길 말</label> : '사장님이 남긴 말'}
        </h2>
        {canEdit ? (
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
          <p className="offer-message-content">{offer?.message?.trim() || '남긴 말이 없어요.'}</p>
        )}
      </section>

      <p className="flow-note offer-note">
        수락하면 은퇴 희망일에서 거꾸로 계산한 가일정과 체크리스트가 만들어져요.
      </p>

      <FlowDialog open={decision !== null} title={decision === 'accept' ? '승계 제안을 수락할까요?' : decision === 'reject' ? '이 제안을 거절할까요?' : '승계를 제안할까요?'} onClose={() => setDecision(null)}>
        <p>
          {decision === 'accept'
            ? `${view.shopName}의 제안 내용을 확인하셨나요? 수락하면 승계가 시작돼요.`
            : decision === 'reject'
              ? '거절한 제안은 다시 수락할 수 없어요.'
              : `${youthName} 님에게 위 조건으로 제안을 보내요.`}
        </p>
        <div className="flow-dialog-actions">
          <button type="button" className="btn btn-gray" disabled={busy} onClick={() => setDecision(null)}>돌아가기</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmDecision}>{decision === 'accept' ? '수락하기' : decision === 'reject' ? '거절하기' : '제안 보내기'}</button>
        </div>
      </FlowDialog>
    </FlowLayout>
  );
}
