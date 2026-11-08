import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { startKakaoLogin } from '../lib/kakao';
import { useAction } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { beginDemoMode } = useApp();
  const { busy, error, run } = useAction();

  return (
    <div className="app">
      <main className="screen login">
        <header className="login-hero">
          <Logo />
          <h1 className="login-title">
            오래된 가게의 맛과 추억을
            <br />
            다음 사람이 이어갑니다
          </h1>
          <p className="login-desc">
            문 닫을 대구 노포와 청년을 잇는
            <br />
            승계 서비스예요
          </p>
        </header>

        <div className="spacer" />

        <div className="login-actions">
          <button type="button" className="btn btn-kakao block" disabled={busy} onClick={() => void run(startKakaoLogin)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.84 5.32 4.62 6.74l-.96 3.52c-.08.3.26.54.52.37l4.2-2.78c.53.07 1.07.11 1.62.11 5.52 0 10-3.58 10-8S17.52 3 12 3z" /></svg>
            {busy ? '카카오 로그인 연결 중' : '카카오로 시작하기'}
          </button>
          <button type="button" className="btn btn-gray block login-phone" disabled>
            휴대폰 번호로 시작하기 <span className="login-unavailable">준비 중</span>
          </button>
          {error && <p className="login-error" role="alert">{error}</p>}
          {import.meta.env.DEV && <button type="button" className="login-dev-link" disabled={busy} onClick={() => { beginDemoMode(); navigate('/role'); }}>개발용으로 확인하기</button>}
          {import.meta.env.DEV && <button type="button" className="login-dev-link" disabled={busy} onClick={() => { beginDemoMode(); navigate('/dev/tools'); }}>주요 기능 테스트</button>}
          <p className="login-terms">
            시작하기 전에 <Link to="/my/terms">이용약관 안내</Link>와 <Link to="/my/privacy">개인정보 안내</Link>를
            확인해 주세요
          </p>
        </div>
      </main>
    </div>
  );
}
