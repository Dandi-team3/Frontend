import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { LoadStatus } from '../components/SuccessionUi';
import { isShopId, listedShopFromCandidate, type ListedShop } from '../data/shops';
import { api, orNull } from '../lib/api';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './MainFeaturePages.css';

export default function MatchingHubPage() {
  const { me, role } = useApp();
  const isOwner = role === 'owner';
  const [params, setParams] = useSearchParams();
  const requestedShopId = params.get('shop');
  const selectedId = isShopId(requestedShopId) ? requestedShopId : null;
  const profilePath = `/successor/register?from=matching${selectedId ? `&shop=${encodeURIComponent(selectedId)}` : ''}`;
  const [showResults, setShowResults] = useState(Boolean(selectedId));
  const { data, error, loading, reload } = useLoad(async () => {
    if (!me) return { viewerId: null, shop: null, profile: null, shops: [] as ListedShop[] };
    if (isOwner) return { viewerId: me.id, shop: await orNull(api.shop()), profile: null, shops: [] as ListedShop[] };
    const profile = await orNull(api.youthProfile());
    const candidates = profile ? await api.youthMatches() : [];
    return { viewerId: me.id, shop: null, profile, shops: candidates.map(listedShopFromCandidate) };
  }, [me?.id, role, me?.hasShop, me?.hasYouthProfile]);

  if (loading || error || !data || data.viewerId !== (me?.id ?? null)) return (
    <div className={`feature-page${isOwner ? ' owner-matching-hub' : ''}`}><h1>{isOwner ? '청년 찾기' : 'AI 매칭'}</h1><LoadStatus error={error} onRetry={() => void reload()} /></div>
  );
  if (isOwner) {
    const shop = data.shop;
    const active = Boolean(me?.successionId);
    return (
      <div className="feature-page owner-matching-hub">
        <p className="feature-eyebrow">청년 찾기</p><h1>가게를 이어갈 분을<br />찾아볼까요?</h1><p className="feature-intro">내 가게와 잘 맞는 청년을 살펴볼 수 있어요.</p>
        <section className="feature-card"><h2>{shop ? shop.name : '먼저 내 가게를 알려 주세요'}</h2><p>{shop ? `${shop.category} · ${shop.district}` : '가게 이름과 하는 음식, 물려줄 조건을 적어 주세요.'}</p>{active && <p>함께 진행 중인 승계가 있어요.</p>}<Link to={active ? '/education' : shop ? '/owner/matches' : '/owner/shop'} className="btn btn-primary block">{active ? '진행 상황 확인하기' : shop ? '맞는 청년 보기' : '내 가게 알려주기'}</Link>{shop && <Link to="/owner/shop" className="feature-text-link">가게 정보 고치기</Link>}</section>
        <div className="feature-steps" aria-label="청년 찾는 순서"><p><span>1</span> 청년의 이야기를 살펴봐요</p><p><span>2</span> 마음에 드는 분에게 제안해요</p><p><span>3</span> 제안이 받아들여지면 함께 시작해요</p></div>
      </div>
    );
  }

  const profile = data.profile;
  const categories = profile?.preferredCategories ?? [];
  const districts = profile?.preferredDistricts ?? [];
  const shops = selectedId ? data.shops.filter((item) => item.id === selectedId) : data.shops;
  const visible = showResults || Boolean(selectedId);
  const showAll = () => { setParams({}); setShowResults(true); };
  return (
    <div className="feature-page">
      <p className="feature-eyebrow">AI 매칭</p><h1>나의 다음 가게,<br />어디가 좋을까요?</h1><p className="feature-intro">경험과 자금, 희망 조건을 바탕으로 나에게 맞는 가게를 살펴보세요.</p>
      <section className="feature-card"><h2>{profile ? '내가 찾는 가게' : '나에게 맞는 조건부터'}</h2>{profile ? <><p>{categories.length ? categories.join(' · ') : '희망 업종 미정'}<br />{districts.length ? districts.join(' · ') : '희망 지역 미정'} · 준비 자금 {profile.fundsReady.toLocaleString('ko-KR')}만 원<br />{profile.loanPlanned ? `대출 계획 ${profile.loanAmount.toLocaleString('ko-KR')}만 원` : '대출 없이 준비해요'}</p><button type="button" className="btn btn-primary block" onClick={() => setShowResults(true)}>나와 맞는 가게 보기</button><Link to={profilePath} className="feature-text-link">매칭 조건 수정</Link></> : <><p>경력과 자금, 원하는 업종과 지역을 알려 주세요.</p><Link to={profilePath} className="btn btn-primary block">매칭 조건 입력하기</Link></>}</section>
      {visible && profile ? (
        <section className="feature-results" aria-labelledby="matching-results-heading">
          <div className="feature-section-heading"><h2 id="matching-results-heading">{selectedId ? '선택한 가게와 맞는 정도' : '나와 잘 맞는 가게'}</h2>{selectedId ? <button type="button" onClick={showAll}>전체 보기</button> : <button type="button" onClick={() => void reload()}>새로고침</button>}</div>
          {shops.length ? shops.map((shop) => <div className="feature-result" key={shop.id}><ShopCard shop={shop} showMatch />{shop.reasons.length > 0 && <ul className="matching-hub-reasons">{shop.reasons.map((reason, index) => <li className={reason.type === 'CAUTION' ? 'is-caution' : ''} key={`${reason.type}-${index}`}>{reason.text}</li>)}</ul>}</div>) : <div className="feature-card feature-empty"><h2>{selectedId ? '현재 추천 목록에서 찾을 수 없어요' : '아직 추천할 가게가 없어요'}</h2><p>{selectedId ? '다른 추천 가게를 살펴보거나 받은 제안을 확인해 주세요.' : '희망 업종과 지역을 넓히거나 나중에 다시 확인해 보세요.'}</p>{selectedId ? <button type="button" className="btn btn-primary block" onClick={showAll}>추천 가게 전체 보기</button> : <Link to={profilePath} className="btn btn-primary block">희망 조건 확인하기</Link>}</div>}
        </section>
      ) : <Link to="/shops" className="feature-browse-link">추천 가게 둘러보기 →</Link>}
      <p className="feature-footnote">사장님의 제안이 도착하면 승계교육 탭에서 내용을 확인하고 답할 수 있어요.</p>
    </div>
  );
}
