import { useEffect, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { hasRequiredPersonalInfo, useApp } from '../state/AppContext';
import '../styles/flow.css';

type FlowLayoutProps = {
  title: string;
  backTo: string;
  backDisabled?: boolean;
  progress?: { current: number; total: number };
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function FlowLayout({ title, backTo, backDisabled = false, progress, children, footer, className = '' }: FlowLayoutProps) {
  const { pathname } = useLocation();
  const { me, role: accountRole, pendingRole, onboardingComplete, personalInfo, isDemoMode } = useApp();
  const role = pathname === '/onboarding/profile' ? pendingRole : accountRole ?? pendingRole;
  const showTabs = pathname.startsWith('/succession/') || pathname.startsWith('/offers/') || pathname === '/owner/matches';
  useEffect(() => {
    document.title = `${title} | 물려받기`;
    window.scrollTo(0, 0);
  }, [title]);

  if (showTabs && !me) return <Navigate to="/" replace />;
  if (showTabs && (!onboardingComplete[role] || !hasRequiredPersonalInfo(personalInfo, role))) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return (
    <div className={`app${role === 'owner' ? ' is-owner' : ''}`}>
      <div className={`flow-page ${className}${showTabs ? ' with-main-tabs' : ''}${role === 'owner' ? ' owner-readable' : ''}`}>
        <header className="flow-header">
          <Link className="flow-back" to={backTo} replace aria-label="이전 화면으로" aria-disabled={backDisabled || undefined} onClick={(event) => { if (backDisabled) event.preventDefault(); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span className="flow-header-title">{title}</span>
          {progress && <span className="flow-step">{progress.current}/{progress.total}</span>}
        </header>
        {isDemoMode && <Link className="dev-test-return" to="/dev/tools" onClick={(event) => { if (backDisabled) event.preventDefault(); }} aria-disabled={backDisabled || undefined}>주요 기능 테스트 · 역할 전환</Link>}
        {progress && (
          <div className="flow-progress" role="progressbar" aria-label={`${title} 진행 단계`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.current}>
            <span style={{ width: `${progress.current / progress.total * 100}%` }} />
          </div>
        )}
        <main className="flow-content">{children}</main>
        {footer && <footer className="flow-footer">{footer}</footer>}
      </div>
      {showTabs && <BottomNav />}
    </div>
  );
}
