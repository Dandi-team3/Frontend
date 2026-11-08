import { Link } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { SHOPS } from '../data/shops';
import { useApp, useShopDraftLoader } from '../state/AppContext';
import { api } from '../lib/api';
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
  return (
    <div className="service-home">
      <section className="home-hero" aria-labelledby="home-heading">
        <span className="home-eyebrow">대구 노포 승계 플랫폼</span>
        <h1 id="home-heading">대구의 오래된 맛,<br />다음 이야기를 잇다</h1>
        <p>오래 지켜온 가게의 맛과 단골,<br />새로운 시작을 꿈꾸는 청년을 연결해요.</p>
        <Link to="/shops" className="home-hero-link">
          <span>이어갈 가게 둘러보기</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </Link>
      </section>

      <nav className="home-shortcuts" aria-label="주요 서비스 바로가기">
        <Link to="/shops" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="shops" /></span><strong>노포 찾기</strong><span>동네의 오래된 맛</span></Link>
        <Link to="/matching" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="matching" /></span><strong>AI 매칭</strong><span>나와 맞는 가게</span></Link>
        <Link to="/education" className="home-shortcut"><span className="home-shortcut-icon"><ShortcutIcon type="education" /></span><strong>승계 교육</strong><span>다음 걸음 준비</span></Link>
      </nav>

      <section className="home-section" aria-labelledby="home-shops-heading">
        <div className="home-section-heading">
          <div><p className="home-section-eyebrow">대구 곳곳의 이야기</p><h2 id="home-shops-heading">이야기가 있는 노포</h2></div>
          <Link to="/shops" className="home-more">전체 보기 <span aria-hidden="true">›</span></Link>
        </div>
        <p className="home-section-description">손님들의 하루에 오래 머물러 온 가게를 만나 보세요.</p>
        <div className="home-shop-list">{SHOPS.slice(0, 2).map((shop) => <ShopCard key={shop.id} shop={shop} />)}</div>
      </section>

      <section className="home-section home-how" aria-labelledby="home-how-heading">
        <p className="home-section-eyebrow">함께 이어가는 방법</p>
        <h2 id="home-how-heading">처음이어도 괜찮아요</h2>
        <p className="home-section-description">가게를 알아보는 순간부터, 나의 가게가 되기까지.</p>
        <ol className="home-step-list">
          {SERVICE_STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="home-step-number" aria-hidden="true">0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function OwnerHomeContent() {
  const { me, shopDraft } = useApp();
  useShopDraftLoader();
  const { data: offers } = useLoad(api.offers, [me?.id]);
  const offerStatus = me?.successionId ? 'accepted' : offers?.some((offer) => offer.status === 'PROPOSED') ? 'sent' : 'idle';
  const shopName = shopDraft.name.trim();
  const askingPrice = Number(shopDraft.askingPrice);

  return (
    <div className="service-home home-owner-page">
      <header className="home-owner-intro">
        <h1>{me?.name ? `${me.name} 사장님,` : '사장님,'}<br />함께할 청년을 찾아봐요</h1>
        <p>가게를 이어갈 청년을 살펴보고,<br />마음에 드는 분에게 제안해 보세요.</p>
      </header>

      <section className="home-owner-shop" aria-labelledby="home-own-shop-heading">
        <p className="home-owner-label">내 가게</p>
        <h2 id="home-own-shop-heading">{shopName || '가게 이야기를 들려주세요'}</h2>
        {shopName ? (
          <dl className="home-owner-facts">
            <div><dt>업종</dt><dd>{shopDraft.category || '아직 안 정했어요'}</dd></div>
            <div><dt>지역</dt><dd>{shopDraft.district.trim() || '아직 안 적었어요'}</dd></div>
            <div><dt>받을 금액</dt><dd>{shopDraft.askingPrice && Number.isFinite(askingPrice) && askingPrice > 0 ? `${askingPrice.toLocaleString('ko-KR')}만 원` : '아직 안 정했어요'}</dd></div>
          </dl>
        ) : <p className="home-owner-empty">가게 이름과 물려주고 싶은 조건을<br />하나씩 적으면 돼요.</p>}
        <Link to="/matching" className="btn btn-primary block home-owner-primary">청년 찾아보기</Link>
        <Link to="/owner/shop" className="btn block home-owner-secondary">가게 정보 고치기</Link>
      </section>

      <Link to="/education" className="home-owner-progress">
        <div>
          <h2>함께 진행할 약속</h2>
          <p>{offerStatus === 'accepted' ? '청년과 함께할 일과 배우는 과정을 확인하세요.' : offerStatus === 'sent' ? '보낸 제안과 청년의 답변을 확인하세요.' : '제안과 진행 상황을 한곳에서 확인하세요.'}</p>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </Link>

      <section className="home-section home-owner-recommended" aria-labelledby="home-owner-shops-heading">
        <div className="home-section-heading">
          <h2 id="home-owner-shops-heading">다른 가게 이야기</h2>
          <Link to="/shops" className="home-more">가게 보기 <span aria-hidden="true">›</span></Link>
        </div>
        <p className="home-section-description">다른 사장님의 가게도 살펴보세요.</p>
        <div className="home-shop-list">{SHOPS.slice(0, 2).map((shop) => <ShopCard key={shop.id} shop={shop} />)}</div>
      </section>
    </div>
  );
}

export default function HomePage() {
  const { role } = useApp();
  return role === 'owner' ? <OwnerHomeContent /> : <SuccessorHomeContent />;
}
