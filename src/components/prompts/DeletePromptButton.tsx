"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeletePromptButton({ promptId }: { promptId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this prompt? This cannot be undone.")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/v1/prompts/${promptId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      onClick={handleDelete}
      isLoading={isLoading}
    >
      {!isLoading && <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}
