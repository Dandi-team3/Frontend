import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDemo } from '../state/DemoContext';
import './PolicyPage.css';

const DOCUMENTS = [
  {
    id: 'terms',
    title: '이용약관 안내',
    introduction: '물려받기를 이용하기 전에 함께 알아둘 내용이에요.',
    sections: [
      { title: '서로 확인하고 결정해요', text: '가게 정보와 추천 점수는 비교를 돕는 자료예요. 인수 금액과 근무 조건은 두 분이 직접 확인하고 결정해 주세요.' },
      { title: '제안은 차근차근 살펴봐요', text: '사장님이 승계를 제안하면 청년이 내용을 보고 수락하거나 거절해요. 정보를 입력했다고 제안이 자동으로 보내지지는 않아요.' },
      { title: '일정은 함께 정해요', text: '승계가 시작된 뒤 은퇴 희망일을 바꾸려면 상대방의 동의가 필요해요. 바뀐 날짜는 두 분이 확인한 뒤 반영해요.' },
    ],
  },
  {
    id: 'privacy',
    title: '개인정보 안내',
    introduction: '어떤 정보를 입력하는지 쉽게 설명해 드릴게요.',
    sections: [
      { title: '나를 소개하는 정보', text: '이름과 나이, 선택해서 적은 휴대폰 번호와 이메일을 사용해요. 사장님인지 청년인지 선택한 역할도 화면에 반영해요.' },
      { title: '가게와 희망 조건', text: '사장님은 가게 정보·사진·승계 조건을, 청년은 경력·준비 자금·대출 계획·희망 업종과 지역을 입력할 수 있어요. 서로 맞는 조건을 비교하는 데 사용해요.' },
      { title: '현재 체험 화면에서는', text: '입력한 정보는 화면을 사용하는 동안만 유지되고, 새로고침하면 초기화돼요. 사진은 미리보기로 확인하며 실제 서버 업로드와 계정 삭제 기능은 아직 연결하지 않았어요.' },
    ],
  },
  {
    id: 'about',
    title: '물려받기 소개',
    introduction: '오래 지켜온 가게의 맛과 이야기를 다음 사람에게 이어 줘요.',
    sections: [
      { title: '가게와 사람을 이어요', text: '물려받기는 대구의 오래된 가게와 새로운 시작을 준비하는 청년을 잇는 서비스예요.' },
      { title: '내게 맞는 만남을 찾아요', text: '사장님은 함께할 청년을 찾고, 청년은 마음에 드는 가게를 살펴봐요. 경력과 희망 조건을 비교하며 천천히 준비할 수 있어요.' },
      { title: '준비부터 승계까지 함께해요', text: '제안이 수락되면 일정과 체크리스트를 확인하고, 승계 계획과 수습 과정, 납입 내역을 차례로 살펴봐요.' },
    ],
  },
];

export default function PolicyPage() {
  const { document: documentName } = useParams<{ document: string }>();
  const { role, onboardingComplete } = useDemo();
  const content = DOCUMENTS.find((item) => item.id === documentName);
  const canReturnToMy = onboardingComplete[role];

  useEffect(() => {
    document.title = `${content?.title ?? '서비스 안내'} | 물려받기`;
  }, [content?.title]);

  return (
    <div className={`policy-page${role === 'owner' ? ' policy-page-owner' : ''}`}>
      <Link to={canReturnToMy ? '/my' : '/'} className="policy-page-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        {canReturnToMy ? '돌아가기' : '시작 화면으로'}
      </Link>
      {content ? (
        <>
          <header className="policy-page-heading">
            <span>서비스 안내</span>
            <h1>{content.title}</h1>
            <p>{content.introduction}</p>
          </header>
          <div className="policy-page-sections">
            {content.sections.map(({ title, text }, index) => (
              <section key={title} className="policy-page-section">
                <span className="policy-page-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div><h2>{title}</h2><p>{text}</p></div>
              </section>
            ))}
          </div>
          <p className="policy-page-notice">정식 약관과 개인정보처리방침은<br />서비스 오픈 전에 안내드릴게요.</p>
        </>
      ) : (
        <header className="policy-page-heading"><h1>안내를 찾을 수 없어요</h1><p>마이페이지에서 필요한 안내를 다시 골라 주세요.</p></header>
      )}
    </div>
  );
}
