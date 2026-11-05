import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './OwnerHomePage.css';

const STEPS = [
  { title: '가게 이야기', desc: '언제, 어떻게 문을 열게 되었는지' },
  { title: '대표 메뉴와 맛의 비결', desc: '손님들이 꼭 찾던 그 맛' },
  { title: '가게의 추억', desc: '사진 몇 장과 단골들과의 기억' },
];

export default function OwnerHomePage() {
  const navigate = useNavigate();

  // TODO: 가게 등록 첫 단계 화면 연결
  const handleStart = () => {};

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
          먼저 가게 이야기를 들려주세요.
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
          가게 이야기 들려주기
        </button>
      </main>
    </div>
  );
}
