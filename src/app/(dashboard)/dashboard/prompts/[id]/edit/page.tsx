"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, DollarSign, Tag, FileText, Eye, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const CATEGORIES = [
  "Marketing", "Coding", "Design", "Writing", "Business",
  "Education", "Photography", "Social Media", "Video", "Other",
];

const AI_TOOLS = [
  "ChatGPT", "Claude", "Midjourney", "DALL-E 3", "Sora",
  "Gemini", "Stable Diffusion", "Grok", "Flux",
];

const TAGS_SUGGESTIONS = [
  "copywriting", "SEO", "social media", "email", "ads",
  "debugging", "code review", "documentation", "UX", "branding",
];

function EditPromptForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: "",
    description: "",
    promptText: "",
    price: "",
    category: "",
    aiTool: "",
    tags: [] as string[],
    tagInput: "",
  });
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/prompts/${id}/data`);
        if (!res.ok) throw new Error("Failed to load prompt");
        const data = await res.json();
        setForm({
          title: data.title || "",
          description: data.description || "",
          promptText: data.promptText || "",
          price: data.price?.toString() || "0",
          category: data.category?.name || "",
          aiTool: data.aiTool?.name || "",
          tags: data.tags || [],
          tagInput: "",
        });
      } catch {
        setError("Failed to load prompt data.");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id]);

  const set = (k: string, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      set("tags", [...form.tags, t]);
      set("tagInput", "");
    }
  };

  const removeTag = (tag: string) => set("tags", form.tags.filter((t) => t !== tag));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.title || !form.promptText || !form.category) {
      setError("Title, prompt text, and category are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          promptText: form.promptText,
          price: parseFloat(form.price) || 0,
          categorySlug: form.category.toLowerCase().replace(/\s+/g, "-"),
          aiToolSlug: form.aiTool.toLowerCase().replace(/\s+/g, "-"),
          tags: form.tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update prompt");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/prompts"), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/prompts">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Edit Prompt</h1>
            <p className="text-zinc-500 mt-1">Update your prompt details</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="gap-2">
          <Eye className="h-4 w-4" />
          {preview ? "Edit" : "Preview"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          Prompt updated! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody className="space-y-5">
                <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-600" />
                  Prompt Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Advanced SEO Blog Post Writer for ChatGPT"
                    maxLength={120}
                  />
                  <p className="mt-1 text-xs text-zinc-400">{form.title.length}/120 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe what this prompt does…"
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100 resize-none"
                  />
                  <p className="mt-1 text-xs text-zinc-400">{form.description.length}/1000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Prompt Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.promptText}
                    onChange={(e) => set("promptText", e.target.value)}
                    placeholder="Paste your full prompt here…"
                    rows={10}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100 resize-y"
                  />
                  <p className="mt-1 text-xs text-zinc-400">{form.promptText.length} characters</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-600" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1.5">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-zinc-600 leading-none">×</button>
                    </Badge>
                  ))}
                  {form.tags.length < 10 && (
                    <Input
                      value={form.tagInput}
                      onChange={(e) => set("tagInput", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(form.tagInput); }
                      }}
                      placeholder="Add tag, press Enter…"
                      className="h-7 w-36 text-xs"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_SUGGESTIONS.filter((t) => !form.tags.includes(t)).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-300 hover:text-violet-600 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-5">
                <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-violet-600" />
                  Pricing & Category
                </h2>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Price (USD)</label>
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0.00"
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <p className="mt-1 text-xs text-zinc-400">Set 0 for free. You keep 80% of each sale.</p>
                  {form.price && parseFloat(form.price) > 0 && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">
                      You earn: ${(parseFloat(form.price) * 0.8).toFixed(2)} per sale
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      className="w-full appearance-none h-10 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
                    >
                      <option value="">Select category…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">AI Tool</label>
                  <div className="relative">
                    <select
                      value={form.aiTool}
                      onChange={(e) => set("aiTool", e.target.value)}
                      className="w-full appearance-none h-10 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
                    >
                      <option value="">Select AI tool…</option>
                      {AI_TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Quality Checklist</h3>
                <ul className="space-y-2 text-sm">
                  {[
                    { done: form.title.length >= 20, label: "Descriptive title (20+ chars)" },
                    { done: form.description.length >= 100, label: "Good description (100+ chars)" },
                    { done: form.promptText.length >= 100, label: "Prompt text (100+ chars)" },
                    { done: !!form.category, label: "Category selected" },
                    { done: form.tags.length >= 3, label: "At least 3 tags" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${item.done ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {item.done ? "✓" : "○"}
                      </span>
                      <span className={item.done ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={loading}>
              <Upload className="h-5 w-5" />
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditPromptPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-10 max-w-4xl animate-pulse"><div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" /></div>}>
      <EditPromptForm />
    </Suspense>
  );
}
