import { API_BASE_URL } from './api';

export function kakaoLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/kakao`;
}

/** 인증 시작 경로가 꺼져 있으면 외부 오류 화면으로 이동하지 않고 안내한다. */
export async function startKakaoLogin() {
  const url = kakaoLoginUrl();
  let response: Response;
  try {
    response = await fetch(url, { redirect: 'manual', credentials: 'omit' });
  } catch {
    throw new Error('카카오 로그인을 열지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    window.location.assign(url);
    return;
  }
  if (response.status === 404 || response.status === 503) {
    throw new Error('카카오 로그인 준비가 아직 끝나지 않았어요. 잠시 후 다시 시도해 주세요.');
  }
  throw new Error('카카오 로그인에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
}
