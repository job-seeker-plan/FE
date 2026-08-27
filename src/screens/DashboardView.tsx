import React from "react";
import { BadgeCheck, CalendarPlus, LineChart, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { JobEvent, MatchedPolicy, PlanAnalysis, UserProfile } from "../types";
import { eventTypeLabels } from "../constants";
import { formatWon } from "../utils";
import { CompactList } from "../components/CompactList";
import { Metric } from "../components/Metric";
import { Panel } from "../components/Panel";
import { PolicyPanel } from "../components/PolicyPanel";

export function DashboardView({ profile, plan, events, policies, selectedPolicyIds, setSelectedPolicyIds, scenario, monthlyEventCost }: { profile: UserProfile; plan: PlanAnalysis; events: JobEvent[]; policies: MatchedPolicy[]; selectedPolicyIds: string[]; setSelectedPolicyIds: React.Dispatch<React.SetStateAction<string[]>>; scenario: PlanAnalysis | null; monthlyEventCost: Array<[string, number]> }) {
  const chartData = plan.monthly_cash_flows.map((flow) => ({ month: flow.month, balance: flow.closing_cash }));
  return (
    <>
      <section className="summary-strip">
        <Metric icon={<WalletCards />} label="현재 가용자금" value={formatWon(profile.available_cash)} />
        <Metric icon={<LineChart />} label="다음 달 예상지출" value={formatWon(plan.predicted_next_spend)} sub={`${plan.spend_delta_rate}%`} />
        <Metric icon={<CalendarPlus />} label="자금 유지기간" value={`${plan.months_until_shortage ?? 0}개월`} sub={plan.shortage_month ?? "부족월 없음"} />
        <Metric icon={<BadgeCheck />} label="권장 월 지출한도" value={formatWon(plan.recommended_monthly_spend_limit)} />
      </section>
      <section className="dashboard-grid">
        <Panel title="월별 예상 잔액">
          <div className="chart">
            <ResponsiveContainer>
              <ReLineChart data={chartData} margin={{ top: 8, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee8" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} width={54} />
                <Tooltip formatter={(value) => formatWon(Number(value))} />
                <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="AI 행동 가이드">
          <p className="guide">{plan.guide}</p>
          <div className="flow-list">
            {plan.monthly_cash_flows.slice(0, 4).map((flow) => (
              <div className="flow-row" key={flow.month}>
                <span>{flow.month}</span>
                <strong>{formatWon(flow.closing_cash)}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="dashboard-grid three">
        <CompactList title="다가오는 일정" items={events.slice(0, 5).map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))} />
        <PolicyPanel policies={policies} selectedPolicyIds={selectedPolicyIds} setSelectedPolicyIds={setSelectedPolicyIds} />
        <Panel title="월별 취준 비용">
          <div className="flow-list">
            {monthlyEventCost.map(([month, cost]) => (
              <div className="flow-row" key={month}>
                <span>{month}</span>
                <strong>{formatWon(cost)}</strong>
              </div>
            ))}
          </div>
          {scenario && <p className="scenario-note">시나리오 예상잔액 {formatWon(scenario.target_month_balance)}</p>}
        </Panel>
      </section>
    </>
  );
}
