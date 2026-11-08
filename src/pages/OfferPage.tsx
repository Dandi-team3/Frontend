import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import ShopPhotoPicker from '../components/ShopPhotoPicker';
import { ActionError, LoadStatus } from '../components/SuccessionUi';
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
  const [searchParams] = useSearchParams();
  const requestedOfferId = Number(searchParams.get('offer'));
  const explicitOfferId = Number.isSafeInteger(requestedOfferId) && requestedOfferId > 0 ? requestedOfferId : null;
  const requestedYouthId = Number(searchParams.get('youth'));
  const composeYouthId = Number.isSafeInteger(requestedYouthId) && requestedYouthId > 0 ? requestedYouthId : null;
  const invalidAddress = (searchParams.has('offer') && explicitOfferId === null) || (searchParams.has('youth') && composeYouthId === null) || (searchParams.has('offer') && searchParams.has('youth'));
  const { me, role, selectedYouth, shopPhotos, setShopPhotos, offerMessage, setOfferMessage, refreshMe, isDemoMode, login } = useApp();
  const isOwner = role === 'owner';
  const [decision, setDecision] = useState<'accept' | 'reject' | 'send' | 'cancel' | null>(null);
  const [acceptedOffer, setAcceptedOffer] = useState<Offer | null>(null);
  const { busy, error: actionError, run } = useAction();

  const { data, error, loading, reload } = useLoad(async () => {
    if (invalidAddress || (composeYouthId !== null && !isOwner)) return { shop: null, offer: null, candidate: null };
    const shop = isOwner ? await orNull(api.shop()) : null;
    if (explicitOfferId !== null) return { shop, offer: await orNull(api.offer(explicitOfferId)), candidate: null };
    const candidate = isOwner && composeYouthId !== null
      ? (await api.ownerMatches()).find((item) => item.youthId === composeYouthId) ?? null
      : isOwner ? selectedYouth : null;
    if (composeYouthId !== null) {
      const offer = candidate?.offerId && candidate.offerStatus === 'PROPOSED' ? await orNull(api.offer(candidate.offerId)) : null;
      return { shop, offer, candidate };
    }
    const offers = await api.offers();
    if (!isOwner) return { shop, offer: offers.find((item) => item.status === 'PROPOSED') ?? latest(offers), candidate };
    const mine = candidate ? offers.filter((item) => item.youthId === candidate.youthId) : offers;
    return { shop, offer: latest(mine), candidate };
  }, [me?.id, role, selectedYouth?.youthId, explicitOfferId, composeYouthId, invalidAddress]);

  const backTo = isOwner ? '/owner/matches' : '/education';
  const title = isOwner ? '가게 물려주기 제안' : '받은 제안';

  if (loading || error || !data) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { shop, candidate } = data;
  const offer = acceptedOffer?.id === data.offer?.id ? acceptedOffer : data.offer;

  if (invalidAddress || (composeYouthId !== null && !isOwner) || (explicitOfferId !== null && !offer) || (composeYouthId !== null && !candidate)) {
    return (
      <FlowLayout title={title} backTo="/education" className="offer-page">
        <h1 className="flow-title">제안을 찾을 수 없어요</h1>
        <p className="flow-desc">제안 목록에서 다시 골라 주세요.</p>
        <Link to="/education" className="btn btn-primary block succ-empty-action">제안 목록 보기</Link>
      </FlowLayout>
    );
  }

  if (!isOwner && !offer) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <h1 className="flow-title">아직 받은 제안이<br />없어요</h1>
        <p className="flow-desc">사장님이 승계를 제안하면 여기에 나타나요.</p>
        <button type="button" className="btn btn-outline block succ-empty-action" onClick={() => void reload()}>새로고침</button>
      </FlowLayout>
    );
  }

  if (isOwner && !offer && !candidate) {
    return (
      <FlowLayout title={title} backTo={backTo} className="offer-page">
        <h1 className="flow-title">제안할 청년을<br />골라 주세요</h1>
        <p className="flow-desc">청년을 고르면 가게를 물려줄 조건을 제안할 수 있어요.</p>
        <Link to="/owner/matches" className="btn btn-primary block succ-empty-action">청년 찾아보기</Link>
      </FlowLayout>
    );
  }

  // 아직 보내지 않았거나, 거절 등으로 끝나 다시 보낼 수 있는 제안은 내 가게 정보를 보여 준다.
  const isActive = offer?.status === 'PROPOSED' || offer?.status === 'ACCEPTED';
  const showOffer = offer && (isActive || !isOwner || explicitOfferId !== null) ? offer : null;
  const view = {
    shopName: showOffer?.shopName ?? shop?.name ?? '',
    ownerName: showOffer?.ownerName ?? shop?.ownerName ?? '',
    category: showOffer?.category ?? shop?.category,
    mainMenu: showOffer ? showOffer.mainMenu : shop?.mainMenu,
    location: showOffer?.district ?? (shop?.address && shop.address.includes(shop.district) ? shop.address : [shop?.district, shop?.address].filter(Boolean).join(' ')),
    openedYear: showOffer ? showOffer.openedYear : shop?.openedYear,
    price: showOffer?.price ?? shop?.askingPrice ?? 0,
    handoverItems: showOffer ? showOffer.handoverItems : shop?.handoverItems,
    retireDate: showOffer?.retireDate ?? shop?.retireDate,
    apprenticeMonths: showOffer?.apprenticeMonths ?? shop?.apprenticeMonths,
    workHours: showOffer ? showOffer.workHours : shop?.workHours,
  };
  const youthName = showOffer?.youthName ?? candidate?.name ?? offer?.youthName ?? '';
  const score = showOffer ? showOffer.matchScore : candidate?.score;
  const shopMeta = [view.openedYear ? `${view.openedYear}년부터` : '', view.category, view.mainMenu, view.location].filter(Boolean).join(' · ');
  const deadline = offer ? formatKoreanDate(offer.expiresAt.slice(0, 10)).replace(/^\d+년 /, '') : '';

  const goToProcess = async () => {
    await refreshMe();
    navigate('/succession/home');
  };

  const confirmDecision = () => {
    void run(async () => {
      if (decision === 'send' && candidate) {
        const created = await api.propose(candidate.youthId, offerMessage.trim() || null);
        setOfferMessage('');
        navigate(`/offers/current?offer=${created.id}`, { replace: true });
      }
      if (decision === 'reject' && offer) await api.rejectOffer(offer.id);
      if (decision === 'cancel' && offer) await api.cancelOffer(offer.id);
      if (decision === 'accept' && offer) {
        const accepted = await api.acceptOffer(offer.id);
        setAcceptedOffer(accepted);
        setDecision(null);
        await goToProcess();
        return;
      }
      await refreshMe();
      await reload();
    }).then((success) => { if (success) setDecision(null); });
  };

  const footer = isOwner ? (
    <>
      <ActionError message={actionError} />
      {offer?.status === 'PROPOSED' && <p className="offer-status" role="status">제안을 보냈어요. {deadline}까지 청년의 답변을 기다려요.</p>}
      {offer && !isActive && CLOSED_LABELS[offer.status] && <p className="offer-status" role="status">{CLOSED_LABELS[offer.status]}</p>}
      {offer?.status === 'ACCEPTED' ? (
        <Link to="/succession/home" className="btn btn-primary block">승계 과정 보기</Link>
      ) : explicitOfferId !== null && offer?.status !== 'PROPOSED' ? (
        <Link to="/education" className="btn btn-primary block">보낸 제안으로 돌아가기</Link>
      ) : (
        <button type="button" className="btn btn-primary block" disabled={busy || offer?.status === 'PROPOSED' || !candidate} onClick={() => setDecision('send')}>
          {offer?.status === 'PROPOSED' ? '제안 보냈어요' : '승계 제안하기'}
        </button>
      )}
      {offer?.status === 'PROPOSED' && <button type="button" className="btn btn-outline block" disabled={busy} onClick={() => setDecision('cancel')}>제안 거둬들이기</button>}
      {isDemoMode && offer?.status === 'PROPOSED' && <button type="button" className="btn btn-outline block" disabled={busy} onClick={() => void run(async () => {
        await login(offer.youthName, 'YOUTH', offer.youthId);
        navigate(`/offers/current?offer=${offer.id}`, { replace: true });
      })}>{offer.youthName} 님으로 받은 제안 보기</button>}

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
      <ActionError message={actionError} />
      <p className="offer-status" role="status">{offer?.status === 'ACCEPTED' ? '제안을 수락했어요.' : offer?.status === 'REJECTED' ? '제안을 거절했어요.' : '닫힌 제안이에요.'}</p>
      <Link to={offer?.status === 'ACCEPTED' ? '/succession/home' : '/education'} className="btn btn-primary block">
        {offer?.status === 'ACCEPTED' ? '승계 과정 보기' : '받은 제안으로 돌아가기'}
      </Link>
      {offer?.status === 'ACCEPTED' && <Link to="/succession/roadmap" className="btn btn-outline block">수습 로드맵 보기</Link>}
    </>
  );

  const canEdit = isOwner && !isActive && explicitOfferId === null;

  return (
    <FlowLayout title={title} backTo={backTo} backDisabled={busy} footer={footer} className="offer-page">
      {!isOwner && offer?.status === 'PROPOSED' && <span className="offer-badge offer-deadline">{deadline}까지 답해 주세요</span>}
      <h1 className="flow-title offer-title">
        {isOwner ? <>{youthName} 님에게<br />{showOffer ? '보낸 제안이에요' : '승계를 제안해 보세요'}</> : <>{view.ownerName} 사장님이<br />승계를 제안했어요</>}
      </h1>
      {!isOwner && <p className="succ-meta">{me?.name} 님이 받은 제안이에요.</p>}

      <ShopPhotoPicker files={isOwner ? shopPhotos : []} onChange={setShopPhotos} editable={canEdit} />
      {canEdit && <p className="succ-meta">사진은 이 화면에서 미리보기로 확인할 수 있어요.</p>}

      <div className="offer-shop-heading">
        <h2>{view.shopName}</h2>
        {score != null && <span className="offer-badge">적합도 {score}점</span>}
      </div>
      <p className="offer-shop-meta">{shopMeta}</p>
      <button type="button" className="offer-edit-link" disabled={busy} onClick={() => void reload()}>최신 내용 확인</button>
      {canEdit && <Link to="/owner/shop" className="offer-edit-link">가게 정보 수정</Link>}

      <section className="offer-card" aria-labelledby="offer-details-heading">
        <div className="offer-card-heading">
          <h2 id="offer-details-heading">{isOwner ? '물려줄 내용' : '제안 내용'}</h2>
          {canEdit && <Link to="/owner/terms" className="offer-edit-link">승계 조건 수정</Link>}
        </div>
        <dl className="offer-details">
          <div><dt>{isOwner ? '받을 금액' : '인수 금액'}</dt><dd><strong>{formatWon(view.price)}</strong></dd></div>
          <div><dt>{isOwner ? '함께 넘길 것' : '포함'}</dt><dd>{view.handoverItems || '선택한 항목 없음'}</dd></div>
          <div><dt>은퇴 희망일</dt><dd>{view.retireDate ? formatKoreanDate(view.retireDate) : '-'}</dd></div>
          <div><dt>{isOwner ? '함께 배우는 기간' : '수습 기간'}</dt><dd>{view.apprenticeMonths}개월</dd></div>
          <div><dt>근무 시간</dt><dd>{view.workHours || '-'}</dd></div>
        </dl>
      </section>

      <section className="offer-card offer-message" aria-labelledby="offer-message-heading">
        <h2 id="offer-message-heading">
          {canEdit ? <label htmlFor="offer-message">승계제안자에게 남길 말</label> : '사장님이 남긴 말'}
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

      <FlowDialog open={decision !== null} title={decision === 'accept' ? '승계 제안을 수락할까요?' : decision === 'reject' ? '이 제안을 거절할까요?' : decision === 'cancel' ? '보낸 제안을 거둬들일까요?' : '승계를 제안할까요?'} onClose={() => { if (!busy) setDecision(null); }}>
        <p>
          {decision === 'accept'
            ? `${view.shopName}의 제안 내용을 확인하셨나요? 수락하면 승계가 시작돼요.`
            : decision === 'reject'
              ? '거절한 제안은 다시 수락할 수 없어요.'
              : decision === 'cancel'
                ? '청년이 수락하기 전에 제안을 거둬들여요. 상대방에게 더 이상 수락할 제안으로 보이지 않아요.'
              : `${youthName} 님에게 위 조건으로 제안을 보내요.`}
        </p>
        <ActionError message={actionError} />
        <div className="flow-dialog-actions">
          <button type="button" className="btn btn-gray" disabled={busy} onClick={() => setDecision(null)}>돌아가기</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmDecision}>{decision === 'accept' ? '수락하기' : decision === 'reject' ? '거절하기' : decision === 'cancel' ? '거둬들이기' : '제안 보내기'}</button>
        </div>
      </FlowDialog>
    </FlowLayout>
  );
}
