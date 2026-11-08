import { Link, useParams } from 'react-router-dom';
import { LoadStatus } from '../components/SuccessionUi';
import ShopCatalogPhoto from '../components/ShopCatalogPhoto';
import ShopPhotoPicker from '../components/ShopPhotoPicker';
import { isShopId, listedShopFromOffer, useShopListings } from '../data/shops';
import { api } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './ShopDetailPage.css';

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { me, role, shopPhotos, setShopPhotos } = useApp();
  const isOwner = role === 'owner';
  const validId = isShopId(id);
  const listings = useShopListings();
  const related = useLoad(async () => {
    const offers = !isOwner && validId ? await api.offers() : [];
    return { viewerId: me?.id, offers: offers.filter((offer) => String(offer.shopId) === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }, [me?.id, role, id]);

  if (validId && (listings.loading || listings.error || !listings.data || related.loading || related.error || !related.data || related.data.viewerId !== me?.id)) {
    return <section className="shop-detail-page"><h1 className="shop-detail-loading-title">{isOwner ? '내 가게' : '가게 자세히 보기'}</h1><LoadStatus error={listings.error ?? related.error} onRetry={() => { void listings.reload(); void related.reload(); }} /></section>;
  }
  const offers = related.data?.offers ?? [];
  const candidate = listings.data?.shops.find((item) => item.id === id);
  const shop = validId ? candidate ?? (offers[0] ? listedShopFromOffer(offers[0]) : undefined) : undefined;
  if (!shop) return (
    <section className="shop-detail-page shop-detail-not-found" aria-labelledby="shop-not-found-title">
      <h1 id="shop-not-found-title">가게를 찾을 수 없어요</h1>
      <p>{isOwner ? '내 가게 목록에서 다시 확인해 주세요.' : '추천 목록에 없거나 현재 확인할 수 없는 가게예요. 받은 제안은 승계교육에서 확인할 수 있어요.'}</p>
      <Link to="/shops" className="btn btn-primary block">{isOwner ? '내 가게 보기' : '가게 목록으로'}</Link>
      {!isOwner && <Link to="/education" className="shop-detail-secondary-link">받은 제안 확인하기</Link>}
    </section>
  );

  const { details } = shop;
  const conditions: { label: string; value: string }[] = [
    { label: isOwner ? '가게를 넘길 금액' : '희망 인수 금액', value: details.amount === null ? '등록 금액 확인 필요' : `${details.amount.toLocaleString('ko-KR')}만 원` },
    { label: '은퇴 희망일', value: details.retireDate ? formatKoreanDate(details.retireDate) : '미등록' },
  ];
  if (shop.source !== 'match') {
    conditions.push({ label: isOwner ? '함께 넘기는 것' : '인수 금액에 포함', value: details.included || '등록하지 않았어요' });
    if (details.trainingMonths !== null) conditions.push({ label: isOwner ? '함께 배우는 기간' : '수습 기간', value: `${details.trainingMonths}개월` });
    if (details.workHours) conditions.push({ label: isOwner ? '함께 일할 시간' : '근무 시간', value: details.workHours });
    if (details.earlyMorning !== null) conditions.push({ label: '새벽 근무', value: details.earlyMorning ? '필요해요' : '필수 조건은 아니에요' });
  }
  const hasOwnPhotos = isOwner && shop.source === 'own' && shopPhotos.length > 0;

  return (
    <section className={`shop-detail-page${isOwner ? ' is-owner' : ''}`} aria-labelledby="shop-detail-title">
      <Link to="/shops" className="shop-detail-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>{isOwner ? '내 가게' : '가게 목록'}</Link>
      <figure className="shop-detail-photo">
        {hasOwnPhotos ? <ShopPhotoPicker files={shopPhotos} onChange={setShopPhotos} editable={false} /> : <ShopCatalogPhoto image={shop.image} className="shop-detail-hero" loading="eager" />}
        <figcaption>{hasOwnPhotos ? '이 브라우저에서 등록한 사진' : '가게 분위기 참고 사진'}</figcaption>
      </figure>
      <div className="shop-detail-intro">
        <p className="shop-detail-location">{details.district} · {details.category}</p><h1 id="shop-detail-title">{details.name}</h1>
        {details.address && <p className="shop-detail-address">{details.address}</p>}
        {details.owner && <p className="shop-detail-owner">{details.owner} 사장님</p>}
        {details.openedYear && <p className="shop-detail-address">{details.openedYear}년 개업</p>}
        {shop.source === 'offer' && <p className="shop-detail-snapshot-note">최근 받은 제안에 담긴 가게 정보예요.</p>}
      </div>
      {details.mainMenu && <section className="shop-detail-section" aria-labelledby="shop-menu-title"><h2 id="shop-menu-title">대표 메뉴</h2><p className="shop-detail-story">{details.mainMenu}</p></section>}
      <section className="shop-detail-section" aria-labelledby="shop-conditions-title"><h2 id="shop-conditions-title">{isOwner ? '넘기는 조건' : '승계 조건'}</h2><dl className="shop-detail-conditions">{conditions.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{shop.source === 'match' && <p className="shop-detail-info-note">포함 항목과 배우는 기간, 근무 시간은 사장님이 보낸 제안에서 확인할 수 있어요.</p>}</section>
      {shop.matchScore !== null && <section className="shop-detail-section" aria-labelledby="shop-fit-title"><div className="shop-detail-fit-heading"><h2 id="shop-fit-title">{shop.source === 'offer' ? '제안 당시 적합도' : '나와 맞는 정도'}</h2><strong>{shop.matchScore}<span>점</span></strong></div>{shop.breakdown.length > 0 && <dl className="shop-detail-breakdown">{shop.breakdown.map((part, index) => <div key={`${part.name}-${index}`}><dt>{part.name}</dt><dd><span className="shop-detail-fit-track"><span style={{ width: `${part.max > 0 ? Math.max(0, Math.min(100, part.points / part.max * 100)) : 0}%` }} /></span><span>{part.points}/{part.max}</span></dd></div>)}</dl>}{shop.reasons.length > 0 && <ul className="shop-detail-highlights">{shop.reasons.map((reason, index) => <li key={`${reason.type}-${index}`} className={reason.type === 'CAUTION' ? 'is-caution' : ''}><span aria-hidden="true">{reason.type === 'CAUTION' ? '!' : '✓'}</span>{reason.text}</li>)}</ul>}</section>}
      {details.message && <section className="shop-detail-section"><h2>{isOwner ? '청년에게 남긴 말' : '사장님이 남긴 말'}</h2><p className="shop-detail-story">{details.message}</p></section>}
      {!isOwner && offers.length > 0 && <section className="shop-detail-section" aria-labelledby="shop-offers-title"><h2 id="shop-offers-title">이 가게에서 받은 제안</h2><ul className="shop-detail-offers">{offers.map((offer) => <li key={offer.id}><Link to={`/offers/current?offer=${offer.id}`}><span>{offer.status === 'PROPOSED' ? '답변할 제안' : offer.status === 'ACCEPTED' ? '수락한 제안' : offer.status === 'REJECTED' ? '거절한 제안' : offer.status === 'CANCELED' ? '거둬들인 제안' : offer.status === 'EXPIRED' ? '기한이 지난 제안' : '닫힌 제안'}</span><strong>제안 내용 확인하기 <span aria-hidden="true">›</span></strong></Link></li>)}</ul></section>}
      <div className="shop-detail-action"><p>{isOwner ? '내 가게를 이어갈 청년을 살펴보세요.' : '사장님이 제안을 보내면 승계교육에서 내용을 확인하고 답할 수 있어요.'}</p><Link to={isOwner ? '/matching' : offers.length ? '/education' : `/matching?shop=${shop.id}`} className="btn btn-primary block">{isOwner ? '내 가게에 맞는 청년 찾기' : offers.length ? '받은 제안 확인하기' : '이 가게와 매칭 확인하기'}</Link>{isOwner && <Link to="/owner/shop" className="shop-detail-secondary-link">가게 정보 고치기</Link>}</div>
    </section>
  );
}
