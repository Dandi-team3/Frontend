import type { ReactNode } from 'react';
import { useDemo } from '../state/DemoContext';
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

/** 서버 연동 전까지 혼자서 두 사람의 차례를 확인해 보기 위한 예시 전환. */
export function DemoRoleSwitch() {
  const { role, setRole } = useDemo();
  const other = role === 'owner' ? 'successor' : 'owner';
  return (
    <button type="button" className="succ-role-switch" onClick={() => setRole(other)}>
      예시: {other === 'owner' ? '사장님' : '청년'} 화면으로 보기
    </button>
  );
}
