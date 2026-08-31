import type { FinanceTransaction, JobEvent } from "./types";

export function formatWon(value: number) {
  return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
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
