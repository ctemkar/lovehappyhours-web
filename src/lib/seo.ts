import { type Metadata } from 'next'
import { type Venue, type Deal, type City, type BlogPost, CATEGORY_MAP } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovehappyhours.com'
const SITE_NAME = 'Love Happy Hours'

export function baseMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Love Happy Hours — Find the Best Deals Near You',
      template: '%s | Love Happy Hours',
    },
    description: 'Discover the best happy hours, daily deals, and promotions at bars, restaurants, spas, salons, and more. Time-aware deals happening right now near you.',
    keywords: ['happy hour', 'deals', 'bars', 'restaurants', 'spas', 'bangkok', 'daily deals'],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@lovehappyhours',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const },
    },
    ...overrides,
  }
}

export function cityMetadata(city: City): Metadata {
  return {
    title: `Best Happy Hours & Deals in ${city.name} ${city.emoji}`,
    description: `Discover ${city.venueCount}+ happy hours, daily deals, and promotions at bars, restaurants, spas, and more in ${city.name}. Find what's happening right now.`,
    openGraph: {
      title: `Best Happy Hours & Deals in ${city.name}`,
      description: `Find the best deals in ${city.name} — happy hours, spa deals, restaurant promotions and more.`,
      url: `${SITE_URL}/${city.slug}/`,
    },
  }
}

export function venueMetadata(venue: Venue): Metadata {
  const cat = CATEGORY_MAP[venue.category]
  const dealSummary = venue.deals[0]?.title || 'Check latest deals'
  return {
    title: `${venue.name} — ${cat.label} in ${venue.neighborhood}, ${venue.city}`,
    description: `${venue.description.slice(0, 150)}. Current deal: ${dealSummary}. ${venue.address}.`,
    openGraph: {
      title: `${venue.name} — Happy Hours & Deals`,
      description: `${dealSummary} at ${venue.name}, ${venue.neighborhood}.`,
      url: `${SITE_URL}/venue/${venue.slug}/`,
      type: 'article',
    },
  }
}

export function blogMetadata(post: BlogPost): Metadata {
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}/`,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

// JSON-LD structured data generators
export function venueJsonLd(venue: Venue) {
  const cat = CATEGORY_MAP[venue.category]
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/venue/${venue.slug}/`,
    name: venue.name,
    description: venue.description,
    url: venue.website || `${SITE_URL}/venue/${venue.slug}/`,
    telephone: venue.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressLocality: venue.neighborhood,
      addressRegion: venue.city,
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: venue.latitude,
      longitude: venue.longitude,
    },
    aggregateRating: venue.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: venue.rating,
      reviewCount: venue.reviewCount,
    } : undefined,
    priceRange: '฿'.repeat(venue.priceRange),
    image: venue.coverImage,
    offers: venue.deals.map(deal => dealJsonLd(deal, venue)),
  }
}

export function dealJsonLd(deal: Deal, venue: Venue) {
  return {
    '@type': 'Offer',
    name: deal.title,
    description: deal.description,
    price: deal.dealPrice || undefined,
    priceCurrency: 'THB',
    availability: deal.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    validFrom: deal.validFrom,
    validThrough: deal.validUntil,
    seller: { '@type': 'LocalBusiness', name: venue.name },
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

export function blogJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Organization', name: SITE_NAME },
    datePublished: post.publishedAt,
    image: post.coverImage,
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }
}
