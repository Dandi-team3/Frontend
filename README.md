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

로그인 → 역할 선택 → 기본 정보·역할별 조건 입력 → 홈으로 이동합니다. 사장님은 가게 업종·판매 금액 등을, 청년은 자금·대출 계획·희망 조건 등을 미리 입력합니다. 사람 찾기·제안은 홈에 들어온 뒤 시작하며, 사장님의 제안을 청년이 수락한 뒤 교육·진행 과정을 확인합니다.

| 경로 | 화면 |
| --- | --- |
| `/onboarding/profile` | 이름·나이·선택 연락처 입력 후 역할별 등록 |
| `/home` | 역할별 홈·추천 가게·서비스 소개 |
| `/shops` | 대구 노포 검색·업종별 탐색 |
| `/shops/:id` | 가게 이야기·메뉴·물려받을 조건 |
| `/matching` | 역할별 조건 설정·가게/청년 찾기 |
| `/education` | 보낸/받은 제안·수락 후 승계 과정 |
| `/my`, `/my/profile` | 내 정보·가게 정보·매칭 조건 관리 |
| `/my/terms`, `/my/privacy`, `/my/about` | 이용약관 준비 안내·개인정보 안내·서비스 소개 |
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

가게 분위기 사진은 CC0 공개 사진을 로컬 파일로 제공합니다. [사진 출처와 사용 조건](docs/image-credits.md)을 참고하세요.
