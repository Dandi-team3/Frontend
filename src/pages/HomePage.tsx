import { Link } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { useShopListings } from '../data/shops';
import { LoadStatus } from '../components/SuccessionUi';
import { useApp } from '../state/AppContext';
import { api, orNull } from '../lib/api';
import { useLoad } from '../lib/useApi';
import './HomePage.css';

const SERVICE_STEPS = [
  { title: '마음에 드는 노포 탐색', description: '가게의 이야기와 물려받을 조건을 살펴봐요.' },
  { title: '조건 확인과 제안 수락', description: '나의 조건을 정하고, 사장님이 보낸 제안을 살펴봐요.' },
  { title: '함께 배우며 가게 승계', description: '사장님 곁에서 맛과 운영을 배우며 차근차근 준비해요.' },
];

function ShortcutIcon({ type }: { type: 'shops' | 'matching' | 'education' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === 'shops' && <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5" /></>}
      {type === 'matching' && <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3ZM20 2v4M18 4h4" /></>}
      {type === 'education' && <><path d="m2 8 10-5 10 5-10 5L2 8ZM6 10v6c3 3 9 3 12 0v-6M22 8v8" /></>}
    </svg>
  );
}

function SuccessorHomeContent() {
  const { data, loading, error, reload } = useShopListings();
  return (
    <div className="service-home">
      <ReceivedOffers />
      <section className="home-hero" aria-labelledby="home-heading">
        <span className="home-eyebrow">대구 노포 승계 플랫폼</span>
        <h1 id="home-heading">대구의 오래된 맛,<br />다음 이야기를 잇다</h1>
        <p>오래 지켜온 가게의 맛과 단골,<br />새로운 시작을 꿈꾸는 청년을 연결해요.</p>
        <Link to="/shops" className="home-hero-link"><span>이어갈 가게 둘러보기</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      </section>
      <nav className="home-shortcuts" aria-label="주요 서비스 바로가기">
        <Link to="/shops" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="shops" /></span><strong>노포 찾기</strong><span>이어갈 가게 살펴보기</span></Link>
        <Link to="/matching" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="matching" /></span><strong>AI 매칭</strong><span>나와 맞는 가게</span></Link>
        <Link to="/education" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="education" /></span><strong>받은 제안</strong><span>수락과 승계 과정</span></Link>
      </nav>
      <section className="home-section" aria-labelledby="home-shops-heading">
        <div className="home-section-heading"><div><p className="home-section-eyebrow">나의 조건으로 찾은 가게</p><h2 id="home-shops-heading">이어갈 가게를 만나 보세요</h2></div><Link to="/shops" className="home-more">전체 보기 <span aria-hidden="true">›</span></Link></div>
        <p className="home-section-description">저장한 경력과 희망 조건에 잘 맞는 순서로 보여드려요.</p>
        {loading || error || !data ? <div className="home-data-state"><LoadStatus error={error} onRetry={() => void reload()} /></div> : data.shops.length ? (
          <div className="home-shop-list">{data.shops.slice(0, 3).map((shop) => <ShopCard key={shop.id} shop={shop} showMatch />)}</div>
        ) : <div className="home-empty"><h3>{data.profileMissing ? '먼저 희망 조건을 알려 주세요' : '아직 추천할 가게가 없어요'}</h3><p>{data.profileMissing ? '경력과 자금, 찾는 업종·지역을 적으면 가게를 살펴볼 수 있어요.' : '희망 업종과 지역을 넓혀 보세요. 새로운 가게가 등록되면 다시 확인할 수 있어요.'}</p><Link to="/successor/register" className="home-empty-link">희망 조건 확인하기 →</Link></div>}
      </section>
      <section className="home-section home-how" aria-labelledby="home-how-heading">
        <p className="home-section-eyebrow">함께 이어가는 방법</p><h2 id="home-how-heading">처음이어도 괜찮아요</h2><p className="home-section-description">가게를 알아보는 순간부터, 나의 가게가 되기까지.</p>
        <ol className="home-step-list">{SERVICE_STEPS.map((step, index) => <li key={step.title}><span className="home-step-number" aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
      </section>
    </div>
  );
}

function ReceivedOffers() {
  const { me } = useApp();
  const { data, loading, error, reload } = useLoad(async () => {
    const [offers, summary] = await Promise.all([api.offers(), orNull(api.currentSuccession())]);
    return { viewerId: me?.id, offers, summary };
  }, [me?.id]);
  const current = data?.viewerId === me?.id ? data : null;
  const pending = current?.offers.filter((offer) => offer.status === 'PROPOSED').sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];
  const first = pending[0];
  const summary = current?.summary;
  return <section className="home-inbox" aria-labelledby="home-inbox-title">
    <div className="home-inbox-heading"><h2 id="home-inbox-title">{summary ? '함께하는 승계 과정' : '받은 승계 제안'}</h2><button type="button" onClick={() => void reload()}>새로 확인</button></div>
    <p className="home-inbox-viewer">{me?.name} 님의 제안함이에요.</p>
    {loading || error || !current ? <LoadStatus error={error} onRetry={() => void reload()} /> : <>
      {summary && <div className="home-inbox-progress"><strong>{summary.shopName}</strong><p>{summary.status === 'COMPLETED' ? '승계를 마쳤어요. 함께한 기록을 확인하세요.' : `${summary.ownerName} 사장님과 ${summary.statusLabel} 단계를 진행하고 있어요.`}</p><Link className="home-inbox-primary" to="/succession/home">{summary.status === 'COMPLETED' ? '마친 승계 과정 보기' : '승계 과정 이어보기'}</Link><Link className="home-inbox-secondary" to="/succession/roadmap">수습 로드맵 보기 →</Link>{!summary.planAgreedByBoth && <p>체크리스트와 두 분의 계획 동의를 마치면 수습 로드맵이 열려요.</p>}</div>}
      {first ? <div className="home-inbox-proposal"><strong>사장님의 제안 {pending.length}건이 도착했어요</strong><p>{first.ownerName} 사장님 · {first.shopName}</p><Link className="home-inbox-primary" to={`/offers/current?offer=${first.id}`}>제안 확인하고 답하기</Link></div> : !summary && <p>사장님이 제안을 보내면 여기에 표시돼요.</p>}
      <Link className="home-inbox-secondary" to="/education">받은 제안과 전체 과정 보기 →</Link>
    </>}
  </section>;
}

function OwnerHomeContent() {
  const { me } = useApp();
  const hasSuccession = Boolean(me?.successionId);
  const completed = me?.successionStatus === 'COMPLETED';
  const { data, loading, error, reload } = useShopListings();
  const progress = useLoad(async () => {
    const [summary, offers] = await Promise.all([orNull(api.currentSuccession()), api.offers()]);
    return { viewerId: me?.id, summary, waitingCount: offers.filter((offer) => offer.status === 'PROPOSED').length };
  }, [me?.id, me?.successionId]);
  const shop = data?.shops[0];
  const knownProgress = progress.data?.viewerId === me?.id ? progress.data : null;
  return (
    <div className="service-home home-owner-page">
      <header className="home-owner-intro"><h1>{me?.name ? `${me.name} 사장님,` : '사장님,'}<br />{completed ? '가게의 다음 이야기를 이었어요' : hasSuccession ? '함께할 다음 단계를 확인해요' : '함께할 청년을 찾아봐요'}</h1><p>{completed ? <>함께 마친 과정과<br />가게를 이어 온 기록을 확인하세요.</> : hasSuccession ? <>지금 할 일과 일정을<br />하나씩 확인해 보세요.</> : <>가게를 이어갈 청년을 살펴보고,<br />마음에 드는 분에게 제안해 보세요.</>}</p></header>
      <section className="home-owner-shop" aria-labelledby="home-own-shop-heading">
        <p className="home-owner-label">내 가게</p>
        {loading || error || !data ? <LoadStatus error={error} onRetry={() => void reload()} /> : shop ? <><h2 id="home-own-shop-heading">{shop.details.name}</h2><dl className="home-owner-facts"><div><dt>업종</dt><dd>{shop.details.category}</dd></div><div><dt>지역</dt><dd>{shop.details.district}</dd></div><div><dt>받을 금액</dt><dd>{shop.details.amount === null ? '등록 금액 확인 필요' : `${shop.details.amount.toLocaleString('ko-KR')}만 원`}</dd></div></dl><Link to={hasSuccession ? '/education' : '/matching'} className="btn btn-primary block home-owner-primary">{completed ? '마친 승계 보기' : hasSuccession ? '진행 상황 보기' : '청년 찾아보기'}</Link><Link to={`/shops/${shop.id}`} className="btn block home-owner-secondary">내 가게 자세히 보기</Link></> : <><h2 id="home-own-shop-heading">가게를 알려 주세요</h2><p className="home-owner-empty">가게 이름과 물려주고 싶은 조건을<br />하나씩 적으면 돼요.</p><Link to="/owner/shop" className="btn btn-primary block home-owner-primary">내 가게 알려주기</Link></>}
      </section>
      <section className="home-section" aria-labelledby="home-owner-progress-heading">
        <h2 id="home-owner-progress-heading">함께 진행할 약속</h2>
        {progress.loading || progress.error || !knownProgress ? <div className="home-data-state"><LoadStatus error={progress.error} onRetry={() => void progress.reload()} /></div> : <Link to="/education" className="home-owner-progress"><div><h3>{knownProgress.summary?.status === 'COMPLETED' ? '마친 승계 확인하기' : knownProgress.summary ? '지금 할 일 확인하기' : knownProgress.waitingCount ? `답변을 기다리는 제안 ${knownProgress.waitingCount}개` : '보낸 제안 확인하기'}</h3><p>{knownProgress.summary?.status === 'COMPLETED' ? '함께 마친 과정과 기록을 확인하세요.' : knownProgress.summary ? '청년과 함께할 일과 배우는 과정을 확인하세요.' : knownProgress.waitingCount ? '보낸 내용과 청년의 답변을 확인하세요.' : '제안과 진행 상황을 한곳에서 확인하세요.'}</p></div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></Link>}
      </section>
      <Link to="/owner/shop" className="home-owner-edit-link">가게 정보 고치기 <span aria-hidden="true">→</span></Link>
    </div>
  );
}

export default function HomePage() {
  const { role } = useApp();
  return role === 'owner' ? <OwnerHomeContent /> : <SuccessorHomeContent />;
}
