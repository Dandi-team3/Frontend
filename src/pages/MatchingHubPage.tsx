import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { LoadStatus } from '../components/SuccessionUi';
import { SHOPS, getShopById } from '../data/shops';
import { api, orNull } from '../lib/api';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './MainFeaturePages.css';

export default function MatchingHubPage() {
  const { me, role } = useApp();
  const isOwner = role === 'owner';
  const [params, setParams] = useSearchParams();
  const selected = getShopById(params.get('shop') ?? '');
  const profilePath = `/successor/register?from=matching${selected ? `&shop=${encodeURIComponent(selected.id)}` : ''}`;
  const [showResults, setShowResults] = useState(Boolean(selected));
  const { data, error, loading, reload } = useLoad(async () => {
    if (!me) return { viewerId: null, shop: null, profile: null };
    if (isOwner) return { viewerId: me.id, shop: await orNull(api.shop()), profile: null };
    return { viewerId: me.id, shop: null, profile: await orNull(api.youthProfile()) };
  }, [me?.id, role, me?.hasShop, me?.hasYouthProfile]);

  if (loading || error || !data || data.viewerId !== (me?.id ?? null)) {
    return (
      <div className={`feature-page${isOwner ? ' owner-matching-hub' : ''}`}>
        <h1>{isOwner ? '청년 찾기' : 'AI 매칭'}</h1>
        <LoadStatus error={error} onRetry={() => void reload()} />
      </div>
    );
  }

  if (isOwner) {
    const shop = data.shop;
    return (
      <div className="feature-page owner-matching-hub">
        <p className="feature-eyebrow">청년 찾기</p>
        <h1>가게를 이어갈 분을<br />찾아볼까요?</h1>
        <p className="feature-intro">내 가게와 잘 맞는 청년을 살펴볼 수 있어요.</p>
        <section className="feature-card">
          <h2>{shop ? shop.name : '먼저 내 가게를 알려 주세요'}</h2>
          <p>{shop ? `${shop.category} · ${shop.district}` : '가게 이름과 하는 음식, 물려줄 조건을 적어 주세요.'}</p>
          <Link to={shop ? '/owner/matches' : '/owner/shop'} className="btn btn-primary block">{shop ? '맞는 청년 보기' : '내 가게 알려주기'}</Link>
          {shop && <Link to="/owner/shop" className="feature-text-link">가게 정보 고치기</Link>}
        </section>
        <div className="feature-steps" aria-label="청년 찾는 순서">
          <p><span>1</span> 청년의 이야기를 살펴봐요</p>
          <p><span>2</span> 마음에 드는 분에게 제안해요</p>
          <p><span>3</span> 제안이 받아들여지면 함께 시작해요</p>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const categories = profile?.preferredCategories ?? [];
  const districts = profile?.preferredDistricts ?? [];
  const ranked = SHOPS.filter((item) => !selected || item.id === selected.id).map((item) => {
    const categoryMatch = categories.includes(item.details.category);
    const districtMatch = districts.includes(item.details.district);
    const budgetMatch = Boolean(profile && profile.fundsReady >= (item.details.amount ?? Infinity));
    return {
      ...item,
      comparisonPoints: Number(categoryMatch) + Number(districtMatch) + Number(budgetMatch),
      matchReasons: [categoryMatch ? '희망하는 업종이에요' : '', districtMatch ? '희망하는 지역에 있어요' : '', budgetMatch ? '준비한 자금 안에서 살펴볼 수 있어요' : '인수 금액과 자금 계획을 함께 확인해 보세요'].filter(Boolean),
    };
  }).sort((a, b) => b.comparisonPoints - a.comparisonPoints);

  return (
    <div className="feature-page">
      <p className="feature-eyebrow">AI 매칭</p>
      <h1>나의 다음 가게,<br />어디가 좋을까요?</h1>
      <p className="feature-intro">저장한 경력과 자금, 희망 업종·지역을 확인해 보세요.</p>
      <section className="feature-card">
        <h2>{profile ? '내가 찾는 가게' : '나에게 맞는 조건부터'}</h2>
        {profile ? (
          <>
            <p>{categories.length ? categories.join(' · ') : '희망 업종 미정'}<br />{districts.length ? districts.join(' · ') : '희망 지역 미정'} · 준비 자금 {profile.fundsReady.toLocaleString('ko-KR')}만 원<br />{profile.loanPlanned ? `대출 계획 ${profile.loanAmount.toLocaleString('ko-KR')}만 원` : '대출 없이 준비해요'}</p>
            <button type="button" className="btn btn-primary block" onClick={() => setShowResults(true)}>내 조건으로 예시 가게 둘러보기</button>
            <Link to={profilePath} className="feature-text-link">매칭 조건 수정</Link>
          </>
        ) : (
          <>
            <p>원하는 조건을 입력하면 가게를 더 편하게 살펴볼 수 있어요.</p>
            <Link to={profilePath} className="btn btn-primary block">매칭 조건 입력하기</Link>
          </>
        )}
      </section>
      {showResults && profile ? (
        <section className="feature-results" aria-labelledby="matching-results-heading">
          <div className="feature-section-heading"><h2 id="matching-results-heading">{selected ? '선택한 예시 가게 살펴보기' : '내 조건으로 비교한 예시 가게'}</h2>{selected && <button type="button" onClick={() => setParams({})}>전체 보기</button>}</div>
          <p className="feature-footnote">예시 가게를 내 조건으로 비교해요. AI 추천 연결은 준비 중이에요.</p>
          {ranked.map((item) => <div className="feature-result" key={item.id}><ShopCard shop={item} /><ul>{item.matchReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>)}
        </section>
      ) : (
        <Link to="/shops" className="feature-browse-link">먼저 대구의 오래된 가게 둘러보기 →</Link>
      )}
      <p className="feature-footnote">사장님의 제안이 도착하면 승계교육 탭에서 내용을 확인하고 답할 수 있어요.</p>
    </div>
  );
}
