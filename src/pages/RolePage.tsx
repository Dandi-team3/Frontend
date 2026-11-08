import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { hasRequiredPersonalInfo, useApp } from '../state/AppContext';
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
  const { setPendingRole, me, personalInfo, onboardingComplete } = useApp();
  const [role, setRole] = useState<Role | null>(null);

  const handleNext = () => {
    if (!role) return;
    setPendingRole(role);
    const currentRole = me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null;
    navigate(currentRole === role && onboardingComplete[role] && hasRequiredPersonalInfo(personalInfo, role)
      ? '/home' : '/onboarding/profile');
  };

  return (
    <div className="app">
      <main className="screen role">
        <button type="button" className="back" aria-label="뒤로" onClick={() => navigate('/', { replace: true })}>
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
        <p className="role-desc">물려주는 분인지, 이어받는 분인지 골라 주세요</p>

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
