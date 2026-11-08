import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { LoadStatus } from '../components/SuccessionUi';
import { useShopListings } from '../data/shops';
import { SHOP_CATEGORIES } from '../lib/shop';
import { useApp } from '../state/AppContext';
import './ShopExplorePage.css';

const CATEGORIES = ['전체', ...SHOP_CATEGORIES];

export default function ShopExplorePage() {
  const { role } = useApp();
  const isOwner = role === 'owner';
  const { data, loading, error, reload } = useShopListings();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const terms = query.trim().toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
  const shops = (data?.shops ?? []).filter((shop) => {
    if (category !== '전체' && shop.details.category !== category) return false;
    const searchable = [shop.details.name, shop.details.mainMenu, shop.details.district, shop.details.category]
      .join(' ').toLocaleLowerCase('ko-KR').replace(/\s/g, '');
    return terms.every((term) => searchable.includes(term));
  });
  const resetSearch = () => { setQuery(''); setCategory('전체'); };
  const handleSearch = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const filtered = Boolean(query.trim() || category !== '전체');

  return (
    <section className={`shop-explore-page${isOwner ? ' is-owner' : ''}`} aria-labelledby="shop-explore-title">
      <span className="shop-explore-kicker">{isOwner ? '내 가게' : '대구의 맛과 이야기'}</span>
      <h1 id="shop-explore-title">{isOwner ? '가게 정보를 확인해요' : <>다음 이야기를 이어갈<br />가게를 찾아보세요</>}</h1>
      <p className="shop-explore-description">{isOwner ? '저장한 가게와 물려줄 조건을 확인해 보세요.' : '내 조건에 맞춰 추천받은 가게를 지역과 메뉴로 찾아보세요.'}</p>
      {loading || error || !data ? <div className="shop-explore-data-state"><LoadStatus error={error} onRetry={() => void reload()} /></div> : (
        <>
          {!isOwner && !data.profileMissing && data.shops.length > 0 && <>
            <form className="shop-explore-search" role="search" onSubmit={handleSearch}>
              <label htmlFor="shop-search" className="visually-hidden">추천받은 가게 이름, 메뉴, 지역으로 검색</label>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
              <input id="shop-search" type="search" value={query} placeholder="가게 이름, 메뉴, 지역 검색" autoComplete="off" maxLength={100} onChange={(event) => setQuery(event.target.value)} />
              {query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
            </form>
            <fieldset className="shop-explore-categories"><legend className="visually-hidden">가게 업종 선택</legend>{CATEGORIES.map((item) => <label key={item} className={`shop-explore-chip${category === item ? ' is-selected' : ''}`}><input className="visually-hidden" type="radio" name="explore-category" value={item} checked={category === item} onChange={() => setCategory(item)} />{item}</label>)}</fieldset>
          </>}
          <div className="shop-explore-result-heading"><p role="status" aria-live="polite">{isOwner ? '내 가게' : filtered ? '찾은 가게' : '추천받은 가게'} <strong>{shops.length}곳</strong></p><button type="button" className="shop-explore-refresh" onClick={() => void reload()}>새로고침</button></div>
          {shops.length > 0 ? <ul className="shop-explore-list">{shops.map((shop) => <li key={shop.id}><ShopCard shop={shop} showMatch={!isOwner} /></li>)}</ul> : (
            <div className="shop-explore-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
              <h2>{isOwner ? '가게 정보를 먼저 적어 주세요' : data.profileMissing ? '희망 조건을 먼저 알려 주세요' : filtered ? '찾는 조건에 맞는 가게가 없어요' : '아직 추천할 가게가 없어요'}</h2>
              <p>{isOwner ? '가게와 물려줄 내용을 적으면 이곳에서 확인할 수 있어요.' : data.profileMissing ? '경력과 자금, 희망 업종·지역을 저장하면 가게를 살펴볼 수 있어요.' : filtered ? '다른 지역이나 메뉴로 검색하거나 업종을 바꿔 보세요.' : '희망 업종과 지역을 넓히거나 나중에 다시 확인해 보세요.'}</p>
              {filtered && !isOwner ? <button type="button" onClick={resetSearch}>추천 가게 전체 보기</button> : <Link className="shop-explore-setup" to={isOwner ? '/owner/shop' : '/successor/register'}>{isOwner ? '내 가게 알려주기' : '희망 조건 확인하기'}</Link>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
