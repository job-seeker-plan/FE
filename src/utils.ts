import type { FinanceTransaction, JobEvent, MonthlyCashFlow } from "./types";

export function formatWon(value: number) {
  return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
}

// 정책 지원금(benefit_amount)이 fromMonth에 한 번 들어온다고 가정하고 이후 잔액을 다시
// 계산한다. BE의 buildPlan()과 동일하게 매달 잔액은 전달 잔액을 그대로 이어받으므로,
// fromMonth부터는 매달 closing_cash가 지원금만큼 그대로 밀려 올라간다 - 새로 API를
// 호출하지 않고 이미 받아온 monthly_cash_flows에 이 한 가지 조건만 더하면 된다.
export function applyPolicyBenefit(flows: MonthlyCashFlow[], fromMonth: string, benefitAmount: number): MonthlyCashFlow[] {
  return flows.map((flow) => {
    if (flow.month < fromMonth) return flow;
    return {
      ...flow,
      opening_cash: flow.month === fromMonth ? flow.opening_cash : flow.opening_cash + benefitAmount,
      policy_support: flow.month === fromMonth ? flow.policy_support + benefitAmount : flow.policy_support,
      closing_cash: flow.closing_cash + benefitAmount
    };
  });
}

export function toWon(value: string | number) {
  return Math.round(Number(value || 0) * 10_000);
}

export function formatManwon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}만원`;
}

export function currentMonthValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function buildCalendarDays(monthValue: string, events: JobEvent[]) {
  const [year, month] = monthValue.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key: iso,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      events: events.filter((event) => event.event_date === iso)
    };
  });
}

export function pageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 2, Math.max(1, totalPages - 4)));
  return Array.from({ length: Math.min(5, totalPages - start + 1) }, (_, index) => start + index);
}

export function extractPolicyDeadline(period: string) {
  const matches = [...period.matchAll(/(20\d{2})\s*(?:[-./년]\s*)(\d{1,2})\s*(?:[-./월]\s*)(\d{1,2})\s*일?/g)];
  const compactMatches = [...period.matchAll(/(20\d{2})(\d{2})(\d{2})/g)];
  const dates = [
    ...matches.map((match) => [match[1], match[2], match[3]]),
    ...compactMatches.map((match) => [match[1], match[2], match[3]])
  ].map(([year, month, day]) => year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0"));
  return dates[dates.length - 1] ?? null;
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function currentWeekStart() {
  const today = new Date();
  today.setDate(today.getDate() - today.getDay());
  return isoDate(today);
}

export function shiftWeekStart(weekStartValue: string, weeks: number) {
  const date = new Date(weekStartValue);
  date.setDate(date.getDate() + weeks * 7);
  return isoDate(date);
}

export function buildWeekDays(weekStartValue: string, events: JobEvent[], transactions: FinanceTransaction[]) {
  const start = new Date(weekStartValue);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = isoDate(date);
    const dayTransactions = transactions.filter((transaction) => transaction.occurred_on === iso);
    return {
      key: iso,
      day: date.getDate(),
      events: events.filter((event) => event.event_date === iso),
      income: dayTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: dayTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0)
    };
  });
}

export function buildFinanceCalendarDays(monthValue: string, transactions: FinanceTransaction[]) {
  const [year, month] = monthValue.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dayTransactions = transactions.filter((transaction) => transaction.occurred_on === iso);
    return {
      key: iso,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      transactions: dayTransactions,
      income: dayTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: dayTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0)
    };
  });
}
