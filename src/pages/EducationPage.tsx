import { Link } from 'react-router-dom';
import { CANDIDATES } from '../data/demo';
import { useDemo } from '../state/DemoContext';
import { useSuccession } from '../state/SuccessionContext';
import './MainFeaturePages.css';

export default function EducationPage() {
  const { role, offerStatus, offerShop: shop, selectedCandidateId } = useDemo();
  const { status, progressPercent, nextStep } = useSuccession();
  const isOwner = role === 'owner';
  const candidate = CANDIDATES.find((person) => person.id === selectedCandidateId) ?? CANDIDATES[0];
  const steps = [
    { code: 'CHECKLIST', owner: '함께 확인할 것', youth: '승계 체크리스트', path: '/succession/checklist' },
    { code: 'PLANNING', owner: '함께 정할 약속', youth: 'AI 승계 계획', path: '/succession/plan' },
    { code: 'APPRENTICE', owner: '가게 일 배우기', youth: '수습 로드맵', path: '/succession/roadmap' },
    { code: 'HANDOVER', owner: '가게 넘겨주기', youth: '운영권 인수', path: '/succession/payments' },
    { code: 'COMPLETED', owner: '가게 물려주기 완료', youth: '승계 완료', path: '/succession/home' },
  ];
  const currentIndex = steps.findIndex((step) => step.code === status);

  return (
    <div className="feature-page education-page">
      <p className="feature-eyebrow">{isOwner ? '진행 상황' : '승계교육'}</p>
      <h1>{isOwner ? (offerStatus === 'accepted' ? <>지금 할 일을<br />확인해 보세요</> : <>보낸 제안을<br />확인해 보세요</>) : offerStatus === 'accepted' ? <>함께 이어가는<br />가게의 다음 이야기</> : <>함께 시작할 준비,<br />차근차근 해봐요</>}</h1>
      {offerStatus === 'idle' ? (
        <section className="feature-card feature-empty">
          <span className="education-symbol" aria-hidden="true">↗</span>
          <h2>{isOwner ? '아직 보낸 제안이 없어요' : '아직 받은 제안이 없어요'}</h2>
          <p>{isOwner ? '가게를 이어갈 청년을 살펴보고 제안해 보세요.' : '사장님의 제안을 수락하면 여기에서 승계 과정과 교육을 확인할 수 있어요.'}</p>
          <Link to={isOwner ? '/matching' : '/shops'} className="btn btn-primary block">{isOwner ? '청년 찾아보기' : '노포 둘러보기'}</Link>
        </section>
      ) : offerStatus !== 'accepted' ? (
        <section className="feature-card">
          <span className={`education-status${offerStatus === 'rejected' ? ' is-rejected' : ''}`}>{offerStatus === 'rejected' ? (isOwner ? '받아들여지지 않은 제안' : '거절한 제안') : isOwner ? '답변을 기다리고 있어요' : '확인할 제안이 있어요'}</span>
          <h2>{shop.name}</h2>
          <p>{isOwner ? `${candidate.name} 님에게 보낸 제안이에요.` : `${shop.owner} 사장님이 보낸 제안이에요.`}</p>
          <Link to="/offers/current" className="btn btn-primary block">{isOwner ? '보낸 내용 보기' : '제안 내용 확인하기'}</Link>
          {offerStatus !== 'rejected' && !isOwner && <p className="feature-footnote">내용을 살펴본 뒤 수락하거나 거절할 수 있어요.</p>}
        </section>
      ) : (
        <>
          <section className="feature-card education-progress-card">
            <span className="education-status">{status === 'COMPLETED' ? '모든 과정을 마쳤어요' : '함께 진행 중이에요'}</span>
            <h2>{shop.name}</h2>
            <p>{isOwner ? `${candidate.name} 님과 함께해요.` : `${shop.owner} 사장님과 함께해요.`}</p>
            <div className="education-progress-heading"><strong>{isOwner ? steps[currentIndex]?.owner : steps[currentIndex]?.youth}</strong><span>{progressPercent}%</span></div>
            <div className="education-progress" role="progressbar" aria-label="승계 진행 정도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div>
            {nextStep && <p className="feature-footnote">지금 할 일: {isOwner ? steps[currentIndex]?.owner : nextStep.title}</p>}
            <Link to="/succession/home" className="btn btn-primary block">{isOwner ? '지금 할 일 보기' : '승계 과정 이어가기'}</Link>
          </section>
          <section className="feature-results" aria-labelledby="education-steps-heading">
            <h2 id="education-steps-heading">{isOwner ? '앞으로 이렇게 진행해요' : '전체 승계 과정'}</h2>
            <ol className="education-steps">{steps.map((step, index) => <li key={step.code} className={index === currentIndex ? 'is-current' : index < currentIndex ? 'is-done' : ''}><Link to={step.path} aria-current={index === currentIndex ? 'step' : undefined}><span className="education-step-number">{index + 1}</span><span>{isOwner ? step.owner : step.youth}</span><small>{index < currentIndex ? '완료' : index === currentIndex ? '지금' : '예정'}</small></Link></li>)}</ol>
          </section>
        </>
      )}
    </div>
  );
}
