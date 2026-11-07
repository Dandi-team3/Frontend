import type { ReactNode } from 'react';
import { api, type ServerRole, type SuccessionSummary } from '../lib/api';
import { useApp } from '../state/AppContext';
import '../styles/succession.css';

export function Tag({ kind, children }: { kind: 'filled' | 'dashed' | 'outline'; children: ReactNode }) {
  return <span className={`succ-tag is-${kind}`}>{children}</span>;
}

export function ProgressBar({ label, percent, large = false }: { label: string; percent: number; large?: boolean }) {
  return (
    <div className={`succ-progress-bar${large ? ' is-large' : ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function LoadStatus({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (!error) return <p className="flow-desc" role="status">불러오는 중이에요…</p>;
  return (
    <>
      <p className="flow-error" role="alert">{error}</p>
      <button type="button" className="btn btn-outline block succ-empty-action" onClick={onRetry}>다시 시도</button>
    </>
  );
}

export function ActionError({ message }: { message: string | null }) {
  return message ? <p className="flow-error" role="alert">{message}</p> : null;
}

/** 개발 서버에서만 보이는 상대방 계정 전환. 두 사람의 차례를 혼자 확인할 때 쓴다. */
export function TestRoleSwitch({ summary }: { summary: Pick<SuccessionSummary, 'mySide' | 'ownerName' | 'youthName'> }) {
  const { login } = useApp();
  if (!import.meta.env.DEV) return null;
  const other: ServerRole = summary.mySide === 'OWNER' ? 'YOUTH' : 'OWNER';
  const name = other === 'OWNER' ? summary.ownerName : summary.youthName;
  return (
    <button type="button" className="succ-role-switch" onClick={() => { void login(name, other); }}>
      테스트: {name} {other === 'OWNER' ? '사장님' : '님'} 화면으로 보기
    </button>
  );
}

/** 상대방 계정의 토큰을 받아 대신 처리한다. 개발용 로그인이 켜진 서버에서만 동작한다. */
export async function asCounterpart(name: string, role: ServerRole, action: (token: string) => Promise<unknown>) {
  const { token } = await api.issueToken(name, role);
  await action(token);
}
