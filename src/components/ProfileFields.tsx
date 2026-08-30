import React from "react";
import type { ProfileForm } from "../types";
import { regions } from "../constants";
import { formatWon } from "../utils";
import { YearMonthSelect } from "./YearMonthSelect";

// Shared by the onboarding form and the settings edit form — both collect the
// same profile fields, just with different surrounding chrome and submit action.
export function ProfileFields({ profileForm, setProfileForm }: { profileForm: ProfileForm; setProfileForm: React.Dispatch<React.SetStateAction<ProfileForm>> }) {
  const cashPresets = [1_000_000, 2_000_000, 3_000_000, 5_000_000];
  const incomePresets = [0, 300_000, 500_000, 1_000_000];

  return (
    <>
      <div className="field-group">
        <label>
          <span>현재 바로 쓸 수 있는 돈</span>
          <input inputMode="numeric" placeholder="예: 3000000" value={profileForm.available_cash} onChange={(event) => setProfileForm({ ...profileForm, available_cash: event.target.value })} />
        </label>
        <div className="preset-row">
          {cashPresets.map((value) => <button className="preset" key={value} onClick={() => setProfileForm({ ...profileForm, available_cash: String(value) })}>{formatWon(value)}</button>)}
        </div>
      </div>

      <div className="field-group">
        <label>
          <span>매달 들어오는 예상 수입</span>
          <input inputMode="numeric" placeholder="없으면 0" value={profileForm.monthly_income} onChange={(event) => setProfileForm({ ...profileForm, monthly_income: event.target.value })} />
        </label>
        <div className="preset-row">
          {incomePresets.map((value) => <button className="preset" key={value} onClick={() => setProfileForm({ ...profileForm, monthly_income: String(value) })}>{formatWon(value)}</button>)}
        </div>
      </div>

      <div className="form-row">
        <label>
          <span>목표 취업월</span>
          <YearMonthSelect value={profileForm.target_job_month} onChange={(value) => setProfileForm({ ...profileForm, target_job_month: value })} />
        </label>
        <label>
          <span>나이</span>
          <input inputMode="numeric" placeholder="예: 27" value={profileForm.age} onChange={(event) => setProfileForm({ ...profileForm, age: event.target.value })} />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span>거주지역</span>
          <select value={profileForm.region} onChange={(event) => setProfileForm({ ...profileForm, region: event.target.value })}>
            <option value="">선택</option>
            {regions.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        <label>
          <span>정책 매칭용 월소득</span>
          <input inputMode="numeric" placeholder="없으면 0" value={profileForm.monthly_income_for_policy} onChange={(event) => setProfileForm({ ...profileForm, monthly_income_for_policy: event.target.value })} />
        </label>
      </div>
    </>
  );
}
