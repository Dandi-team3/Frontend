import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { DemoRoleSwitch, Tag } from '../components/SuccessionUi';
import type { RoadmapTask } from '../lib/succession';
import { useDemo } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';

function monthRange(startDate: string, endDate: string) {
  const month = (value: string) => Number(value.split('-')[1]);
  return `${month(startDate)}~${month(endDate)}월`;
}

export default function RoadmapPage() {
  const { role, offerShop: shop } = useDemo();
  const { stages, requestTask, youthName, planAgreedByBoth, accepted, waitingApprovalCount, approveRequestedTasks } = useSuccession();

  if (!planAgreedByBoth) {
    return (
      <FlowLayout title="수습 로드맵" backTo={accepted ? '/succession/home' : '/succession/schedule'} className="roadmap-page">
        <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
        <p className="flow-desc">두 분이 승계 계획에 동의하면 수습 로드맵이 만들어져요.</p>
        <Link to="/succession/plan" className="btn btn-primary block succ-empty-action">AI 승계 계획 보기</Link>
      </FlowLayout>
    );
  }

  const current = stages.find((stage) => stage.state === 'NOW');
  const viewer = role === 'owner' ? `${shop.owner} 사장님`.trim() : `${youthName} 님`;

  const taskControl = (task: RoadmapTask) => {
    if (task.status === 'APPROVED') return <Tag kind="filled">승인됨</Tag>;
    if (task.status === 'REQUESTED') return <Tag kind="dashed">승인 기다리는 중</Tag>;
    if (role === 'successor') return <button type="button" className="succ-small-btn is-primary" aria-label={`${task.title} 완료 요청`} onClick={() => requestTask(task.id)}>완료 요청</button>;
    return <Tag kind="outline">진행 전</Tag>;
  };

  return (
    <FlowLayout title="수습 로드맵" backTo="/succession/home" className="roadmap-page">
      <h1 className="flow-title">{viewer},<br />{current ? `수습 ${current.seq}단계예요` : '수습을 모두 마쳤어요'}</h1>
      <p className="flow-desc">마친 일은 완료 요청을 보내면 사장님이 승인해요</p>

      <ol className="succ-cards">
        {stages.map((stage) => (
          <li key={stage.seq} className={`succ-card${stage.state === 'NOW' ? ' is-active' : ''}${stage.state === 'DONE' ? ' is-tinted' : ''}`}>
            <div className="succ-row">
              <h2>{stage.seq}단계 · {stage.title}</h2>
              {stage.state === 'DONE' && <Tag kind="filled">승인 완료</Tag>}
              {stage.state === 'NOW' && <Tag kind="outline">진행 중</Tag>}
              {stage.state === 'LOCKED' && <Tag kind="dashed">{stage.seq - 1}단계 후</Tag>}
            </div>
            <p className="succ-meta">
              {monthRange(stage.startDate, stage.endDate)} · {stage.state === 'DONE' ? `${stage.tasks.length}개 모두 사장님 승인` : stage.state === 'NOW' ? `${stage.tasks.length}개 중 ${stage.approvedCount}개 승인` : stage.description}
            </p>
            {stage.state === 'NOW' && (
              <ul className="roadmap-tasks">
                {stage.tasks.map((task) => (
                  <li key={task.id} className="roadmap-task">
                    <div className="succ-row">
                      <span>{task.title}</span>
                      {taskControl(task)}
                    </div>
                    {task.feedback && <p className="roadmap-feedback">다시 해 보기: {task.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {role === 'successor' && waitingApprovalCount > 0 && (
        <button type="button" className="btn btn-outline block succ-note" onClick={approveRequestedTasks}>예시: 사장님이 승인한 걸로 하기</button>
      )}

      <p className="flow-note succ-note">사장님이 ‘다시 해 보기’를 누르면 이유가 함께 와요. 다시 연습하고 요청하면 돼요.</p>
      <DemoRoleSwitch />
    </FlowLayout>
  );
}
