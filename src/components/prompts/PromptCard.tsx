"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Bookmark, Eye } from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/types";

interface PromptCardProps {
  prompt: Prompt;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  className?: string;
}

export function PromptCard({ prompt, onSave, isSaved, className }: PromptCardProps) {
  const price = typeof prompt.price === "number" ? prompt.price : parseFloat(prompt.price as any);

  return (
    <Card hover className={cn("flex flex-col overflow-hidden group", className)}>
      {/* Example image / preview */}
      <div className="relative aspect-video bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
        {prompt.exampleImageUrl ? (
          <Image
            src={prompt.exampleImageUrl}
            alt={prompt.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 dark:text-zinc-600 text-xs text-center px-4 font-mono leading-relaxed line-clamp-4">
              {prompt.previewText || prompt.description.slice(0, 120) + "..."}
            </div>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {prompt.isFree && <Badge variant="free">FREE</Badge>}
          {prompt.isFeatured && <Badge>Featured</Badge>}
          {prompt.aiTool && (
            <Badge variant="secondary">{prompt.aiTool.name}</Badge>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); onSave?.(prompt.id); }}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm transition-all",
            "opacity-0 group-hover:opacity-100",
            isSaved ? "text-violet-600" : "text-zinc-500 hover:text-violet-600"
          )}
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
        </button>
      </div>

      <CardBody className="flex-1 flex flex-col gap-2">
        {/* Category */}
        {prompt.category && (
          <span className="text-xs text-violet-600 font-medium uppercase tracking-wide">
            {prompt.category.name}
          </span>
        )}

        {/* Title */}
        <Link href={`/prompts/${prompt.slug}`} className="group/title">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover/title:text-violet-600 transition-colors leading-snug">
            {prompt.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {prompt.description}
        </p>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardBody>

      <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 justify-between">
        {/* Seller + rating */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={prompt.seller?.avatarUrl}
            name={prompt.seller?.fullName || prompt.seller?.username || "?"}
            size="xs"
          />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 truncate">
              {prompt.seller?.fullName || prompt.seller?.username}
            </p>
            {prompt.ratingCount > 0 && (
              <StarRating rating={prompt.ratingAvg} count={prompt.ratingCount} />
            )}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {price === 0 ? "Free" : `$${price.toFixed(2)}`}
          </span>
          <Link href={`/prompts/${prompt.slug}`}>
            <Button size="sm" className="gap-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              {price === 0 ? "Get" : "Buy"}
            </Button>
          </Link>
        </div>
      </CardFooter>

      {/* Stats bar */}
      <div className="px-5 pb-3 flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {prompt.viewCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <ShoppingCart className="h-3.5 w-3.5" />
          {prompt.purchaseCount.toLocaleString()} sales
        </span>
      </div>
    </Card>
  );
}
