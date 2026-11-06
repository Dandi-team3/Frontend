import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '../state/DemoContext';
import './PersonalInfoPage.css';

export default function PersonalInfoPage() {
  const { role, personalInfo, setPersonalInfo, shopDraft, setShopDraft } = useDemo();
  const [values, setValues] = useState({ ...personalInfo, name: personalInfo.name || (role === 'owner' ? shopDraft.ownerName : '') });
  const nameInput = useRef<HTMLInputElement>(null);
  const ageInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) {
      nameInput.current?.setCustomValidity('이름을 입력해 주세요.');
      nameInput.current?.reportValidity();
      return;
    }
    const age = Number(values.age);
    if (!/^\d{1,3}$/.test(values.age) || !Number.isInteger(age) || age < 15 || age > 100) {
      ageInput.current?.setCustomValidity('나이는 15세부터 100세 사이로 적어 주세요.');
      ageInput.current?.reportValidity();
      return;
    }
    setPersonalInfo({ name, age: String(age), phone: values.phone.trim(), email: values.email.trim() });
    if (role === 'owner') setShopDraft({ ...shopDraft, ownerName: name });
    navigate('/my', { state: { notice: '내 정보를 저장했어요' } });
  };

  return (
    <div className={`personal-info-page${role === 'owner' ? ' personal-info-owner' : ''}`}>
      <Link to="/my" className="personal-info-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        돌아가기
      </Link>

      <header className="personal-info-heading">
        <h1>내 정보</h1>
        <p>{role === 'owner' ? '사장님의 이름과 나이를 알려 주세요.' : '나를 소개하는 기본 정보예요.'}</p>
      </header>

      <form className="personal-info-form" onSubmit={handleSubmit}>
        <div className="personal-info-field">
          <label htmlFor="personal-name">이름</label>
          <input
            ref={nameInput}
            id="personal-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            maxLength={50}
            placeholder="이름을 입력해 주세요"
            required
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              setValues({ ...values, name: event.currentTarget.value });
            }}
          />
        </div>

        <div className="personal-info-field">
          <label htmlFor="personal-age">나이</label>
          <div className="personal-info-age-control">
            <input
              ref={ageInput}
              id="personal-age"
              name="age"
              type="number"
              inputMode="numeric"
              min={15}
              max={100}
              step={1}
              value={values.age}
              placeholder="나이를 입력해 주세요"
              required
              onChange={(event) => {
                event.currentTarget.setCustomValidity('');
                setValues({ ...values, age: event.currentTarget.value });
              }}
            />
            <span aria-hidden="true">세</span>
          </div>
        </div>

        <div className="personal-info-field">
          <label htmlFor="personal-phone">휴대폰 번호 <span>선택</span></label>
          <input
            id="personal-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            maxLength={30}
            placeholder="휴대폰 번호를 입력해 주세요"
            onChange={(event) => setValues({ ...values, phone: event.currentTarget.value })}
          />
        </div>

        <div className="personal-info-field">
          <label htmlFor="personal-email">이메일 <span>선택</span></label>
          <input
            id="personal-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            maxLength={254}
            placeholder="이메일을 입력해 주세요"
            onChange={(event) => setValues({ ...values, email: event.currentTarget.value })}
          />
        </div>

        <p className="personal-info-note">이름과 나이는 꼭 적어 주세요.<br />연락처는 나중에 적어도 돼요.</p>
        <button type="submit" className="btn btn-primary block personal-info-save">저장하기</button>
      </form>
    </div>
  );
}
