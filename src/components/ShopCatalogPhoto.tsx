import { useState, type ReactNode } from 'react';
import type { ListedShop } from '../data/shops';
import './ShopCatalogPhoto.css';

type ShopCatalogPhotoProps = {
  image: ListedShop['image'];
  className?: string;
  loading?: 'eager' | 'lazy';
  children?: ReactNode;
};

export default function ShopCatalogPhoto({ image, className = '', loading = 'lazy', children }: ShopCatalogPhotoProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <div className={`shop-catalog-photo ${className}`}>
      {failedSource !== image.src ? (
        <img src={image.src} alt={image.alt} loading={loading} decoding="async" style={{ objectPosition: image.position }} onError={() => setFailedSource(image.src)} />
      ) : (
        <div className="shop-catalog-photo-fallback" role="img" aria-label="가게 분위기 사진을 불러오지 못했어요">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5" /></svg>
          <span>가게 사진</span>
        </div>
      )}
      {children}
    </div>
  );
}
