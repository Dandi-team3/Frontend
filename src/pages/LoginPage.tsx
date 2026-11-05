import Logo from '../components/Logo';
import './LoginPage.css';

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.84 5.32 4.62 6.74l-.96 3.52c-.08.3.26.54.52.37l4.2-2.78c.53.07 1.07.11 1.62.11 5.52 0 10-3.58 10-8S17.52 3 12 3z"
      />
    </svg>
  );
}

export default function LoginPage() {
  // TODO: 카카오 로그인 / 휴대폰 인증 연동 후 역할 선택 화면으로 이동
  const handleKakao = () => {};
  const handlePhone = () => {};

  return (
    <div className="app">
      <main className="screen login">
        <header className="login-hero">
          <Logo />
          <h1 className="login-title">
            가게의 맛과 단골,
            <br />
            이제 이어받으세요
          </h1>
          <p className="login-desc">
            문 닫을 대구 노포와 청년을 잇는
            <br />
            승계 서비스예요
          </p>
        </header>

        <div className="spacer" />

        <div className="login-actions">
          <button type="button" className="btn btn-kakao block" onClick={handleKakao}>
            <KakaoIcon />
            카카오로 시작하기
          </button>
          <button type="button" className="btn btn-gray block" onClick={handlePhone}>
            휴대폰 번호로 시작하기
          </button>
          <p className="login-terms">
            시작하면 <a href="#terms">이용약관</a>과 <a href="#privacy">개인정보 처리방침</a>에
            동의하게 돼요
          </p>
        </div>
      </main>
    </div>
  );
}
