import { Link } from 'react-router-dom';
import type { ListedShop } from '../data/shops';
import { useDemo } from '../state/DemoContext';
import ShopCatalogPhoto from './ShopCatalogPhoto';
import './ShopCard.css';

type ShopCardProps = {
  shop: ListedShop;
  showMatch?: boolean;
};

export default function ShopCard({ shop, showMatch = false }: ShopCardProps) {
  const { role } = useDemo();
  const isOwner = role === 'owner';
  const { details } = shop;
  const description = [details.district, details.category, details.openedYear ? `${details.openedYear}년부터` : ''].filter(Boolean).join(' · ');

  return (
    <article className={`listed-shop-card${isOwner ? ' is-owner' : ''}`}>
      <Link to={`/shops/${shop.id}`} className="listed-shop-link" aria-label={`${details.name} 가게 자세히 보기`}>
        <ShopCatalogPhoto image={shop.image} className="listed-shop-visual">
          <span className="listed-shop-status">{details.retireDate ? '은퇴일 등록' : '은퇴일 협의'}</span>
        </ShopCatalogPhoto>

        <div className="listed-shop-body">
          <div className="listed-shop-heading">
            <h2>{details.name}</h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </div>
          <p className="listed-shop-meta">{description}</p>
          {details.mainMenu && <p className="listed-shop-menu">대표 메뉴 <strong>{details.mainMenu}</strong></p>}

          <div className="listed-shop-price">
            <span>{isOwner ? '가게를 넘길 금액' : '희망 인수 금액'}</span>
            <strong>{details.amount === null ? '함께 정해요' : `${details.amount.toLocaleString('ko-KR')}만 원`}</strong>
          </div>

          {shop.tags.length > 0 && (
            <ul className="listed-shop-tags" aria-label="가게 특징">
              {shop.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
          {showMatch && (
            <div className="listed-shop-match">
              <span>{isOwner ? '맞는 정도' : '적합도'}</span>
              <strong>{shop.matchScore}<span>점</span></strong>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
