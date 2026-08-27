import { useEffect, useRef, useState } from "react";

// <input type="month"> falls back to a plain text field in Safari, so a typed
// value like "13" can reach the backend instead of a guaranteed "YYYY-MM"
// string. Two <select> elements guarantee a valid value in every browser.
function splitYearMonth(value: string): [string, string] {
  const [year, month] = value ? value.split("-") : ["", ""];
  return [year ?? "", month ?? ""];
}

export function YearMonthSelect({
  value,
  onChange,
  yearsBehind = 0,
  yearsAhead = 3,
  allowEmpty = true
}: {
  value: string;
  onChange: (value: string) => void;
  yearsBehind?: number;
  yearsAhead?: number;
  allowEmpty?: boolean;
}) {
  const [year, setYear] = useState(() => splitYearMonth(value)[0]);
  const [month, setMonth] = useState(() => splitYearMonth(value)[1]);
  // Picking only the year (or only the month) composes to "" until both are
  // set, so the combined value we hand back to the parent doesn't yet reflect
  // that pick. This ref lets the effect below tell "the parent echoed back
  // what we just emitted" apart from "the parent reset us from the outside"
  // (e.g. clearing a form after submit) — only the latter should overwrite
  // the in-progress selection.
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      const [nextYear, nextMonth] = splitYearMonth(value);
      setYear(nextYear);
      setMonth(nextMonth);
      lastEmitted.current = value;
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsBehind + yearsAhead + 1 }, (_, index) => currentYear - yearsBehind + index);
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

  function update(nextYear: string, nextMonth: string) {
    setYear(nextYear);
    setMonth(nextMonth);
    const combined = nextYear && nextMonth ? `${nextYear}-${nextMonth}` : "";
    lastEmitted.current = combined;
    onChange(combined);
  }

  return (
    <div className="year-month-select">
      <select value={year} onChange={(event) => update(event.target.value, month)}>
        {allowEmpty && <option value="">연도</option>}
        {years.map((y) => <option key={y} value={String(y)}>{y}년</option>)}
      </select>
      <select value={month} onChange={(event) => update(year, event.target.value)}>
        {allowEmpty && <option value="">월</option>}
        {months.map((m) => <option key={m} value={m}>{Number(m)}월</option>)}
      </select>
    </div>
  );
}
