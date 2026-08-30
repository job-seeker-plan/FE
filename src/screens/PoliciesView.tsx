import React from "react";
import type { MatchedPolicy, PlanAnalysis } from "../types";
import { formatWon } from "../utils";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";
import { YearMonthSelect } from "../components/YearMonthSelect";

export function PoliciesView({ policies, selectedPolicyIds, setSelectedPolicyIds, confirmedSupport, setConfirmedSupport, scenario }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; confirmedSupport: { month: string; amount: string }; setConfirmedSupport: React.Dispatch<React.SetStateAction<{ month: string; amount: string }>>; scenario: PlanAnalysis | null }) {
  return (
    <section className="dashboard-grid">
      <PolicyPanel policies={policies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} />
      <Panel title="정책 적용 효과">
        <p className="muted">정책 공고의 지원 내용을 자동으로 금액으로 추정하지 않습니다. 지급이 확정된 금액만 입력하세요.</p>
        <div className="form-row">
          <YearMonthSelect value={confirmedSupport.month} onChange={(value) => setConfirmedSupport({ ...confirmedSupport, month: value })} />
          <label className="money-field"><span>확정 지원금</span><div className="money-input"><input type="number" min="0" value={confirmedSupport.amount} onChange={(event) => setConfirmedSupport({ ...confirmedSupport, amount: event.target.value })} /><span>만원</span></div></label>
        </div>
        {scenario ? <div className="compare"><div><span>시나리오 예상잔액</span><strong>{formatWon(scenario.target_month_balance)}</strong></div></div> : <p className="muted">정책을 선택하고, 취업 캘린더에서 What-if를 실행하면 확정 지원금을 반영합니다.</p>}
      </Panel>
    </section>
  );
}
