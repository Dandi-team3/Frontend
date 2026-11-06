import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { hasRequiredPersonalInfo, useDemo } from '../state/DemoContext';
import './OnboardingProfilePage.css';

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { role, personalInfo, setPersonalInfo, shopDraft, setShopDraft, onboardingComplete } = useDemo();
  const isOwner = role === 'owner';
  const nameInput = useRef<HTMLInputElement>(null);
  const ageInput = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');

  if (onboardingComplete[role] && hasRequiredPersonalInfo(personalInfo)) return <Navigate to="/my/profile" replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = personalInfo.name.trim();
    const age = personalInfo.age.trim();
    const ageNumber = Number(age);

    if (!name) {
      const message = '이름을 입력해 주세요.';
      setNameError(message);
      nameInput.current?.setCustomValidity(message);
      nameInput.current?.reportValidity();
      return;
    }
    if (!/^\d+$/.test(age) || !Number.isInteger(ageNumber) || ageNumber < 15 || ageNumber > 100) {
      const message = '나이를 15세부터 100세 사이의 정수로 적어 주세요.';
      setAgeError(message);
      ageInput.current?.setCustomValidity(message);
      ageInput.current?.reportValidity();
      return;
    }

    setPersonalInfo({ ...personalInfo, name, age: String(ageNumber), phone: personalInfo.phone.trim() });
    if (isOwner) setShopDraft({ ...shopDraft, ownerName: name });
    navigate(isOwner ? '/owner/shop?onboarding=1' : '/successor/register?onboarding=1');
  };

  return (
    <FlowLayout
      title="기본 정보"
      backTo="/role"
      progress={{ current: 1, total: isOwner ? 4 : 2 }}
      className="onboarding-profile-page"
      footer={<button type="submit" form="onboarding-profile-form" className="btn btn-primary block">다음</button>}
    >
      <h1 className="flow-title">{isOwner ? <>사장님,<br />반가워요</> : <>만나서<br />반가워요</>}</h1>
      <p className="flow-desc">먼저 이름과 나이를 알려 주세요.<br />연락처는 나중에 적어도 괜찮아요.</p>

      <form id="onboarding-profile-form" className="onboarding-profile-form" onSubmit={handleSubmit}>
        <div className="onboarding-profile-field">
          <label className="flow-label" htmlFor="onboarding-name">이름</label>
          <input
            ref={nameInput}
            id="onboarding-name"
            className="flow-input"
            type="text"
            autoComplete="name"
            value={personalInfo.name}
            maxLength={50}
            placeholder={isOwner ? '성함을 적어 주세요' : '이름을 적어 주세요'}
            required
            aria-invalid={Boolean(nameError) || undefined}
            aria-describedby={nameError ? 'onboarding-name-error' : undefined}
            onInvalid={() => setNameError('이름을 입력해 주세요.')}
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              setNameError('');
              setPersonalInfo({ ...personalInfo, name: event.currentTarget.value });
            }}
          />
          {nameError && <p id="onboarding-name-error" className="flow-error" role="alert">{nameError}</p>}
        </div>

        <div className="onboarding-profile-field">
          <label className="flow-label" htmlFor="onboarding-age">나이</label>
          <div className="onboarding-age-control">
            <input
              ref={ageInput}
              id="onboarding-age"
              className="flow-input"
              type="number"
              inputMode="numeric"
              min={15}
              max={100}
              step={1}
              value={personalInfo.age}
              placeholder="나이를 적어 주세요"
              required
              aria-invalid={Boolean(ageError) || undefined}
              aria-describedby={ageError ? 'onboarding-age-unit onboarding-age-error' : 'onboarding-age-unit'}
              onInvalid={() => setAgeError('나이를 15세부터 100세 사이의 정수로 적어 주세요.')}
              onChange={(event) => {
                event.currentTarget.setCustomValidity('');
                setAgeError('');
                setPersonalInfo({ ...personalInfo, age: event.currentTarget.value });
              }}
            />
            <span id="onboarding-age-unit" className="onboarding-age-unit">세</span>
          </div>
          {ageError && <p id="onboarding-age-error" className="flow-error" role="alert">{ageError}</p>}
        </div>

        <div className="onboarding-profile-field">
          <label className="flow-label" htmlFor="onboarding-phone">휴대폰 번호 <span className="onboarding-optional">선택</span></label>
          <input
            id="onboarding-phone"
            className="flow-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={personalInfo.phone}
            maxLength={30}
            placeholder="연락받을 번호를 적어 주세요"
            onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })}
          />
        </div>
      </form>
    </FlowLayout>
  );
}
