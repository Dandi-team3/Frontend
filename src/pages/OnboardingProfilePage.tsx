import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import FlowLayout from '../components/FlowLayout';
import { hasRequiredPersonalInfo, useApp } from '../state/AppContext';
import { useAction } from '../lib/useApi';
import { api } from '../lib/api';
import './OnboardingProfilePage.css';

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { me, pendingRole, personalInfo, setPersonalInfo, onboardingComplete, login, completeOnboarding } = useApp();
  const isOwner = pendingRole === 'owner';
  const maxAge = isOwner ? 100 : 80;
  const [values, setValues] = useState(personalInfo);
  const { busy, error, run } = useAction();
  const nameInput = useRef<HTMLInputElement>(null);
  const ageInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');

  const currentRole = me?.role === 'OWNER' ? 'owner' : me?.role === 'YOUTH' ? 'successor' : null;
  if (!submitted.current && !busy && !error && currentRole === pendingRole && onboardingComplete[pendingRole] && hasRequiredPersonalInfo(personalInfo, pendingRole)) return <Navigate to="/my/profile" replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    const age = values.age.trim();
    const ageNumber = Number(age);

    if (!name) {
      const message = '이름을 입력해 주세요.';
      setNameError(message);
      nameInput.current?.setCustomValidity(message);
      nameInput.current?.reportValidity();
      return;
    }
    if (!/^\d+$/.test(age) || !Number.isInteger(ageNumber) || ageNumber < 15 || ageNumber > maxAge) {
      const message = `나이를 15세부터 ${maxAge}세 사이의 정수로 적어 주세요.`;
      setAgeError(message);
      ageInput.current?.setCustomValidity(message);
      ageInput.current?.reportValidity();
      return;
    }

    // 계정 복원으로 상태가 바뀌어도 제출 결과의 이동 경로를 유지한다.
    submitted.current = true;
    void run(async () => {
      const serverRole = isOwner ? 'OWNER' : 'YOUTH';
      const next = me?.name === name && me.role === serverRole ? me : await login(name, serverRole);
      if (next.role !== (isOwner ? 'OWNER' : 'YOUTH')) {
        throw new Error('이 이름으로 등록한 역할이 달라요. 역할을 다시 골라 주세요.');
      }
      const info = { ...values, name: next.name, age: String(ageNumber), phone: values.phone.trim(), email: values.email.trim() };
      const alreadyRegistered = isOwner ? next.hasShop : next.hasYouthProfile;
      if (alreadyRegistered) {
        if (!isOwner) {
          const profile = await api.youthProfile();
          if (profile.age !== ageNumber) {
            await api.saveYouthProfile({
              age: ageNumber, experience: profile.experience, experienceDetail: profile.experienceDetail,
              fundsReady: profile.fundsReady, loanPlanned: profile.loanPlanned, loanAmount: profile.loanAmount,
              preferredCategories: profile.preferredCategories, preferredDistricts: profile.preferredDistricts,
              earlyMorningOk: profile.earlyMorningOk, intro: profile.intro,
            });
          }
        }
        setPersonalInfo(info);
        completeOnboarding(pendingRole);
        navigate('/home', { replace: true });
      } else {
        setPersonalInfo(info);
        navigate(isOwner ? '/owner/shop?onboarding=1' : '/successor/register?onboarding=1');
      }
    });
  };

  return (
    <FlowLayout
      title="기본 정보"
      backTo="/role"
      progress={{ current: 1, total: isOwner ? 4 : 2 }}
      className="onboarding-profile-page"
      footer={<>{error && <p className="flow-error" role="alert">{error}</p>}<button type="submit" form="onboarding-profile-form" className="btn btn-primary block" disabled={busy}>{busy ? '확인하고 있어요' : '다음'}</button></>}
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
            value={values.name}
            maxLength={50}
            placeholder={isOwner ? '성함을 적어 주세요' : '이름을 적어 주세요'}
            required
            aria-invalid={Boolean(nameError) || undefined}
            aria-describedby={nameError ? 'onboarding-name-error' : undefined}
            onInvalid={() => setNameError('이름을 입력해 주세요.')}
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              setNameError('');
              setValues({ ...values, name: event.currentTarget.value });
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
              max={maxAge}
              step={1}
              value={values.age}
              placeholder="나이를 적어 주세요"
              required
              aria-invalid={Boolean(ageError) || undefined}
              aria-describedby={ageError ? 'onboarding-age-unit onboarding-age-error' : 'onboarding-age-unit'}
              onInvalid={() => setAgeError(`나이를 15세부터 ${maxAge}세 사이의 정수로 적어 주세요.`)}
              onChange={(event) => {
                event.currentTarget.setCustomValidity('');
                setAgeError('');
                setValues({ ...values, age: event.currentTarget.value });
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
            value={values.phone}
            maxLength={30}
            placeholder="연락받을 번호를 적어 주세요"
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
          />
        </div>
      </form>
    </FlowLayout>
  );
}
