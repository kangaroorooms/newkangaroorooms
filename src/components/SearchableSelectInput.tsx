import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { PortalDropdown } from "./ui/PortalDropdown";

type Option = {
  label: string;
  value: string;
};

type SearchableSelectInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  emptyText?: string;

  // 🔥 Styling control (important)
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  leadingIcon?: React.ReactNode;
  showChevron?: boolean;
};

export default function SearchableSelectInput({
  id,
  value,
  onChange,
  options,
  placeholder = "Search...",
  emptyText = "No results found",
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  leadingIcon,
  showChevron = true,
}: SearchableSelectInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options.slice(0, 100);

    return options
      .filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 100);
  }, [query, options]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Close on outside click and repositioning are handled by PortalDropdown.

  // Reset highlight when open/query changes
  useEffect(() => {
    if (open) setHighlightedIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setOpen(false);
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative ${className || "w-full"}`}>
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between text-left outline-none
          ${inputClassName}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {leadingIcon && (
            <span className="flex shrink-0 items-center">{leadingIcon}</span>
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        {showChevron && (
          <ChevronDown
            className={`ml-2 h-4 w-4 flex-shrink-0 transition 
            text-slate-400 dark:text-slate-500
            ${open ? "rotate-180 text-amber-500" : ""}`}
          />
        )}
      </button>

      {/* DROPDOWN */}
      <PortalDropdown
        isOpen={open}
        anchorRef={triggerRef}
        wrapperRef={wrapperRef}
        onClose={() => setOpen(false)}
        className={`rounded-b-2xl rounded-t-none border border-t-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-200 ${dropdownClassName}`}
        portalId="searchable-select-dropdown"
        zIndex={9999}
      >
        {/* SEARCH HEADER */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-0 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((i) =>
                    Math.min(i + 1, filteredOptions.length - 1)
                  );
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const selected = filteredOptions[highlightedIndex];
                  if (selected) handleSelect(selected);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={placeholder}
              autoComplete="off"
              aria-label={`${placeholder} search`}
              className="w-full bg-transparent 
                pl-4 pr-2 py-1.5 text-sm
                text-slate-900 dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                outline-none"
            />
          </div>
        </div>

        {/* OPTIONS LIST */}
        <ul className="max-h-[220px] overflow-auto py-2" role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => {
              const active = opt.value === value;
              const highlighted = index === highlightedIndex;

              return (
                <li key={opt.value} role="option" aria-selected={active}>
                  <button
                    ref={(el) => (itemRefs.current[index] = el)}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex justify-between items-center px-4 py-3 text-sm transition
                    ${
                      active
                        ? "bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200 font-medium border-l-2 border-amber-500"
                        : highlighted
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex-1 text-left">{opt.label}</span>
                    {active && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 ml-2" />}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {emptyText}
            </li>
          )}
        </ul>
      </PortalDropdown>
    </div>
  );
}
