import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import type { Me } from '../lib/api';
import { useApp } from '../state/AppContext';

export default function OAuthCallbackPage() {
  const { me, signInWithToken, onboardingComplete, setPendingRole } = useApp();
  const navigate = useNavigate();
  const [incoming] = useState(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return { token: fragment.get('token')?.trim() ?? '', failed: fragment.has('error') || query.has('error') };
  });
  const request = useRef<Promise<Me> | null>(null);
  const [authenticated, setAuthenticated] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰을 주소창과 현재 방문 기록에서 즉시 지운다.
    window.history.replaceState(window.history.state, '', '/oauth/callback');
    if (incoming.failed || !incoming.token) {
      setError('카카오 로그인이 완료되지 않았어요. 다시 로그인해 주세요.');
      return;
    }
    let active = true;
    request.current ??= signInWithToken(incoming.token);
    void request.current.then((next) => { if (active) setAuthenticated(next); }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : '로그인 정보를 확인하지 못했어요.');
    });
    return () => { active = false; };
  }, [incoming, signInWithToken]);

  useEffect(() => {
    if (!authenticated || me?.id !== authenticated.id) return;
    if (!me.role) {
      navigate('/role', { replace: true });
      return;
    }
    const role = me.role === 'OWNER' ? 'owner' : 'successor';
    setPendingRole(role);
    navigate(onboardingComplete[role] ? '/home' : '/onboarding/profile', { replace: true });
  }, [authenticated, me, onboardingComplete, setPendingRole, navigate]);

  return (
    <FlowLayout title="카카오 로그인" backTo="/">
      <h1 className="flow-title">{error ? <>로그인을<br />다시 해 주세요</> : <>카카오 로그인을<br />확인하고 있어요</>}</h1>
      {error ? <><p className="flow-error" role="alert">{error}</p><Link to="/" className="btn btn-primary block succ-empty-action">로그인 화면으로</Link></> : <p className="flow-desc" role="status">잠시만 기다려 주세요.</p>}
    </FlowLayout>
  );
}
