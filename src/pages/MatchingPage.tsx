import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { LoadStatus } from '../components/SuccessionUi';
import { api, orNull, type YouthCandidate } from '../lib/api';
import { formatWon } from '../lib/shop';
import { useLoad } from '../lib/useApi';
import { useApp } from '../state/AppContext';
import './MatchingPage.css';

export default function MatchingPage() {
  const navigate = useNavigate();
  const { me, setSelectedYouth } = useApp();
  const hasActiveSuccession = Boolean(me?.successionId);
  const { data, error, loading, reload } = useLoad(async () => {
    const shop = await orNull(api.shop());
    return { shop, candidates: shop ? await api.ownerMatches() : [] };
  }, [me?.id]);
  const [expandedIds, setExpandedIds] = useState<number[] | null>(null);

  const toggleCandidate = (id: number, current: number[]) => {
    setExpandedIds(current.includes(id) ? current.filter((candidateId) => candidateId !== id) : [...current, id]);
  };

  const handleOffer = (candidate: YouthCandidate) => {
    setSelectedYouth(candidate);
    navigate(candidate.offerStatus === 'PROPOSED' && candidate.offerId ? `/offers/current?offer=${candidate.offerId}` : `/offers/current?youth=${candidate.youthId}`);
  };

  if (loading || error || !data) {
    return (
      <FlowLayout title="청년 찾기" backTo="/matching" className="matching-page">
        <LoadStatus error={error} onRetry={() => void reload()} />
      </FlowLayout>
    );
  }

  if (!data.shop) {
    return (
      <FlowLayout title="청년 찾기" backTo="/matching" className="matching-page">
        <h1 className="flow-title">먼저 가게를<br />등록해 주세요</h1>
        <p className="flow-desc">가게 정보를 저장하면 맞는 청년을 찾아 드려요.</p>
        <Link to="/owner/shop" className="btn btn-primary block succ-empty-action">가게 등록하기</Link>
      </FlowLayout>
    );
  }

  const candidates = data.candidates;
  const expanded = expandedIds ?? (candidates[0] ? [candidates[0].youthId] : []);

  return (
    <FlowLayout title="청년 찾기" backTo="/matching" className="matching-page">
      <h1 className="flow-title">
        {data.shop.name}에 맞는
        <br />
        {candidates.length ? `청년 ${candidates.length}명을 찾았어요` : '청년을 아직 찾지 못했어요'}
      </h1>
      <p className="flow-desc">{candidates.length ? '청년의 이야기를 보고 가게를 물려줄 분을 찾아보세요.' : '잘 맞는 청년이 등록하면 여기에 나타나요.'}</p>
      {hasActiveSuccession && (
        <p className="flow-note matching-active-note" role="status">
          진행 중인 승계가 있어요.{' '}
          <Link to="/succession/home">승계 홈으로 가기</Link>
        </p>
      )}

      <div className="matching-list">
        {candidates.map((candidate, index) => {
          const isExpanded = expanded.includes(candidate.youthId);
          const detailId = `matching-detail-${candidate.youthId}`;
          const isCompact = index > 1 && !isExpanded;
          const good = candidate.reasons.filter((reason) => reason.type === 'GOOD');
          const cautions = candidate.reasons.filter((reason) => reason.type === 'CAUTION');
          const career = candidate.experienceDetail ?? candidate.experienceLabel;
          const isOffered = candidate.offerStatus === 'PROPOSED';

          return (
            <article
              key={candidate.youthId}
              className={`matching-card${isExpanded ? ' is-expanded' : ''}`}
              aria-label={`${candidate.name} 님 매칭 결과`}
            >
              <button
                type="button"
                className="matching-toggle"
                aria-label={`${candidate.name} 님 정보 ${isExpanded ? '접기' : '펼치기'}`}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                onClick={() => toggleCandidate(candidate.youthId, expanded)}
              >
                <span className="matching-heading">
                  <span className="matching-person">
                    <strong>{candidate.name} 님</strong>
                    <span>{candidate.age ? `${candidate.age}세 · ` : ''}{career}</span>
                  </span>
                  <span className="matching-score">
                    <span>잘 맞는 정도</span>
                    <strong>{candidate.score}<span>점</span></strong>
                  </span>
                </span>
                {!isExpanded && (
                  <span className="matching-summary">{candidate.aiComment ?? cautions[0]?.text ?? good[0]?.text}</span>
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
                  {candidate.breakdown.map((part) => {
                    const percent = part.max ? Math.round(part.points / part.max * 100) : 0;
                    return (
                      <div className="matching-metric" key={part.name}>
                        <span className="matching-metric-label">{part.name}</span>
                        <div
                          className="matching-meter"
                          role="progressbar"
                          aria-label={`${part.name} 적합도`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percent}
                          aria-valuetext={`${part.points}점, ${part.level}`}
                        >
                          <span style={{ width: `${percent}%` }} />
                        </div>
                        <span className="matching-metric-level">{part.level}</span>
                      </div>
                    );
                  })}
                </div>

                <section className="matching-profile" aria-labelledby={`matching-profile-${candidate.youthId}`}>
                  <h2 id={`matching-profile-${candidate.youthId}`}>청년 정보</h2>
                  <dl>
                    <div><dt>경력</dt><dd>{candidate.experienceLabel}</dd></div>
                    {candidate.experienceDetail && <div><dt>경력 상세</dt><dd>{candidate.experienceDetail}</dd></div>}
                    <div><dt>준비 자금</dt><dd>{formatWon(candidate.fundsReady)}</dd></div>
                  </dl>
                </section>

                <div className="matching-reasons">
                  <h2>이래서 맞아요</h2>
                  {candidate.aiComment && <p>{candidate.aiComment}</p>}
                  <ul>
                    {good.map((reason) => (
                      <li key={reason.text}>
                        <span className="matching-check" aria-hidden="true">✓</span>
                        <span>{reason.text}</span>
                      </li>
                    ))}
                  </ul>
                  {cautions.map((reason) => (
                    <p className="matching-caution" key={reason.text}>
                      <span aria-hidden="true">!</span>
                      <span>{reason.text}</span>
                    </p>
                  ))}
                </div>
              </div>

              {!isCompact && (
                <button
                  type="button"
                  className={`btn block matching-offer${isExpanded ? ' btn-primary' : ''}`}
                  aria-label={hasActiveSuccession ? '승계 진행 중' : `${candidate.name} 님에게 승계 제안하기`}
                  disabled={hasActiveSuccession}
                  onClick={() => handleOffer(candidate)}
                >
                  {hasActiveSuccession ? '함께 진행 중이에요' : isOffered ? '보낸 제안 보기' : '이 청년에게 제안하기'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </FlowLayout>
  );
}
