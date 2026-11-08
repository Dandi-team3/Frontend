import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, Tag, formatServerTime } from '../components/SuccessionUi';
import { api, orNull, type PlanSection } from '../lib/api';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

export default function PlanPage() {
  const { me, role, refreshMe } = useApp();
  const pageTitle = role === 'owner' ? '함께 정할 약속' : 'AI 승계 계획';
  const [editor, setEditor] = useState<{ id: number; content: string } | null>(null);
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, plan: summary ? await orNull(api.plan(summary.id)) : null };
  }, [me?.id, me?.successionStatus]);

  if (loading || error || !data) return (
    <FlowLayout title={pageTitle} backTo="/education" className="plan-page">
      <LoadStatus error={error} onRetry={() => void reload()} />
    </FlowLayout>
  );

  const { summary, plan } = data;
  if (!summary || !plan) {
    const canGenerate = summary?.status === 'PLANNING';
    return (
      <FlowLayout title={pageTitle} backTo="/education" className="plan-page">
        <h1 className="flow-title">{canGenerate ? <>체크리스트를<br />모두 확인했어요</> : <>체크리스트를 마치면<br />만들 수 있어요</>}</h1>
        <p className="flow-desc">{canGenerate ? '확인한 내용과 가일정으로 승계 계획 초안을 만들어요.' : '두 분이 체크리스트를 모두 확인해야 계획을 만들 수 있어요.'}</p>
        <ActionError message={actionError} />
        {canGenerate ? (
          <button type="button" className="btn btn-primary block succ-empty-action" disabled={busy} onClick={() => void run(async () => { await api.generatePlan(summary.id); await refreshMe(); await reload(); })}>
            {busy ? '초안을 만들고 있어요…' : '승계 계획 초안 만들기'}
          </button>
        ) : <Link to={summary ? '/succession/checklist' : '/education'} className="btn btn-primary block succ-empty-action">{summary ? '체크리스트 확인하기' : '제안 목록 보기'}</Link>}
      </FlowLayout>
    );
  }

  const myAgreed = plan.mySide === 'OWNER' ? plan.ownerAgreed : plan.youthAgreed;
  const isLaterStage = summary.status !== 'CHECKLIST' && summary.status !== 'PLANNING';
  const canAgree = summary.status === 'PLANNING' && !plan.agreedByBoth;
  const canEdit = canAgree && !isLaterStage;
  const otherName = plan.mySide === 'OWNER' ? `${summary.youthName} 님` : `${summary.ownerName} 사장님`;
  const saveSection = (event: FormEvent<HTMLFormElement>, section: PlanSection) => {
    event.preventDefault();
    if (!editor || editor.id !== section.id || !editor.content.trim()) return;
    void run(async () => {
      await api.editPlanSection(summary.id, section.id, editor.content.trim());
      setEditor(null);
      await refreshMe();
      await reload();
    });
  };

  const footer = plan.agreedByBoth || isLaterStage ? <Link to="/succession/roadmap" className="btn btn-primary block">수습 로드맵 보기</Link> : (
    <button type="button" className="btn btn-primary block" disabled={busy || !canAgree || myAgreed || editor !== null} onClick={() => void run(async () => { await api.agreePlan(summary.id); await refreshMe(); await reload(); })}>
      {busy ? '저장하고 있어요' : !canAgree ? '체크리스트를 먼저 확인해 주세요' : myAgreed ? '상대방의 동의를 기다리고 있어요' : editor ? '고친 내용을 먼저 저장해 주세요' : '계획을 확인하고 동의하기'}
    </button>
  );

  return (
    <FlowLayout title={pageTitle} backTo="/education" backDisabled={busy} footer={footer} className="plan-page">
      <span className="plan-badge"><Tag kind="outline">{plan.generatedBy === 'AI' ? 'AI 초안' : '기본 초안'} · {plan.version}번째 버전</Tag></span>
      <h1 className="flow-title">{summary.shopName}<br />승계 계획</h1>
      <p className="flow-desc">{plan.agreedByBoth ? '두 분이 동의한 계획이에요.' : '내용을 함께 확인해 주세요. 고친 내용은 상대방이 다시 동의해야 해요.'}</p>
      {summary.status === 'CHECKLIST' && <p className="flow-note">체크리스트를 모두 확인한 뒤 동의할 수 있어요. <Link to="/succession/checklist">체크리스트 확인하기</Link></p>}
      <button type="button" className="succ-small-btn" disabled={busy || editor !== null} onClick={() => void reload()}>최신 내용 확인</button>

      {plan.sections.map((section) => (
        <section key={section.id} className="plan-section" aria-label={section.title}>
          <div className="succ-row">
            <h2>{section.title}</h2>
            {canEdit && editor?.id !== section.id && <button type="button" className="succ-small-btn" aria-label={`${section.title} 수정`} disabled={busy || editor !== null} onClick={() => setEditor({ id: section.id, content: section.content })}>고치기</button>}
          </div>
          {canEdit && editor?.id === section.id ? (
            <form className="plan-composer" onSubmit={(event) => saveSection(event, section)}>
              <label className="flow-label" htmlFor={`plan-section-${section.id}`}>고칠 내용</label>
              <textarea id={`plan-section-${section.id}`} className="flow-input succ-textarea" value={editor.content} maxLength={2000} required disabled={busy} onChange={(event) => setEditor({ ...editor, content: event.target.value })} />
              <p className="succ-meta">{editor.content.length} / 2,000자 · 저장하면 {otherName}이 다시 확인해요.</p>
              <div className="succ-actions">
                <button type="button" className="succ-small-btn" disabled={busy} onClick={() => setEditor(null)}>취소</button>
                <button type="submit" className="succ-small-btn is-primary" disabled={busy || !editor.content.trim() || editor.content.trim() === section.content.trim()}>{busy ? '저장 중' : '저장하기'}</button>
              </div>
            </form>
          ) : <p className="plan-section-content">{section.content}</p>}
          {section.editedBy && <p className="succ-meta plan-edit-history">{section.editedByName || (section.editedBy === 'OWNER' ? summary.ownerName : summary.youthName)}{section.editedBy === 'OWNER' ? ' 사장님' : ' 님'}이 수정했어요{section.editedAt ? ` · ${formatServerTime(section.editedAt)}` : ''}</p>}
        </section>
      ))}

      <div className="succ-card plan-consent">
        <h2>두 분의 확인</h2>
        <div className="succ-row"><span>{summary.ownerName} 사장님</span><Tag kind={plan.ownerAgreed ? 'filled' : 'dashed'}>{plan.ownerAgreed ? '동의함' : '확인 전'}</Tag></div>
        {plan.ownerAgreedAt && <p className="succ-meta">{formatServerTime(plan.ownerAgreedAt)}</p>}
        <div className="succ-row"><span>{summary.youthName} 님</span><Tag kind={plan.youthAgreed ? 'filled' : 'dashed'}>{plan.youthAgreed ? '동의함' : '확인 전'}</Tag></div>
        {plan.youthAgreedAt && <p className="succ-meta">{formatServerTime(plan.youthAgreedAt)}</p>}
      </div>
      <ActionError message={actionError} />
      {plan.disclaimer && <p className="flow-note succ-note">{plan.disclaimer}</p>}
    </FlowLayout>
  );
}
