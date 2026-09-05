import React, { useState } from "react";
import type { EmailPreviewEvent, EventForm, FinanceTransaction, JobEvent, TransactionForm } from "../types";
import { DayDetailModal } from "../components/DayDetailModal";
import { EventFormPanel } from "../components/EventFormPanel";
import { TransactionFormPanel } from "../components/TransactionFormPanel";
import { EmailImportModal } from "../components/EmailImportModal";
import { ScheduleCalendarView } from "./ScheduleCalendarView";
import { FinanceCalendarView } from "./FinanceCalendarView";

type CalendarTab = "schedule" | "finance";

type EmailImport = {
  isOpen: boolean; loading: boolean; candidates: EmailPreviewEvent[]; error: string | null;
  importing: boolean; importNotice: string | null;
  openImport: () => Promise<void>; close: () => void; importSelected: (selected: EmailPreviewEvent[]) => Promise<void>;
};

export function CalendarView({
  events, eventForm, setEventForm, addEvent, updateEvent, deleteEvent, cancelEdit, editingEventId,
  financeTransactions, transactionForm, setTransactionForm, addTransaction, updateTransaction, deleteTransaction, cancelTransactionEdit, editingTransactionId, transactionNotice,
  calendarMonth, setCalendarMonth, monthlyEventCost, eventNotice,
  canImportEmail, emailImport
}: {
  events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; updateEvent: () => Promise<void>; deleteEvent: (eventId?: string) => Promise<void>; cancelEdit: () => void; editingEventId: string | null;
  financeTransactions: FinanceTransaction[]; transactionForm: TransactionForm; setTransactionForm: React.Dispatch<React.SetStateAction<TransactionForm>>; addTransaction: () => Promise<void>; updateTransaction: () => Promise<void>; deleteTransaction: (id?: string) => Promise<void>; cancelTransactionEdit: () => void; editingTransactionId: string | null; transactionNotice?: string | null;
  calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; monthlyEventCost: Array<[string, number]>; eventNotice?: string | null;
  canImportEmail?: boolean; emailImport?: EmailImport;
}) {
  const [calendarTab, setCalendarTab] = useState<CalendarTab>("schedule");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventFormModalOpen, setEventFormModalOpen] = useState(false);
  const [transactionFormModalOpen, setTransactionFormModalOpen] = useState(false);

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

  return (
    <>
      <div className="button-row calendar-tabs">
        <button className={calendarTab === "schedule" ? "" : "secondary"} onClick={() => setCalendarTab("schedule")}>일정 캘린더</button>
        <button className={calendarTab === "finance" ? "" : "secondary"} onClick={() => setCalendarTab("finance")}>가계부 캘린더</button>
      </div>

      {calendarTab === "schedule" ? (
        <ScheduleCalendarView
          events={events} eventForm={eventForm} setEventForm={setEventForm} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent}
          cancelEdit={cancelEdit} editingEventId={editingEventId} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth}
          monthlyEventCost={monthlyEventCost} eventNotice={eventNotice} onDayClick={setSelectedDate} onEditEvent={openEditEvent}
          canImportEmail={canImportEmail} onOpenEmailImport={emailImport?.openImport}
        />
      ) : (
        <FinanceCalendarView
          transactions={financeTransactions} transactionForm={transactionForm} setTransactionForm={setTransactionForm} addTransaction={addTransaction}
          updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} cancelEdit={cancelTransactionEdit} editingTransactionId={editingTransactionId}
          calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} transactionNotice={transactionNotice} onDayClick={setSelectedDate} onEditTransaction={openEditTransaction}
        />
      )}

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          initialTab={calendarTab}
          events={events.filter((event) => event.event_date === selectedDate)}
          transactions={financeTransactions.filter((transaction) => transaction.occurred_on === selectedDate)}
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

      {emailImport?.isOpen && (
        <EmailImportModal
          loading={emailImport.loading} candidates={emailImport.candidates} error={emailImport.error}
          importing={emailImport.importing} importNotice={emailImport.importNotice}
          onImport={emailImport.importSelected} onClose={emailImport.close}
        />
      )}
    </>
  );
}
