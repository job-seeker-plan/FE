import React, { useState } from "react";
import { BadgeCheck, CalendarPlus, ChevronLeft, ChevronRight, LineChart, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EventForm, FinanceTransaction, JobEvent, PlanAnalysis, TransactionForm, UserProfile } from "../types";
import { buildWeekDays, currentWeekStart, formatWon, shiftWeekStart } from "../utils";
import { DayDetailModal } from "../components/DayDetailModal";
import { EventFormPanel } from "../components/EventFormPanel";
import { TransactionFormPanel } from "../components/TransactionFormPanel";
import { Metric } from "../components/Metric";
import { Panel } from "../components/Panel";

export function OverviewView({
  profile, plan,
  events, eventForm, setEventForm, addEvent, updateEvent, deleteEvent, cancelEdit, editingEventId, eventNotice,
  financeTransactions, transactionForm, setTransactionForm, addTransaction, updateTransaction, deleteTransaction, cancelTransactionEdit, editingTransactionId, transactionNotice
}: {
  profile: UserProfile; plan: PlanAnalysis | null;
  events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; updateEvent: () => Promise<void>; deleteEvent: (eventId?: string) => Promise<void>; cancelEdit: () => void; editingEventId: string | null; eventNotice?: string | null;
  financeTransactions: FinanceTransaction[]; transactionForm: TransactionForm; setTransactionForm: React.Dispatch<React.SetStateAction<TransactionForm>>; addTransaction: () => Promise<void>; updateTransaction: () => Promise<void>; deleteTransaction: (id?: string) => Promise<void>; cancelTransactionEdit: () => void; editingTransactionId: string | null; transactionNotice?: string | null;
}) {
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventFormModalOpen, setEventFormModalOpen] = useState(false);
  const [transactionFormModalOpen, setTransactionFormModalOpen] = useState(false);

  const chartData = plan?.monthly_cash_flows.map((flow) => ({ month: flow.month, balance: flow.closing_cash })) ?? [];
  const weekDays = buildWeekDays(weekStart, events, financeTransactions);
  const weekEnd = weekDays[6].key;

  function shiftWeek(offset: number) {
    setWeekStart((current) => shiftWeekStart(current, offset));
  }

  function openNewEvent(date?: string) {
    setEventForm({ title: "", event_type: "interview", event_date: date ?? "", expected_cost: "" });
    setEventFormModalOpen(true);
    setSelectedDate(null);
  }

  function openEditEvent(event: JobEvent) {
    setEventForm({ title: event.title, event_type: event.event_type, event_date: event.event_date, expected_cost: String(Math.round(event.expected_cost / 10_000)), id: event.id });
    setEventFormModalOpen(true);
    setSelectedDate(null);
  }

  function closeEventFormModal() {
    cancelEdit();
    setEventFormModalOpen(false);
  }

  function openNewTransaction(date?: string) {
    setTransactionForm({ occurred_on: date ?? "", type: "expense", category: "food", amount: "", memo: "", deduct_from_available_cash: true });
    setTransactionFormModalOpen(true);
    setSelectedDate(null);
  }

  function openEditTransaction(transaction: FinanceTransaction) {
    setTransactionForm({ id: transaction.id, occurred_on: transaction.occurred_on, type: transaction.type, category: transaction.category, amount: String(Math.round(transaction.amount / 10_000)), memo: transaction.memo, deduct_from_available_cash: transaction.deduct_from_available_cash });
    setTransactionFormModalOpen(true);
    setSelectedDate(null);
  }

  function closeTransactionFormModal() {
    cancelTransactionEdit();
    setTransactionFormModalOpen(false);
  }

  const selectedDayEvents = selectedDate ? events.filter((event) => event.event_date === selectedDate) : [];
  const selectedDayTransactions = selectedDate ? financeTransactions.filter((transaction) => transaction.occurred_on === selectedDate) : [];

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
        </>
      ) : (
        <Panel title="소비 예측 · AI 가이드">
          <div className="requirement">
            <span>가계부에 수입·지출 내역을 2~3개월 이상 기록하면 다음 달 소비 예측과 AI 가이드가 여기에 표시됩니다. AI 서비스도 함께 실행되어야 합니다.</span>
          </div>
        </Panel>
      )}
      <Panel title="이번 주 일정 · 가계부">
        <div className="calendar-toolbar">
          <button className="icon-button calendar-nav-button" aria-label="이전 주" onClick={() => shiftWeek(-1)}><ChevronLeft size={20} /></button>
          <strong className="calendar-month-title">{weekStart} ~ {weekEnd}</strong>
          <button className="icon-button calendar-nav-button" aria-label="다음 주" onClick={() => shiftWeek(1)}><ChevronRight size={20} /></button>
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {weekDays.map((day) => (
            <div className="calendar-cell" key={day.key} onClick={() => setSelectedDate(day.key)}>
              <span className="day-number">{day.day}</span>
              <div className="calendar-events">
                {day.events.slice(0, 3).map((event) => (
                  <span className="event-chip" key={event.id}>{event.title}</span>
                ))}
              </div>
              <div className="calendar-events finance-day-amounts">
                {day.income > 0 && <span className="income-amount">+{formatWon(day.income)}</span>}
                {day.expense > 0 && <span className="expense-amount">-{formatWon(day.expense)}</span>}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          initialTab={selectedDayEvents.length > 0 ? "schedule" : "finance"}
          events={selectedDayEvents}
          transactions={selectedDayTransactions}
          onClose={() => setSelectedDate(null)}
          onAddEvent={() => openNewEvent(selectedDate)}
          onEditEvent={openEditEvent}
          onDeleteEvent={(id) => void deleteEvent(id)}
          onAddTransaction={() => openNewTransaction(selectedDate)}
          onEditTransaction={openEditTransaction}
          onDeleteTransaction={(id) => void deleteTransaction(id)}
        />
      )}

      {eventFormModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeEventFormModal()}>
          <div className="form-modal">
            <EventFormPanel
              eventForm={eventForm} setEventForm={setEventForm}
              addEvent={async () => { await addEvent(); setEventFormModalOpen(false); }}
              updateEvent={async () => { await updateEvent(); setEventFormModalOpen(false); }}
              deleteEvent={async () => { await deleteEvent(); setEventFormModalOpen(false); }}
              cancelEdit={closeEventFormModal} editing={Boolean(editingEventId)} notice={eventNotice}
            />
          </div>
        </div>
      )}

      {transactionFormModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeTransactionFormModal()}>
          <div className="form-modal">
            <TransactionFormPanel
              transactionForm={transactionForm} setTransactionForm={setTransactionForm}
              addTransaction={async () => { await addTransaction(); setTransactionFormModalOpen(false); }}
              updateTransaction={async () => { await updateTransaction(); setTransactionFormModalOpen(false); }}
              deleteTransaction={async () => { await deleteTransaction(); setTransactionFormModalOpen(false); }}
              cancelEdit={closeTransactionFormModal} editing={Boolean(editingTransactionId)} notice={transactionNotice}
            />
          </div>
        </div>
      )}
    </>
  );
}
