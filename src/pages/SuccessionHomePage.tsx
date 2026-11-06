import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { DemoRoleSwitch, ProgressBar, Tag } from '../components/SuccessionUi';
import { formatKoreanDate } from '../lib/dates';
import { formatWon, STATUS_LABELS } from '../lib/succession';
import { useDemo } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';

export default function SuccessionHomePage() {
  const { role, offerShop: shop, checklistDone } = useDemo();
  const { accepted, status, progressPercent, nextStep, youthName, plan, planAgreedByBoth, stages, waitingApprovalCount, confirmedAmount, pendingActions, approveTask, sendBackTask, confirmPayment } = useSuccession();
  const [sendBackId, setSendBackId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!accepted) {
    return (
      <FlowLayout title="승계 홈" backTo="/role" className="home-page">
        <h1 className="flow-title">아직 진행 중인<br />승계가 없어요</h1>
        <p className="flow-desc">제안을 수락하면 이곳에서 승계 진행 상황을 볼 수 있어요.</p>
        <Link to={role === 'owner' ? '/owner' : '/successor'} className="btn btn-primary block succ-empty-action">첫 화면으로</Link>
      </FlowLayout>
    );
  }

  const viewer = role === 'owner' ? `${shop.owner} 사장님`.trim() : `${youthName} 님`;
  const currentStage = stages.find((stage) => stage.state === 'NOW');
  const beforePlan = '계획에 동의하면 만들어져요';
  const shortDate = (value: string) => formatKoreanDate(value).replace(/^\d+년 /, '');
  const menu = [
    { to: '/succession/schedule', title: '승계 가일정', sub: nextStep ? `다음: ${shortDate(nextStep.dueDate)} ${nextStep.title}` : '승계를 마쳤어요' },
    { to: '/succession/checklist', title: '체크리스트', sub: checklistDone ? '6개 모두 양쪽 확인 완료' : '두 분이 각자 확인하는 중' },
    { to: '/succession/plan', title: 'AI 승계 계획', sub: planAgreedByBoth ? '두 분 모두 동의함' : plan ? '동의 진행 중' : '체크리스트를 마치면 만들 수 있어요' },
    { to: '/succession/roadmap', title: '수습 로드맵', sub: !planAgreedByBoth ? beforePlan : currentStage ? `${currentStage.seq}단계 진행 중 · 승인 대기 ${waitingApprovalCount}개` : '모든 단계 승인 완료' },
    { to: '/succession/payments', title: '납입 관리', sub: !planAgreedByBoth ? beforePlan : `${formatWon(shop.amount ?? 0)} 중 ${formatWon(confirmedAmount)} ${role === 'owner' ? '받음' : '확인됨'}` },
  ];

  const handleSendBack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sendBackId || !reason.trim()) return;
    sendBackTask(sendBackId, reason.trim());
    setSendBackId(null);
    setReason('');
  };

  return (
    <FlowLayout title="승계 홈" backTo="/role" className="home-page">
      <h1 className="flow-title">{viewer},<br />{status === 'COMPLETED' ? '승계를 마쳤어요' : pendingActions.length ? `확인할 일이 ${pendingActions.length}개 있어요` : '지금 확인할 일이 없어요'}</h1>

      <ul className="succ-cards">
        {pendingActions.map((action) => (
          <li key={action.description} className="succ-card is-active home-action">
            <Tag kind="outline">{action.title}</Tag>
            <h2>{action.description}</h2>
            <div className="succ-actions">
              {action.type === 'ROADMAP_APPROVE' ? (
                <>
                  <button type="button" className="succ-small-btn" onClick={() => setSendBackId(action.taskId)}>다시 해 보기</button>
                  <button type="button" className="succ-small-btn is-primary" onClick={() => approveTask(action.taskId)}>승인하기</button>
                </>
              ) : action.type === 'PAYMENT_CONFIRM' ? (
                <button type="button" className="succ-small-btn is-primary" onClick={() => confirmPayment(action.seq)}>받았어요</button>
              ) : (
                <Link to={action.to} className="succ-small-btn is-primary home-action-link">바로 가기</Link>
              )}
            </div>
          </li>
        ))}

        <li className="succ-card">
          <div className="succ-row succ-row-top">
            <div>
              <h2>{shop.name} 승계</h2>
              <p className="succ-meta">청년 {youthName} 님 · 예시 가게</p>
            </div>
            <Tag kind="outline">{STATUS_LABELS[status]}</Tag>
          </div>
          <ProgressBar label="승계 진행률" percent={progressPercent} />
          <div className="succ-row home-summary-foot">
            <span>{nextStep ? shortDate(nextStep.dueDate) : '완료'}{nextStep ? ` ${nextStep.title}` : ''}</span>
            <span>은퇴 {shop.retireDate ? formatKoreanDate(shop.retireDate) : ''}</span>
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

      <DemoRoleSwitch />

      <FlowDialog open={sendBackId !== null} title="다시 해 보라고 할까요?" onClose={() => setSendBackId(null)}>
        <p>이유를 적어 주시면 청년에게 그대로 전해져요.</p>
        <form onSubmit={handleSendBack}>
          <textarea className="flow-input succ-textarea succ-dialog-input" aria-label="다시 해 보라는 이유" value={reason} maxLength={300} required placeholder="예: 간을 조금 더 맞춰 보자" onChange={(event) => setReason(event.target.value)} />
          <div className="flow-dialog-actions">
            <button type="button" className="btn btn-gray" onClick={() => setSendBackId(null)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={!reason.trim()}>보내기</button>
          </div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
