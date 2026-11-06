import { useState } from 'react';
import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { DemoRoleSwitch, Tag } from '../components/SuccessionUi';
import { useDemo, type Role } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';

export default function PlanPage() {
  const { role, offerShop: shop, checklistDone } = useDemo();
  const { accepted, plan, planAgreedByBoth, generatePlan, editPlanSection, agreePlan, youthName } = useSuccession();
  const [editing, setEditing] = useState<{ code: string; content: string } | null>(null);
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
  const consentTag = (who: Role) => {
    if (plan.agreed[who]) return <Tag kind="filled">동의함</Tag>;
    return <Tag kind="dashed">{plan.sections.some((section) => section.editedBy && section.editedBy !== who) ? '수정 확인 전' : '동의 전'}</Tag>;
  };

  const footer = planAgreedByBoth ? (
    <Link to="/succession/roadmap" className="btn btn-primary block">수습 로드맵 보기</Link>
  ) : (
    <button type="button" className="btn btn-primary block" disabled={plan.agreed[role]} onClick={agreePlan}>
      {plan.agreed[role] ? `${nameOf(other)}의 동의를 기다리고 있어요` : hasEditByOther ? '고친 내용 확인하고 동의하기' : '계획에 동의하기'}
    </button>
  );

  return (
    <FlowLayout title="AI 승계 계획" backTo="/succession/home" footer={footer} className="plan-page">
      <span className="plan-badge"><Tag kind="outline">예시 초안{plan.version > 1 ? ` · ${plan.version}번째 수정본` : ''}</Tag></span>
      <h1 className="flow-title">{shop.name}<br />승계 계획</h1>
      <p className="flow-desc">체크리스트와 가일정으로 만든 초안이에요. 고칠 곳은 바로 고쳐 주세요.</p>

      {plan.sections.map((section) => {
        const isEditing = editing?.code === section.code;
        return (
          <section key={section.code} className="plan-section" aria-label={section.title}>
            <div className="succ-row">
              <h2>{section.title}</h2>
              {!planAgreedByBoth && !isEditing && (
                <button type="button" className="succ-small-btn" aria-label={`${section.title} 고치기`} onClick={() => setEditing({ code: section.code, content: section.content })}>고치기</button>
              )}
            </div>
            {isEditing ? (
              <>
                <textarea className="flow-input succ-textarea" aria-label={`${section.title} 내용`} value={editing.content} maxLength={2000} onChange={(event) => setEditing({ code: section.code, content: event.target.value })} />
                <div className="succ-actions">
                  <button type="button" className="succ-small-btn" onClick={() => setEditing(null)}>취소</button>
                  <button
                    type="button"
                    className="succ-small-btn is-primary"
                    disabled={!editing.content.trim()}
                    onClick={() => {
                      if (editing.content !== section.content) editPlanSection(section.code, editing.content.trim());
                      setEditing(null);
                    }}
                  >
                    저장
                  </button>
                </div>
              </>
            ) : <p>{section.content}</p>}
            {section.editedBy && !isEditing && (
              <p className="plan-change">
                변경 표시 · {nameOf(section.editedBy)}이 고쳤어요.
                {!plan.agreed[section.editedBy === 'owner' ? 'successor' : 'owner'] && ` ${nameOf(section.editedBy === 'owner' ? 'successor' : 'owner')} 확인 전이에요.`}
              </p>
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
