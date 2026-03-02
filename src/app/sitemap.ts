import { type MetadataRoute } from 'next'
import { venues } from '@/data/venues'
import { cities } from '@/data/cities'
import { blogPosts } from '@/data/blog'
import { CATEGORY_MAP } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovehappyhours.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${SITE_URL}/about/`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/blog/`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
  ]

  const cityPages = cities.filter(c => c.isActive).map(city => ({
    url: `${SITE_URL}/${city.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  const categoryPages = cities.filter(c => c.isActive).flatMap(city =>
    Object.values(CATEGORY_MAP).map(cat => ({
      url: `${SITE_URL}/${city.slug}/${cat.slug}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  )

  const neighborhoodPages = cities.filter(c => c.isActive).flatMap(city =>
    city.neighborhoods.map(n => ({
      url: `${SITE_URL}/${city.slug}/${n.slug}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  )

  const venuePages = venues.map(v => ({
    url: `${SITE_URL}/venue/${v.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogPages = blogPosts.map(p => ({
    url: `${SITE_URL}/blog/${p.slug}/`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...cityPages, ...categoryPages, ...neighborhoodPages, ...venuePages, ...blogPages]
}
