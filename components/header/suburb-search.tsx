"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce, POPULAR_SUBURBS, storage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SuburbSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SuburbSearch({
  value,
  onChange,
  className,
}: SuburbSearchProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Debounced change handler
  const debouncedOnChange = React.useMemo(
    () => debounce((val: string) => onChange(val), 300),
    [onChange]
  );

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    debouncedOnChange(val);

    // Filter suggestions
    if (val.length > 0) {
      const recent = storage.get<string[]>("recentSuburbs", []);
      const allSuburbs = [...new Set([...recent, ...POPULAR_SUBURBS])];
      const filtered = allSuburbs.filter((suburb) =>
        suburb.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suburb: string) => {
    setInputValue(suburb);
    onChange(suburb);
    setShowSuggestions(false);

    // Save to recent
    const recent = storage.get<string[]>("recentSuburbs", []);
    const updated = [suburb, ...recent.filter((s) => s !== suburb)].slice(
      0,
      10
    );
    storage.set("recentSuburbs", updated);
  };

  const handleFocus = () => {
    if (inputValue.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      // Show recent suburbs on focus
      const recent = storage.get<string[]>("recentSuburbs", []);
      if (recent.length > 0) {
        setSuggestions(recent.slice(0, 5));
        setShowSuggestions(true);
      }
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search suburbs..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="pl-9"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
          {suggestions.map((suburb) => (
            <button
              key={suburb}
              onClick={() => handleSelectSuggestion(suburb)}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {suburb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
