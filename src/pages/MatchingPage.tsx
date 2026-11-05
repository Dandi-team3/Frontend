import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { CANDIDATES } from '../data/demo';
import { useDemo } from '../state/DemoContext';
import './MatchingPage.css';

export default function MatchingPage() {
  const navigate = useNavigate();
  const { setRole, setSelectedCandidateId, offerStatus, shop } = useDemo();
  const hasActiveSuccession = offerStatus === 'accepted';
  const [expandedIds, setExpandedIds] = useState<string[]>(
    () => CANDIDATES[0] ? [CANDIDATES[0].id] : [],
  );

  const toggleCandidate = (id: string) => {
    setExpandedIds((current) => current.includes(id)
      ? current.filter((candidateId) => candidateId !== id)
      : [...current, id]);
  };

  const handleOffer = (id: string) => {
    if (hasActiveSuccession) return;
    setRole('owner');
    setSelectedCandidateId(id);
    navigate('/offers/current');
  };

  return (
    <FlowLayout title="매칭" backTo="/owner/register" className="matching-page">
      <h1 className="flow-title">
        {shop.name}에 맞는
        <br />
        청년 {CANDIDATES.length}명을 찾았어요
      </h1>
      <p className="flow-desc">마음에 드는 청년에게 승계를 제안해 보세요</p>
      {hasActiveSuccession && (
        <p className="flow-note matching-active-note" role="status">
          진행 중인 승계가 있어요.{' '}
          <Link to="/succession/schedule">가일정을 확인해 주세요.</Link>
        </p>
      )}

      <div className="matching-list">
        {CANDIDATES.map((candidate, index) => {
          const isExpanded = expandedIds.includes(candidate.id);
          const detailId = `matching-detail-${candidate.id}`;
          const isCompact = index > 1 && !isExpanded;

          return (
            <article
              key={candidate.id}
              className={`matching-card${isExpanded ? ' is-expanded' : ''}`}
              aria-label={`${candidate.name} 님 매칭 결과`}
            >
              <button
                type="button"
                className="matching-toggle"
                aria-label={`${candidate.name} 님 정보 ${isExpanded ? '접기' : '펼치기'}`}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                onClick={() => toggleCandidate(candidate.id)}
              >
                <span className="matching-heading">
                  <span className="matching-person">
                    <strong>{candidate.name} 님</strong>
                    <span>{candidate.age}세 · {candidate.career}</span>
                  </span>
                  <span className="matching-score">
                    <span>적합도</span>
                    <strong>{candidate.score}<span>점</span></strong>
                  </span>
                </span>
                {!isExpanded && (
                  <span className="matching-summary">{candidate.summary}</span>
                )}
                <span className="matching-disclosure">
                  {isExpanded ? '접기' : '자세히 보기'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              <div id={detailId} hidden={!isExpanded} className="matching-details">
                <div className="matching-metrics" aria-label="항목별 적합도">
                  {candidate.metrics.map((metric) => (
                    <div className="matching-metric" key={metric.label}>
                      <span className="matching-metric-label">{metric.label}</span>
                      <div
                        className="matching-meter"
                        role="progressbar"
                        aria-label={`${metric.label} 적합도`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={metric.value}
                        aria-valuetext={`${metric.value}점, ${metric.level}`}
                      >
                        <span style={{ width: `${metric.value}%` }} />
                      </div>
                      <span className="matching-metric-level">{metric.level}</span>
                    </div>
                  ))}
                </div>

                <section className="matching-profile" aria-labelledby={`matching-profile-${candidate.id}`}>
                  <h2 id={`matching-profile-${candidate.id}`}>청년 정보</h2>
                  <dl>
                    {candidate.profile.map(({ label, value }) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <div className="matching-reasons">
                  <h2>이래서 맞아요</h2>
                  <ul>
                    {candidate.reasons.map((reason) => (
                      <li key={reason}>
                        <span className="matching-check" aria-hidden="true">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {candidate.caution && (
                    <p className="matching-caution">
                      <span aria-hidden="true">!</span>
                      <span>{candidate.caution}</span>
                    </p>
                  )}
                </div>
              </div>

              {!isCompact && (
                <button
                  type="button"
                  className={`btn block matching-offer${isExpanded ? ' btn-primary' : ''}`}
                  aria-label={hasActiveSuccession ? '승계 진행 중' : `${candidate.name} 님에게 승계 제안하기`}
                  disabled={hasActiveSuccession}
                  onClick={() => handleOffer(candidate.id)}
                >
                  {hasActiveSuccession ? '승계 진행 중' : '승계 제안하기'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </FlowLayout>
  );
}
