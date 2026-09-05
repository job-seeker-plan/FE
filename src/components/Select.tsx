import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function Select({ value, onChange, options, placeholder = "Select", id, disabled }: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlighted(Math.max(0, selectedIndex));
    }
    // Only re-sync the highlighted row when the menu transitions open, not on
    // every keystroke while it's already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      const node = listRef.current?.children[highlighted] as HTMLElement | undefined;
      node?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlighted]);

  function commit(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  function moveHighlight(delta: 1 | -1) {
    setHighlighted((current) => {
      let next = current;
      for (let step = 0; step < options.length; step += 1) {
        next = (next + delta + options.length) % options.length;
        if (!options[next]?.disabled) break;
      }
      return next;
    });
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else moveHighlight(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) setOpen(true);
      else commit(highlighted);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="select-root" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`select-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "select-value" : "select-placeholder"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={17} className="select-chevron" />
      </button>
      {open && (
        <ul className="select-menu" role="listbox" ref={listRef} tabIndex={-1}>
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              className={["select-option", index === highlighted && "highlighted", option.value === value && "selected", option.disabled && "disabled"].filter(Boolean).join(" ")}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commit(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
