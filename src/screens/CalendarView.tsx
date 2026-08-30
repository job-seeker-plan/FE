import React from "react";
import type { EventForm, JobEvent } from "../types";
import { buildCalendarDays } from "../utils";
import { CompactList } from "../components/CompactList";
import { EventFormPanel } from "../components/EventFormPanel";
import { Panel } from "../components/Panel";
import { YearMonthSelect } from "../components/YearMonthSelect";
import { eventTypeLabels } from "../constants";
import { formatWon } from "../utils";

export function CalendarView({ events, eventForm, setEventForm, addEvent, runScenario, calendarMonth, setCalendarMonth, monthlyEventCost, eventNotice }: { events: JobEvent[]; eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; runScenario: () => Promise<void>; calendarMonth: string; setCalendarMonth: React.Dispatch<React.SetStateAction<string>>; monthlyEventCost: Array<[string, number]>; eventNotice?: string | null }) {
  const calendarDays = buildCalendarDays(calendarMonth, events);
  const monthCost = monthlyEventCost.find(([month]) => month === calendarMonth)?.[1] ?? 0;
  return (
    <section className="calendar-layout">
      <Panel title="월간 취업 일정">
        <div className="calendar-toolbar">
          <YearMonthSelect value={calendarMonth} onChange={setCalendarMonth} yearsBehind={1} yearsAhead={2} allowEmpty={false} />
          <strong>{calendarMonth} 예상 취준비 {formatWon(monthCost)}</strong>
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div className={`calendar-cell ${day.inMonth ? "" : "muted-cell"}`} key={day.key}>
              <span className="day-number">{day.day}</span>
              <div className="calendar-events">
                {day.events.slice(0, 3).map((event) => (
                  <button className="event-chip" key={event.id} onClick={() => setEventForm({ title: event.title, event_type: event.event_type, event_date: event.event_date, expected_cost: String(Math.round(event.expected_cost / 10_000)) })}>
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <section className="side-stack">
        <EventFormPanel eventForm={eventForm} setEventForm={setEventForm} addEvent={addEvent} runScenario={runScenario} notice={eventNotice} />
        <CompactList title="일정 목록" items={events.map((event) => ({ key: event.id, title: event.title, meta: `${event.event_date} · ${eventTypeLabels[event.event_type]}`, value: formatWon(event.expected_cost) }))} />
      </section>
    </section>
  );
}
