import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressSearchDialog from '../components/AddressSearchDialog';
import FlowLayout from '../components/FlowLayout';
import ShopPhotoPicker from '../components/ShopPhotoPicker';
import type { PostcodeResult } from '../lib/postcode';
import { SHOP_CATEGORIES, type ShopDraft } from '../lib/shop';
import { useApp, useShopDraftLoader } from '../state/AppContext';
import './OwnerShopPage.css';

const REQUIRED_FIELDS = [
  { key: 'name', message: '가게 이름을 입력해 주세요.' },
  { key: 'district', message: '가게가 있는 지역을 입력해 주세요.' },
] as const;

export default function OwnerShopPage() {
  const navigate = useNavigate();
  const { me, shopDraft, setShopDraft, shopPhotos, setShopPhotos } = useApp();
  useShopDraftLoader();

  const [searchOpen, setSearchOpen] = useState(false);
  const districtInput = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof ShopDraft>(field: K, value: ShopDraft[K]) {
    setShopDraft({ ...shopDraft, [field]: value });
  }

  const handleAddressSelect = ({ address, sido, sigungu }: PostcodeResult) => {
    districtInput.current?.setCustomValidity('');
    setShopDraft({ ...shopDraft, district: sigungu || sido, address });
    setSearchOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    for (const { key, message } of REQUIRED_FIELDS) {
      const input = form.elements.namedItem(key);
      if (input instanceof HTMLInputElement && !shopDraft[key].trim()) {
        input.setCustomValidity(message);
        input.reportValidity();
        return;
      }
    }

    setShopDraft({
      ...shopDraft,
      name: shopDraft.name.trim(),
      district: shopDraft.district.trim(),
      mainMenu: shopDraft.mainMenu.trim(),
      address: shopDraft.address.trim(),
    });
    navigate('/owner/terms');
  };

  return (
    <FlowLayout
      title="가게 등록"
      backTo="/owner"
      progress={{ current: 1, total: 3 }}
      className="owner-shop-page"
      footer={(
        <button type="submit" form="owner-shop-form" className="btn btn-primary block">
          다음
        </button>
      )}
    >
      <h1 className="flow-title">사장님의 가게를<br />알려 주세요</h1>
      <p className="flow-desc">가게에 맞는 청년을 찾을 수 있도록 기본 정보를 입력해 주세요.</p>

      <form id="owner-shop-form" className="owner-shop-form" onSubmit={handleSubmit}>
        <div className="owner-shop-field">
          <label className="flow-label" htmlFor="owner-name">사장님 이름</label>
          <input id="owner-name" className="flow-input" type="text" value={me?.name ?? ''} readOnly />
        </div>

        <div className="owner-shop-field">
          <label className="flow-label" htmlFor="shop-name">가게 이름</label>
          <input
            id="shop-name"
            name="name"
            className="flow-input"
            type="text"
            autoComplete="organization"
            value={shopDraft.name}
            maxLength={100}
            placeholder="가게 이름을 입력해 주세요"
            required
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              updateField('name', event.currentTarget.value);
            }}
          />
        </div>

        <fieldset className="owner-shop-field owner-shop-categories">
          <legend className="flow-label">가게 업종</legend>
          <div className="owner-shop-category-options">
            {SHOP_CATEGORIES.map((category) => (
              <label key={category} className={`flow-chip${shopDraft.category === category ? ' is-selected' : ''}`}>
                <input
                  className="visually-hidden"
                  type="radio"
                  name="category"
                  value={category}
                  checked={shopDraft.category === category}
                  required
                  onChange={() => updateField('category', category)}
                />
                {category}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="owner-shop-field">
          <label className="flow-label" htmlFor="shop-main-menu">대표 메뉴 <span className="owner-shop-optional">선택</span></label>
          <input
            id="shop-main-menu"
            name="mainMenu"
            className="flow-input"
            type="text"
            value={shopDraft.mainMenu}
            maxLength={50}
            placeholder="예: 손칼국수, 잔치국수"
            onChange={(event) => updateField('mainMenu', event.target.value)}
          />
        </div>

        <div className="owner-shop-field">
          <span className="flow-label">가게 위치</span>
          <button type="button" className="owner-shop-search" onClick={() => setSearchOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            도로명, 건물명, 지번으로 검색
          </button>
        </div>

        <div className="owner-shop-field-row">
          <div className="owner-shop-field">
            <label className="flow-label" htmlFor="shop-district">가게 지역</label>
            <input
              ref={districtInput}
              id="shop-district"
              name="district"
              className="flow-input"
              type="text"
              autoComplete="address-level2"
              value={shopDraft.district}
              maxLength={20}
              placeholder="예: 중구"
              required
              onChange={(event) => {
                event.currentTarget.setCustomValidity('');
                updateField('district', event.currentTarget.value);
              }}
            />
          </div>
          <div className="owner-shop-field">
            <label className="flow-label" htmlFor="shop-opened-year">개업 연도 <span className="owner-shop-optional">선택</span></label>
            <input
              id="shop-opened-year"
              name="openedYear"
              className="flow-input"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              step={1}
              value={shopDraft.openedYear}
              placeholder="예: 1987"
              onChange={(event) => updateField('openedYear', event.target.value)}
            />
          </div>
        </div>

        <div className="owner-shop-field">
          <label className="flow-label" htmlFor="shop-address">상세 주소 <span className="owner-shop-optional">선택</span></label>
          <input
            id="shop-address"
            name="address"
            className="flow-input"
            type="text"
            autoComplete="street-address"
            value={shopDraft.address}
            maxLength={200}
            placeholder="검색 후 층·호수를 적어 주세요"
            onChange={(event) => updateField('address', event.target.value)}
          />
        </div>

        <section className="owner-shop-field owner-shop-photo" aria-labelledby="owner-shop-photo-heading">
          <h2 id="owner-shop-photo-heading" className="flow-label">가게 사진 <span className="owner-shop-optional">선택</span></h2>
          <ShopPhotoPicker files={shopPhotos} onChange={setShopPhotos} editable />
        </section>
      </form>

      <AddressSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleAddressSelect} />
    </FlowLayout>
  );
}
