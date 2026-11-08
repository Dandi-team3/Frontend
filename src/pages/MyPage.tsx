import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useLoad } from '../lib/useApi';
import { useApp, useShopDraftLoader } from '../state/AppContext';
import './MyPage.css';

type MenuIcon = 'person' | 'shop' | 'conditions' | 'offer';

function MyMenuIcon({ kind }: { kind: MenuIcon }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'person' && <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>}
      {kind === 'shop' && <><path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5" /></>}
      {kind === 'conditions' && <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="var(--sky-50)" /><circle cx="16" cy="12" r="2" fill="var(--sky-50)" /><circle cx="10" cy="18" r="2" fill="var(--sky-50)" /></>}
      {kind === 'offer' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>}
    </svg>
  );
}

function MenuArrow() {
  return (
    <svg className="my-page-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export default function MyPage() {
  const { me, role, personalInfo, shopDraft } = useApp();
  useShopDraftLoader();
  const { data: offers, error, loading, reload } = useLoad(api.offers, [me?.id]);
  const offerStatus = me?.successionId ? 'accepted' : offers?.some((offer) => offer.status === 'PROPOSED') ? 'sent' : 'idle';
  const location = useLocation();
  const locationState: unknown = location.state;
  const notice = locationState && typeof locationState === 'object' && 'notice' in locationState && typeof locationState.notice === 'string'
    ? locationState.notice
    : null;
  const isOwner = role === 'owner';
  const name = me?.name || personalInfo.name.trim();
  const age = personalInfo.age.trim();
  const shopReady = Boolean(me?.hasShop);
  const youthReady = Boolean(me?.hasYouthProfile);
  const ready = isOwner ? shopReady : youthReady;
  const statusLabel = isOwner
    ? (ready ? '가게 정보 입력 완료' : '가게 정보 입력 중')
    : (ready ? '매칭 조건 입력 완료' : '매칭 조건 입력 중');
  const offerDescription = offerStatus === 'accepted'
    ? '수락한 제안과 진행 상황을 봐요'
    : offerStatus === 'sent'
      ? '청년의 답변을 기다리고 있어요'
      : isOwner ? '청년에게 보낸 제안을 확인해요' : '사장님이 보낸 제안을 확인해요';
  const items: { to: string; title: string; description: string; icon: MenuIcon }[] = [
    { to: '/my/profile', title: '내 정보', description: '이름과 나이, 연락처를 확인해요', icon: 'person' },
    isOwner
      ? { to: '/owner/shop', title: '내 가게', description: shopDraft.name.trim() || '가게와 물려줄 내용을 적어요', icon: 'shop' }
      : { to: '/successor/register', title: '매칭 조건', description: '경력과 희망하는 가게를 알려 주세요', icon: 'conditions' },
    { to: '/education', title: isOwner ? '보낸 제안' : '받은 제안', description: offerDescription, icon: 'offer' },
  ];

  return (
    <div className={`my-page${isOwner ? ' my-page-owner' : ''}`}>
      {notice && <p className="my-page-notice" role="status">{notice}</p>}
      {loading && <p role="status">제안을 불러오고 있어요.</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => void reload()}>다시 시도</button></p>}

      <header className="my-page-heading">
        <h1>{isOwner ? '사장님, 안녕하세요' : '나의 물려받기'}</h1>
        <p>{isOwner ? '필요한 정보를 편하게 확인하세요.' : '내 정보부터 승계 준비까지, 한곳에서.'}</p>
      </header>

      <Link to="/my/profile" className="my-page-profile" aria-label="내 정보 수정">
        <span className="my-page-avatar" aria-hidden="true">
          {name ? name.slice(0, 1) : <MyMenuIcon kind="person" />}
        </span>
        <span className="my-page-profile-copy">
          <strong>{name || '이름을 입력해 주세요'}</strong>
          <span><span>{age ? `${age}세` : '나이 미입력'}</span><span className="my-page-role">{isOwner ? '사장님' : '청년'}</span></span>
        </span>
        <span className="my-page-profile-edit">수정<MenuArrow /></span>
      </Link>

      <p className={`my-page-readiness${ready ? ' is-ready' : ''}`}>
        <span aria-hidden="true">{ready ? '✓' : '·'}</span>{statusLabel}
      </p>

      {offerStatus === 'accepted' && (
        <Link to="/education" className="my-page-progress-link">
          <span className="my-page-progress-check" aria-hidden="true">✓</span>
          <span><strong>진행 중인 승계</strong><span>일정과 지금 할 일을 확인하세요</span></span>
          <MenuArrow />
        </Link>
      )}

      <nav className="my-page-section" aria-labelledby="my-page-menu-heading">
        <h2 id="my-page-menu-heading">나의 메뉴</h2>
        <ul className="my-page-menu">
          {items.map(({ to, title, description, icon }) => (
            <li key={title}>
              <Link to={to} className="my-page-menu-link">
                <span className="my-page-menu-icon"><MyMenuIcon kind={icon} /></span>
                <span className="my-page-menu-copy"><strong>{title}</strong><span>{description}</span></span>
                <MenuArrow />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="my-page-section my-page-service" aria-labelledby="my-page-service-heading">
        <h2 id="my-page-service-heading">서비스 안내</h2>
        <ul>
          <li><Link to="/my/terms"><span>이용약관</span><MenuArrow /></Link></li>
          <li><Link to="/my/privacy"><span>개인정보 처리방침</span><MenuArrow /></Link></li>
          <li><Link to="/my/about"><span>서비스 소개</span><MenuArrow /></Link></li>
        </ul>
      </nav>
    </div>
  );
}
