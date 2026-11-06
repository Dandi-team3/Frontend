import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { SHOPS, getShopById } from '../data/shops';
import { useDemo } from '../state/DemoContext';
import './MainFeaturePages.css';

export default function MatchingHubPage() {
  const { role, shop, shopDraft, youthProfile } = useDemo();
  const [params, setParams] = useSearchParams();
  const selected = getShopById(params.get('shop') ?? '');
  const profilePath = `/successor/register?from=matching${selected ? `&shop=${encodeURIComponent(selected.id)}` : ''}`;
  const [showResults, setShowResults] = useState(Boolean(selected));
  const ownerReady = Boolean(shopDraft.name.trim() && shopDraft.category && shopDraft.district.trim() && shop.amount !== null);
  const youthReady = Boolean(youthProfile.experience && youthProfile.funds !== '' && youthProfile.loanPlan && youthProfile.industries.length && youthProfile.regions.length);

  if (role === 'owner') {
    return (
      <div className="feature-page owner-matching-hub">
        <p className="feature-eyebrow">청년 찾기</p>
        <h1>가게를 이어갈 분을<br />찾아볼까요?</h1>
        <p className="feature-intro">가게 정보를 알려 주시면 잘 맞는 청년을 살펴볼 수 있어요.</p>
        <section className="feature-card">
          <h2>{ownerReady ? shop.name : '먼저 내 가게를 알려 주세요'}</h2>
          <p>{ownerReady ? `${shop.category} · ${shop.district}` : '가게 이름과 하는 음식, 물려줄 조건을 적어 주세요.'}</p>
          <Link to={ownerReady ? '/owner/matches' : '/owner/shop'} className="btn btn-primary block">{ownerReady ? '맞는 청년 보기' : '내 가게 알려주기'}</Link>
          {ownerReady && <Link to="/owner/shop" className="feature-text-link">가게 정보 고치기</Link>}
        </section>
        <div className="feature-steps" aria-label="청년 찾는 순서">
          <p><span>1</span> 청년의 이야기를 살펴봐요</p>
          <p><span>2</span> 마음에 드는 분에게 제안해요</p>
          <p><span>3</span> 제안이 받아들여지면 함께 시작해요</p>
        </div>
      </div>
    );
  }

  const ranked = SHOPS.filter((item) => !selected || item.id === selected.id).map((item) => {
    const categoryMatch = youthProfile.industries.includes(item.details.category);
    const districtMatch = youthProfile.regions.includes(item.details.district);
    const budgetMatch = Number(youthProfile.funds) >= (item.details.amount ?? Infinity);
    return {
      ...item,
      matchScore: 40 + Number(categoryMatch) * 25 + Number(districtMatch) * 20 + Number(budgetMatch) * 15,
      matchReasons: [categoryMatch ? '희망하는 업종이에요' : '', districtMatch ? '희망하는 지역에 있어요' : '', budgetMatch ? '준비한 자금 안에서 살펴볼 수 있어요' : '인수 금액과 자금 계획을 함께 확인해 보세요'].filter(Boolean),
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="feature-page">
      <p className="feature-eyebrow">AI 매칭</p>
      <h1>나의 다음 가게,<br />어디가 좋을까요?</h1>
      <p className="feature-intro">경험과 자금, 희망 업종·지역을 정하고 가게를 비교해 보세요.</p>
      <section className="feature-card">
        <h2>{youthReady ? '내가 찾는 가게' : '나에게 맞는 조건부터'}</h2>
        {youthReady ? (
          <>
            <p>{youthProfile.industries.join(' · ')}<br />{youthProfile.regions.join(' · ')} · 준비 자금 {Number(youthProfile.funds).toLocaleString('ko-KR')}만 원</p>
            <button type="button" className="btn btn-primary block" onClick={() => setShowResults(true)}>조건에 맞는 가게 보기</button>
            <Link to={profilePath} className="feature-text-link">매칭 조건 수정</Link>
          </>
        ) : (
          <>
            <p>원하는 조건을 입력하면 가게를 더 편하게 살펴볼 수 있어요.</p>
            <Link to={profilePath} className="btn btn-primary block">매칭 조건 입력하기</Link>
          </>
        )}
      </section>
      {showResults && youthReady ? (
        <section className="feature-results" aria-labelledby="matching-results-heading">
          <div className="feature-section-heading"><h2 id="matching-results-heading">{selected ? '선택한 가게 살펴보기' : '내 조건으로 살펴본 가게'}</h2>{selected && <button type="button" onClick={() => setParams({})}>전체 보기</button>}</div>
          {ranked.map((item) => <div className="feature-result" key={item.id}><ShopCard shop={item} showMatch /><ul>{item.matchReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>)}
        </section>
      ) : (
        <Link to="/shops" className="feature-browse-link">먼저 대구의 오래된 가게 둘러보기 →</Link>
      )}
      <p className="feature-footnote">사장님의 제안이 도착하면 승계교육 탭에서 내용을 확인하고 답할 수 있어요.</p>
    </div>
  );
}
