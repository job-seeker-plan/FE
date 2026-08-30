import { useState } from "react";
import type { ProfileForm, UserProfile } from "../types";
import { Panel } from "../components/Panel";
import { ProfileFields } from "../components/ProfileFields";
import { ProfilePanel } from "../components/ProfilePanel";

function toProfileForm(profile: UserProfile): ProfileForm {
  return {
    user_id: profile.user_id,
    available_cash: String(Math.round(profile.available_cash / 10_000)),
    monthly_income: String(Math.round(profile.monthly_income / 10_000)),
    age: String(profile.age),
    region: profile.region,
    monthly_income_for_policy: String(Math.round(profile.monthly_income_for_policy / 10_000)),
    target_job_month: profile.target_job_month
  };
}

export function SettingsView({ profile, onLogout, updateProfile, updateNotice }: { profile: UserProfile; onLogout: () => Promise<void>; updateProfile: (form: ProfileForm) => Promise<void>; updateNotice?: string | null }) {
  const [editForm, setEditForm] = useState<ProfileForm>(() => toProfileForm(profile));
  const canSave = editForm.available_cash && editForm.monthly_income && editForm.age && editForm.region && editForm.target_job_month;

  return (
    <section className="dashboard-grid">
      <Panel title="프로필 수정">
        <ProfileFields profileForm={editForm} setProfileForm={setEditForm} />
        <div className="setup-actions">
          <div>
            <strong>{updateNotice ?? (canSave ? "저장할 준비가 되었습니다" : "필수 정보를 입력하세요")}</strong>
            <span>저장하면 대시보드·정책 매칭에 바로 반영됩니다.</span>
          </div>
          <button disabled={!canSave} onClick={() => void updateProfile(editForm)}>저장</button>
        </div>
      </Panel>
      <section className="side-stack">
        <ProfilePanel profile={profile} />
        <Panel title="계정">
          <p className="muted">이 기기의 로그인 세션을 종료합니다.</p>
          <button className="secondary" onClick={() => void onLogout()}>로그아웃</button>
        </Panel>
      </section>
    </section>
  );
}
