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

화면은 `.env`의 `VITE_API_URL` 서버 API로 동작합니다. 서버 CORS가 `localhost:5173`을 허용하므로 개발 서버는 5173 포트로 실행하세요. 역할 선택에서 이름과 역할로 개발용 로그인을 하며, `테스트:`로 시작하는 버튼은 개발 서버에서만 보입니다.

서버 API가 없는 기능은 다음처럼 임시로 처리합니다.

- 가게 사진: 브라우저 메모리에만 보관합니다.
- 승계 계획 대화: 이 브라우저에만 저장하고, 수락한 제안만 항목 수정 API로 저장합니다.
- 수습 항목 완료: 개발용 로그인으로 청년 완료 요청을 함께 보낸 뒤 사장님이 승인합니다. 사장님 직접 완료 API가 생기면 `RoadmapPage`의 `completeTask`를 바꿉니다.

백엔드 연동 규칙은 [docs/backend-contract.md](docs/backend-contract.md)를 참고하세요.
