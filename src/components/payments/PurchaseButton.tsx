"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PurchaseButtonProps {
  promptId: string;
  price: number;
  fullWidth?: boolean;
}

export function PurchaseButton({ promptId, price, fullWidth }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();
  const isFree = price === 0;

  async function handlePurchase() {
    if (!isSignedIn) {
      router.push(`/login?redirect=/prompts/${promptId}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, provider: "stripe" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Purchase failed");

      if (data.free) {
        router.refresh(); // re-render to show full prompt
      } else if (data.url) {
        window.location.href = data.url; // Stripe redirect
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn(fullWidth && "w-full")}>
      <Button
        onClick={handlePurchase}
        isLoading={isLoading}
        size="lg"
        variant={isFree ? "gradient" : "default"}
        className={cn(fullWidth && "w-full")}
      >
        {!isLoading && (
          isFree ? (
            <><ShoppingCart className="h-5 w-5" /> Get Free Prompt</>
          ) : (
            <><Lock className="h-4 w-4" /> Buy for ${price.toFixed(2)}</>
          )
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
