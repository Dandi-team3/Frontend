import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { API_BASE_URL, api, orNull, type Offer } from '../lib/api';
import { formatWon } from '../lib/shop';
import { useAction, useLoad } from '../lib/useApi';
import { hasRequiredPersonalInfo, useApp, type Role } from '../state/AppContext';
import './DevToolsPage.css';

type Result<T> = { value: T | null; error: string | null };
async function read<T>(request: Promise<T>): Promise<Result<T>> {
  try { return { value: await request, error: null }; }
  catch (cause) { return { value: null, error: cause instanceof Error ? cause.message : '불러오지 못했어요.' }; }
}

type Feature = { id: string; title: string; description: string; path: string; status: string; ready: boolean; next?: { path: string; label: string }; detail?: string };

export default function DevToolsPage() {
  const navigate = useNavigate();
  const { me, role, isDemoMode, demoNames, login, setPendingRole, personalInfo } = useApp();
  const enabled = import.meta.env.DEV && isDemoMode;
  const [names, setNames] = useState({ ...demoNames });
  const [switchedId, setSwitchedId] = useState<number | null>(null);
  const [offerToOpen, setOfferToOpen] = useState<number | null>(null);
  const { busy, error: actionError, run } = useAction();
  const { data, error: loadError, loading, reload } = useLoad(async () => {
    if (!enabled || !me) return null;
    const [account, offers, succession] = await Promise.all([
      read(api.me()), read(api.offers()), read(orNull(api.currentSuccession())),
    ]);
    const summary = succession.value;
    const afterPlan = Boolean(summary && (summary.planAgreedByBoth || ['APPRENTICE', 'HANDOVER', 'COMPLETED'].includes(summary.status)));
    const [checklist, plan, roadmap, payments] = await Promise.all([
      read(summary ? orNull(api.checklist(summary.id)) : Promise.resolve(null)),
      read(summary?.planCreated ? orNull(api.plan(summary.id)) : Promise.resolve(null)),
      read(summary && afterPlan ? orNull(api.roadmap(summary.id)) : Promise.resolve(null)),
      read(summary && afterPlan ? orNull(api.payments(summary.id)) : Promise.resolve(null)),
    ]);
    return { viewerId: me.id, account, offers, succession, checklist, plan, roadmap, payments, checkedAt: new Date().toISOString() };
  }, [enabled, me?.id, me?.successionStatus]);

  useEffect(() => { setNames({ ...demoNames }); }, [demoNames.owner, demoNames.successor]);
  useEffect(() => { document.title = '주요 기능 확인 | 물려받기'; }, []);
  useEffect(() => {
    if (switchedId === null || me?.id !== switchedId) return;
    setSwitchedId(null);
    const registered = role === 'owner' ? me.hasShop : me.hasYouthProfile;
    if (!registered || !hasRequiredPersonalInfo(personalInfo, role)) navigate('/onboarding/profile');
    else if (offerToOpen !== null) navigate(`/offers/current?offer=${offerToOpen}`);
    setOfferToOpen(null);
  }, [switchedId, me, role, personalInfo, navigate, offerToOpen]);

  const switchAccount = (nextRole: Role) => {
    const name = names[nextRole].trim();
    if (!name || busy) return;
    void run(async () => {
      const account = await login(name, nextRole === 'owner' ? 'OWNER' : 'YOUTH');
      setPendingRole(nextRole);
      setOfferToOpen(null);
      setSwitchedId(account.id);
    });
  };

  const viewAsRecipient = (offer: Offer) => {
    if (busy) return;
    void run(async () => {
      const account = await login(offer.youthName, 'YOUTH', offer.youthId);
      setPendingRole('successor');
      setOfferToOpen(offer.id);
      setSwitchedId(account.id);
    });
  };

  if (!enabled) return <Navigate to="/" replace />;
  const current = data?.viewerId === me?.id ? data : null;
  const summary = current?.succession.value ?? null;
  const checklist = current?.checklist.value ?? null;
  const plan = current?.plan.value ?? null;
  const roadmap = current?.roadmap.value ?? null;
  const payments = current?.payments.value ?? null;
  const account = current?.account.value ?? me;
  const isOwner = role === 'owner';
  const registered = Boolean(account && (isOwner ? account.hasShop : account.hasYouthProfile));
  const basicReady = hasRequiredPersonalInfo(personalInfo, role);
  const offers = current?.offers.value ?? [];
  const proposed = offers.filter((offer) => offer.status === 'PROPOSED');
  const bothAgreed = Boolean(summary?.planAgreedByBoth || plan?.agreedByBoth);
  const checklistDone = Boolean(checklist?.completed || (summary && summary.checklist.total > 0 && summary.checklist.done === summary.checklist.total));
  const confirmedByMe = checklist?.items.filter((item) => item.confirmedByMe).length ?? 0;
  const errors = current ? [
    ['내 정보', current.account.error], ['제안', current.offers.error], ['승계 진행', current.succession.error],
    ['체크리스트', current.checklist.error], ['승계 계획', current.plan.error], ['수습 로드맵', current.roadmap.error], ['납입', current.payments.error],
  ].filter((item): item is [string, string] => Boolean(item[1])) : [];
  const featureErrors: Record<string, string | null | undefined> = {
    profile: current?.account.error,
    matching: current?.account.error,
    offers: current?.offers.error,
    schedule: current?.succession.error,
    checklist: current?.succession.error || current?.checklist.error,
    plan: current?.succession.error || current?.plan.error,
    roadmap: current?.succession.error || current?.roadmap.error,
    payments: current?.succession.error || current?.payments.error,
  };
  const features: Feature[] = [
    { id: 'profile', title: '기본 정보와 등록', path: '/onboarding/profile', status: registered && basicReady ? '입력 완료' : '입력 필요', ready: registered && basicReady,
      description: isOwner ? '이름·나이 → 가게 업종·가격 → 물려줄 것 → 은퇴일을 확인해요.' : '이름·나이 → 경력·자금·대출·희망 업종과 지역을 확인해요.',
      next: { path: isOwner ? '/owner/shop' : '/successor/register', label: isOwner ? '가게 정보 보기' : '청년 조건 보기' } },
    { id: 'matching', title: isOwner ? '청년 찾기와 제안 보내기' : '가게 찾기와 조건 비교', path: isOwner ? '/owner/matches' : '/matching',
      status: registered ? '확인 가능' : '등록 먼저', ready: registered,
      description: isOwner ? '맞는 청년의 점수와 이유를 보고 직접 제안을 보내요.' : '노포와 조건을 비교해요. 승계 제안은 사장님이 보내요.',
      next: !registered ? { path: '/onboarding/profile', label: '등록부터 하기' } : undefined },
    { id: 'offers', title: isOwner ? '보낸 제안 확인·철회' : '받은 제안 수락·거절', path: '/education',
      status: proposed.length ? `답변 대기 ${proposed.length}건` : summary ? '수락한 승계 있음' : '제안 확인', ready: proposed.length > 0 || Boolean(summary),
      description: isOwner ? '청년 계정으로 바꿔 받은 제안을 수락하거나 거절해 보세요.' : '제안을 수락하면 일정과 체크리스트가 열려요. 거절도 확인할 수 있어요.',
      next: proposed[0] ? { path: `/offers/current?offer=${proposed[0].id}`, label: '최근 제안 열기' } : undefined },
    { id: 'schedule', title: '승계 일정과 날짜 변경', path: '/succession/schedule', status: summary ? '확인 가능' : '제안 수락 먼저', ready: Boolean(summary),
      description: '일정 변경을 요청하고 상대방 계정에서 승인·거절해 보세요.',
      next: !summary ? { path: '/education', label: '제안 확인하기' } : undefined },
    { id: 'checklist', title: '함께 확인할 체크리스트', path: '/succession/checklist',
      status: summary ? `${checklist?.doneCount ?? summary.checklist.done}/${checklist?.total ?? summary.checklist.total}개 양쪽 확인` : '제안 수락 먼저', ready: Boolean(summary),
      description: '사장님과 청년이 각각 확인하고 메모를 남겨요. 확인 취소도 할 수 있어요.',
      detail: checklist ? `현재 계정은 ${confirmedByMe}/${checklist.total}개 확인했어요.` : undefined,
      next: !summary ? { path: '/education', label: '제안 확인하기' } : undefined },
    { id: 'plan', title: 'AI 승계 계획 만들기·동의', path: '/succession/plan',
      status: bothAgreed ? '두 분 동의 완료' : plan ? '동의 진행 중' : checklistDone ? '초안 만들기 가능' : '체크리스트 먼저', ready: checklistDone || Boolean(plan),
      description: '양쪽 체크리스트를 마치고 초안을 만들어요. 항목 수정과 두 사람의 동의를 확인해 보세요.',
      detail: plan ? `사장님 ${plan.ownerAgreed ? '동의' : '미동의'} · 청년 ${plan.youthAgreed ? '동의' : '미동의'} · ${plan.generatedBy === 'AI' ? 'AI 초안' : '기본 양식 초안'}` : undefined,
      next: !checklistDone && !plan ? { path: summary ? '/succession/checklist' : '/education', label: summary ? '체크리스트 확인' : '제안 확인하기' } : undefined },
    { id: 'roadmap', title: isOwner ? '수습 확인·승인·다시 해 보기' : '수습 로드맵과 완료 요청', path: '/succession/roadmap',
      status: roadmap ? `${roadmap.approvedCount}/${roadmap.taskCount}개 완료` : !summary ? '제안 수락 먼저' : current?.roadmap.error ? '조회 오류' : bothAgreed ? '다시 조회 필요' : '계획 동의 먼저', ready: Boolean(roadmap),
      description: roadmap ? (isOwner ? '청년의 완료 요청을 승인하거나 이유를 적어 다시 해 보도록 요청해요.' : '현재 단계의 일을 마치고 완료를 요청해요. 사장님 승인 후 다음 단계가 열려요.') : bothAgreed ? '계획 동의는 마쳤어요. 위의 새로 확인을 눌러 로드맵을 다시 불러와 주세요.' : '제안을 수락하고 두 분이 계획에 동의하면 열려요. 이후 단계별 일을 직접 확인할 수 있어요.',
      detail: roadmap ? `${roadmap.currentStage === null ? '수습 완료' : `지금 ${roadmap.currentStage}단계`} · 승인 기다림 ${roadmap.waitingApprovalCount}개` : undefined,
      next: !roadmap ? { path: !summary ? '/education' : !checklistDone ? '/succession/checklist' : '/succession/plan', label: !summary ? '제안 확인하기' : !checklistDone ? '체크리스트 확인' : '계획 동의 확인' } : undefined },
    { id: 'payments', title: isOwner ? '납입금 받았는지 확인' : '납입 기록과 남은 금액', path: '/succession/payments',
      status: payments ? `${payments.installments.filter((item) => item.status === 'CONFIRMED').length}/${payments.installments.length}회 확인` : !summary ? '제안 수락 먼저' : current?.payments.error ? '조회 오류' : bothAgreed ? '다시 조회 필요' : '계획 동의 먼저', ready: Boolean(payments),
      description: '청년이 납입 기록을 남기고 사장님이 받은 금액을 확인해요.',
      detail: payments ? `${formatWon(payments.confirmedAmount)} 확인 · ${formatWon(payments.remainingAmount)} 남음` : '실제 송금 기능이 아니라 두 사람의 납입 기록이에요.',
      next: !payments ? { path: summary ? '/succession/plan' : '/education', label: summary ? '계획 확인하기' : '제안 확인하기' } : undefined },
  ];
  const sid = summary?.id ?? '{sid}';

  return (
    <div className={`app dev-tools${isOwner ? ' is-owner' : ''}`}>
      <header className="dev-tools-header"><Link to={me ? '/my' : '/'} aria-label="이전 화면으로">‹</Link><span>주요 기능 확인</span><span className="dev-tools-badge">개발용</span></header>
      <main className="dev-tools-content">
        <section className="dev-tools-intro"><p className="dev-tools-eyebrow">하나씩, 끝까지 확인해요</p><h1>제안부터<br />수습 승인까지</h1><p>아래 순서로 진행하고 계정을 바꿔서 두 사람의 화면을 확인해 보세요.</p></section>

        <section className="dev-tools-account" aria-labelledby="dev-accounts-title">
          <h2 id="dev-accounts-title">확인할 계정</h2>
          <p>{me ? <><strong>{me.name}</strong> · {isOwner ? '사장님' : '청년'}으로 보고 있어요.</> : '이름과 역할을 골라 개발용 계정으로 들어가세요.'}</p>
          {(['owner', 'successor'] as const).map((targetRole) => <div className="dev-tools-account-row" key={targetRole}>
            <label htmlFor={`dev-${targetRole}-name`}>{targetRole === 'owner' ? '사장님 이름' : '청년 이름'}</label>
            <div><input id={`dev-${targetRole}-name`} value={names[targetRole]} maxLength={50} disabled={busy} onChange={(event) => setNames({ ...names, [targetRole]: event.target.value })} /><button type="button" className="dev-tools-switch" disabled={busy || !names[targetRole].trim()} onClick={() => switchAccount(targetRole)}>{targetRole === 'owner' ? '사장님으로 보기' : '청년으로 보기'}</button></div>
          </div>)}
          {actionError && <p className="dev-tools-error" role="alert">{actionError}</p>}
          <p className="dev-tools-caption">새 이름으로 들어가면 등록부터 시작해요. 이름마다 저장한 정보와 진행 상황이 달라요.</p>
        </section>

        {me && <>
          <section className="dev-tools-server" aria-labelledby="dev-server-title">
            <div className="dev-tools-section-heading"><h2 id="dev-server-title">서버에서 불러온 진행 상황</h2><button type="button" disabled={busy || loading} onClick={() => void run(async () => { await reload(); })}>{busy || loading ? '확인 중' : '새로 확인'}</button></div>
            {loading || !current ? <p role="status">현재 계정의 진행 상황을 불러오고 있어요.</p> : <>
              {current.account.value && <p className="dev-tools-connected">서버 연결 확인 · {new Date(current.checkedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>}
              {summary ? <><h3>{summary.shopName}</h3><p>{summary.ownerName} 사장님 ↔ {summary.youthName} 청년</p><p><strong>{summary.statusLabel}</strong> · 진행 {Math.round(summary.progressPercent)}%</p><p className="dev-tools-caption">이 승계의 상대방 이름으로 들어가서 확인해 주세요.</p><button type="button" className="dev-tools-prefill" disabled={busy} onClick={() => { const targetRole = isOwner ? 'successor' : 'owner'; setNames({ ...names, [targetRole]: isOwner ? summary.youthName : summary.ownerName }); }}>상대방 이름 채우기</button></> : !current.succession.error ? <p>아직 수락한 승계가 없어요. 제안부터 시작해 보세요.</p> : null}
              {errors.map(([label, message]) => <p className="dev-tools-error" role="alert" key={label}>{label}: {message}</p>)}
            </>}
            {loadError && <p className="dev-tools-error" role="alert">{loadError}</p>}
          </section>

          {current && !loading && !current.offers.error && proposed.length > 0 && <section className="dev-tools-delivery" aria-labelledby="dev-delivery-title">
            <h2 id="dev-delivery-title">{isOwner ? '보낸 제안을 청년 화면에서 확인해요' : '사장님이 보낸 제안이 도착했어요'}</h2>
            <p>{isOwner ? '받는 청년 계정으로 들어가서 수락과 이후 과정을 확인할 수 있어요.' : `${me.name} 님이 받은 제안이에요. 내용을 확인하고 답해 주세요.`}</p>
            <ul>{proposed.map((offer) => <li key={offer.id}>
              <strong>{offer.shopName}</strong><p>{offer.ownerName} 사장님 → {offer.youthName} 님</p>
              {isOwner ? <button type="button" className="dev-tools-switch" disabled={busy} onClick={() => viewAsRecipient(offer)}>{offer.youthName} 님으로 받은 제안 보기</button> : <Link className="dev-tools-switch" to={`/offers/current?offer=${offer.id}`}>제안 확인하고 답하기</Link>}
            </li>)}</ul>
          </section>}

          {current && !loading && <ol className="dev-tools-features" aria-label="주요 기능 확인 순서">
            {features.map((feature, index) => <li className="dev-tools-feature" key={feature.id} data-feature={feature.id}>
              <div className="dev-tools-feature-heading"><span className="dev-tools-number">{index + 1}</span><span className={`dev-tools-status${feature.ready && !featureErrors[feature.id] ? ' is-ready' : ''}`}>{featureErrors[feature.id] ? '다시 조회 필요' : feature.status}</span></div>
              <h2>{feature.title}</h2><p>{feature.description}</p>{feature.detail && <p className="dev-tools-caption">{feature.detail}</p>}
              <div className="dev-tools-links"><Link to={feature.path}>화면 열기 <span aria-hidden="true">→</span></Link>{feature.next && !featureErrors[feature.id] && <Link className="dev-tools-next" to={feature.next.path}>{feature.next.label}</Link>}</div>
            </li>)}
          </ol>}

          <details className="dev-tools-api"><summary>연결된 API 확인</summary><p>조회는 아래 서버에서 받아와요. 저장·수락·승인은 각 화면에서 직접 눌렀을 때 요청해요.</p><code>{API_BASE_URL || window.location.origin}</code><ul>
            <li><code>GET /api/me</code></li><li><code>GET /api/owner/matches</code></li><li><code>GET /api/youth/matches</code></li><li><code>GET, POST /api/offers</code></li><li><code>POST /api/offers/&#123;id&#125;/accept · reject · cancel</code></li>
            {['schedule', 'checklist', 'plan', 'roadmap', 'payments'].map((path) => <li key={path}><code>GET /api/successions/{sid}/{path}</code></li>)}
            <li><code>POST /api/successions/{sid}/roadmap/tasks/&#123;id&#125;/request</code></li><li><code>POST /api/successions/{sid}/roadmap/tasks/&#123;id&#125;/approve</code></li><li><code>POST /api/successions/{sid}/roadmap/tasks/&#123;id&#125;/send-back</code></li>
          </ul></details>
        </>}
        <p className="dev-tools-footer-note">등록·제안·승인은 직접 누르면 서버에 저장돼요. 이 페이지에서 진행 단계를 자동으로 바꾸지는 않아요.</p>
      </main>
    </div>
  );
}
