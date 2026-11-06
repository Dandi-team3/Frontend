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
  const { stages, completeTask, youthName, planAgreedByBoth, accepted } = useSuccession();

  if (!planAgreedByBoth) {
    return (
      <FlowLayout title={role === 'owner' ? '배우는 과정 확인' : '수습 로드맵'} backTo={accepted ? '/succession/home' : '/succession/schedule'} className="roadmap-page">
        <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
        <p className="flow-desc">두 분이 승계 계획에 동의하면 수습 로드맵이 만들어져요.</p>
        <Link to="/succession/plan" className="btn btn-primary block succ-empty-action">AI 승계 계획 보기</Link>
      </FlowLayout>
    );
  }

  const current = stages.find((stage) => stage.state === 'NOW');
  const viewer = role === 'owner' ? `${shop.owner} 사장님`.trim() : `${youthName} 님`;

  const taskControl = (task: RoadmapTask) => {
    if (task.status === 'APPROVED') return <Tag kind="filled">완료</Tag>;
    if (role === 'owner') return <button type="button" className="succ-small-btn is-primary" aria-label={`${task.title} 완료`} onClick={() => completeTask(task.id)}>완료</button>;
    return <Tag kind="dashed">진행 중</Tag>;
  };

  return (
    <FlowLayout title={role === 'owner' ? '배우는 과정 확인' : '수습 로드맵'} backTo="/succession/home" className="roadmap-page">
      <h1 className="flow-title">{viewer},<br />{current ? `수습 ${current.seq}단계예요` : '수습을 모두 마쳤어요'}</h1>
      <p className="flow-desc">{role === 'owner' ? '일을 마치면 완료를 눌러 주세요. 모두 끝나면 다음 단계가 열려요.' : '사장님이 완료로 표시하면 여기에 나타나요.'}</p>

      <ol className="succ-cards">
        {stages.map((stage) => (
          <li key={stage.seq} className={`succ-card${stage.state === 'NOW' ? ' is-active' : ''}${stage.state === 'DONE' ? ' is-tinted' : ''}`}>
            <div className="succ-row">
              <h2>{stage.seq}단계 · {stage.title}</h2>
              {stage.state === 'DONE' && <Tag kind="filled">단계 완료</Tag>}
              {stage.state === 'NOW' && <Tag kind="outline">진행 중</Tag>}
              {stage.state === 'LOCKED' && <Tag kind="dashed">{stage.seq - 1}단계 후</Tag>}
            </div>
            <p className="succ-meta">
              {monthRange(stage.startDate, stage.endDate)} · {stage.state === 'DONE' ? `${stage.tasks.length}개 모두 완료` : stage.state === 'NOW' ? `${stage.tasks.length}개 중 ${stage.approvedCount}개 완료` : stage.description}
            </p>
            {stage.state === 'NOW' && (
              <ul className="roadmap-tasks">
                {stage.tasks.map((task) => (
                  <li key={task.id} className="roadmap-task">
                    <div className="succ-row">
                      <span>{task.title}</span>
                      {taskControl(task)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <DemoRoleSwitch />
    </FlowLayout>
  );
}
