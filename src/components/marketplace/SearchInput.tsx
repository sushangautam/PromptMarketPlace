"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useRef } from "react";

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (timer.current) clearTimeout(timer.current);
    const val = e.target.value.trim();
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (val) sp.set("q", val);
      else sp.delete("q");
      sp.set("page", "1");
      router.push(`/marketplace?${sp}`);
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
      <input
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search prompts…"
        className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
      />
    </div>
  );
}
