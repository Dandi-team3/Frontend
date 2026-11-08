import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import FlowDialog from '../components/FlowDialog';
import FlowLayout from '../components/FlowLayout';
import { ActionError, LoadStatus, Tag, formatServerTime } from '../components/SuccessionUi';
import { api, orNull, type RoadmapTask } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { useAction, useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';

type TaskDecision = { kind: 'request' | 'approve' | 'sendBack'; task: RoadmapTask };

export default function RoadmapPage() {
  const { me, role, refreshMe } = useApp();
  const pageTitle = role === 'owner' ? '배우는 과정 확인' : '수습 로드맵';
  const { busy, error: actionError, run } = useAction();
  const [decision, setDecision] = useState<TaskDecision | null>(null);
  const [message, setMessage] = useState('');
  const { data, error, loading, reload } = useLoad(async () => {
    const summary = await orNull(api.currentSuccession());
    return { summary, roadmap: summary ? await orNull(api.roadmap(summary.id)) : null };
  }, [me?.id, me?.successionStatus]);

  if (loading || error || !data) return (
    <FlowLayout title={pageTitle} backTo="/education" className="roadmap-page"><LoadStatus error={error} onRetry={() => void reload()} /></FlowLayout>
  );
  const { summary, roadmap } = data;
  if (!summary || !roadmap) return (
    <FlowLayout title={pageTitle} backTo="/education" className="roadmap-page">
      <h1 className="flow-title">계획에 동의하면<br />만들어져요</h1>
      <p className="flow-desc">두 분이 승계 계획에 동의하면 수습 로드맵이 만들어져요.</p>
      <Link to={summary ? '/succession/plan' : '/education'} className="btn btn-primary block succ-empty-action">{summary ? '승계 계획 보기' : '제안 목록 보기'}</Link>
    </FlowLayout>
  );
  const isOwner = summary.mySide === 'OWNER';
  const viewer = isOwner ? `${summary.ownerName} 사장님` : `${summary.youthName} 님`;
  const openDecision = (kind: TaskDecision['kind'], task: RoadmapTask) => { setMessage(''); setDecision({ kind, task }); };
  const submitDecision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision || (decision.kind === 'sendBack' && !message.trim())) return;
    void run(async () => {
      if (decision.kind === 'request') await api.requestTask(summary.id, decision.task.id, message.trim() || null);
      else if (decision.kind === 'approve') await api.approveTask(summary.id, decision.task.id);
      else await api.sendBackTask(summary.id, decision.task.id, message.trim());
      setDecision(null);
      await refreshMe();
      await reload();
    });
  };
  const renderTask = (task: RoadmapTask, active: boolean) => (
    <li key={task.id} className="roadmap-task">
      <div className="succ-row"><span>{task.title}</span><Tag kind={task.status === 'APPROVED' ? 'filled' : task.status === 'REQUESTED' ? 'outline' : 'dashed'}>{task.status === 'APPROVED' ? '완료' : task.status === 'REQUESTED' ? '승인 기다림' : '진행 중'}</Tag></div>
      {task.memo && <p className="succ-meta roadmap-task-note"><strong>청년이 남긴 말</strong><br />{task.memo}</p>}
      {task.feedback && <p className="flow-note roadmap-feedback"><strong>{task.status === 'TODO' ? '다시 해 볼 내용' : '사장님이 남긴 말'}</strong><br />{task.feedback}</p>}
      {task.requestedAt && <p className="succ-meta">완료 요청 · {formatServerTime(task.requestedAt)}</p>}
      {task.decidedAt && <p className="succ-meta">사장님 확인 · {formatServerTime(task.decidedAt)}</p>}
      {active && task.status === 'TODO' && !isOwner && <div className="succ-actions"><button type="button" className="succ-small-btn is-primary" disabled={busy} aria-label={`${task.title} 완료 요청`} onClick={() => openDecision('request', task)}>완료 요청하기</button></div>}
      {active && task.status === 'REQUESTED' && isOwner && <div className="succ-actions"><button type="button" className="succ-small-btn" disabled={busy} aria-label={`${task.title} 다시 해 보기`} onClick={() => openDecision('sendBack', task)}>다시 해 보기</button><button type="button" className="succ-small-btn is-primary" disabled={busy} aria-label={`${task.title} 승인`} onClick={() => openDecision('approve', task)}>확인하고 승인</button></div>}
      {active && task.status === 'TODO' && isOwner && <p className="succ-meta">청년이 완료를 요청하면 확인할 수 있어요.</p>}
    </li>
  );

  return (
    <FlowLayout title={pageTitle} backTo="/education" backDisabled={busy} className="roadmap-page" footer={roadmap.currentStage === null ? <Link to="/succession/payments" className="btn btn-primary block">납입 관리 보기</Link> : undefined}>
      <h1 className="flow-title">{viewer},<br />{roadmap.currentStage ? `수습 ${roadmap.currentStage}단계예요` : '수습을 모두 마쳤어요'}</h1>
      <p className="flow-desc">{isOwner ? '청년이 마쳤다고 요청한 일을 확인하고 승인해 주세요.' : '마친 일은 완료를 요청해 주세요. 사장님이 확인하면 다음 단계가 열려요.'}</p>
      <button type="button" className="succ-small-btn" disabled={busy} onClick={() => void reload()}>최신 진행 상황 확인</button>
      <ol className="succ-cards">
        {roadmap.stages.map((stage) => (
          <li key={stage.id} className={`succ-card${stage.state === 'NOW' ? ' is-active' : ''}${stage.state === 'DONE' ? ' is-tinted' : ''}`}>
            <div className="succ-row"><h2>{stage.seq}단계 · {stage.title}</h2><Tag kind={stage.state === 'DONE' ? 'filled' : stage.state === 'NOW' ? 'outline' : 'dashed'}>{stage.state === 'DONE' ? '단계 완료' : stage.state === 'NOW' ? '진행 중' : '이전 단계 후'}</Tag></div>
            <p className="succ-meta">{formatKoreanDate(stage.startDate)} ~ {formatKoreanDate(stage.endDate)}<br />{stage.tasks.length}개 중 {stage.approvedCount}개 완료</p>
            {stage.description && <p className="succ-meta">{stage.description}</p>}
            {stage.state === 'NOW' && <ul className="roadmap-tasks">{stage.tasks.map((task) => renderTask(task, summary.status === 'APPRENTICE'))}</ul>}
            {stage.state === 'DONE' && <details className="roadmap-completed"><summary>마친 일 보기</summary><ul className="roadmap-tasks">{stage.tasks.map((task) => renderTask(task, false))}</ul></details>}
          </li>
        ))}
      </ol>
      <ActionError message={actionError} />
      <FlowDialog open={decision !== null} title={decision?.kind === 'request' ? '완료를 요청할까요?' : decision?.kind === 'sendBack' ? '다시 해 볼 내용을 알려 주세요' : '마친 일을 승인할까요?'} onClose={() => { if (!busy) setDecision(null); }}>
        <form onSubmit={submitDecision}>
          <p>{decision?.task.title}</p>
          {decision?.kind !== 'approve' ? <>
            <label className="flow-label roadmap-dialog-label" htmlFor="roadmap-message">{decision?.kind === 'request' ? '사장님께 남길 말 (선택)' : '다시 해 볼 이유'}</label>
            <textarea id="roadmap-message" className="flow-input succ-textarea" value={message} maxLength={300} required={decision?.kind === 'sendBack'} disabled={busy} onChange={(event) => setMessage(event.target.value)} />
          </> : <p>직접 확인한 뒤 승인해 주세요. 승인한 일은 완료로 표시돼요.</p>}
          <ActionError message={actionError} />
          <div className="flow-dialog-actions"><button type="button" className="btn btn-gray" disabled={busy} onClick={() => setDecision(null)}>돌아가기</button><button type="submit" className="btn btn-primary" disabled={busy || (decision?.kind === 'sendBack' && !message.trim())}>{busy ? '저장 중' : decision?.kind === 'request' ? '완료 요청' : decision?.kind === 'sendBack' ? '다시 해 보기 요청' : '승인하기'}</button></div>
        </form>
      </FlowDialog>
    </FlowLayout>
  );
}
