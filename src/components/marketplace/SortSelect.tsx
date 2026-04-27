"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Most Popular" },
  { value: "top-rated",  label: "Top Rated" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(value: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("sort", value);
    sp.set("page", "1");
    router.push(`?${sp}`);
  }

  return (
    <div className="relative">
      <select
        value={current || "newest"}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
    </div>
  );
}
