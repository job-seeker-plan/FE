import React, { useState } from "react";
import { BadgeCheck, CalendarPlus, ChevronLeft, ChevronRight, LineChart, Pencil, Trash2, WalletCards, X } from "lucide-react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FinanceTransaction, PlanAnalysis, TransactionForm, UserProfile } from "../types";
import { buildFinanceCalendarDays, formatWon } from "../utils";
import { TransactionFormPanel } from "../components/TransactionFormPanel";
import { Metric } from "../components/Metric";
import { Panel } from "../components/Panel";
import { expenseCategoryLabels, incomeCategoryLabels } from "../constants";

export function FinanceCalendarView({ profile, plan, transactions, transactionForm, setTransactionForm, addTransaction, updateTransaction, deleteTransaction, cancelEdit, editingTransactionId, calendarMonth, setCalendarMonth, transactionNotice, onDayClick, onEditTransaction }: { profile: UserProfile; plan: PlanAnalysis | null; transactions: FinanceTransaction[]; transactionForm: TransactionForm; setTransactionForm: React.Dispatch<React.SetStateAction<TransactionForm>>; addTransaction: () => Promise<void>; updateTransaction: () => Promise<void>; deleteTransaction: (id?: string) => Promise<void>; cancelEdit: () => void; editingTransactionId: string | null; calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; transactionNotice?: string | null; onDayClick: (date: string) => void; onEditTransaction: (transaction: FinanceTransaction) => void }) {
  const calendarDays = buildFinanceCalendarDays(calendarMonth, transactions);
  const chartData = plan?.monthly_cash_flows.map((flow) => ({ month: flow.month, balance: flow.closing_cash })) ?? [];
  const monthTransactions = transactions.filter((transaction) => transaction.occurred_on.slice(0, 7) === calendarMonth);
  const monthIncome = monthTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthExpense = monthTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);

  function shiftMonth(offset: number) {
    const [year, month] = calendarMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  function categoryLabel(transaction: FinanceTransaction) {
    return (transaction.type === "income" ? incomeCategoryLabels : expenseCategoryLabels)[transaction.category] ?? transaction.category;
  }

  async function removeSelectedTransaction() {
    if (!selectedTransaction) return;
    await deleteTransaction(selectedTransaction.id);
    setSelectedTransaction(null);
  }

  return (
    <>
      {plan ? (
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
        </>
      ) : (
        <Panel title="소비 예측 · AI 가이드">
          <div className="requirement">
            <span>가계부에 수입·지출 내역을 2~3개월 이상 기록하면 다음 달 소비 예측과 AI 가이드가 여기에 표시됩니다. AI 서비스도 함께 실행되어야 합니다.</span>
          </div>
        </Panel>
      )}
      <section className="calendar-layout">
      <Panel title="월간 가계부">
        <div className="calendar-toolbar">
          <button className="icon-button calendar-nav-button" aria-label="이전 달" onClick={() => shiftMonth(-1)}><ChevronLeft size={20} /></button>
          <strong className="calendar-month-title">{calendarMonth.replace("-", "년 ")}월</strong>
          <button className="icon-button calendar-nav-button" aria-label="다음 달" onClick={() => shiftMonth(1)}><ChevronRight size={20} /></button>
          <span className="calendar-month-cost">수입 <b className="income-amount">{formatWon(monthIncome)}</b> · 지출 <b className="expense-amount">{formatWon(monthExpense)}</b></span>
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div className={`calendar-cell ${day.inMonth ? "" : "muted-cell"}`} key={day.key} onClick={() => onDayClick(day.key)}>
              <span className="day-number">{day.day}</span>
              <div className="calendar-events finance-day-amounts">
                {day.income > 0 && <span className="income-amount">+{formatWon(day.income)}</span>}
                {day.expense > 0 && <span className="expense-amount">-{formatWon(day.expense)}</span>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <section className="side-stack">
        <TransactionFormPanel transactionForm={transactionForm} setTransactionForm={setTransactionForm} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} cancelEdit={cancelEdit} editing={Boolean(editingTransactionId)} notice={transactionNotice} />
        <Panel title="가계부 내역">
          <div className="item-list">
            {transactions.length === 0 && <p className="muted">등록된 항목이 없습니다.</p>}
            {transactions.slice().reverse().map((transaction) => (
              <button className={`item event-list-item ${editingTransactionId === transaction.id ? "selected-item" : ""}`} key={transaction.id} onClick={() => setSelectedTransaction(transaction)}>
                <span><strong>{categoryLabel(transaction)}</strong><span>{transaction.occurred_on}{transaction.memo ? ` · ${transaction.memo}` : ""}</span></span>
                <b className={transaction.type === "income" ? "income-amount" : "expense-amount"}>{transaction.type === "income" ? "+" : "-"}{formatWon(transaction.amount)}</b>
              </button>
            ))}
          </div>
        </Panel>
      </section>
      </section>
      {selectedTransaction && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedTransaction(null)}>
          <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">가계부 상세</span>
                <h2 id="transaction-modal-title">{categoryLabel(selectedTransaction)}</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setSelectedTransaction(null)}><X size={18} /></button>
            </div>
            <div className="event-detail-grid">
              <span>구분<strong>{selectedTransaction.type === "income" ? "수입" : "지출"}</strong></span>
              <span>날짜<strong>{selectedTransaction.occurred_on}</strong></span>
              <span>금액<strong className={selectedTransaction.type === "income" ? "income-amount" : "expense-amount"}>{formatWon(selectedTransaction.amount)}</strong></span>
              {selectedTransaction.memo && <span>메모<strong>{selectedTransaction.memo}</strong></span>}
            </div>
            <div className="button-row modal-actions">
              <button onClick={() => { onEditTransaction(selectedTransaction); setSelectedTransaction(null); }}><Pencil size={16} />수정</button>
              <button className="danger" onClick={() => void removeSelectedTransaction()}><Trash2 size={16} />삭제</button>
              <button className="secondary" onClick={() => setSelectedTransaction(null)}>닫기</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
