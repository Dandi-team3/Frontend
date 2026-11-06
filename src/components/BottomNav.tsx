import { Link, useLocation } from 'react-router-dom';
import { useDemo } from '../state/DemoContext';
import './BottomNav.css';

type Tab = 'home' | 'shops' | 'matching' | 'education' | 'my';

const TABS: { id: Tab; to: string; label: string; ownerLabel: string }[] = [
  { id: 'home', to: '/home', label: '홈', ownerLabel: '홈' },
  { id: 'shops', to: '/shops', label: '노포 찾기', ownerLabel: '가게보기' },
  { id: 'matching', to: '/matching', label: 'AI 매칭', ownerLabel: '청년찾기' },
  { id: 'education', to: '/education', label: '승계 교육', ownerLabel: '진행상황' },
  { id: 'my', to: '/my', label: '마이', ownerLabel: '내정보' },
];

function startsWithPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function getCurrentTab(pathname: string): Tab | null {
  if (pathname === '/home' || pathname === '/home/') return 'home';
  if (startsWithPath(pathname, '/shops')) return 'shops';
  if (startsWithPath(pathname, '/matching') || startsWithPath(pathname, '/owner/matches')) return 'matching';
  if (['/education', '/succession', '/offers'].some((prefix) => startsWithPath(pathname, prefix))) return 'education';
  if (['/my', '/profile'].some((prefix) => startsWithPath(pathname, prefix))) return 'my';
  return null;
}

function TabIcon({ tab, isOwner }: { tab: Tab; isOwner: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tab === 'home' && <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>}
      {tab === 'shops' && <><path d="M4 10v11h16V10M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 21v-6h4v6" /></>}
      {tab === 'matching' && (isOwner ? <><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 9-5" /><circle cx="17" cy="16" r="3" /><path d="m19 18 3 3" /></> : <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3ZM20 2v4M18 4h4" /></>)}
      {tab === 'education' && (isOwner ? <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 11l2 2 5-5M9 17h6" /></> : <><path d="m2 8 10-5 10 5-10 5L2 8ZM6 10v6c3 3 9 3 12 0v-6M22 8v8" /></>)}
      {tab === 'my' && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
    </svg>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const { role } = useDemo();
  const isOwner = role === 'owner';
  const currentTab = getCurrentTab(pathname);

  return (
    <nav className={`bottom-nav${isOwner ? ' is-owner' : ''}`} aria-label="주 메뉴">
      {TABS.map(({ id, to, label, ownerLabel }) => {
        const tabLabel = isOwner ? ownerLabel : label;
        return (
          <Link key={id} to={to} className="bottom-nav-item" aria-label={tabLabel} aria-current={currentTab === id ? 'page' : undefined}>
            <TabIcon tab={id} isOwner={isOwner} />
            <span className="bottom-nav-label">
              {isOwner && tabLabel.length > 1 ? <>{tabLabel.slice(0, tabLabel === '내정보' ? 1 : 2)}<br />{tabLabel.slice(tabLabel === '내정보' ? 1 : 2)}</> : tabLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
