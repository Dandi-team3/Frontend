// VITE_API_URL을 설정했을 때만 서버를 호출한다. 없으면 예시 데이터로 동작한다.
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const TOKEN_KEY = 'mullyeobatgi.token';

export const isApiEnabled = Boolean(BASE_URL);

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 저장할 수 없는 환경이면 다음 요청에서 다시 로그인한다.
  }
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = readToken();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK', '서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { code?: string; message?: string } | null;
    throw new ApiError(error?.code ?? String(response.status), error?.message ?? '요청을 처리하지 못했어요.');
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export type ServerRole = 'OWNER' | 'YOUTH';

export type Me = {
  id: number;
  name: string;
  role: ServerRole | null;
  hasShop: boolean;
  hasYouthProfile: boolean;
  successionId: number | null;
  successionStatus: string | null;
};

export async function devLogin(name: string, role: ServerRole) {
  const { token, me } = await request<{ token: string; me: Me }>('/api/auth/dev-login', 'POST', { name, role });
  saveToken(token);
  return me;
}
