import React from "react";
import type { MatchedPolicy } from "../types";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";

export function PoliciesView({ policies, selectedPolicyIds, setSelectedPolicyIds, confirmedPolicyIds, confirmSelectedPolicies, policyNotice }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; confirmedPolicyIds: string[]; confirmSelectedPolicies: () => Promise<void>; policyNotice?: string | null }) {
  return (
    <section className="dashboard-grid">
      <PolicyPanel policies={policies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} />
      <Panel title="선택 정책 확정">
        <p className="muted">마감일이 있는 정책은 자동으로 취업 캘린더에 등록됩니다.</p>
        <button onClick={() => void confirmSelectedPolicies()}>선택 정책 확정</button>
        {confirmedPolicyIds.length > 0 && <p className="success-text">확정된 정책 {confirmedPolicyIds.length}개</p>}
        {policyNotice && <p className="muted">{policyNotice}</p>}
      </Panel>
    </section>
  );
}
