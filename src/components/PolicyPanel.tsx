import React from "react";
import type { MatchedPolicy } from "../types";
import { formatWon } from "../utils";
import { Panel } from "./Panel";

export function PolicyPanel({ policies, selectedPolicyIds, setSelectedPolicyIds, onHidePolicy }: { policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; onHidePolicy: (id: string) => void }) {
  return (
    <Panel title="추천 정책">
      <div className="item-list">
        {policies.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
        {policies.map((policy) => (
          <div className="policy" key={policy.id}>
            <input
              type="checkbox"
              checked={selectedPolicyIds.includes(policy.id)}
              onChange={(event) => setSelectedPolicyIds((current) => event.target.checked ? [...current, policy.id] : current.filter((id) => id !== policy.id))}
            />
            <div>
              <strong>{policy.name}</strong>
              <span>{policy.benefit_amount == null ? "지원금 공고 확인" : formatWon(policy.benefit_amount)} · {policy.application_period}</span>
              <p>{policy.description}</p>
            </div>
            <button type="button" className="secondary policy-hide-button" onClick={() => onHidePolicy(policy.id)}>숨기기</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
