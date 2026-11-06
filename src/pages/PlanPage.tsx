import { useState } from 'react';
import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { DemoRoleSwitch, Tag } from '../components/SuccessionUi';
import { useDemo, type Role } from '../state/DemoContext';
import { useSuccession, type PlanMessage } from '../state/SuccessionContext';

const PROPOSAL_STATES: Record<Exclude<PlanMessage['state'], null | 'pending'>, string> = {
  accepted: '수락됨',
  rejected: '거절됨',
  replaced: '다른 제안으로 바뀜',
};

export default function PlanPage() {
  const { role, offerShop: shop, checklistDone } = useDemo();
  const { accepted, plan, planAgreedByBoth, generatePlan, agreePlan, youthName, planThreads, sendPlanMessage, respondToProposal } = useSuccession();
  const [composer, setComposer] = useState<{ code: string; text: string } | null>(null);
  const ownerName = `${shop.owner} 사장님`.trim();
  const youthLabel = `${youthName} 님`;
  const nameOf = (who: Role) => (who === 'owner' ? ownerName : youthLabel);
  const other: Role = role === 'owner' ? 'successor' : 'owner';

  if (!accepted || !checklistDone || !plan) {
    const canGenerate = accepted && checklistDone;
    return (
      <FlowLayout title="AI 승계 계획" backTo={accepted ? '/succession/home' : '/succession/schedule'} className="plan-page">
        <h1 className="flow-title">{canGenerate ? <>체크리스트를<br />모두 확인했어요</> : <>체크리스트를 마치면<br />만들 수 있어요</>}</h1>
        <p className="flow-desc">{canGenerate ? '체크리스트와 가일정으로 승계 계획 초안을 만들어요.' : '두 분이 체크리스트를 모두 확인해야 계획을 만들 수 있어요.'}</p>
        {canGenerate
          ? <button type="button" className="btn btn-primary block succ-empty-action" onClick={generatePlan}>승계 계획 초안 만들기</button>
          : <Link to="/succession/checklist" className="btn btn-primary block succ-empty-action">체크리스트 확인하기</Link>}
      </FlowLayout>
    );
  }

  const hasEditByOther = plan.sections.some((section) => section.editedBy === other);
  const hasPendingProposal = Object.values(planThreads).some((thread) => thread.some((message) => message.state === 'pending'));
  const consentTag = (who: Role) => {
    if (plan.agreed[who]) return <Tag kind="filled">동의함</Tag>;
    return <Tag kind="dashed">{plan.sections.some((section) => section.editedBy && section.editedBy !== who) ? '수정 확인 전' : '동의 전'}</Tag>;
  };

  const footer = planAgreedByBoth ? (
    <Link to="/succession/roadmap" className="btn btn-primary block">수습 로드맵 보기</Link>
  ) : (
    <button type="button" className="btn btn-primary block" disabled={plan.agreed[role] || hasPendingProposal} onClick={agreePlan}>
      {hasPendingProposal ? '답을 기다리는 제안이 있어요' : plan.agreed[role] ? `${nameOf(other)}의 동의를 기다리고 있어요` : hasEditByOther ? '고친 내용 확인하고 동의하기' : '계획에 동의하기'}
    </button>
  );

  const send = (kind: PlanMessage['kind']) => {
    if (!composer?.text.trim()) return;
    sendPlanMessage(composer.code, kind, composer.text.trim());
    setComposer(null);
  };

  return (
    <FlowLayout title="AI 승계 계획" backTo="/succession/home" footer={footer} className="plan-page">
      <span className="plan-badge"><Tag kind="outline">예시 초안{plan.version > 1 ? ` · ${plan.version}번째 수정본` : ''}</Tag></span>
      <h1 className="flow-title">{shop.name}<br />승계 계획</h1>
      <p className="flow-desc">바꾸고 싶은 조건은 상대방에게 제안하고, 이야기를 나누며 맞춰 보세요.</p>

      {plan.sections.map((section) => {
        const thread = planThreads[section.code] ?? [];
        const isComposing = composer?.code === section.code;
        return (
          <section key={section.code} className="plan-section" aria-label={section.title}>
            <div className="succ-row">
              <h2>{section.title}</h2>
              {!planAgreedByBoth && !isComposing && (
                <button type="button" className="succ-small-btn" aria-label={`${section.title} 이야기하기`} onClick={() => setComposer({ code: section.code, text: '' })}>이야기하기</button>
              )}
            </div>
            <p>{section.content}</p>

            {thread.length > 0 && (
              <ul className="plan-thread" aria-label={`${section.title} 대화`}>
                {thread.map((message) => {
                  const isMine = message.from === role;
                  return (
                    <li key={message.id} className={`plan-message${isMine ? ' is-mine' : ''}`}>
                      <small>{nameOf(message.from)}</small>
                      <div className="plan-bubble">
                        {message.kind === 'proposal' && <strong>조건 제안</strong>}
                        <span>{message.text}</span>
                      </div>
                      {message.state === 'pending' && (isMine ? <small>답을 기다리고 있어요</small> : (
                        <div className="plan-respond">
                          <small>수락하면 항목이 이 내용으로 바뀌어요</small>
                          <div className="succ-actions">
                            <button type="button" className="succ-small-btn" aria-label={`${section.title} 제안 거절`} onClick={() => respondToProposal(section.code, false)}>거절</button>
                            <button type="button" className="succ-small-btn is-primary" aria-label={`${section.title} 제안 수락`} onClick={() => respondToProposal(section.code, true)}>수락</button>
                          </div>
                        </div>
                      ))}
                      {message.state && message.state !== 'pending' && <small>{PROPOSAL_STATES[message.state]}</small>}
                    </li>
                  );
                })}
              </ul>
            )}

            {isComposing && (
              <div className="plan-composer">
                <textarea
                  className="flow-input succ-textarea"
                  aria-label={`${section.title}에 보낼 내용`}
                  value={composer.text}
                  maxLength={2000}
                  placeholder={`${nameOf(other)}께 하고 싶은 말이나 바꾸고 싶은 조건을 적어 주세요`}
                  onChange={(event) => setComposer({ code: section.code, text: event.target.value })}
                />
                <div className="succ-actions">
                  <button type="button" className="succ-small-btn" onClick={() => setComposer(null)}>취소</button>
                  <button type="button" className="succ-small-btn" disabled={!composer.text.trim()} onClick={() => send('chat')}>말 보내기</button>
                  <button type="button" className="succ-small-btn is-primary" disabled={!composer.text.trim()} onClick={() => send('proposal')}>조건 제안</button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      <div className="succ-card plan-consent">
        <h2>동의</h2>
        <div className="succ-row"><span>{ownerName}</span>{consentTag('owner')}</div>
        <div className="succ-row"><span>{youthLabel}</span>{consentTag('successor')}</div>
      </div>

      <p className="flow-note succ-note">AI가 만든 초안이라 법적 효력이 없어요. 실제 계약 전에 전문가 검토를 받으세요.</p>
      {!planAgreedByBoth && <DemoRoleSwitch />}
    </FlowLayout>
  );
}
