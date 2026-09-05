import React from "react";
import type { MatchedPolicy } from "../types";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";
import type { JobEvent } from "../types";
import { extractPolicyDeadline, pageNumbers } from "../utils";

const REGION_OPTIONS = [
  ["11", "서울"], ["26", "부산"], ["27", "대구"], ["28", "인천"], ["29", "광주"], ["30", "대전"],
  ["31", "울산"], ["36", "세종"], ["41", "경기"], ["42", "강원"], ["43", "충북"], ["44", "충남"],
  ["45", "전북"], ["46", "전남"], ["47", "경북"], ["48", "경남"], ["50", "제주"]
] as const;

export function PoliciesView({ policies, events, selectedPolicyIds, setSelectedPolicyIds, confirmedPolicyIds, confirmSelectedPolicies, policyNotice, hiddenPolicyIds, hidePolicy, restorePolicy }: { policies: MatchedPolicy[]; events: JobEvent[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; confirmedPolicyIds: string[]; confirmSelectedPolicies: () => Promise<void>; policyNotice?: string | null; hiddenPolicyIds: string[]; hidePolicy: (id: string) => void; restorePolicy: (id: string) => void }) {
  const [page, setPage] = React.useState(1);
  const [showHiddenPolicies, setShowHiddenPolicies] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [region, setRegion] = React.useState("전체 지역");
  const pageSize = 8;
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const calendarPolicyIds = new Set(events.map((event) => event.memo.match(/^policy:(.+)$/)?.[1]).filter((id): id is string => Boolean(id)));
  const hiddenPolicies = policies.filter((policy) => hiddenPolicyIds.includes(policy.id));
  const filteredPolicies = policies.filter((policy) => {
    if (calendarPolicyIds.has(policy.id) || hiddenPolicyIds.includes(policy.id)) return false;
    const policyText = [policy.name, policy.description].filter(Boolean).join(" ").toLowerCase();
    const regionText = [policy.region, ...(policy.region_codes ?? [])].filter(Boolean).join(" ");
    const selectedRegion = REGION_OPTIONS.find(([, label]) => label === region);
    const deadline = extractPolicyDeadline(policy.application_period);
    const keywordMatches = !keyword.trim() || policyText.includes(keyword.trim().toLowerCase());
    const regionMatches = region === "전체 지역" || (selectedRegion !== undefined && (regionText.includes(selectedRegion[0]) || regionText.includes(selectedRegion[1])));
    return keywordMatches && regionMatches && (!deadline || deadline >= todayValue);
  });
  const pageCount = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const visiblePolicies = filteredPolicies.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  React.useEffect(() => { setPage(1); }, [keyword, region]);

  return (
    <section className="policy-page-layout">
      <div className="policy-list-column">
        <Panel title="정책 목록 관리">
        <div className="policy-filter-grid">
          <label><span>지역</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option>전체 지역</option>{REGION_OPTIONS.map(([, label]) => <option key={label}>{label}</option>)}</select></label>
          <label><span>정책명·내용 검색</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="예: 취업, 교육, 지원금" /></label>
        </div>
        <p className="muted policy-result-summary">총 {filteredPolicies.length}개 정책 · {page} / {pageCount}페이지</p>
        {hiddenPolicies.length > 0 && <div className="hidden-policy-section">
          <button className="secondary" onClick={() => setShowHiddenPolicies((current) => !current)}>숨김 정책 {showHiddenPolicies ? "닫기" : `${hiddenPolicies.length}개 보기`}</button>
          {showHiddenPolicies && <div className="hidden-policy-list">{hiddenPolicies.map((policy) => <div className="hidden-policy-row" key={policy.id}><span>{policy.name}</span><button className="secondary" onClick={() => restorePolicy(policy.id)}>다시 표시</button></div>)}</div>}
        </div>}
        </Panel>
        <PolicyPanel policies={visiblePolicies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} onHidePolicy={hidePolicy} />
        <div className="policy-pagination policy-pagination-bottom" aria-label="정책 페이지 이동">
          <button className="secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</button>
          {pageNumbers(page, pageCount).map((number) => <button key={number} className={number === page ? "" : "secondary"} onClick={() => setPage(number)}>{number}</button>)}
          <button className="secondary" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>다음</button>
        </div>
      </div>
      <Panel title="선택 정책 확정">
        <p className="muted">마감일이 있는 정책은 자동으로 취업 캘린더에 등록됩니다.</p>
        <button onClick={() => void confirmSelectedPolicies()}>선택 정책 확정</button>
        {confirmedPolicyIds.length > 0 && <p className="success-text">확정된 정책 {confirmedPolicyIds.length}개</p>}
        {policyNotice && <p className="muted">{policyNotice}</p>}
      </Panel>
    </section>
  );
}
