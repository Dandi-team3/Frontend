# 물려받기 Frontend

단디톤 2026 · 문 닫을 대구 노포의 맛과 단골을 청년이 이어받는 모바일 웹앱

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 타입 체크 + 빌드
```

스택: React 19 · Vite · TypeScript · React Router

## 화면 확인

로그인 → 역할 선택 후 사장님·청년의 시작 화면에서 이어갈 수 있습니다.

| 경로 | 화면 |
| --- | --- |
| `/owner/shop` | 사장님·가게 정보, 업종·위치·사진 |
| `/owner/terms` | 인수 금액·포함 항목·수습 기간·근무 조건 |
| `/owner/register` | 은퇴 희망일 선택 |
| `/successor/register` | 청년 경력·자금·희망 조건 |
| `/owner/matches` | 청년 매칭·제안 진입 |
| `/offers/current` | 받은 제안 / 사장님 제안 확인 |
| `/succession/home` | 승계 홈 (할 일·단계 승인·메뉴) |
| `/succession/schedule` | 승계 가일정 |
| `/succession/checklist` | 체크리스트 |
| `/succession/plan` | AI 승계 계획 |
| `/succession/roadmap` | 수습 로드맵 |
| `/succession/payments` | 납입 관리 |

현재 새 화면은 예시 데이터로 동작하며 새로고침하면 초기 상태로 돌아갑니다. 실제 인증·저장·제안 전송 API는 아직 연결하지 않았습니다. 백엔드 연동 규칙은 [docs/backend-contract.md](docs/backend-contract.md)를 참고하세요.
