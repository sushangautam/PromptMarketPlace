import type { Metadata } from "next";
import { SEO_CONFIG } from "@/config/seo";
import type { Prompt, Category, AiTool } from "@/types";

export function buildPromptMetadata(prompt: Prompt): Metadata {
  const title = prompt.metaTitle || `${prompt.title} | ${SEO_CONFIG.siteName}`;
  const description =
    prompt.metaDescription ||
    `${prompt.description.slice(0, 155)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SEO_CONFIG.siteUrl}/prompts/${prompt.slug}`,
      images: prompt.exampleImageUrl
        ? [{ url: prompt.exampleImageUrl, width: 1200, height: 630 }]
        : [{ url: SEO_CONFIG.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: prompt.exampleImageUrl ? [prompt.exampleImageUrl] : [],
    },
    alternates: {
      canonical: `${SEO_CONFIG.siteUrl}/prompts/${prompt.slug}`,
    },
  };
}

export function buildCategoryMetadata(category: Category, tool?: AiTool): Metadata {
  const subject = tool ? `${tool.name} ` : "";
  const title = `Best ${subject}${category.name} Prompts – Free & Premium | ${SEO_CONFIG.siteName}`;
  const description = `Browse ${category.promptCount}+ ${subject}${category.name} prompts. Find professional AI prompts for ${category.name.toLowerCase()} to boost your productivity.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/category/${category.slug}` },
  };
}

export function buildProgrammaticMetadata({
  tool,
  useCase,
  count,
}: {
  tool: string;
  useCase: string;
  count: number;
}): Metadata {
  const formattedUseCase = useCase.replace(/-/g, " ");
  const title = `${count}+ Best ${tool} Prompts for ${formattedUseCase} (Free & Pro) | ${SEO_CONFIG.siteName}`;
  const description = `Discover the best ${tool} prompts for ${formattedUseCase}. ${count} verified, high-quality prompts used by professionals. Copy, customize, and get results instantly.`;

  return { title, description };
}

// JSON-LD structured data for prompt pages
export function buildPromptJsonLd(prompt: Prompt) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: prompt.title,
    description: prompt.description,
    url: `${SEO_CONFIG.siteUrl}/prompts/${prompt.slug}`,
    image: prompt.exampleImageUrl,
    offers: {
      "@type": "Offer",
      price: prompt.price.toString(),
      priceCurrency: prompt.currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Person",
        name: prompt.seller?.fullName || prompt.seller?.username,
      },
    },
    aggregateRating:
      (prompt.ratingCount ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: prompt.ratingAvg,
            reviewCount: prompt.ratingCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    keywords: (prompt.tags ?? []).join(", "),
  };
}

// FAQ structured data
export function buildFaqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

// BreadcrumbList for all pages
export function buildBreadcrumbJsonLd(crumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
