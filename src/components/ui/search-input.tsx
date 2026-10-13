import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { useDebouncedValue } from "@/hooks";

import { Input } from "./input";

/**
 * Debounced list search. It reports upward rather than holding the term, because
 * the screen owns it and writes it to the URL.
 */
export function SearchInput({
  label = "Search",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (term: string) => void;
}) {
  const id = useId();
  const [term, setTerm] = useState(value);
  const debounced = useDebouncedValue(term, 300);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // `value` is intentionally excluded: reacting to it would fight the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="search"
        value={term}
        placeholder={label}
        onChange={(event) => setTerm(event.target.value)}
        className="ps-8"
      />
    </div>
  );
}
