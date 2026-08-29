import React from "react";
import { CalendarPlus } from "lucide-react";
import type { EventForm } from "../types";
import { eventTypeLabels } from "../constants";
import { Panel } from "./Panel";

export function EventFormPanel({ eventForm, setEventForm, addEvent, runScenario, notice }: { eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<void>; runScenario: () => Promise<void>; notice?: string | null }) {
  return (
    <Panel title="일정 등록">
      <div className="form-row">
        <input placeholder="일정명" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} />
        <select value={eventForm.event_type} onChange={(event) => setEventForm({ ...eventForm, event_type: event.target.value })}>
          {Object.entries(eventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="form-row">
        <input type="date" value={eventForm.event_date} onChange={(event) => setEventForm({ ...eventForm, event_date: event.target.value })} />
        <input type="number" placeholder="예상비용" value={eventForm.expected_cost} onChange={(event) => setEventForm({ ...eventForm, expected_cost: event.target.value })} />
      </div>
      <div className="button-row">
        <button onClick={addEvent}><CalendarPlus size={16} />일정 저장</button>
        <button className="secondary" onClick={runScenario}>What-if 실행</button>
      </div>
      {notice && <p className="muted">{notice}</p>}
    </Panel>
  );
}
