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

const COMPOSER_KINDS: { kind: PlanMessage['kind']; label: string }[] = [
  { kind: 'chat', label: '말하기' },
  { kind: 'add', label: '내용 추가' },
  { kind: 'replace', label: '일부 바꾸기' },
];

function splitSentences(content: string) {
  return (content.match(/[^.!?]+[.!?]*/g) ?? []).map((sentence) => sentence.trim()).filter(Boolean);
}

export default function PlanPage() {
  const { role, offerShop: shop, checklistDone } = useDemo();
  const { accepted, plan, planAgreedByBoth, generatePlan, agreePlan, youthName, planThreads, sendPlanMessage, respondToProposal } = useSuccession();
  const [composer, setComposer] = useState<{ code: string; kind: PlanMessage['kind']; text: string; target: string } | null>(null);
  const ownerName = `${shop.owner} 사장님`.trim();
  const youthLabel = `${youthName} 님`;
  const nameOf = (who: Role) => (who === 'owner' ? ownerName : youthLabel);
  const other: Role = role === 'owner' ? 'successor' : 'owner';

  if (!accepted || !checklistDone || !plan) {
    const canGenerate = accepted && checklistDone;
    return (
      <FlowLayout title={role === 'owner' ? '함께 정할 약속' : 'AI 승계 계획'} backTo={accepted ? '/succession/home' : '/succession/schedule'} className="plan-page">
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

  const send = () => {
    if (!composer?.text.trim()) return;
    sendPlanMessage(composer.code, composer.kind, composer.text.trim(), composer.kind === 'replace' ? composer.target : undefined);
    setComposer(null);
  };

  return (
    <FlowLayout title={role === 'owner' ? '함께 정할 약속' : 'AI 승계 계획'} backTo="/succession/home" footer={footer} className="plan-page">
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
                <button type="button" className="succ-small-btn" aria-label={`${section.title} 이야기하기`} onClick={() => setComposer({ code: section.code, kind: 'chat', text: '', target: '' })}>이야기하기</button>
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
                        {message.kind === 'add' && <strong>내용 추가 제안</strong>}
                        {message.kind === 'replace' && <strong>이 부분만 변경 제안</strong>}
                        {message.target && <del>{message.target}</del>}
                        <span>{message.text}</span>
                      </div>
                      {message.state === 'pending' && (isMine ? <small>답을 기다리고 있어요</small> : (
                        <div className="plan-respond">
                          <small>{message.kind === 'replace' ? '수락하면 이 문장만 바뀌어요' : '수락하면 이 내용이 항목 뒤에 더해져요'}</small>
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
                <div className="plan-kinds" role="group" aria-label="보낼 내용 종류">
                  {COMPOSER_KINDS.map(({ kind, label }) => (
                    <button
                      key={kind}
                      type="button"
                      className={`flow-chip${composer.kind === kind ? ' is-selected' : ''}`}
                      aria-pressed={composer.kind === kind}
                      onClick={() => {
                        const first = splitSentences(section.content)[0] ?? '';
                        setComposer(kind === 'replace' ? { ...composer, kind, target: first, text: first } : { ...composer, kind, target: '', text: composer.kind === 'replace' ? '' : composer.text });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {composer.kind === 'replace' && (
                  <select
                    className="flow-input"
                    aria-label="바꿀 문장"
                    value={composer.target}
                    onChange={(event) => setComposer({ ...composer, target: event.target.value, text: event.target.value })}
                  >
                    {splitSentences(section.content).map((sentence) => <option key={sentence} value={sentence}>{sentence}</option>)}
                  </select>
                )}
                <textarea
                  className="flow-input succ-textarea"
                  aria-label={`${section.title}에 보낼 내용`}
                  value={composer.text}
                  maxLength={2000}
                  placeholder={composer.kind === 'add' ? '항목에 더하고 싶은 내용을 적어 주세요' : `${nameOf(other)}께 하고 싶은 말을 적어 주세요`}
                  onChange={(event) => setComposer({ ...composer, text: event.target.value })}
                />
                <div className="succ-actions">
                  <button type="button" className="succ-small-btn" onClick={() => setComposer(null)}>취소</button>
                  <button
                    type="button"
                    className="succ-small-btn is-primary"
                    disabled={!composer.text.trim() || (composer.kind === 'replace' && composer.text.trim() === composer.target)}
                    onClick={send}
                  >
                    {composer.kind === 'chat' ? '말 보내기' : '제안 보내기'}
                  </button>
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
