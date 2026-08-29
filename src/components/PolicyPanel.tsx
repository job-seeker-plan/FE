import React from "react";
import type { MatchedPolicy } from "../types";
import { formatWon } from "../utils";
import { Panel } from "./Panel";

export function PolicyPanel({ policies, selectedPolicyIds, setSelectedPolicyIds }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>> }) {
  return (
    <Panel title="추천 정책">
      <div className="item-list">
        {policies.length === 0 && <p className="muted">정책 API 키를 설정하면 추천 정책이 표시됩니다.</p>}
        {policies.slice(0, 8).map((policy) => (
          <label className="policy" key={policy.id}>
            <input
              type="checkbox"
              checked={selectedPolicyIds.includes(policy.id)}
              onChange={(event) => setSelectedPolicyIds((current) => event.target.checked ? [...current, policy.id] : current.filter((id) => id !== policy.id))}
            />
            <div>
              <strong>{policy.name}</strong>
              <span>{policy.match_score}점 · {policy.benefit_amount == null ? "지원금 공고 확인" : formatWon(policy.benefit_amount)} · {policy.application_period}</span>
              <p>{policy.description}</p>
            </div>
          </label>
        ))}
      </div>
    </Panel>
  );
}
