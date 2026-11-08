import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, ProgressBar, Tag } from '../components/SuccessionUi';
import { api, orNull, type ActionType } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { formatWon } from '../lib/shop';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

const ACTION_LINKS: Record<ActionType, string> = {
  CHECKLIST: '/succession/checklist',
  PLAN_CREATE: '/succession/plan',
  PLAN_AGREE: '/succession/plan',
  ROADMAP_APPROVE: '/succession/roadmap',
  ROADMAP_RETRY: '/succession/roadmap',
  PAYMENT_CONFIRM: '/succession/payments',
  PAYMENT_DUE: '/succession/payments',
  SCHEDULE_CHANGE: '/succession/schedule',
};

export default function SuccessionHomePage() {
  const { me, role } = useApp();
  const pageTitle = role === 'owner' ? '진행 상황' : '승계 홈';
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, roadmap: summary?.planAgreedByBoth ? await orNull(api.roadmap(summary.id)) : null };
  }, [me?.id, me?.successionStatus]);
  const summary = data?.summary ?? null;

  if (loading || error || !data) {
    return (
      <FlowLayout title={pageTitle} backTo="/education" className="home-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  if (!summary) {
    return (
      <FlowLayout title={pageTitle} backTo="/education" className="home-page">
        <h1 className="flow-title">아직 진행 중인<br />승계가 없어요</h1>
        <p className="flow-desc">제안을 수락하면 이곳에서 승계 진행 상황을 볼 수 있어요.</p>
        <Link to="/education" className="btn btn-primary block succ-empty-action">제안 목록 보기</Link>
      </FlowLayout>
    );
  }

  const isOwner = summary.mySide === 'OWNER';
  const viewer = isOwner ? `${summary.ownerName} 사장님` : `${summary.youthName} 님`;
  const currentStage = data.roadmap?.stages.find((stage) => stage.state === 'NOW');
  const beforePlan = '계획에 동의하면 만들어져요';
  const shortDate = (value: string) => formatKoreanDate(value).replace(/^\d+년 /, '');

  const actions = summary.pendingActions;
  const count = actions.length;

  const menu = [
    { to: '/succession/schedule', title: isOwner ? '함께할 일정' : '승계 가일정', sub: summary.nextStep ? `다음: ${shortDate(summary.nextStep.dueDate)} ${summary.nextStep.title}` : '승계를 마쳤어요' },
    { to: '/succession/checklist', title: isOwner ? '함께 확인할 것' : '체크리스트', sub: summary.checklist.done === summary.checklist.total ? `${summary.checklist.total}개 모두 양쪽 확인 완료` : `${summary.checklist.total}개 중 ${summary.checklist.done}개 양쪽 확인` },
    { to: '/succession/plan', title: isOwner ? '함께 정할 약속' : 'AI 승계 계획', sub: summary.planAgreedByBoth ? '두 분 모두 동의함' : summary.planCreated ? '동의 진행 중' : '체크리스트를 마치면 만들 수 있어요' },
    { to: '/succession/roadmap', title: isOwner ? '배우는 과정' : '수습 로드맵', sub: !summary.planAgreedByBoth ? beforePlan : currentStage ? `${currentStage.seq}단계 진행 중 · ${currentStage.tasks.length}개 중 ${currentStage.approvedCount}개 완료` : '모든 단계 완료' },
    { to: '/succession/payments', title: isOwner ? '받은 돈 확인' : '납입 관리', sub: !summary.planAgreedByBoth ? beforePlan : `${formatWon(summary.payments.total)} 중 ${formatWon(summary.payments.done)} ${isOwner ? '받음' : '확인됨'}` },
  ];

  return (
    <FlowLayout title={pageTitle} backTo="/education" backDisabled={busy} className="home-page">
      <h1 className="flow-title">{viewer},<br />{summary.status === 'COMPLETED' ? '승계를 마쳤어요' : count ? `확인할 일이 ${count}개 있어요` : '지금 확인할 일이 없어요'}</h1>
      <button type="button" className="succ-small-btn" disabled={busy} onClick={() => void reload()}>최신 진행 상황 확인</button>
      <ActionError message={actionError} />

      <ul className="succ-cards">
        {actions.map((action) => (
          <li key={`${action.type}-${action.targetId ?? action.description}`} className="succ-card is-active home-action">
            <Tag kind="outline">{action.title}</Tag>
            <h2>{action.description}</h2>
            <div className="succ-actions">
              {action.type === 'PAYMENT_CONFIRM' && action.targetId !== null ? (
                <button type="button" className="succ-small-btn is-primary" disabled={busy} onClick={() => void run(async () => { await api.confirmPayment(summary.id, action.targetId as number); await reload(); })}>받았어요</button>
              ) : (
                <Link to={ACTION_LINKS[action.type]} className="succ-small-btn is-primary home-action-link">바로 가기</Link>
              )}
            </div>
          </li>
        ))}

        <li className="succ-card">
          <div className="succ-row succ-row-top">
            <div>
              <h2>{summary.shopName} 승계</h2>
              <p className="succ-meta">청년 {summary.youthName} 님</p>
            </div>
            <Tag kind="outline">{summary.statusLabel}</Tag>
          </div>
          <ProgressBar label="승계 진행률" percent={summary.progressPercent} />
          <div className="succ-row home-summary-foot">
            <span>{summary.nextStep ? `${shortDate(summary.nextStep.dueDate)} ${summary.nextStep.title}` : '완료'}</span>
            <span>은퇴 {formatKoreanDate(summary.retireDate)}</span>
          </div>
        </li>

        <li className="succ-card home-menu">
          <ul>
            {menu.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>
                  <span><strong>{item.title}</strong><small>{item.sub}</small></span>
                  <i aria-hidden="true">›</i>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      </ul>

    </FlowLayout>
  );
}
