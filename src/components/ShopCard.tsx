import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListedShop } from '../data/shops';
import { useApp } from '../state/AppContext';
import ShopCatalogPhoto from './ShopCatalogPhoto';
import './ShopCard.css';

type ShopCardProps = { shop: ListedShop; showMatch?: boolean };

export default function ShopCard({ shop, showMatch = false }: ShopCardProps) {
  const { role, shopPhotos } = useApp();
  const isOwner = role === 'owner';
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const photo = isOwner && shop.source === 'own' ? shopPhotos[0] : undefined;
  useEffect(() => {
    if (!photo) { setUploadedPhoto(null); return; }
    const url = URL.createObjectURL(photo);
    setUploadedPhoto(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const { details } = shop;
  const description = [details.district, details.category, details.openedYear ? `${details.openedYear}년부터` : ''].filter(Boolean).join(' · ');
  const image = uploadedPhoto ? { src: uploadedPhoto, alt: `${details.name}에 등록한 가게 사진` } : shop.image;

  return (
    <article className={`listed-shop-card${isOwner ? ' is-owner' : ''}`}>
      <Link to={`/shops/${shop.id}`} className="listed-shop-link" aria-label={`${details.name} 가게 자세히 보기`}>
        <ShopCatalogPhoto image={image} className="listed-shop-visual">
          <span className="listed-shop-status">{details.retireDate ? '은퇴일 등록' : '은퇴일 미등록'}</span>
        </ShopCatalogPhoto>
        <p className="listed-shop-photo-caption">{uploadedPhoto ? '등록한 가게 사진' : '가게 분위기 참고 사진'}</p>
        <div className="listed-shop-body">
          <div className="listed-shop-heading">
            <h2>{details.name}</h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </div>
          <p className="listed-shop-meta">{description}</p>
          {details.mainMenu && <p className="listed-shop-menu">대표 메뉴 <strong>{details.mainMenu}</strong></p>}
          <div className="listed-shop-price">
            <span>{isOwner ? '가게를 넘길 금액' : '희망 인수 금액'}</span>
            <strong>{details.amount === null ? '등록 금액 확인 필요' : `${details.amount.toLocaleString('ko-KR')}만 원`}</strong>
          </div>
          {shop.tags.length > 0 && <ul className="listed-shop-tags" aria-label="가게 특징">{shop.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
          {showMatch && shop.matchScore !== null && (
            <div className="listed-shop-match"><span>{isOwner ? '맞는 정도' : '적합도'}</span><strong>{shop.matchScore}<span>점</span></strong></div>
          )}
        </div>
      </Link>
    </article>
  );
}
