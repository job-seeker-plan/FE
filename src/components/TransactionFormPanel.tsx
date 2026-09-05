import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, PiggyBank, Trash2, X } from "lucide-react";
import type { TransactionForm } from "../types";
import { expenseCategoryLabels, incomeCategoryLabels } from "../constants";
import { buildCalendarDays, currentMonthValue } from "../utils";
import { Panel } from "./Panel";
import { Select } from "./Select";

export function TransactionFormPanel({ transactionForm, setTransactionForm, addTransaction, updateTransaction, deleteTransaction, cancelEdit, editing, notice }: { transactionForm: TransactionForm; setTransactionForm: React.Dispatch<React.SetStateAction<TransactionForm>>; addTransaction: () => Promise<void>; updateTransaction: () => Promise<void>; deleteTransaction: () => Promise<void>; cancelEdit: () => void; editing: boolean; notice?: string | null }) {
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [pickerMonth, setPickerMonth] = React.useState(transactionForm.occurred_on.slice(0, 7) || currentMonthValue());
  const pickerDays = buildCalendarDays(pickerMonth, []);
  const categoryLabels = transactionForm.type === "income" ? incomeCategoryLabels : expenseCategoryLabels;

  function openDatePicker() {
    setPickerMonth(transactionForm.occurred_on.slice(0, 7) || currentMonthValue());
    setDatePickerOpen(true);
  }

  function shiftPickerMonth(offset: number) {
    const [year, month] = pickerMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setPickerMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  function setType(type: "income" | "expense") {
    const nextLabels = type === "income" ? incomeCategoryLabels : expenseCategoryLabels;
    const category = transactionForm.category in nextLabels ? transactionForm.category : Object.keys(nextLabels)[0];
    setTransactionForm({ ...transactionForm, type, category });
  }

  return (
    <>
    <Panel title={editing ? "가계부 수정" : "가계부 등록"}>
      <div className="button-row transaction-type-toggle">
        <button type="button" className={transactionForm.type === "expense" ? "" : "secondary"} onClick={() => setType("expense")}>지출</button>
        <button type="button" className={transactionForm.type === "income" ? "" : "secondary"} onClick={() => setType("income")}>수입</button>
      </div>
      <div className="form-row">
        <button className="date-trigger" type="button" onClick={openDatePicker}><CalendarDays size={16} />{transactionForm.occurred_on || "날짜 선택"}</button>
        <Select value={transactionForm.category} onChange={(value) => setTransactionForm({ ...transactionForm, category: value })} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
      </div>
      <div className="form-row single">
        <label className="money-field"><span>금액</span><div className="money-input"><input type="number" min="0" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} /><span>만원</span></div></label>
      </div>
      <div className="form-row single">
        <input placeholder="메모 (선택)" value={transactionForm.memo} onChange={(event) => setTransactionForm({ ...transactionForm, memo: event.target.value })} />
      </div>
      {transactionForm.type === "expense" && (
        <div className="form-row single">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={transactionForm.deduct_from_available_cash}
              onChange={(event) => setTransactionForm({ ...transactionForm, deduct_from_available_cash: event.target.checked })}
            />
            <span>가용자금에서 차감하기</span>
          </label>
        </div>
      )}
      <div className="button-row">
        {editing ? <>
          <button onClick={updateTransaction}><Pencil size={16} />수정 저장</button>
          <button className="danger" onClick={deleteTransaction}><Trash2 size={16} />삭제</button>
          <button className="secondary" onClick={cancelEdit}><X size={16} />취소</button>
        </> : <button onClick={addTransaction}><PiggyBank size={16} />가계부 저장</button>}
      </div>
      {notice && <p className="muted">{notice}</p>}
    </Panel>
    {datePickerOpen && (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDatePickerOpen(false)}>
        <section className="date-modal" role="dialog" aria-modal="true" aria-label="가계부 날짜 선택">
          <div className="modal-header">
            <div><span className="eyebrow">날짜 선택</span><h2>{pickerMonth}</h2></div>
            <button className="icon-button" aria-label="닫기" onClick={() => setDatePickerOpen(false)}><X size={18} /></button>
          </div>
          <div className="date-picker-toolbar">
            <button className="icon-button" aria-label="이전 달" onClick={() => shiftPickerMonth(-1)}><ChevronLeft size={18} /></button>
            <strong>{pickerMonth}</strong>
            <button className="icon-button" aria-label="다음 달" onClick={() => shiftPickerMonth(1)}><ChevronRight size={18} /></button>
          </div>
          <div className="weekday-row">{["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="date-picker-grid">
            {pickerDays.map((day) => <button className={`date-picker-day ${day.inMonth ? "" : "muted-date"} ${transactionForm.occurred_on === day.key ? "picked-date" : ""}`} key={day.key} onClick={() => { setTransactionForm({ ...transactionForm, occurred_on: day.key }); setDatePickerOpen(false); }}>{day.day}</button>)}
          </div>
        </section>
      </div>
    )}
    </>
  );
}
