"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Briefcase, MapPin, Globe, X } from "lucide-react";

// ─── Single autocomplete input ────────────────────────────────────────────────
function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
  suggestions,
  showAllOnFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  suggestions: string[];
  showAllOnFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return showAllOnFocus ? suggestions.slice(0, 100) : [];
    const q = value.toLowerCase();
    return Array.from(new Set(
      suggestions.filter((s) => s.toLowerCase().includes(q))
    )).slice(0, 100);
  }, [value, suggestions, showAllOnFocus]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (value.trim()) setOpen(true); }}
        className="pl-9 pr-7"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={(e) => { e.preventDefault(); onSelect(s); setOpen(false); }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export interface SearchValues {
  title: string;
  city: string;
  country: string;
}

export interface SearchBarProps {
  titleSuggestions: string[];
  citySuggestions: string[];
  countrySuggestions: string[];
  onSearch: (values: SearchValues) => void;
  titlePlaceholder?: string;
  initial?: Partial<SearchValues>;
}

export default function SearchBar({
  titleSuggestions,
  citySuggestions,
  countrySuggestions,
  onSearch,
  titlePlaceholder = "Job title",
  initial = {},
}: SearchBarProps) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [country, setCountry] = useState(initial.country ?? "");

  function submit(overrides?: Partial<SearchValues>) {
    onSearch({
      title: (overrides?.title !== undefined ? overrides.title : title).trim(),
      city: (overrides?.city !== undefined ? overrides.city : city).trim(),
      country: (overrides?.country !== undefined ? overrides.country : country).trim(),
    });
  }

  const hasValues = title || city || country;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <AutocompleteInput
        value={title}
        onChange={setTitle}
        onSelect={(v) => { setTitle(v); submit({ title: v }); }}
        placeholder={titlePlaceholder}
        icon={<Briefcase className="h-4 w-4" />}
        suggestions={titleSuggestions}
      />
      <AutocompleteInput
        value={country}
        onChange={setCountry}
        onSelect={(v) => { setCountry(v); submit({ country: v }); }}
        placeholder="Country"
        icon={<Globe className="h-4 w-4" />}
        suggestions={countrySuggestions}
        showAllOnFocus
      />
      <AutocompleteInput
        value={city}
        onChange={setCity}
        onSelect={(v) => { setCity(v); submit({ city: v }); }}
        placeholder="City"
        icon={<MapPin className="h-4 w-4" />}
        suggestions={citySuggestions}
      />

      <div className="flex shrink-0 gap-2">
        <Button type="submit" className="flex-1 sm:flex-none">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
        {hasValues && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTitle(""); setCity(""); setCountry("");
              onSearch({ title: "", city: "", country: "" });
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
