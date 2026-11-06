import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ProgressBar, Tag } from '../components/SuccessionUi';
import { CANDIDATES, CHECKLIST_ITEMS } from '../data/demo';
import { buildSchedule, formatKoreanDate } from '../lib/dates';
import { useDemo, type Role } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';
import './ChecklistPage.css';

const ROLE_LABELS: Record<Role, string> = { owner: '사장님', successor: '청년' };

function ConfirmTag({ label, confirmed }: { label: string; confirmed: boolean }) {
  return <Tag kind={confirmed ? 'filled' : 'dashed'}>{label} 확인{confirmed ? '' : ' 전'}</Tag>;
}

export default function ChecklistPage() {
  const { role, offerStatus, offerShop: shop, selectedCandidateId, checklistConfirms, toggleChecklistItem, confirmChecklistAsOther, checklistDone } = useDemo();
  // 백엔드와 같이, 두 분이 계획에 동의한 뒤에는 확인을 취소할 수 없다.
  const { planAgreedByBoth } = useSuccession();
  const otherRole: Role = role === 'owner' ? 'successor' : 'owner';
  const isConfirmedBy = (who: Role, id: string) => checklistConfirms[who].includes(id);
  const doneCount = CHECKLIST_ITEMS.filter(({ id }) => isConfirmedBy('owner', id) && isConfirmedBy('successor', id)).length;
  const allMineDone = CHECKLIST_ITEMS.every(({ id }) => isConfirmedBy(role, id));

  if (offerStatus !== 'accepted') {
    return (
      <FlowLayout title={role === 'owner' ? '함께 확인할 것' : '체크리스트'} backTo="/succession/schedule" className="checklist-page">
        <h1 className="flow-title">제안을 수락하면<br />확인할 수 있어요</h1>
        <p className="flow-desc">승계 제안을 수락한 뒤에 두 분이 함께 체크리스트를 확인해요.</p>
        <Link to="/offers/current" className="btn btn-primary block checklist-empty-action">제안 확인하기</Link>
      </FlowLayout>
    );
  }

  const candidate = CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0];
  const dueDate = shop.retireDate ? formatKoreanDate(buildSchedule(shop.retireDate, shop.trainingMonths).checklistDue).replace(/^\d+년 /, '') : null;
  const viewerName = role === 'owner' ? `${shop.owner || ''} 사장님`.trim() : `${candidate.name} 님`;
  const context = {
    youthName: candidate.name,
    price: shop.amount === null ? '금액 미정' : `${shop.amount.toLocaleString('ko-KR')}만 원`,
    months: shop.trainingMonths,
  };

  return (
    <FlowLayout title={role === 'owner' ? '함께 확인할 것' : '체크리스트'} backTo="/succession/home" className="checklist-page">
      <h1 className="flow-title">승계 전에<br />두 분이 각자 확인해요</h1>
      <p className="flow-desc">{dueDate ? `${dueDate}까지 · ` : ''}{viewerName} 화면</p>

      <div className="checklist-progress">
        <div className="checklist-progress-row">
          <span>양쪽 모두 확인</span>
          <strong>{CHECKLIST_ITEMS.length}개 중 {doneCount}개</strong>
        </div>
        <ProgressBar label="양쪽 모두 확인한 항목" percent={doneCount / CHECKLIST_ITEMS.length * 100} />
      </div>

      <ul className="checklist-items">
        {CHECKLIST_ITEMS.map((item) => {
          const mine = isConfirmedBy(role, item.id);
          return (
            <li key={item.id} className="checklist-item">
              <h2>{item.title}</h2>
              <p>{item.description(context)}</p>
              <div className="checklist-item-footer">
                <div className="checklist-tags">
                  <ConfirmTag label={ROLE_LABELS[otherRole]} confirmed={isConfirmedBy(otherRole, item.id)} />
                  <ConfirmTag label="내" confirmed={mine} />
                </div>
                {planAgreedByBoth ? null : mine ? (
                  <button type="button" className="checklist-cancel" aria-label={`${item.title} 확인 취소`} onClick={() => toggleChecklistItem(item.id)}>취소</button>
                ) : (
                  <button type="button" className="checklist-confirm" aria-label={`${item.title} 확인했어요`} onClick={() => toggleChecklistItem(item.id)}>확인했어요</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="flow-note checklist-note">모든 항목을 두 분이 확인하면 AI가 승계 계획 초안을 만들어요.</p>

      <div className="checklist-actions">
        {allMineDone && !checklistDone && (
          <button type="button" className="btn btn-outline block" onClick={confirmChecklistAsOther}>예시: {ROLE_LABELS[otherRole]}도 확인한 걸로 하기</button>
        )}
        {checklistDone ? (
          <Link to="/succession/plan" className="btn btn-primary block">AI 승계 계획 보기</Link>
        ) : (
          <button type="button" className="btn btn-primary block" disabled>AI 승계 계획 보기</button>
        )}
      </div>
    </FlowLayout>
  );
}
