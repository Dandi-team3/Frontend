import { useCallback, useEffect, useState } from 'react';
import type { ServerRole } from './api';

// 백엔드에 대화 API가 없어 이 브라우저에만 저장한다. 수락한 제안만 항목 수정 API로 서버에 저장된다.
export type PlanMessage = {
  id: number;
  from: ServerRole;
  kind: 'chat' | 'add' | 'replace';
  text: string;
  /** kind가 replace일 때 바꿀 기존 문장 */
  target?: string;
  state: 'pending' | 'accepted' | 'rejected' | 'replaced' | null;
};

export type PlanThreads = Record<string, PlanMessage[]>;

const keyOf = (successionId: number) => `mullyeobatgi.plan-chat.${successionId}`;

function read(successionId: number): PlanThreads {
  try {
    return JSON.parse(localStorage.getItem(keyOf(successionId)) ?? '{}') as PlanThreads;
  } catch {
    return {};
  }
}

export function usePlanThreads(successionId: number | null) {
  const [threads, setThreads] = useState<PlanThreads>({});

  useEffect(() => {
    if (successionId === null) return;
    setThreads(read(successionId));
    const onStorage = (event: StorageEvent) => {
      if (event.key === keyOf(successionId)) setThreads(read(successionId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [successionId]);

  const save = useCallback((next: PlanThreads) => {
    setThreads(next);
    if (successionId === null) return;
    try {
      localStorage.setItem(keyOf(successionId), JSON.stringify(next));
    } catch {
      // 저장할 수 없는 환경이면 이 화면에서만 유지한다.
    }
  }, [successionId]);

  return { threads, save };
}

export function mergeProposal(content: string, proposal: PlanMessage) {
  return proposal.kind === 'replace' && proposal.target
    ? content.replace(proposal.target, proposal.text)
    : `${content} ${proposal.text}`;
}
