import { Link, useParams } from 'react-router-dom';
import { getShopById } from '../data/shops';
import { formatKoreanDate } from '../lib/dates';
import { useDemo } from '../state/DemoContext';
import ShopCatalogPhoto from '../components/ShopCatalogPhoto';
import './ShopDetailPage.css';

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useDemo();
  const isOwner = role === 'owner';
  const shop = id ? getShopById(id) : undefined;

  if (!shop) {
    return (
      <section className="shop-detail-page shop-detail-not-found" aria-labelledby="shop-not-found-title">
        <h1 id="shop-not-found-title">가게를 찾을 수 없어요</h1>
        <p>목록에서 다른 가게를 살펴보세요.</p>
        <Link to="/shops" className="btn btn-primary block">노포 목록으로</Link>
      </section>
    );
  }

  const { details } = shop;
  const location = details.address.includes(details.district)
    ? details.address
    : [details.district, details.address].filter(Boolean).join(' ');
  const conditions = [
    { label: isOwner ? '가게를 넘길 금액' : '희망 인수 금액', value: details.amount === null ? '함께 정할 예정이에요' : `${details.amount.toLocaleString('ko-KR')}만 원` },
    { label: isOwner ? '함께 넘기는 것' : '인수 금액에 포함', value: details.included },
    { label: '은퇴 희망일', value: details.retireDate ? formatKoreanDate(details.retireDate) : '함께 정할 예정이에요' },
    { label: isOwner ? '함께 배우는 기간' : '수습 기간', value: `${details.trainingMonths}개월` },
    { label: isOwner ? '함께 일할 시간' : '근무 시간', value: details.workHours },
    { label: '새벽 근무', value: details.earlyMorning ? '필요해요' : '필수 조건은 아니에요' },
  ];

  return (
    <section className={`shop-detail-page${isOwner ? ' is-owner' : ''}`} aria-labelledby="shop-detail-title">
      <Link to="/shops" className="shop-detail-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        노포 목록
      </Link>

      <figure className="shop-detail-photo">
        <ShopCatalogPhoto image={shop.image} className="shop-detail-hero" loading="eager" />
        <figcaption>가게 분위기 참고 사진</figcaption>
      </figure>

      <div className="shop-detail-intro">
        <p className="shop-detail-location">{details.district} · {details.category}</p>
        <h1 id="shop-detail-title">{details.name}</h1>
        <p className="shop-detail-address">{location}</p>
        {details.owner && <p className="shop-detail-owner">{details.owner} 사장님이 지켜온 가게예요</p>}
        {shop.tags.length > 0 && <ul className="shop-detail-tags" aria-label="가게 특징">{shop.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      </div>

      <section className="shop-detail-section" aria-labelledby="shop-story-title">
        <h2 id="shop-story-title">가게 이야기</h2>
        <p className="shop-detail-story">{shop.story}</p>
        {shop.highlights.length > 0 && (
          <ul className="shop-detail-highlights">
            {shop.highlights.map((highlight) => <li key={highlight}><span aria-hidden="true">✓</span>{highlight}</li>)}
          </ul>
        )}
      </section>

      <section className="shop-detail-section" aria-labelledby="shop-menu-title">
        <h2 id="shop-menu-title">대표 메뉴</h2>
        <ul className="shop-detail-menus">
          {shop.menus.map((menu) => <li key={menu.name}><span>{menu.name}</span><strong>{menu.price.toLocaleString('ko-KR')}원</strong></li>)}
        </ul>
      </section>

      <section className="shop-detail-section" aria-labelledby="shop-conditions-title">
        <h2 id="shop-conditions-title">{isOwner ? '넘기는 조건' : '승계 조건'}</h2>
        <dl className="shop-detail-conditions">
          {conditions.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>

      <div className="shop-detail-action">
        <p>{isOwner ? '내 가게와 맞는 청년도 찾아보세요.' : '내 경력과 희망 조건에 얼마나 맞는지 확인해 보세요.'}</p>
        <Link to={isOwner ? '/matching' : `/matching?shop=${shop.id}`} className="btn btn-primary block">
          {isOwner ? '내 가게에 맞는 청년 찾기' : '이 가게와 매칭 확인하기'}
        </Link>
      </div>
    </section>
  );
}
