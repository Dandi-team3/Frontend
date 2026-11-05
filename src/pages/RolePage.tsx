import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './RolePage.css';

type Role = 'owner' | 'successor';

function StoreIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v10h16V10" />
      <path d="M3 10l2-6h14l2 6" />
      <path d="M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-9" />
      <path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" />
      <path d="M12 10c0-3 2.5-6 8-6 0 4-3 6-8 6z" />
    </svg>
  );
}

const ROLES: { id: Role; icon: ReactNode; title: string; desc: string }[] = [
  {
    id: 'owner',
    icon: <StoreIcon />,
    title: '사장님이에요',
    desc: '오랫동안 지켜온 가게의 맛과 이야기를\n이어갈 사람을 찾고 있어요',
  },
  {
    id: 'successor',
    icon: <SproutIcon />,
    title: '물려받고 싶어요',
    desc: '오래된 가게의 맛과 추억을\n제가 이어가고 싶어요',
  },
];

export default function RolePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);

  // TODO: 선택한 역할 저장(dev-login 연동)
  const handleNext = () => {
    if (role === 'owner') navigate('/owner');
    if (role === 'successor') navigate('/successor');
  };

  return (
    <div className="app">
      <main className="screen role">
        <button type="button" className="back" aria-label="뒤로" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Logo size="sm" />
        <h1 className="role-title">
          어떤 마음으로
          <br />
          오셨나요?
        </h1>
        <p className="role-desc">나중에 언제든 바꿀 수 있어요</p>

        <div className="role-options" role="radiogroup" aria-label="역할 선택">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={role === r.id}
              className={role === r.id ? 'role-card selected' : 'role-card'}
              onClick={() => setRole(r.id)}
            >
              <span className="role-icon" aria-hidden="true">
                {r.icon}
              </span>
              <span className="role-text">
                <strong>{r.title}</strong>
                <span>{r.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="spacer" />

        <button type="button" className="btn btn-primary block" disabled={!role} onClick={handleNext}>
          다음
        </button>
      </main>
    </div>
  );
}
