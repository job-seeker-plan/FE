import React from "react";
import { Search } from "lucide-react";
import type { MatchedPolicy } from "../types";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";
import { Select } from "../components/Select";
import type { JobEvent } from "../types";
import { extractPolicyDeadline, pageNumbers } from "../utils";

const REGION_OPTIONS = [
  ["서울", "서울"], ["부산", "부산"], ["대구", "대구"], ["인천", "인천"], ["광주", "광주"], ["대전", "대전"],
  ["울산", "울산"], ["세종", "세종"], ["경기", "경기"], ["강원", "강원"], ["충북", "충북"], ["충남", "충남"],
  ["전북", "전북"], ["전남", "전남"], ["경북", "경북"], ["경남", "경남"], ["제주", "제주"]
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
    const selectedRegion = REGION_OPTIONS.find(([, label]) => label === region);
    const deadline = extractPolicyDeadline(policy.application_period);
    const keywordMatches = !keyword.trim() || policyText.includes(keyword.trim().toLowerCase());
    // 온통청년 API의 zipCd는 시도(2자리)가 아니라 시군구 단위(5자리, 예: 41111=경기
    // 수원시 장안구) 코드라서, 문자열을 통짜로 합쳐 includes()로 검사하면 예를 들어
    // "41111"에 "11"이 우연히 포함되어 서울(11) 필터에 경기 정책이 잘못 섞여 나온다.
    // 각 코드가 선택한 시도 코드로 "시작하는지"를 개별적으로 검사해야 정확하다.
    const regionMatches = region === "전체 지역" || (selectedRegion !== undefined && (
      (policy.region_codes ?? []).some((code) => code.startsWith(selectedRegion[0])) ||
      (policy.region ?? "").includes(selectedRegion[1])
    ));
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
          <label><span>지역</span><Select value={region} onChange={setRegion} options={[{ value: "전체 지역", label: "전체 지역" }, ...REGION_OPTIONS.map(([, label]) => ({ value: label, label }))]} /></label>
          <label><span>정책명·내용 검색</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="예: 취업, 교육, 지원금" /></label>
          <button type="button" className="policy-search-button" onClick={() => setPage(1)}><Search size={16} />검색</button>
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
