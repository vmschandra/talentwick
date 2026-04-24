"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Briefcase, X } from "lucide-react";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { WORLD_LOCATIONS } from "@/lib/data/locations";

const ALL_COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

// ─── Title autocomplete (keyword search, not a fixed list) ────────────────────
function TitleInput({
  value,
  onChange,
  onSelect,
  placeholder,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  placeholder: string;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [value, suggestions]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Briefcase className="h-4 w-4" />
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
        <button type="button" onClick={() => { onChange(""); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((s) => (
            <li key={s} onMouseDown={(e) => { e.preventDefault(); onSelect(s); setOpen(false); }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
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
  onSearch,
  titlePlaceholder = "Job title",
  initial = {},
}: SearchBarProps) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [city, setCity] = useState(initial.city ?? "");

  function handleCountryChange(v: string) {
    setCountry(v);
    setCity("");
    onSearch({ title, country: v.trim(), city: "" });
  }

  function handleCityChange(v: string) {
    setCity(v);
    onSearch({ title, country, city: v.trim() });
  }

  function handleTitleSelect(v: string) {
    setTitle(v);
    onSearch({ title: v.trim(), country, city });
  }

  function handleClear() {
    setTitle(""); setCountry(""); setCity("");
    onSearch({ title: "", country: "", city: "" });
  }

  // Cities from selected country, or fall back to cities derived from job data
  const cityOptions = country
    ? (WORLD_LOCATIONS[country] ?? citySuggestions)
    : citySuggestions;

  const hasValues = title || country || city;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch({ title: title.trim(), country: country.trim(), city: city.trim() }); }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <TitleInput
        value={title}
        onChange={setTitle}
        onSelect={handleTitleSelect}
        placeholder={titlePlaceholder}
        suggestions={titleSuggestions}
      />

      {/* Country — full searchable dropdown */}
      <div className="flex-1 min-w-0">
        <SearchableSelect
          value={country}
          onChange={handleCountryChange}
          options={ALL_COUNTRIES}
          placeholder="Country"
        />
      </div>

      {/* City — searchable dropdown, filtered by selected country */}
      <div className="flex-1 min-w-0">
        <SearchableSelect
          value={city}
          onChange={handleCityChange}
          options={cityOptions}
          placeholder={country ? "City" : "Select country first"}
          disabled={!country}
        />
      </div>

      <div className="flex shrink-0 gap-2">
        <Button type="submit" className="flex-1 sm:flex-none">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
        {hasValues && (
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
