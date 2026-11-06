import { useState, type FormEvent } from 'react';
import ShopCard from '../components/ShopCard';
import { SHOPS } from '../data/shops';
import { SHOP_CATEGORIES } from '../lib/shop';
import { useDemo } from '../state/DemoContext';
import './ShopExplorePage.css';

const CATEGORIES = ['전체', ...SHOP_CATEGORIES];

export default function ShopExplorePage() {
  const { role } = useDemo();
  const isOwner = role === 'owner';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const terms = query.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
  const shops = SHOPS.filter((shop) => {
    if (category !== '전체' && shop.details.category !== category) return false;
    const searchable = [shop.details.name, shop.details.mainMenu, shop.details.district, shop.details.address, shop.details.category, ...shop.menus.map((menu) => menu.name)]
      .join(' ').toLocaleLowerCase('ko-KR').replace(/\s/g, '');
    return terms.every((term) => searchable.includes(term));
  });

  const resetSearch = () => {
    setQuery('');
    setCategory('전체');
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <section className={`shop-explore-page${isOwner ? ' is-owner' : ''}`} aria-labelledby="shop-explore-title">
      <span className="shop-explore-kicker">대구의 맛과 이야기</span>
      <h1 id="shop-explore-title">{isOwner ? '오래된 가게 둘러보기' : <>다음 이야기를 이어갈<br />가게를 찾아보세요</>}</h1>
      <p className="shop-explore-description">{isOwner ? '다른 가게는 어떻게 준비하는지 살펴보세요.' : '지역과 메뉴를 살펴보고, 마음에 드는 가게를 만나 보세요.'}</p>

      <form className="shop-explore-search" role="search" onSubmit={handleSearch}>
        <label htmlFor="shop-search" className="visually-hidden">가게 이름, 메뉴, 대구 지역으로 검색</label>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
        <input id="shop-search" type="search" value={query} placeholder={isOwner ? '가게 이름이나 지역을 적어 주세요' : '가게 이름, 메뉴, 지역 검색'} autoComplete="off" maxLength={100} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
      </form>

      <fieldset className="shop-explore-categories">
        <legend className="visually-hidden">가게 업종 선택</legend>
        {CATEGORIES.map((item) => (
          <label key={item} className={`shop-explore-chip${category === item ? ' is-selected' : ''}`}>
            <input className="visually-hidden" type="radio" name="explore-category" value={item} checked={category === item} onChange={() => setCategory(item)} />
            {item}
          </label>
        ))}
      </fieldset>

      <div className="shop-explore-result-heading">
        <p role="status" aria-live="polite">{query.trim() || category !== '전체' ? '찾은 가게' : '둘러볼 가게'} <strong>{shops.length}곳</strong></p>
        <span>대구</span>
      </div>

      {shops.length > 0 ? (
        <ul className="shop-explore-list">
          {shops.map((shop) => <li key={shop.id}><ShopCard shop={shop} /></li>)}
        </ul>
      ) : (
        <div className="shop-explore-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <h2>조건에 맞는 가게가 없어요</h2>
          <p>다른 지역이나 메뉴로 검색하거나<br />업종을 바꿔 보세요.</p>
          <button type="button" onClick={resetSearch}>전체 가게 보기</button>
        </div>
      )}
    </section>
  );
}
