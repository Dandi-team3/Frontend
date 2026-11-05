# 백엔드 연동 참고

확인일: 2026-11-05. 실행·배포·API 호출 없이 실제 소스를 읽어 확인한 내용이다.

소스: [donghyun-03/mullyeobatgi-backend](https://github.com/donghyun-03/mullyeobatgi-backend/tree/22f631a5cc910592f0668b852f36e9d37fd73c95), 확인 커밋 `22f631a5cc910592f0668b852f36e9d37fd73c95`.

아래 Java 경로의 공통 접두사는 `src/main/java/com/danditon/mullyeobatgi/`다. PDF의 API 개요보다 구체적인 계약이며, 이후 백엔드 변경 시 다시 확인한다.

## 실행·인증

- 확인된 배포 주소는 없다. README의 로컬 주소는 `http://localhost:8080`이다.
- Java 21, Spring Boot, MySQL 8.4/Docker Compose 구성이며 실제 실행은 검증하지 않았다.
- `PORT` 기본 8080. `FRONTEND_URL` 기본 `http://localhost:5173`.
- CORS 기본은 `http://localhost:5173`, `http://localhost:3000`. `CORS_ORIGINS`로 변경 가능하다. 프런트를 `127.0.0.1`로 접속하면 호스트 차이를 고려해야 한다.
- `POST /api/auth/dev-login` 요청: `{ name: string, role?: 'OWNER' | 'YOUTH' }`. 이름 필수·최대 50자. 응답 `{ token, me }`.
- 토큰은 기본 30일 유효한 무작위 문자열이다. `Authorization: Bearer {token}`을 사용하며 JWT로 가정하지 않는다.
- 로그아웃은 204. 오류 응답은 `{ code, message }`, 인증 누락은 401 `UNAUTHORIZED`.
- 카카오는 선택 프로필·키 설정 후 `/oauth2/authorization/kakao`로 진입한다. 성공 시 `{FRONTEND_URL}/oauth/callback#token=...`으로 돌아오므로 프런트 콜백 처리가 필요하다. 휴대폰 인증 API는 확인되지 않았다.

출처: `auth/AuthController.java`, `TokenService.java`, `TokenAuthenticationFilter.java`, `KakaoLoginSuccessHandler.java`, `SecurityConfig.java`, `src/main/resources/application.yml`, `application-kakao.yml`.

## 역할·내 정보

프런트 `owner → OWNER`, `successor → YOUTH`로 매핑한다.

`GET /api/me`, `PUT /api/me/role` 응답:

```ts
type Me = {
  id: number;
  name: string;
  role: 'OWNER' | 'YOUTH' | null;
  hasShop: boolean;
  hasYouthProfile: boolean;
  successionId: number | null;
  successionStatus: string | null;
};
```

역할 선택 요청은 `{ role: 'OWNER' | 'YOUTH' }`다. 가게·청년 정보 등록 후 역할을 바꾸면 409 `ROLE_LOCKED`다. 역할을 언제든 바꿀 수 있다고 안내하지 않는다.

출처: `user/Role.java`, `MeController.java`, `MeService.java`, `MeResponse.java`.

## 가게 저장

`GET`, `PUT /api/owner/shop`. PUT은 은퇴일만 보내는 부분 수정이 아니다.

| 필드 | 타입·조건 |
| --- | --- |
| `name` | 필수 문자열, 공백 불가·최대 100자 |
| `category` | 필수 문자열, 최대 30자 |
| `district` | 필수 문자열, 최대 20자 |
| `askingPrice` | 양의 정수, 만 원 |
| `retireDate` | 필수 `YYYY-MM-DD` |
| `mainMenu` | 선택 문자열, 최대 50자 |
| `address` | 선택 문자열, 최대 200자 |
| `openedYear` | 선택 정수, 1900~2100 |
| `monthlySales` | 선택 정수, 0 이상, 만 원 |
| `handoverItems` | 선택 문자열, 최대 200자 |
| `apprenticeMonths` | 선택 정수, 3~12, 기본 6 |
| `workHours` | 선택 문자열, 최대 50자 |
| `earlyMorning` | boolean |
| `message` | 선택 문자열, 최대 500자 |

응답은 등록 정보에 `id`, `ownerId`, `ownerName`을 추가한다. `category`, `district`는 enum이 아닌 문자열이며 청년 희망 목록과 동일한 글자로 비교한다.

`ShopService`는 은퇴일이 `오늘.plusMonths(apprenticeMonths + 2).plusDays(24)`보다 빠르면 400 `RETIRE_DATE_TOO_SOON`을 반환한다. 기본 수습 6개월이면 8개월 24일 이후가 저장 기준이다. ‘6개월 뒤’와 날짜 미정은 예시 화면에서 선택할 수 있어도 서버 저장 조건과 다르므로 실제 연동 때 별도 검증이 필요하다.

출처: `shop/ShopRequest.java`, `ShopResponse.java`, `ShopService.java`.

## 청년 프로필

`GET`, `PUT /api/youth/profile`.

```ts
type YouthProfileRequest = {
  age?: number | null; // 15~80
  experience: 'NONE' | 'UNDER_1Y' | 'ONE_TO_3Y' | 'OVER_3Y';
  experienceDetail?: string | null; // 최대 100자
  fundsReady: number; // 0 이상 정수, 만 원
  loanPlanned: boolean;
  loanAmount: number; // 0 이상 정수, 만 원
  preferredCategories?: string[] | null;
  preferredDistricts?: string[] | null;
  earlyMorningOk: boolean;
  intro?: string | null; // 최대 500자
};
```

- 화면 경력 ‘없음/1년 미만/1~3년/3년 이상’은 각각 `NONE/UNDER_1Y/ONE_TO_3Y/OVER_3Y`로 변환한다.
- `loanPlanned === false`이면 서버가 `loanAmount`를 0으로 저장한다. true일 때도 0은 허용한다.
- 희망 목록은 각각 최대 10개, 원소 최대 20자다. null이면 빈 배열로 저장한다. 서버는 최소 1개를 요구하지 않으나 현재 화면은 사용자의 선호를 위해 1개 이상을 선택하게 한다.
- 응답은 위 정보에 `id`, `userId`, `name`, `experienceLabel`을 추가한다. 제안의 `youthId`는 **응답의 `userId`**이며 프로필 `id`가 아니다.
- 부분 화면에서 PUT할 때 화면에 없는 나이·소개·새벽 근무 여부·대출 금액 등의 기존 값을 보존해야 한다.

출처: `youth/YouthProfileRequest.java`, `YouthProfileResponse.java`, `YouthProfile.java`, `Experience.java`.

## 매칭·제안

`GET /api/owner/matches`는 최대 20명의 점수순 배열이다.

```ts
type YouthCandidate = {
  youthId: number;
  name: string;
  age: number | null;
  experienceLabel: string;
  experienceDetail: string | null;
  fundsReady: number;
  score: number;
  breakdown: { name: string; points: number; max: number; level: string }[];
  reasons: { type: 'GOOD' | 'CAUTION'; text: string }[];
  aiComment: string | null;
  offerId: number | null;
  offerStatus: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'EXPIRED' | 'CLOSED' | null;
};
```

막대 비율은 `points / max * 100`이다. 항목별 만점은 경력 30·자금 30·조건 40이다.

- 제안 생성: `POST /api/offers`, 요청 `{ youthId: number, message?: string }`, 성공 201.
- 제안 응답 필드: `id`, `status`, `price`, `message`, `matchScore`, `expiresAt`, `createdAt`, `shopId`, `shopName`, `category`, `mainMenu`, `district`, `openedYear`, `handoverItems`, `retireDate`, `apprenticeMonths`, `workHours`, `ownerId`, `ownerName`, `youthId`, `youthName`, `successionId`.
- 답변 기한은 14일이다. 실제 UI는 임의로 오늘부터 다시 계산하지 않고 응답의 `expiresAt`을 사용해야 한다.
- 수락 응답도 제안 응답이며 `successionId`로 일정 API를 호출한다. 수락 시 승계는 `CHECKLIST`로 시작하고 관련 다른 제안은 `CLOSED`가 된다.
- `GET /api/offers`는 역할별 보낸/받은 목록을 최신순으로 반환한다.

출처: `matching/YouthCandidateResponse.java`, `MatchScore.java`, `offer/OfferController.java`, `OfferResponse.java`, `OfferStatus.java`.

## 가일정과 변경 요청

`GET /api/successions/{sid}/schedule` 응답:

```ts
type Schedule = {
  retireDate: string;
  daysLeft: number;
  items: {
    seq: number;
    code: 'ACCEPT' | 'CHECKLIST' | 'PLAN' | 'APPRENTICE' | 'HANDOVER' | 'COMPLETE';
    title: string;
    note: string | null;
    startDate: string | null;
    endDate: string;
    state: 'DONE' | 'NOW' | 'UPCOMING';
  }[];
  warnings: string[];
  changeRequests: {
    id: number;
    requestedBy: 'OWNER' | 'YOUTH';
    newRetireDate: string;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    mine: boolean;
  }[];
};
```

진행 상태는 날짜가 아닌 승계 단계로 결정된다. 실제 연동에서는 응답의 날짜·상태·경고를 표시한다.

```text
handoverStart = 은퇴일.plusDays(1).minusMonths(2)
trainingEnd = handoverStart.minusDays(1)
trainingStart = handoverStart.minusMonths(수습개월)
planDue = trainingStart.minusDays(12)
checklistDue = planDue.minusDays(5)
```

월요일 보정은 하지 않는다. 예시 화면의 수습 시작 1월 4일과 달리 기본 은퇴일 2027-08-31의 서버 수습 시작일은 2027-01-01이다.

변경 요청은 `POST .../schedule/change-requests`에 `{ retireDate: string, reason?: string }`을 보내고 갱신된 일정 응답을 받는다. 날짜는 오늘보다 뒤여야 하고 이유는 최대 300자다. 대기 요청이 있으면 409 `REQUEST_PENDING`. 요청자의 상대방만 승인·거절할 수 있고, 승인한 뒤에만 일정·로드맵·미확인 납입 날짜가 바뀐다.

출처: `schedule/ScheduleResponse.java`, `ScheduleService.java`, `ScheduleItem.java`, `ScheduleChangeRequest.java`, `succession/TimelinePlanner.java`, `src/test/java/com/danditon/mullyeobatgi/succession/TimelinePlannerTest.java`.

## 데모 시드

빈 DB와 `DEMO_SEED=true` 조건에서만 생성한다. 운영 환경의 실제 사용자라고 가정하지 않는다.

- 김순자(OWNER): 남문 손칼국수, 4,800만 원, 수습 6개월. 은퇴일은 시드 실행일 + 300일.
- 이도윤(YOUTH): 경력 1~3년, 자금 3,000·대출 계획 1,800만 원, 한식·면 요리 / 중구·남구, 새벽 가능.
- 박서연(YOUTH): 경력 3년 이상, 자금 5,000·대출 없음, 한식·분식 / 수성구, 새벽 가능.
- 최민재(YOUTH): 경력 1년 미만, 자금 1,500·대출 계획 2,000만 원, 카페·한식 / 중구, 새벽 불가.

출처: `demo/DemoDataSeeder.java`.
