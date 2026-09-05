import React from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import type { EventForm } from "../types";
import { eventTypeLabels } from "../constants";
import { buildCalendarDays, currentMonthValue } from "../utils";
import { Panel } from "./Panel";
import { Select } from "./Select";

export function EventFormPanel({ eventForm, setEventForm, addEvent, updateEvent, deleteEvent, cancelEdit, editing, notice }: { eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; updateEvent: () => Promise<void>; deleteEvent: () => Promise<void>; cancelEdit: () => void; editing: boolean; notice?: string | null }) {
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [pickerMonth, setPickerMonth] = React.useState(eventForm.event_date.slice(0, 7) || currentMonthValue());
  const pickerDays = buildCalendarDays(pickerMonth, []);

  function openDatePicker() {
    setPickerMonth(eventForm.event_date.slice(0, 7) || currentMonthValue());
    setDatePickerOpen(true);
  }

  function shiftPickerMonth(offset: number) {
    const [year, month] = pickerMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setPickerMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <>
    <Panel title={editing ? "일정 수정" : "일정 등록"}>
      <div className="form-row">
        <input placeholder="일정명" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} />
        <Select value={eventForm.event_type} onChange={(value) => setEventForm({ ...eventForm, event_type: value })} options={Object.entries(eventTypeLabels).map(([value, label]) => ({ value, label }))} />
      </div>
      <div className="form-row">
        <button className="date-trigger" type="button" onClick={openDatePicker}><CalendarDays size={16} />{eventForm.event_date || "날짜 선택"}</button>
        <label className="money-field"><span>예상비용</span><div className="money-input"><input type="number" min="0" placeholder="0" value={eventForm.expected_cost} onChange={(event) => setEventForm({ ...eventForm, expected_cost: event.target.value })} /><span>만원</span></div></label>
      </div>
      <div className="button-row">
        {editing ? <>
          <button onClick={updateEvent}><Pencil size={16} />수정 저장</button>
          <button className="danger" onClick={deleteEvent}><Trash2 size={16} />삭제</button>
          <button className="secondary" onClick={cancelEdit}><X size={16} />취소</button>
        </> : <button onClick={addEvent}><CalendarPlus size={16} />일정 저장</button>}
      </div>
      {notice && <p className="muted">{notice}</p>}
    </Panel>
    {datePickerOpen && (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDatePickerOpen(false)}>
        <section className="date-modal" role="dialog" aria-modal="true" aria-label="일정 날짜 선택">
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
            {pickerDays.map((day) => <button className={`date-picker-day ${day.inMonth ? "" : "muted-date"} ${eventForm.event_date === day.key ? "picked-date" : ""}`} key={day.key} onClick={() => { setEventForm({ ...eventForm, event_date: day.key }); setDatePickerOpen(false); }}>{day.day}</button>)}
          </div>
        </section>
      </div>
    )}
    </>
  );
}
