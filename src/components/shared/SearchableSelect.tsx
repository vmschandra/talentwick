"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

/**
 * Searchable dropdown — type to filter, click to select, X to clear.
 * The dropdown shows all options when the input is focused and empty,
 * and filters to matches as the user types.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [inputText, setInputText] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep display text in sync when external value changes
  useEffect(() => { setInputText(value); }, [value]);

  const filtered = useMemo(() => {
    if (!inputText.trim()) return options;
    const q = inputText.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [inputText, options]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputText(value); // restore on outside-click
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [value]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <Input
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); setOpen(true); }}
        onFocus={() => { setInputText(""); setOpen(true); }}
        placeholder={placeholder}
        disabled={disabled}
        className={value ? "pr-7" : ""}
        autoComplete="off"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => { onChange(""); setInputText(""); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.slice(0, 100).map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setInputText(opt);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
