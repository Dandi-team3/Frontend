import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../state/AppContext';
import { useAction } from '../lib/useApi';
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
  const { setPendingRole, me, chooseRole, isDemoMode, demoNames, login } = useApp();
  const currentRole = me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null;
  const [role, setRole] = useState<Role | null>(currentRole);
  const { busy, error, run } = useAction();
  const locked = !isDemoMode && Boolean(me?.hasShop || me?.hasYouthProfile);

  const handleNext = () => {
    if (!role || busy) return;
    void run(async () => {
      if (isDemoMode) await login(demoNames[role], role === 'owner' ? 'OWNER' : 'YOUTH');
      else if (me && currentRole !== role) await chooseRole(role === 'owner' ? 'OWNER' : 'YOUTH');
      setPendingRole(role);
      navigate('/onboarding/profile');
    });
  };

  if (!me && !isDemoMode) return <Navigate to="/" replace />;

  return (
    <div className="app">
      <main className="screen role">
        <button type="button" className="back" aria-label="뒤로" disabled={busy} onClick={() => navigate('/', { replace: true })}>
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
        <p className="role-desc">{isDemoMode ? '개발용 확인에서는 두 역할을 번갈아 볼 수 있어요' : locked ? '선택한 역할로 가게와 조건을 확인해 주세요' : '물려주는 분인지, 이어받는 분인지 골라 주세요'}</p>
        {isDemoMode && <Link className="role-test-link" to="/dev/tools">주요 기능 테스트 열기</Link>}

        <div className="role-options" role="radiogroup" aria-label="역할 선택">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={role === r.id}
              className={role === r.id ? 'role-card selected' : 'role-card'}
              disabled={busy || (locked && currentRole !== r.id)}
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

        {error && <p className="role-error" role="alert">{error}</p>}
        <button type="button" className="btn btn-primary block" disabled={!role || busy} onClick={handleNext}>
          {busy ? '확인하고 있어요' : '다음'}
        </button>
      </main>
    </div>
  );
}
