import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './SuccessorHomePage.css';

/** 청년(물려받는 사람) 첫 화면 — 초기 설정만. 내용은 이후에 채움 */
export default function SuccessorHomePage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <main className="screen successor">
        <button type="button" className="back" aria-label="뒤로" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Logo size="sm" />
        <h1 className="successor-title">청년 첫 화면</h1>

        {/* TODO: 청년 첫 화면 내용 */}

        <div className="spacer" />
      </main>
    </div>
  );
}
