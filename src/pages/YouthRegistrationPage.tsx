import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import FlowLayout from "../components/FlowLayout";
import { api, orNull, type Experience, type YouthProfileRequest } from "../lib/api";
import { useAction } from "../lib/useApi";
import { EMPTY_YOUTH_PROFILE, useApp } from "../state/AppContext";
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
const INDUSTRIES = ["한식", "양식", "중식", "일식", "카페"];
const REGIONS = ["중구", "남구", "수성구", "북구"];

function formatFunds(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function YouthRegistrationPage() {
  const navigate = useNavigate();
  const { me, refreshMe } = useApp();
  const [youthProfile, setYouthProfile] = useState<YouthProfileRequest>(EMPTY_YOUTH_PROFILE);
  const { busy, error, run } = useAction();
  const [invalidGroup, setInvalidGroup] = useState<
    "industries" | "regions" | null
  >(null);
  const industryInput = useRef<HTMLInputElement>(null);
  const regionInput = useRef<HTMLInputElement>(null);

  // 이미 등록했으면 불러온다. 화면에 없는 값(나이, 소개 등)도 저장할 때 유지된다.
  useEffect(() => {
    if (!me?.hasYouthProfile) return;
    let cancelled = false;
    void orNull(api.youthProfile()).then((profile) => {
      if (!cancelled && profile) setYouthProfile(profile);
    }).catch(() => {
      // 불러오지 못하면 새로 입력할 수 있게 둔다.
    });
    return () => { cancelled = true; };
  }, [me]);

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
    setInvalidGroup(null);
    void run(async () => {
      await api.saveYouthProfile({
        ...youthProfile,
        loanAmount: youthProfile.loanPlanned ? youthProfile.loanAmount : 0,
      });
      await refreshMe();
      navigate("/offers/current");
    });
  };

  return (
    <FlowLayout
      title="청년 등록"
      backTo="/successor"
      progress={{ current: 2, total: 3 }}
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
            다음
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
              value={formatFunds(String(youthProfile.fundsReady || ""))}
              placeholder="0"
              pattern="[0-9,]+"
              maxLength={15}
              required
              aria-describedby="youth-funds-unit"
              onChange={(event) => {
                const funds = event.target.value.replace(/,/g, "");
                if (/^\d*$/.test(funds)) {
                  setYouthProfile({ ...youthProfile, fundsReady: Number(funds) });
                }
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
