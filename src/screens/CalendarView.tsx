import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { EventForm, JobEvent } from "../types";
import { buildCalendarDays, formatWon } from "../utils";
import { CompactList } from "../components/CompactList";
import { EventFormPanel } from "../components/EventFormPanel";
import { Panel } from "../components/Panel";
import { eventTypeLabels } from "../constants";

export function CalendarView({ events, eventForm, setEventForm, addEvent, updateEvent, deleteEvent, runScenario, calendarMonth, setCalendarMonth, monthlyEventCost, eventNotice }: { events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<boolean>; updateEvent: (eventId: string) => Promise<boolean>; deleteEvent: (eventId: string) => Promise<boolean>; runScenario: () => Promise<void>; calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; monthlyEventCost: Array<[string, number]>; eventNotice?: string | null }) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const calendarDays = buildCalendarDays(calendarMonth, events);
  const monthCost = monthlyEventCost.find(([month]) => month === calendarMonth)?.[1] ?? 0;

  function moveMonth(offset: number) {
    const [year, month] = calendarMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  function selectDate(date: string) {
    setEditingEventId(null);
    setEventForm({ title: "", event_type: "interview", event_date: date, expected_cost: "" });
    setCalendarMonth(date.slice(0, 7));
    setIsEventModalOpen(true);
  }

  function selectExistingEvent(event: JobEvent) {
    setEditingEventId(event.id);
    setEventForm({ title: event.title, event_type: event.event_type, event_date: event.event_date, expected_cost: String(Math.round(event.expected_cost / 10_000)) });
    setCalendarMonth(event.event_date.slice(0, 7));
    setIsEventModalOpen(true);
  }

  async function saveModalEvent(): Promise<boolean> {
    const saved = editingEventId ? await updateEvent(editingEventId) : await addEvent();
    if (saved) {
      setEditingEventId(null);
      setIsEventModalOpen(false);
    }
    return saved;
  }

  async function saveSideEvent(): Promise<boolean> {
    const saved = editingEventId ? await updateEvent(editingEventId) : await addEvent();
    if (saved) setEditingEventId(null);
    return saved;
  }

  async function removeEvent(): Promise<boolean> {
    if (editingEventId && await deleteEvent(editingEventId)) {
      setEditingEventId(null);
      setIsEventModalOpen(false);
      return true;
    }
    return false;
  }

  async function removeSideEvent(): Promise<boolean> {
    if (!editingEventId) return false;
    const deleted = await deleteEvent(editingEventId);
    if (deleted) setEditingEventId(null);
    return deleted;
  }

  return <section className="calendar-layout">
    <Panel title="월간 취업 일정">
      <div className="calendar-toolbar"><button type="button" className="calendar-month-button" onClick={() => moveMonth(-1)} aria-label="이전 달"><ChevronLeft size={22} /></button><strong className="calendar-month-title">{calendarMonth.slice(0, 4)}년 {Number(calendarMonth.slice(5, 7))}월</strong><button type="button" className="calendar-month-button" onClick={() => moveMonth(1)} aria-label="다음 달"><ChevronRight size={22} /></button><span className="calendar-month-cost">예상 취준비 {formatWon(monthCost)}</span></div>
      <div className="weekday-row">{["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{calendarDays.map((day) => <button className={`calendar-cell ${day.inMonth ? "" : "muted-cell"}`} key={day.key} onClick={() => selectDate(day.key)} aria-label={`${day.key} 일정 등록`}><span className="day-number">{day.day}</span><div className="calendar-events">{day.events.map((event) => <span className="event-chip" key={event.id} onClick={(click) => { click.stopPropagation(); selectExistingEvent(event); }}>{event.title}</span>)}</div></button>)}</div>
    </Panel>
    <section className="side-stack"><EventFormPanel eventForm={eventForm} setEventForm={setEventForm} addEvent={saveSideEvent} deleteEvent={removeSideEvent} isEditing={Boolean(editingEventId)} runScenario={runScenario} notice={eventNotice} onDateChange={(date) => { if (date) setCalendarMonth(date.slice(0, 7)); }} /><CompactList title="일정 목록" onItemClick={(id) => { const event = events.find((item) => item.id === id); if (event) selectExistingEvent(event); }} items={events.map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))} /></section>
    {isEventModalOpen && <div className="event-modal-backdrop" onClick={() => setIsEventModalOpen(false)}><div className="event-modal" role="dialog" aria-modal="true" aria-label="일정 등록" onClick={(event) => event.stopPropagation()}><div className="event-modal-header"><div><p className="eyebrow">CALENDAR EVENT</p><h2>{editingEventId ? "일정 수정" : "일정 등록"}</h2></div><button type="button" className="icon-button" onClick={() => setIsEventModalOpen(false)} aria-label="닫기"><X size={20} /></button></div><EventFormPanel eventForm={eventForm} setEventForm={setEventForm} addEvent={() => saveModalEvent()} deleteEvent={removeEvent} isEditing={Boolean(editingEventId)} runScenario={runScenario} notice={eventNotice} onDateChange={(date) => { if (date) setCalendarMonth(date.slice(0, 7)); }} /></div></div>}
  </section>;
}
