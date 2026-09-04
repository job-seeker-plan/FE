import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Pencil, Trash2, X } from "lucide-react";
import type { EventForm, JobEvent } from "../types";
import { buildCalendarDays } from "../utils";
import { EventFormPanel } from "../components/EventFormPanel";
import { Panel } from "../components/Panel";
import { eventTypeLabels } from "../constants";
import { formatWon } from "../utils";

export function ScheduleCalendarView({ events, eventForm, setEventForm, addEvent, updateEvent, deleteEvent, cancelEdit, editingEventId, calendarMonth, setCalendarMonth, monthlyEventCost, eventNotice, onDayClick, onEditEvent, canImportEmail, onOpenEmailImport }: { events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; updateEvent: () => Promise<void>; deleteEvent: (eventId?: string) => Promise<void>; cancelEdit: () => void; editingEventId: string | null; calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; monthlyEventCost: Array<[string, number]>; eventNotice?: string | null; onDayClick: (date: string) => void; onEditEvent: (event: JobEvent) => void; canImportEmail?: boolean; onOpenEmailImport?: () => void }) {
  const calendarDays = buildCalendarDays(calendarMonth, events);
  const monthCost = monthlyEventCost.find(([month]) => month === calendarMonth)?.[1] ?? 0;
  const [selectedEvent, setSelectedEvent] = useState<JobEvent | null>(null);

  function openEvent(event: JobEvent) {
    setSelectedEvent(event);
  }

  function shiftMonth(offset: number) {
    const [year, month] = calendarMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  async function removeSelectedEvent() {
    if (!selectedEvent) return;
    await deleteEvent(selectedEvent.id);
    setSelectedEvent(null);
  }

  return (
    <>
      <section className="calendar-layout">
      <Panel title="월간 취업 일정">
        <div className="calendar-toolbar">
          <button className="icon-button calendar-nav-button" aria-label="이전 달" onClick={() => shiftMonth(-1)}><ChevronLeft size={20} /></button>
          <strong className="calendar-month-title">{calendarMonth.replace("-", "년 ")}월</strong>
          <button className="icon-button calendar-nav-button" aria-label="다음 달" onClick={() => shiftMonth(1)}><ChevronRight size={20} /></button>
          <span className="calendar-month-cost">예상 취준비 {formatWon(monthCost)}</span>
          {canImportEmail && onOpenEmailImport && (
            <button className="secondary icon-button-text" onClick={onOpenEmailImport} title="Gmail에서 채용 일정 자동 가져오기">
              <Mail size={15} /> 메일 가져오기
            </button>
          )}
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div className={`calendar-cell ${day.inMonth ? "" : "muted-cell"}`} key={day.key} onClick={() => onDayClick(day.key)}>
              <span className="day-number">{day.day}</span>
              <div className="calendar-events">
                {day.events.slice(0, 3).map((event) => (
                  <button className="event-chip" key={event.id} onClick={(clickEvent) => { clickEvent.stopPropagation(); openEvent(event); }}>
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <section className="side-stack">
        <EventFormPanel eventForm={eventForm} setEventForm={setEventForm} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} cancelEdit={cancelEdit} editing={Boolean(editingEventId)} notice={eventNotice} />
        <Panel title="일정 목록">
          <div className="item-list">
            {events.length === 0 && <p className="muted">등록된 항목이 없습니다.</p>}
            {events.map((event) => (
              <button className={`item event-list-item ${editingEventId === event.id ? "selected-item" : ""}`} key={event.id} onClick={() => openEvent(event)}>
                <span><strong>{event.title}</strong><span>{event.event_date} · {eventTypeLabels[event.event_type]}</span></span>
                <b>{formatWon(event.expected_cost)}</b>
              </button>
            ))}
          </div>
        </Panel>
      </section>
      </section>
      {selectedEvent && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}>
          <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">일정 상세</span>
                <h2 id="event-modal-title">{selectedEvent.title}</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setSelectedEvent(null)}><X size={18} /></button>
            </div>
            <div className="event-detail-grid">
              <span>일정 유형<strong>{eventTypeLabels[selectedEvent.event_type]}</strong></span>
              <span>일정 날짜<strong>{selectedEvent.event_date}</strong></span>
              <span>예상 비용<strong>{formatWon(selectedEvent.expected_cost)}</strong></span>
              {selectedEvent.memo && <span>메모<strong>{selectedEvent.memo}</strong></span>}
            </div>
            <div className="button-row modal-actions">
              <button onClick={() => { onEditEvent(selectedEvent); setSelectedEvent(null); }}><Pencil size={16} />수정</button>
              <button className="danger" onClick={() => void removeSelectedEvent()}><Trash2 size={16} />삭제</button>
              <button className="secondary" onClick={() => setSelectedEvent(null)}>닫기</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
