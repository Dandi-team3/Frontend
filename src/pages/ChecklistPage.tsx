import { useState } from 'react';
import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, ProgressBar, Tag } from '../components/SuccessionUi';
import { api, orNull, type ChecklistItem } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './ChecklistPage.css';

function ConfirmTag({ label, confirmed }: { label: string; confirmed: boolean }) {
  return <Tag kind={confirmed ? 'filled' : 'dashed'}>{label} 확인{confirmed ? '' : ' 전'}</Tag>;
}

export default function ChecklistPage() {
  const { me, role, refreshMe } = useApp();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const pageTitle = role === 'owner' ? '함께 확인할 것' : '체크리스트';
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return summary ? { summary, checklist: await api.checklist(summary.id) } : { summary: null, checklist: null };
  }, [me?.id, me?.successionStatus]);

  if (loading || error || !data) {
    return (
      <FlowLayout title={pageTitle} backTo="/education" className="checklist-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { summary, checklist } = data;
  if (!summary || !checklist) {
    return (
      <FlowLayout title={pageTitle} backTo="/education" className="checklist-page">
        <h1 className="flow-title">제안을 수락하면<br />확인할 수 있어요</h1>
        <p className="flow-desc">승계 제안을 수락한 뒤에 두 분이 함께 체크리스트를 확인해요.</p>
        <Link to="/offers/current" className="btn btn-primary block checklist-empty-action">제안 확인하기</Link>
      </FlowLayout>
    );
  }

  const isOwner = checklist.mySide === 'OWNER';
  const otherLabel = isOwner ? '청년' : '사장님';
  const otherConfirmed = (item: ChecklistItem) => (isOwner ? item.youthConfirmed : item.ownerConfirmed);
  const isLocked = summary.planAgreedByBoth;
  const viewer = isOwner ? `${summary.ownerName} 사장님` : `${summary.youthName} 님`;
  const dueDate = summary.status === 'CHECKLIST' && summary.nextStep ? `${formatKoreanDate(summary.nextStep.dueDate).replace(/^\d+년 /, '')}까지 · ` : '';

  const toggle = (item: ChecklistItem) => {
    void run(async () => {
      await (item.confirmedByMe ? api.cancelChecklist(summary.id, item.id) : api.confirmChecklist(summary.id, item.id, notes[item.id]?.trim() || null));
      await refreshMe();
      await reload();
    });
  };


  return (
    <FlowLayout title={pageTitle} backTo="/education" backDisabled={busy} className="checklist-page">
      <h1 className="flow-title">승계 전에<br />두 분이 각자 확인해요</h1>
      <p className="flow-desc">{dueDate}{viewer} 화면</p>
      <button type="button" className="succ-small-btn" disabled={busy} onClick={() => void reload()}>상대방 확인 내용 새로 보기</button>

      <div className="checklist-progress">
        <div className="checklist-progress-row">
          <span>양쪽 모두 확인</span>
          <strong>{checklist.total}개 중 {checklist.doneCount}개</strong>
        </div>
        <ProgressBar label="양쪽 모두 확인한 항목" percent={checklist.total ? checklist.doneCount / checklist.total * 100 : 0} />
      </div>

      <ul className="checklist-items">
        {checklist.items.map((item) => (
          <li key={item.id} className="checklist-item">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            {!isLocked && !item.confirmedByMe && (
              <div className="checklist-note-input">
                <label className="flow-label" htmlFor={`checklist-note-${item.id}`}>확인 메모 (선택)</label>
                <textarea id={`checklist-note-${item.id}`} className="flow-input" value={notes[item.id] ?? ''} maxLength={300} rows={2} disabled={busy} placeholder="확인한 내용을 적으면 계획을 만들 때 참고해요" onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} />
              </div>
            )}
            <div className="checklist-item-footer">
              <div className="checklist-tags">
                <ConfirmTag label={otherLabel} confirmed={otherConfirmed(item)} />
                <ConfirmTag label="내" confirmed={item.confirmedByMe} />
              </div>
              {isLocked ? null : item.confirmedByMe ? (
                <button type="button" className="checklist-cancel" disabled={busy} aria-label={`${item.title} 확인 취소`} onClick={() => toggle(item)}>취소</button>
              ) : (
                <button type="button" className="checklist-confirm" disabled={busy} aria-label={`${item.title} 확인했어요`} onClick={() => toggle(item)}>확인했어요</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="flow-note checklist-note">모든 항목을 두 분이 확인하면 승계 계획 초안을 만들 수 있어요.</p>
      <ActionError message={actionError} />

      <div className="checklist-actions">
        {checklist.completed ? (
          <Link to="/succession/plan" className="btn btn-primary block">AI 승계 계획 보기</Link>
        ) : (
          <button type="button" className="btn btn-primary block" disabled>AI 승계 계획 보기</button>
        )}
      </div>
    </FlowLayout>
  );
}
