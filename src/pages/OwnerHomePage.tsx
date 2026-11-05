import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './OwnerHomePage.css';

const STEPS = [
  { title: '가게 정보', desc: '가게 이름, 업종, 위치와 대표 메뉴' },
  { title: '승계 조건', desc: '인수 금액, 포함 항목과 함께 일할 조건' },
  { title: '은퇴 희망일', desc: '가게를 물려주고 싶은 날짜' },
];

export default function OwnerHomePage() {
  const navigate = useNavigate();

  const handleStart = () => navigate('/owner/shop');

  return (
    <div className="app">
      <main className="screen owner">
        <button type="button" className="back" aria-label="뒤로" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Logo size="sm" />
        <h1 className="owner-title">
          사장님, 그동안
          <br />
          정말 수고 많으셨어요
        </h1>
        <p className="owner-desc">
          가게의 맛과 추억을 이어갈 사람을 함께 찾아볼게요.
          <br />
          먼저 가게 정보와 승계 조건을 알려 주세요.
        </p>

        <ol className="owner-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="owner-step">
              <span className="owner-step-num">{i + 1}</span>
              <span className="owner-step-text">
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="spacer" />

        <p className="owner-note">천천히 하셔도 괜찮아요.</p>
        <button type="button" className="btn btn-primary block" onClick={handleStart}>
          내 가게 등록하기
        </button>
      </main>
    </div>
  );
}
