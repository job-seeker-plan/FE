import React from "react";
import { BadgeCheck, CalendarPlus, LineChart, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { JobEvent, PlanAnalysis, UserProfile } from "../types";
import { eventTypeLabels } from "../constants";
import { formatWon } from "../utils";
import { CompactList } from "../components/CompactList";
import { Metric } from "../components/Metric";
import { Panel } from "../components/Panel";

export function DashboardView({ profile, plan, events }: { profile: UserProfile; plan: PlanAnalysis | null; events: JobEvent[] }) {
  if (!plan) {
    return (
      <Panel title="소비 예측 · AI 가이드">
        <div className="requirement">
          <span>가계부에 수입·지출 내역을 2~3개월 이상 기록하면 다음 달 소비 예측과 AI 가이드가 여기에 표시됩니다. AI 서비스도 함께 실행되어야 합니다.</span>
        </div>
      </Panel>
    );
  }

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
          {plan.guide_personalized && (
            <span className="guide-badge">회원님이 입력한 내용 {plan.guide_context_count}개를 반영했어요</span>
          )}
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
      <CompactList
        title="다가오는 일정"
        items={events.slice(0, 5).map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))}
      />
    </>
  );
}
