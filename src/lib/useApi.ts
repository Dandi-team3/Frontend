import { useCallback, useEffect, useRef, useState } from 'react';

function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.';
}

/** 화면에 필요한 데이터를 불러온다. deps가 바뀌면(예: 로그인 전환) 다시 불러온다. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const latestLoader = useRef(loader);
  latestLoader.current = loader;

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const next = await latestLoader.current();
      if (id !== requestId.current) return;
      setData(next);
      setError(null);
    } catch (cause) {
      if (id === requestId.current) setError(messageOf(cause));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
    return () => { requestId.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload };
}

/** 버튼으로 실행하는 요청의 진행·오류 상태를 다룬다. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = async (action: () => Promise<unknown>) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      setError(messageOf(cause));
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { busy, error, run };
}
