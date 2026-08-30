import React from "react";
import { CalendarPlus } from "lucide-react";
import type { EventForm } from "../types";
import { eventTypeLabels } from "../constants";
import { Panel } from "./Panel";

export function EventFormPanel({ eventForm, setEventForm, addEvent, deleteEvent, isEditing = false, runScenario, notice, onDateChange }: { eventForm: EventForm; setEventForm: React.Dispatch<React.SetStateAction<EventForm>>; addEvent: () => Promise<boolean>; deleteEvent?: () => Promise<boolean>; isEditing?: boolean; runScenario: () => Promise<void>; notice?: string | null; onDateChange?: (date: string) => void }) {
  return (
    <Panel title="일정 등록">
      <div className="form-row"><input placeholder="일정명" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} /><select value={eventForm.event_type} onChange={(event) => setEventForm({ ...eventForm, event_type: event.target.value })}>{Object.entries(eventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="form-row"><label><span>날짜</span><input inputMode="numeric" placeholder="YYYY-MM-DD" value={eventForm.event_date} onChange={(event) => { const date = event.target.value; setEventForm({ ...eventForm, event_date: date }); onDateChange?.(date); }} /></label><label className="money-field"><span>예상비용</span><div className="money-input"><input type="number" min="0" value={eventForm.expected_cost} onChange={(event) => setEventForm({ ...eventForm, expected_cost: event.target.value })} /><span>만원</span></div></label></div>
      <div className="button-row event-form-actions"><button onClick={() => void addEvent()}><CalendarPlus size={16} />{isEditing ? "일정 수정" : "일정 저장"}</button>{isEditing && deleteEvent && <button className="danger-button" type="button" onClick={() => void deleteEvent()}>일정 삭제</button>}<button className="secondary" onClick={() => void runScenario()}>What-if 실행</button></div>
      {notice && <p className="muted">{notice}</p>}
    </Panel>
  );
}
