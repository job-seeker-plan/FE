import React from "react";
import { Search, X } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { JobEvent, MatchedPolicy, PlanAnalysis } from "../types";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";
import { Select } from "../components/Select";
import { applyPolicyBenefit, extractPolicyDeadline, formatWon, pageNumbers } from "../utils";

const REGION_OPTIONS = [
  ["서울", "서울"], ["부산", "부산"], ["대구", "대구"], ["인천", "인천"], ["광주", "광주"], ["대전", "대전"],
  ["울산", "울산"], ["세종", "세종"], ["경기", "경기"], ["강원", "강원"], ["충북", "충북"], ["충남", "충남"],
  ["전북", "전북"], ["전남", "전남"], ["경북", "경북"], ["경남", "경남"], ["제주", "제주"]
] as const;

export function PoliciesView({ policies, events, selectedPolicyIds, setSelectedPolicyIds, confirmedPolicyIds, confirmSelectedPolicies, policyNotice, hiddenPolicyIds, hidePolicy, restorePolicy, plan, calendarMonth }: { policies: MatchedPolicy[]; events: JobEvent[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; confirmedPolicyIds: string[]; confirmSelectedPolicies: () => Promise<void>; policyNotice?: string | null; hiddenPolicyIds: string[]; hidePolicy: (id: string) => void; restorePolicy: (id: string) => void; plan: PlanAnalysis | null; calendarMonth: string }) {
  const [page, setPage] = React.useState(1);
  const [showHiddenPolicies, setShowHiddenPolicies] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [region, setRegion] = React.useState("전체 지역");
  const [simulatingPolicy, setSimulatingPolicy] = React.useState<MatchedPolicy | null>(null);
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

  const simulation = simulatingPolicy && plan && simulatingPolicy.benefit_amount != null ? (() => {
    const flows = plan.monthly_cash_flows;
    const fromMonth = flows.some((flow) => flow.month === calendarMonth) ? calendarMonth : (flows[0]?.month ?? calendarMonth);
    const simulatedFlows = applyPolicyBenefit(flows, fromMonth, simulatingPolicy.benefit_amount);
    return {
      chartData: flows.map((flow, index) => ({ month: flow.month, before: flow.closing_cash, after: simulatedFlows[index].closing_cash })),
      beforeTarget: flows.length > 0 ? flows[flows.length - 1].closing_cash : 0,
      afterTarget: simulatedFlows.length > 0 ? simulatedFlows[simulatedFlows.length - 1].closing_cash : 0
    };
  })() : null;

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
        <PolicyPanel policies={visiblePolicies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} onHidePolicy={hidePolicy} onSimulate={setSimulatingPolicy} />
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
      {simulatingPolicy && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSimulatingPolicy(null)}>
          <section className="event-modal policy-simulation-modal" role="dialog" aria-modal="true" aria-labelledby="policy-simulation-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">정책 적용 시뮬레이션</span>
                <h2 id="policy-simulation-title">{simulatingPolicy.name}</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setSimulatingPolicy(null)}><X size={18} /></button>
            </div>
            {simulation ? (
              <>
                <div className="chart">
                  <ResponsiveContainer>
                    <ReLineChart data={simulation.chartData} margin={{ top: 8, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d7dee8" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} width={54} />
                      <Tooltip formatter={(value) => formatWon(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="before" name="적용 전" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="after" name="적용 후" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
                <p className="scenario-note">목표월 예상 잔액 {formatWon(simulation.beforeTarget)} → {formatWon(simulation.afterTarget)} ({formatWon(simulation.afterTarget - simulation.beforeTarget)} 증가)</p>
              </>
            ) : (
              <p className="muted">대시보드에서 예상 잔액이 먼저 계산되어야 시뮬레이션할 수 있어요.</p>
            )}
            <div className="button-row modal-actions">
              <button className="secondary" onClick={() => setSimulatingPolicy(null)}>닫기</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
