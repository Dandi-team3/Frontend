import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './SuccessorHomePage.css';

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
        <h1 className="successor-title">이어받고 싶은 가게,<br />함께 찾아볼까요?</h1>
        <p className="successor-desc">준비해 온 경험과 앞으로의 바람을 알려 주세요.<br />사장님과 잘 맞는 가게를 찾는 데 도움이 돼요.</p>
        <div className="successor-intro">
          <strong>청년 등록에서 알려 주세요</strong>
          <ul>
            <li>음식점에서 일한 경험</li>
            <li>준비한 자금과 대출 계획</li>
            <li>이어받고 싶은 업종과 지역</li>
          </ul>
        </div>

        <div className="spacer" />
        <button type="button" className="btn btn-primary block" onClick={() => navigate('/successor/register')}>내 이야기 들려주기</button>
      </main>
    </div>
  );
}
