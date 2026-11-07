// 카카오(다음) 우편번호 서비스. API 키 없이 쓸 수 있다.
const SCRIPT_URL = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

export type PostcodeResult = {
  address: string;
  sido: string;
  sigungu: string;
};

type PostcodeOptions = {
  width: string;
  height: string;
  theme: Record<string, string>;
  oncomplete: (result: PostcodeResult) => void;
  onresize: (size: { width: number; height: number }) => void;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: PostcodeOptions) => { embed: (element: HTMLElement) => void };
    };
  }
}

let loading: Promise<void> | null = null;

export function loadPostcode() {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = () => {
      if (window.daum?.Postcode) resolve();
      else reject(new Error('postcode unavailable'));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('postcode load failed'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null; // 다음 시도에서 다시 불러온다.
    throw error;
  });
  return loading;
}
