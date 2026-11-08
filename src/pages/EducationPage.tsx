import { Link } from 'react-router-dom';
import { LoadStatus } from '../components/SuccessionUi';
import { api, orNull, type OfferStatus } from '../lib/api';
import { formatKoreanDate } from '../lib/dates';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './MainFeaturePages.css';

const STEPS = [
  { code: 'CHECKLIST', owner: '함께 확인할 것', youth: '승계 체크리스트', path: '/succession/checklist' },
  { code: 'PLANNING', owner: '함께 정할 약속', youth: 'AI 승계 계획', path: '/succession/plan' },
  { code: 'APPRENTICE', owner: '가게 일 배우기', youth: '수습 로드맵', path: '/succession/roadmap' },
  { code: 'HANDOVER', owner: '가게 넘겨주기', youth: '운영권 인수', path: '/succession/payments' },
  { code: 'COMPLETED', owner: '가게 물려주기 완료', youth: '승계 완료', path: '/succession/home' },
];

function offerLabel(status: OfferStatus, isOwner: boolean) {
  switch (status) {
    case 'PROPOSED': return isOwner ? '답변을 기다리고 있어요' : '확인할 제안이 있어요';
    case 'ACCEPTED': return '수락한 제안';
    case 'REJECTED': return isOwner ? '받아들여지지 않은 제안' : '거절한 제안';
    case 'CANCELED': return '사장님이 거둬들인 제안';
    case 'EXPIRED': return '답변 기한이 지난 제안';
    case 'CLOSED': return '닫힌 제안';
  }
}

export default function EducationPage() {
  const { me, role } = useApp();
  const isOwner = role === 'owner';
  const { data, loading, error, reload } = useLoad(async () => {
    if (!me) return { viewerId: null, offers: [], summary: null };
    const [offers, summary] = await Promise.all([api.offers(), orNull(api.currentSuccession())]);
    return { viewerId: me.id, offers, summary };
  }, [me?.id, role, me?.successionId, me?.successionStatus]);

  if (loading || error || !data || data.viewerId !== (me?.id ?? null)) {
    return (
      <div className="feature-page education-page">
        <h1>{isOwner ? '진행 상황' : '승계교육'}</h1>
        <LoadStatus error={error} onRetry={() => void reload()} />
      </div>
    );
  }

  const summary = data.summary;
  const offers = [...data.offers].sort((a, b) => Number(b.status === 'PROPOSED') - Number(a.status === 'PROPOSED') || b.createdAt.localeCompare(a.createdAt));
  const pendingCount = offers.filter((offer) => offer.status === 'PROPOSED').length;
  const currentIndex = summary ? STEPS.findIndex((step) => step.code === summary.status) : -1;
  const isCompleted = summary?.status === 'COMPLETED';
  const progress = summary ? Math.round(Math.min(100, Math.max(0, summary.progressPercent))) : 0;
  const currentTitle = summary ? (isOwner ? STEPS[currentIndex]?.owner : STEPS[currentIndex]?.youth) ?? summary.statusLabel : '';

  return (
    <div className="feature-page education-page">
      <p className="feature-eyebrow">{isOwner ? '진행 상황' : '승계교육'}</p>
      <h1>{isOwner ? (summary ? <>지금 할 일을<br />확인해 보세요</> : <>보낸 제안을<br />확인해 보세요</>) : summary ? <>함께 이어가는<br />가게의 다음 이야기</> : pendingCount ? <>사장님의 제안이<br />{pendingCount}건 도착했어요</> : <>받은 제안과<br />승계 과정을 확인해요</>}</h1>
      {!isOwner && <p className="feature-intro">{me?.name} 님의 제안과 진행 상황이에요.</p>}
      <button type="button" className="succ-small-btn" onClick={() => void reload()}>최신 진행 상황 확인</button>

      {summary && (
        <>
          <section className="feature-card education-progress-card">
            <span className="education-status">{isCompleted ? '모든 과정을 마쳤어요' : '함께 진행 중이에요'}</span>
            <h2>{summary.shopName}</h2>
            <p>{isOwner ? `${summary.youthName} 님과 함께해요.` : `${summary.ownerName} 사장님과 함께해요.`}</p>
            <div className="education-progress-heading"><strong>{currentTitle}</strong><span>{progress}%</span></div>
            <div className="education-progress" role="progressbar" aria-label="승계 진행 정도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            {summary.nextStep && <p className="feature-footnote">지금 할 일: {isOwner ? currentTitle : summary.nextStep.title}</p>}
            <Link to="/succession/home" className="btn btn-primary block">{isOwner ? '지금 할 일 보기' : '승계 과정 이어가기'}</Link>
          </section>
          <section className="feature-results" aria-labelledby="education-steps-heading">
            <h2 id="education-steps-heading">{isOwner ? '앞으로 이렇게 진행해요' : '전체 승계 과정'}</h2>
            <ol className="education-steps">
              {STEPS.map((step, index) => {
                const done = isCompleted || index < currentIndex;
                const current = !isCompleted && index === currentIndex;
                return <li key={step.code} className={done ? 'is-done' : current ? 'is-current' : ''}><Link to={step.path} aria-current={current ? 'step' : undefined}><span className="education-step-number">{index + 1}</span><span>{isOwner ? step.owner : step.youth}</span><small>{done ? '완료' : current ? '지금' : '예정'}</small></Link></li>;
              })}
            </ol>
          </section>
        </>
      )}

      {offers.length > 0 ? (
        <section className="feature-results" aria-labelledby="education-offers-heading">
          <h2 id="education-offers-heading">{isOwner ? '보낸 제안' : '받은 제안'}</h2>
          {offers.map((offer) => (
            <article className="feature-card" key={offer.id}>
              <span className={`education-status${offer.status !== 'PROPOSED' && offer.status !== 'ACCEPTED' ? ' is-rejected' : ''}`}>{offerLabel(offer.status, isOwner)}</span>
              <h2>{offer.shopName}</h2>
              <p>{isOwner ? `${offer.youthName} 님에게 보낸 제안이에요.` : `${offer.ownerName} 사장님이 보낸 제안이에요.`}</p>
              {offer.status === 'PROPOSED' && <p>{formatKoreanDate(offer.expiresAt.slice(0, 10))}까지 {isOwner ? '답변을 기다려요.' : '답해 주세요.'}</p>}
              <Link to={`/offers/current?offer=${offer.id}`} className="btn btn-primary block">{isOwner ? '보낸 내용 보기' : '제안 내용 확인하기'}</Link>
            </article>
          ))}
        </section>
      ) : !summary ? (
        <section className="feature-card feature-empty">
          <span className="education-symbol" aria-hidden="true">↗</span>
          <h2>{isOwner ? '아직 보낸 제안이 없어요' : '아직 받은 제안이 없어요'}</h2>
          <p>{isOwner ? '가게를 이어갈 청년을 살펴보고 제안해 보세요.' : '사장님의 제안을 수락하면 여기에서 승계 과정과 교육을 확인할 수 있어요.'}</p>
          <Link to={isOwner ? '/matching' : '/shops'} className="btn btn-primary block">{isOwner ? '청년 찾아보기' : '노포 둘러보기'}</Link>
        </section>
      ) : null}
    </div>
  );
}
