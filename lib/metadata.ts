import type { Metadata } from "next"

interface CreateMetadataOptions {
  title: string | { default: string; template: string }
  description: string
  metadataBase?: URL
  openGraph?: Metadata["openGraph"]
  twitter?: Metadata["twitter"]
  keywords?: string[]
  authors?: { name: string; url?: string }[]
  category?: string
  classification?: string
}

export function createMetadata(options: CreateMetadataOptions): Metadata {
  const {
    title,
    description,
    metadataBase,
    openGraph,
    twitter,
    keywords = [],
    authors = [{ name: "gitfeel" }],
    category,
    classification,
  } = options

  const baseUrl = metadataBase?.toString() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const titleString = typeof title === "string" ? title : title.default

  const defaultKeywords = [
    "developers",
    "programadores",
    "red social",
    "git",
    "commits",
    "código",
    "programación",
    "frustración",
    "debugging",
    "tech",
  ]

  const allKeywords = [...defaultKeywords, ...keywords]

  const defaultMetadata: Metadata = {
    title: title,
    description: description,
    keywords: allKeywords,
    authors: authors,
    category: category || "technology",
    classification: classification || "social network",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: titleString,
      description: description,
      url: baseUrl,
      siteName: "gitfeel",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "gitfeel - Red social para developers",
        },
      ],
      type: "website",
      locale: "es_ES",
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: titleString,
      description: description,
      images: ["/og-image.png"],
      creator: "@gitfeel",
      site: "@gitfeel",
      ...twitter,
    },
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon-16x16.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
    ],
    manifest: "/site.webmanifest",
    other: {
      "theme-color": "#3b82f6",
      "color-scheme": "light dark",
      "format-detection": "telephone=no",
    },
  }

  return defaultMetadata
}
