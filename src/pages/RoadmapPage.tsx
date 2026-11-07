import { Link } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { ActionError, asCounterpart, LoadStatus, Tag, TestRoleSwitch } from '../components/SuccessionUi';
import { api, orNull, type RoadmapTask } from '../lib/api';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

function monthRange(startDate: string, endDate: string) {
  const month = (value: string) => Number(value.split('-')[1]);
  return `${month(startDate)}~${month(endDate)}월`;
}

export default function RoadmapPage() {
  const { me } = useApp();
  const { busy, error: actionError, run } = useAction();
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, roadmap: summary ? await orNull(api.roadmap(summary.id)) : null };
  }, [me?.id]);

  if (loading || error || !data) {
    return (
      <FlowLayout title="수습 로드맵" backTo="/succession/home" className="roadmap-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  const { summary, roadmap } = data;
  if (!summary || !roadmap) {
    return (
      <FlowLayout title="수습 로드맵" backTo={summary ? '/succession/home' : '/succession/schedule'} className="roadmap-page">
        <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
        <p className="flow-desc">두 분이 승계 계획에 동의하면 수습 로드맵이 만들어져요.</p>
        <Link to="/succession/plan" className="btn btn-primary block succ-empty-action">AI 승계 계획 보기</Link>
      </FlowLayout>
    );
  }

  const isOwner = summary.mySide === 'OWNER';
  const viewer = isOwner ? `${summary.ownerName} 사장님` : `${summary.youthName} 님`;

  // 사장님이 바로 완료하는 API가 아직 없다. 서버 규칙(청년 요청 → 사장님 승인)에 맞춰
  // 개발용 로그인으로 청년 요청을 함께 보낸다. API가 생기면 이 함수만 바꾸면 된다.
  const completeTask = (task: RoadmapTask) => {
    void run(async () => {
      if (task.status === 'TODO') {
        await asCounterpart(summary.youthName, 'YOUTH', (token) => api.requestTask(summary.id, task.id, token));
      }
      await api.approveTask(summary.id, task.id);
      await reload();
    });
  };

  const taskControl = (task: RoadmapTask) => {
    if (task.status === 'APPROVED') return <Tag kind="filled">완료</Tag>;
    if (isOwner) return <button type="button" className="succ-small-btn is-primary" disabled={busy} aria-label={`${task.title} 완료`} onClick={() => completeTask(task)}>완료</button>;
    return <Tag kind="dashed">진행 중</Tag>;
  };

  return (
    <FlowLayout
      title="수습 로드맵"
      backTo="/succession/home"
      className="roadmap-page"
      footer={roadmap.currentStage === null ? <Link to="/succession/payments" className="btn btn-primary block">납입 관리 보기</Link> : undefined}
    >
      <h1 className="flow-title">{viewer},<br />{roadmap.currentStage ? `수습 ${roadmap.currentStage}단계예요` : '수습을 모두 마쳤어요'}</h1>
      <p className="flow-desc">{isOwner ? '일을 마치면 완료를 눌러 주세요. 모두 끝나면 다음 단계가 열려요.' : '사장님이 완료로 표시하면 여기에 나타나요.'}</p>

      <ol className="succ-cards">
        {roadmap.stages.map((stage) => (
          <li key={stage.id} className={`succ-card${stage.state === 'NOW' ? ' is-active' : ''}${stage.state === 'DONE' ? ' is-tinted' : ''}`}>
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

      <ActionError message={actionError} />
      <TestRoleSwitch summary={summary} />
    </FlowLayout>
  );
}
