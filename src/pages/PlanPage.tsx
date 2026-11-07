import { useState } from 'react';
import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, Tag, TestRoleSwitch } from '../components/SuccessionUi';
import { api, orNull, type PlanSection, type ServerRole } from '../lib/api';
import { mergeProposal, usePlanThreads, type PlanMessage } from '../lib/planThreads';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

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
  const { me } = useApp();
  const [composer, setComposer] = useState<{ code: string; kind: PlanMessage['kind']; text: string; target: string } | null>(null);
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, plan: summary ? await orNull(api.plan(summary.id)) : null };
  }, [me?.id]);
  const summary = data?.summary ?? null;
  const { threads, save } = usePlanThreads(summary?.id ?? null);

  if (loading || error || !data) {
    return (
      <FlowLayout title="AI 승계 계획" backTo="/succession/home" className="plan-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const plan = data.plan;
  if (!summary || !plan) {
    const canGenerate = summary?.status === 'PLANNING';
    return (
      <FlowLayout title="AI 승계 계획" backTo={summary ? '/succession/home' : '/succession/schedule'} className="plan-page">
        <h1 className="flow-title">{canGenerate ? <>체크리스트를<br />모두 확인했어요</> : <>체크리스트를 마치면<br />만들 수 있어요</>}</h1>
        <p className="flow-desc">{canGenerate ? '체크리스트와 가일정으로 승계 계획 초안을 만들어요.' : '두 분이 체크리스트를 모두 확인해야 계획을 만들 수 있어요.'}</p>
        <ActionError message={actionError} />
        {canGenerate
          ? <button type="button" className="btn btn-primary block succ-empty-action" disabled={busy} onClick={() => void run(async () => { await api.generatePlan(summary.id); await reload(); })}>{busy ? '초안을 만들고 있어요…' : '승계 계획 초안 만들기'}</button>
          : <Link to="/succession/checklist" className="btn btn-primary block succ-empty-action">체크리스트 확인하기</Link>}
      </FlowLayout>
    );
  }

  const mySide = plan.mySide;
  const other: ServerRole = mySide === 'OWNER' ? 'YOUTH' : 'OWNER';
  const nameOf = (who: ServerRole) => (who === 'OWNER' ? `${summary.ownerName} 사장님` : `${summary.youthName} 님`);
  const agreed = (who: ServerRole) => (who === 'OWNER' ? plan.ownerAgreed : plan.youthAgreed);
  const hasEditByOther = plan.sections.some((section) => section.editedBy === other);
  const hasPendingProposal = Object.values(threads).some((thread) => thread.some((message) => message.state === 'pending'));
  const consentTag = (who: ServerRole) => {
    if (agreed(who)) return <Tag kind="filled">동의함</Tag>;
    return <Tag kind="dashed">{plan.sections.some((section) => section.editedBy && section.editedBy !== who) ? '수정 확인 전' : '동의 전'}</Tag>;
  };

  const footer = plan.agreedByBoth ? (
    <Link to="/succession/roadmap" className="btn btn-primary block">수습 로드맵 보기</Link>
  ) : (
    <button type="button" className="btn btn-primary block" disabled={busy || agreed(mySide) || hasPendingProposal} onClick={() => void run(async () => { await api.agreePlan(summary.id); await reload(); })}>
      {hasPendingProposal ? '답을 기다리는 제안이 있어요' : agreed(mySide) ? `${nameOf(other)}의 동의를 기다리고 있어요` : hasEditByOther ? '고친 내용 확인하고 동의하기' : '계획에 동의하기'}
    </button>
  );

  const send = () => {
    if (!composer?.text.trim()) return;
    const { code, kind, text, target } = composer;
    const isProposal = kind !== 'chat';
    const thread = (threads[code] ?? []).map((message) => (isProposal && message.state === 'pending' ? { ...message, state: 'replaced' as const } : message));
    save({ ...threads, [code]: [...thread, { id: thread.length, from: mySide, kind, text: text.trim(), target: kind === 'replace' ? target : undefined, state: isProposal ? 'pending' : null }] });
    setComposer(null);
  };

  const respond = (section: PlanSection, accept: boolean) => {
    const thread = threads[section.code] ?? [];
    const proposal = thread.find((message) => message.state === 'pending');
    if (!proposal) return;
    void run(async () => {
      // 항목 수정 API는 전체 내용을 받으므로 합친 결과를 보낸다. 수락한 쪽이 고친 것으로 저장된다.
      if (accept) await api.editPlanSection(summary.id, section.id, mergeProposal(section.content, proposal));
      save({ ...threads, [section.code]: thread.map((message) => (message === proposal ? { ...message, state: accept ? 'accepted' as const : 'rejected' as const } : message)) });
      await reload();
    });
  };

  return (
    <FlowLayout title="AI 승계 계획" backTo="/succession/home" footer={footer} className="plan-page">
      <span className="plan-badge"><Tag kind="outline">{plan.generatedBy === 'AI' ? 'AI 초안' : '초안'}{plan.version > 1 ? ` · ${plan.version}번째 수정본` : ''}</Tag></span>
      <h1 className="flow-title">{summary.shopName}<br />승계 계획</h1>
      <p className="flow-desc">바꾸고 싶은 조건은 상대방에게 제안하고, 이야기를 나누며 맞춰 보세요.</p>

      {plan.sections.map((section) => {
        const thread = threads[section.code] ?? [];
        const isComposing = composer?.code === section.code;
        return (
          <section key={section.id} className="plan-section" aria-label={section.title}>
            <div className="succ-row">
              <h2>{section.title}</h2>
              {!plan.agreedByBoth && !isComposing && (
                <button type="button" className="succ-small-btn" aria-label={`${section.title} 이야기하기`} onClick={() => setComposer({ code: section.code, kind: 'chat', text: '', target: '' })}>이야기하기</button>
              )}
            </div>
            <p>{section.content}</p>

            {thread.length > 0 && (
              <ul className="plan-thread" aria-label={`${section.title} 대화`}>
                {thread.map((message) => {
                  const isMine = message.from === mySide;
                  return (
                    <li key={message.id} className={`plan-message${isMine ? ' is-mine' : ''}`}>
                      <small>{nameOf(message.from)}</small>
                      <div className="plan-bubble">
                        {message.kind === 'add' && <strong>내용 추가 제안</strong>}
                        {message.kind === 'replace' && <strong>이 부분만 변경 제안</strong>}
                        {message.target && <del>{message.target}</del>}
                        <span>{message.text}</span>
                      </div>
                      {message.state === 'pending' && !plan.agreedByBoth && (isMine ? <small>답을 기다리고 있어요</small> : (
                        <div className="plan-respond">
                          <small>{message.kind === 'replace' ? '수락하면 이 문장만 바뀌어요' : '수락하면 이 내용이 항목 뒤에 더해져요'}</small>
                          <div className="succ-actions">
                            <button type="button" className="succ-small-btn" disabled={busy} aria-label={`${section.title} 제안 거절`} onClick={() => respond(section, false)}>거절</button>
                            <button type="button" className="succ-small-btn is-primary" disabled={busy} aria-label={`${section.title} 제안 수락`} onClick={() => respond(section, true)}>수락</button>
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
        <div className="succ-row"><span>{nameOf('OWNER')}</span>{consentTag('OWNER')}</div>
        <div className="succ-row"><span>{nameOf('YOUTH')}</span>{consentTag('YOUTH')}</div>
      </div>

      <ActionError message={actionError} />
      <p className="flow-note succ-note">{plan.disclaimer}</p>
      <TestRoleSwitch summary={summary} />
    </FlowLayout>
  );
}
