"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
}

export function TagInput({
  values,
  onChange,
  placeholder = "Add a keyword…",
  maxTags = 20,
  maxTagLength = 40,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, maxTagLength);
    if (!tag || values.includes(tag) || values.length >= maxTags) return;
    onChange([...values, tag]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTag(input);
      setInput("");
    }
  }

  return (
    <div
      className="flex min-h-[48px] cursor-text flex-wrap items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2 focus-within:border-accent"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-ink bg-ink px-3 py-1 font-mono text-xs text-cream-50"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(values.filter((v) => v !== tag));
            }}
            className="ml-0.5 rounded-full hover:text-cream-50/70"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {values.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, maxTagLength))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      )}
    </div>
  );
}
