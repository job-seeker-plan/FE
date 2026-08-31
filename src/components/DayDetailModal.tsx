import React from "react";
import { CalendarPlus, Pencil, PiggyBank, Trash2, X } from "lucide-react";
import type { FinanceTransaction, JobEvent } from "../types";
import { eventTypeLabels, expenseCategoryLabels, incomeCategoryLabels } from "../constants";
import { formatWon } from "../utils";

export function DayDetailModal({ date, initialTab, events, transactions, onClose, onAddEvent, onEditEvent, onDeleteEvent, onAddTransaction, onEditTransaction, onDeleteTransaction }: {
  date: string;
  initialTab: "schedule" | "finance";
  events: JobEvent[];
  transactions: FinanceTransaction[];
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: JobEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [tab, setTab] = React.useState<"schedule" | "finance">(initialTab);
  const categoryLabel = (transaction: FinanceTransaction) => (transaction.type === "income" ? incomeCategoryLabels : expenseCategoryLabels)[transaction.category] ?? transaction.category;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="date-events-modal" role="dialog" aria-modal="true" aria-labelledby="date-detail-title">
        <div className="modal-header">
          <div><span className="eyebrow">날짜 관리</span><h2 id="date-detail-title">{date}</h2></div>
          <button className="icon-button" aria-label="닫기" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="button-row day-detail-tabs">
          <button type="button" className={tab === "schedule" ? "" : "secondary"} onClick={() => setTab("schedule")}>일정</button>
          <button type="button" className={tab === "finance" ? "" : "secondary"} onClick={() => setTab("finance")}>가계부</button>
        </div>
        {tab === "schedule" ? (
          <>
            <div className="day-event-list">
              {events.length === 0 && <p className="muted">등록된 일정이 없습니다.</p>}
              {events.map((event) => (
                <div className="day-event-row" key={event.id}>
                  <div><strong>{event.title}</strong><span>{eventTypeLabels[event.event_type]} · {formatWon(event.expected_cost)}</span></div>
                  <div className="compact-actions">
                    <button className="icon-button" aria-label={`${event.title} 수정`} onClick={() => onEditEvent(event)}><Pencil size={16} /></button>
                    <button className="icon-button danger-icon" aria-label={`${event.title} 삭제`} onClick={() => onDeleteEvent(event.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="button-row modal-actions">
              <button onClick={onAddEvent}><CalendarPlus size={16} />이 날짜에 일정 추가</button>
              <button className="secondary" onClick={onClose}>닫기</button>
            </div>
          </>
        ) : (
          <>
            <div className="day-event-list">
              {transactions.length === 0 && <p className="muted">등록된 가계부 내역이 없습니다.</p>}
              {transactions.map((transaction) => (
                <div className="day-event-row" key={transaction.id}>
                  <div><strong className={transaction.type === "income" ? "income-amount" : "expense-amount"}>{transaction.type === "income" ? "+" : "-"}{formatWon(transaction.amount)}</strong><span>{categoryLabel(transaction)}{transaction.memo ? ` · ${transaction.memo}` : ""}</span></div>
                  <div className="compact-actions">
                    <button className="icon-button" aria-label="가계부 항목 수정" onClick={() => onEditTransaction(transaction)}><Pencil size={16} /></button>
                    <button className="icon-button danger-icon" aria-label="가계부 항목 삭제" onClick={() => onDeleteTransaction(transaction.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="button-row modal-actions">
              <button onClick={onAddTransaction}><PiggyBank size={16} />이 날짜에 가계부 추가</button>
              <button className="secondary" onClick={onClose}>닫기</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
