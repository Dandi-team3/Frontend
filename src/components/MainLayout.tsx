import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasRequiredPersonalInfo, useDemo } from '../state/DemoContext';
import BottomNav from './BottomNav';
import Logo from './Logo';
import './MainLayout.css';

export default function MainLayout() {
  const { role, onboardingComplete, personalInfo } = useDemo();
  const { pathname } = useLocation();
  const roleLabel = role === 'owner' ? '사장님' : '청년';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const isServiceInfo = ['/my/terms', '/my/privacy', '/my/about'].includes(pathname);
  if ((!onboardingComplete[role] || !hasRequiredPersonalInfo(personalInfo)) && !isServiceInfo) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return (
    <div className={`app main-layout ${role === 'owner' ? 'is-owner' : 'is-successor'}`}>
      <header className="main-layout-header">
        <Link to="/home" className="main-layout-brand" aria-label="물려받기 홈으로">
          <Logo size="sm" />
        </Link>
        <Link to="/my" className="main-layout-profile" aria-label={`마이 페이지, ${roleLabel}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
          <span>{roleLabel}</span>
        </Link>
      </header>
      <main className="main-outlet main-layout-content"><Outlet /></main>
      <BottomNav />
    </div>
  );
}
