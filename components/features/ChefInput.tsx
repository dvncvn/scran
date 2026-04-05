"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChefInputProps {
  householdId: Id<"households">;
  value: { id?: Id<"chefs">; name: string };
  onChange: (value: { id?: Id<"chefs">; name: string }) => void;
}

export function ChefInput({ householdId, value, onChange }: ChefInputProps) {
  const [inputValue, setInputValue] = useState(value.name);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const chefs = useQuery(api.functions.chefs.search, {
    householdId,
    query: inputValue,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value.name);
  }, [value.name]);

  function handleSelect(chef: { _id: Id<"chefs">; name: string }) {
    setInputValue(chef.name);
    onChange({ id: chef._id, name: chef.name });
    setShowDropdown(false);
  }

  function handleInputChange(text: string) {
    setInputValue(text);
    setShowDropdown(true);
    // Clear the ID if they're typing something new
    if (value.id && text.toLowerCase() !== value.name.toLowerCase()) {
      onChange({ name: text });
    } else {
      onChange({ ...value, name: text });
    }
  }

  function handleBlur() {
    // Small delay to allow click on dropdown item
    setTimeout(() => {
      // If they typed a name that exactly matches an existing chef, select it
      if (chefs && inputValue.trim()) {
        const match = chefs.find(
          (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (match) {
          onChange({ id: match._id, name: match.name });
          setInputValue(match.name);
        } else {
          // New chef name — will be created on save
          onChange({ name: inputValue.trim() });
        }
      }
      setShowDropdown(false);
    }, 150);
  }

  const filtered = chefs ?? [];
  const exactMatch = filtered.some(
    (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showCreate = inputValue.trim() && !exactMatch;

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="chef" className="block text-sm font-medium mb-1">
        Chef
      </label>
      <input
        id="chef"
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => inputValue.trim() && setShowDropdown(true)}
        onBlur={handleBlur}
        placeholder="e.g., Kenji Lopez-Alt, Molly Baz, Sean Brock"
        autoComplete="off"
        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {showDropdown && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 max-h-48 overflow-y-auto">
          {filtered.map((chef) => (
            <button
              key={chef._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(chef)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {chef.name}
            </button>
          ))}
          {showCreate && (
            <div className="px-3 py-2 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              New chef &ldquo;{inputValue.trim()}&rdquo; will be added on save
            </div>
          )}
        </div>
      )}
    </div>
  );
}
