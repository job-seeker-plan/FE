import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { AuthUser, ProfileForm } from "../types";
import { ProfileFields } from "../components/ProfileFields";

export function Onboarding({ authUser, profileForm, setProfileForm, saveProfile, submitNotice }: { authUser: AuthUser; profileForm: ProfileForm; setProfileForm: React.Dispatch<React.SetStateAction<ProfileForm>>; saveProfile: () => Promise<void>; submitNotice?: string | null }) {
  const canSubmit = authUser.user_id && profileForm.available_cash && profileForm.monthly_income && profileForm.age && profileForm.region && profileForm.target_job_month;

  return (
    <main className="shell setup-shell">
      <header className="setup-header">
        <p className="eyebrow">AI Financial Planner</p>
        <h1>취업 준비가 몇 달 버틸 수 있는지 먼저 계산합니다</h1>
        <p>최소 정보만 입력하고, 다음 화면에서 면접·시험·강의 일정을 캘린더에 추가합니다.</p>
      </header>
      <section className="onboarding-layout">
        <aside className="onboarding-steps">
          <div className="step-item active"><span>1</span><strong>자금</strong><small>가용자금과 월 수입</small></div>
          <div className="step-item active"><span>2</span><strong>목표</strong><small>취업 목표월과 기본 정보</small></div>
          <div className="step-item"><span>3</span><strong>정책</strong><small>지역·소득 조건</small></div>
        </aside>

        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Required Setup</span>
              <h2>기본 플랜 만들기</h2>
            </div>
            <ShieldCheck size={22} />
          </div>

          <div className="field-group">
            <label>
              <span>사용자 ID</span>
          <input readOnly value={authUser.email || authUser.name || authUser.user_id} />
            </label>
          </div>

          <ProfileFields profileForm={profileForm} setProfileForm={setProfileForm} />

          <div className="setup-actions">
            <div>
              <strong>{submitNotice ?? (canSubmit ? "캘린더 준비 완료" : "필수 정보를 입력하세요")}</strong>
              <span>저장하면 취업 캘린더로 이동합니다.</span>
            </div>
            <button disabled={!canSubmit} onClick={saveProfile}><BadgeCheck size={16} />캘린더로 이동</button>
          </div>
        </section>
      </section>
    </main>
  );
}
