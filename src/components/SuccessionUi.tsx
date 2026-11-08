import type { ReactNode } from 'react';
import '../styles/succession.css';

export function Tag({ kind, children }: { kind: 'filled' | 'dashed' | 'outline'; children: ReactNode }) {
  return <span className={`succ-tag is-${kind}`}>{children}</span>;
}

export function ProgressBar({ label, percent, large = false }: { label: string; percent: number; large?: boolean }) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className={`succ-progress-bar${large ? ' is-large' : ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safePercent)}>
      <span style={{ width: `${safePercent}%` }} />
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

/** 서버 시각은 한국 시간의 오프셋 없는 문자열이다. */
export function formatServerTime(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}
