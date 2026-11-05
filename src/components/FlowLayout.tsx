import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../styles/flow.css';

type FlowLayoutProps = {
  title: string;
  backTo: string;
  progress?: { current: number; total: number };
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function FlowLayout({ title, backTo, progress, children, footer, className = '' }: FlowLayoutProps) {
  useEffect(() => {
    document.title = `${title} | 물려받기`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="app">
      <div className={`flow-page ${className}`}>
        <header className="flow-header">
          <Link className="flow-back" to={backTo} aria-label="이전 화면으로">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span className="flow-header-title">{title}</span>
          {progress && <span className="flow-step">{progress.current}/{progress.total}</span>}
        </header>
        {progress && (
          <div className="flow-progress" role="progressbar" aria-label={`${title} 진행 단계`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.current}>
            <span style={{ width: `${progress.current / progress.total * 100}%` }} />
          </div>
        )}
        <main className="flow-content">{children}</main>
        {footer && <footer className="flow-footer">{footer}</footer>}
      </div>
    </div>
  );
}
