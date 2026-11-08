import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FlowLayout from "../components/FlowLayout";
import { LoadStatus } from "../components/SuccessionUi";
import { api, orNull, type Experience } from "../lib/api";
import { useAction } from "../lib/useApi";
import { hasRequiredPersonalInfo, useApp } from "../state/AppContext";
import "./RegistrationPages.css";

const EXPERIENCES: { value: Experience; label: string }[] = [
  { value: "NONE", label: "없음" },
  { value: "UNDER_1Y", label: "1년 미만" },
  { value: "ONE_TO_3Y", label: "1~3년" },
  { value: "OVER_3Y", label: "3년 이상" },
];
const LOAN_PLANS = [
  { value: true, label: "청년 창업 대출 알아보는 중" },
  { value: false, label: "대출 없이" },
];
const EARLY_MORNING = [
  { value: true, label: "가능해요" },
  { value: false, label: "어려워요" },
];
const INDUSTRIES = ["한식", "양식", "중식", "일식", "카페"];
const REGIONS = ["중구", "남구", "수성구", "북구"];

function formatFunds(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function YouthRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === '1';
  const requestedShop = searchParams.get('shop') ?? '';
  const selectedShop = /^[1-9]\d*$/.test(requestedShop) && Number.isSafeInteger(Number(requestedShop)) ? requestedShop : null;
  const returnTo = isOnboarding ? '/home' : searchParams.get('from') === 'matching'
    ? `/matching${selectedShop ? `?shop=${selectedShop}` : ''}` : '/my';
  const { me, refreshMe, personalInfo, completeOnboarding, youthDraft: youthProfile,
    setYouthDraft: setYouthProfile, youthDraftText, setYouthDraftText } = useApp();
  const { funds: fundsText, loan: loanText } = youthDraftText;
  const { busy, error, run } = useAction();
  const [profileLoading, setProfileLoading] = useState(Boolean(me?.hasYouthProfile));
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [invalidGroup, setInvalidGroup] = useState<
    "industries" | "regions" | null
  >(null);
  const industryInput = useRef<HTMLInputElement>(null);
  const regionInput = useRef<HTMLInputElement>(null);

  // 이미 등록했으면 불러온다. 화면에 없는 값(나이, 소개 등)도 저장할 때 유지된다.
  useEffect(() => {
    if (!me?.hasYouthProfile) { setProfileLoading(false); return; }
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    void orNull(api.youthProfile()).then((profile) => {
      if (cancelled) return;
      if (!profile) throw new Error('저장한 청년 정보를 찾지 못했어요. 다시 불러와 주세요.');
      setYouthProfile({ ...profile, preferredCategories: profile.preferredCategories ?? [], preferredDistricts: profile.preferredDistricts ?? [] });
      setYouthDraftText({ funds: String(profile.fundsReady), loan: profile.loanAmount ? String(profile.loanAmount) : "" });
    }).catch((cause: unknown) => {
      if (!cancelled) setProfileError(cause instanceof Error ? cause.message : '청년 정보를 불러오지 못했어요.');
    }).finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [me?.id, me?.hasYouthProfile, loadAttempt]);

  const updateSelection = (field: "preferredCategories" | "preferredDistricts", value: string) => {
    const current = youthProfile[field];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setYouthProfile({ ...youthProfile, [field]: next });
    if (next.length > 0 && invalidGroup === (field === "preferredCategories" ? "industries" : "regions")) setInvalidGroup(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileLoading || profileError || busy) return;
    if (youthProfile.preferredCategories.length === 0) {
      setInvalidGroup("industries");
      industryInput.current?.focus();
      return;
    }
    if (youthProfile.preferredDistricts.length === 0) {
      setInvalidGroup("regions");
      regionInput.current?.focus();
      return;
    }
    if (isOnboarding && !hasRequiredPersonalInfo(personalInfo, 'successor')) {
      navigate('/onboarding/profile', { replace: true });
      return;
    }
    setInvalidGroup(null);
    void run(async () => {
      const age = personalInfo.age ? Number(personalInfo.age) : youthProfile.age;
      if (age !== null && (!Number.isInteger(age) || age < 15 || age > 80)) {
        throw new Error('나이는 15세부터 80세 사이로 입력해 주세요.');
      }
      if (!/^\d+$/.test(fundsText) || !Number.isInteger(Number(fundsText)) || Number(fundsText) < 0) {
        throw new Error('준비된 자금을 0 이상으로 적어 주세요.');
      }
      if (youthProfile.loanPlanned && loanText && !/^\d+$/.test(loanText)) {
        throw new Error('대출 예정 금액을 0 이상으로 적어 주세요.');
      }
      if (Number(fundsText) > 2_147_483_647 || (youthProfile.loanPlanned && Number(loanText) > 2_147_483_647)) {
        throw new Error('금액이 너무 커요. 입력한 금액을 다시 확인해 주세요.');
      }
      await api.saveYouthProfile({
        age, experience: youthProfile.experience, experienceDetail: youthProfile.experienceDetail,
        fundsReady: Number(fundsText),
        loanPlanned: youthProfile.loanPlanned,
        loanAmount: youthProfile.loanPlanned ? Number(loanText) : 0,
        preferredCategories: youthProfile.preferredCategories,
        preferredDistricts: youthProfile.preferredDistricts,
        earlyMorningOk: youthProfile.earlyMorningOk,
        intro: youthProfile.intro,
      });
      await refreshMe();
      if (isOnboarding) completeOnboarding('successor');
      navigate(returnTo, { replace: isOnboarding, state: { notice: '매칭 조건을 저장했어요.' } });
    });
  };

  if (profileLoading || profileError) {
    return <FlowLayout title={isOnboarding ? '청년 등록' : '매칭 조건'} backTo={isOnboarding ? '/onboarding/profile' : returnTo} progress={isOnboarding ? { current: 2, total: 2 } : undefined} className="youth-registration-page">
      <h1 className="flow-title">저장한 조건을<br />불러올게요</h1>
      <LoadStatus error={profileError} onRetry={() => setLoadAttempt((value) => value + 1)} />
    </FlowLayout>;
  }

  return (
    <FlowLayout
      title={isOnboarding ? '청년 등록' : '매칭 조건'}
      backTo={isOnboarding ? '/onboarding/profile' : returnTo}
      progress={isOnboarding ? { current: 2, total: 2 } : undefined}
      className="youth-registration-page"
      footer={
        <>
          {error && <p className="flow-error" role="alert">{error}</p>}
          <button
            type="submit"
            form="youth-registration-form"
            className="btn btn-primary block"
            disabled={busy}
          >
            {busy ? '저장하고 있어요' : isOnboarding ? '시작하기' : '저장하기'}
          </button>
        </>
      }
    >
      <h1 className="flow-title">
        경력과 자금,
        <br />
        희망 조건을 알려 주세요
      </h1>
      <p className="flow-desc">사장님과 맞는 정도를 계산하는 데 써요</p>

      <form
        id="youth-registration-form"
        className="registration-form"
        onSubmit={handleSubmit}
      >
        <fieldset className="registration-fieldset">
          <legend className="flow-label">음식점 경력 (단일 선택)</legend>
          <div className="registration-chip-list">
            {EXPERIENCES.map(({ value: experience, label }) => (
              <label
                key={experience}
                className={`flow-chip registration-choice${youthProfile.experience === experience ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  className="registration-choice-input"
                  name="experience"
                  value={experience}
                  checked={youthProfile.experience === experience}
                  required
                  onChange={() =>
                    setYouthProfile({ ...youthProfile, experience })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="registration-field">
          <label className="flow-label" htmlFor="youth-funds">
            지금 준비된 자금
          </label>
          <div className="registration-money-control">
            <input
              id="youth-funds"
              className="flow-input registration-money-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatFunds(fundsText)}
              placeholder="0"
              pattern="[0-9,]+"
              maxLength={13}
              required
              aria-describedby="youth-funds-unit"
              onChange={(event) => {
                const funds = event.target.value.replace(/,/g, "");
                if (/^\d*$/.test(funds)) setYouthDraftText({ ...youthDraftText, funds: funds.replace(/^0+(?=\d)/, "") });
              }}
            />
            <span id="youth-funds-unit" className="registration-money-unit">
              만 원
            </span>
          </div>
        </div>

        <fieldset className="registration-fieldset">
          <legend className="flow-label">대출 계획 (단일 선택)</legend>
          <div className="registration-chip-list">
            {LOAN_PLANS.map(({ value, label }) => (
              <label
                key={label}
                className={`flow-chip registration-choice registration-loan-choice${youthProfile.loanPlanned === value ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  className="registration-choice-input"
                  name="loan-plan"
                  value={label}
                  checked={youthProfile.loanPlanned === value}
                  required
                  onChange={() =>
                    setYouthProfile({ ...youthProfile, loanPlanned: value })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          {youthProfile.loanPlanned && (
            <div className="registration-field registration-loan-amount">
              <label className="flow-label" htmlFor="youth-loan-amount">
                대출 예정 금액 (선택)
              </label>
              <div className="registration-money-control">
                <input
                  id="youth-loan-amount"
                  className="flow-input registration-money-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatFunds(loanText)}
                  placeholder="0"
                  pattern="[0-9,]*"
                  maxLength={13}
                  aria-describedby="youth-loan-unit"
                  onChange={(event) => {
                    const amount = event.target.value.replace(/,/g, "");
                    if (/^\d*$/.test(amount)) setYouthDraftText({ ...youthDraftText, loan: amount.replace(/^0+(?=\d)/, "") });
                  }}
                />
                <span id="youth-loan-unit" className="registration-money-unit">
                  만 원
                </span>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="registration-fieldset">
          <legend className="flow-label">새벽 근무 (단일 선택)</legend>
          <div className="registration-chip-list">
            {EARLY_MORNING.map(({ value, label }) => (
              <label
                key={label}
                className={`flow-chip registration-choice${youthProfile.earlyMorningOk === value ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  className="registration-choice-input"
                  name="early-morning"
                  value={label}
                  checked={youthProfile.earlyMorningOk === value}
                  required
                  onChange={() =>
                    setYouthProfile({ ...youthProfile, earlyMorningOk: value })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset
          className="registration-fieldset"
          aria-invalid={invalidGroup === "industries" || undefined}
          aria-describedby={
            invalidGroup === "industries" ? "youth-industry-error" : undefined
          }
        >
          <legend className="flow-label">
            희망 업종 · 여러 개 골라도 돼요
          </legend>
          <div className="registration-chip-list">
            {INDUSTRIES.map((industry, index) => (
              <label
                key={industry}
                className={`flow-chip registration-choice${youthProfile.preferredCategories.includes(industry) ? " is-selected" : ""}`}
              >
                <input
                  ref={index === 0 ? industryInput : undefined}
                  type="checkbox"
                  className="registration-choice-input"
                  name="industry"
                  value={industry}
                  checked={youthProfile.preferredCategories.includes(industry)}
                  onChange={() => updateSelection("preferredCategories", industry)}
                />
                {industry}
              </label>
            ))}
          </div>
          {invalidGroup === "industries" && (
            <p id="youth-industry-error" className="flow-error" role="alert">
              희망 업종을 하나 이상 골라 주세요.
            </p>
          )}
        </fieldset>

        <fieldset
          className="registration-fieldset"
          aria-invalid={invalidGroup === "regions" || undefined}
          aria-describedby={
            invalidGroup === "regions" ? "youth-region-error" : undefined
          }
        >
          <legend className="flow-label">희망 지역 (복수 선택)</legend>
          <div className="registration-chip-list">
            {REGIONS.map((region, index) => (
              <label
                key={region}
                className={`flow-chip registration-choice${youthProfile.preferredDistricts.includes(region) ? " is-selected" : ""}`}
              >
                <input
                  ref={index === 0 ? regionInput : undefined}
                  type="checkbox"
                  className="registration-choice-input"
                  name="region"
                  value={region}
                  checked={youthProfile.preferredDistricts.includes(region)}
                  onChange={() => updateSelection("preferredDistricts", region)}
                />
                {region}
              </label>
            ))}
          </div>
          {invalidGroup === "regions" && (
            <p id="youth-region-error" className="flow-error" role="alert">
              희망 지역을 하나 이상 골라 주세요.
            </p>
          )}
        </fieldset>
      </form>
    </FlowLayout>
  );
}
