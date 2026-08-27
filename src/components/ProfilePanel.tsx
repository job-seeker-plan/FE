import type { UserProfile } from "../types";
import { formatWon } from "../utils";
import { Panel } from "./Panel";

export function ProfilePanel({ profile }: { profile: UserProfile }) {
  return (
    <Panel title="현재 프로필">
      <div className="flow-list">
        <div className="flow-row"><span>사용자</span><strong>{profile.user_id}</strong></div>
        <div className="flow-row"><span>가용자금</span><strong>{formatWon(profile.available_cash)}</strong></div>
        <div className="flow-row"><span>월 예상수입</span><strong>{formatWon(profile.monthly_income)}</strong></div>
        <div className="flow-row"><span>거주지역</span><strong>{profile.region}</strong></div>
        <div className="flow-row"><span>목표 취업월</span><strong>{profile.target_job_month}</strong></div>
      </div>
    </Panel>
  );
}
