import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { venues } from '@/data/venues'
import { getCityBySlug, cities } from '@/data/cities'
import { CATEGORY_MAP, type Category } from '@/types'
import VenueCard from '@/components/venue/VenueCard'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { faqJsonLd } from '@/lib/seo'

function getCategoryBySlug(slug: string): [Category, typeof CATEGORY_MAP[Category]] | null {
  const entry = Object.entries(CATEGORY_MAP).find(([_, v]) => v.slug === slug)
  return entry ? [entry[0] as Category, entry[1]] : null
}

export function generateStaticParams() {
  const params: { city: string; category: string }[] = []
  for (const city of cities.filter(c => c.isActive)) {
    // Category params
    for (const cat of Object.values(CATEGORY_MAP)) {
      params.push({ city: city.slug, category: cat.slug })
    }
    // Neighborhood params
    for (const n of city.neighborhoods) {
      params.push({ city: city.slug, category: n.slug })
    }
  }
  return params
}

export function generateMetadata({ params }: { params: { city: string; category: string } }): Metadata {
  const city = getCityBySlug(params.city)
  if (!city) return {}

  const cat = getCategoryBySlug(params.category)
  if (cat) {
    return {
      title: `Best ${cat[1].label} Happy Hours & Deals in ${city.name}`,
      description: `Find the best ${cat[1].label.toLowerCase()} deals in ${city.name}. Happy hours, daily promotions, and special offers.`,
    }
  }
  const neighborhood = city.neighborhoods.find(n => n.slug === params.category)
  if (neighborhood) {
    return {
      title: `Happy Hours & Deals in ${neighborhood.name}, ${city.name}`,
      description: `${neighborhood.description} Find the best deals in ${neighborhood.name}.`,
    }
  }
  return {}
}

export default function CategoryOrNeighborhoodPage({ params }: { params: { city: string; category: string } }) {
  const city = getCityBySlug(params.city)
  if (!city || !city.isActive) notFound()

  const cat = getCategoryBySlug(params.category)
  const neighborhood = !cat ? city.neighborhoods.find(n => n.slug === params.category) : null

  if (!cat && !neighborhood) notFound()

  const cityVenues = venues.filter(v => v.citySlug === params.city)

  // Neighborhood page
  if (neighborhood) {
    const neighborhoodVenues = cityVenues.filter(v => v.neighborhoodSlug === neighborhood.slug)
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { name: city.name, url: `/${city.slug}/` },
          { name: neighborhood.name, url: `/${city.slug}/${neighborhood.slug}/` },
        ]} />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Deals in {neighborhood.name}, {city.name}</h1>
          <p className="mt-2 text-lg text-gray-600">{neighborhood.description}</p>
          <p className="mt-1 text-gray-500">{neighborhoodVenues.length} venues with active deals.</p>
        </div>
        {neighborhoodVenues.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoodVenues.map(venue => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No venues in {neighborhood.name} yet</h2>
            <p className="text-gray-500">We&apos;re adding new venues every day. Check back soon!</p>
          </div>
        )}
      </div>
    )
  }

  // Category page
  const [categoryKey, categoryInfo] = cat!
  const categoryVenues = cityVenues.filter(v => v.category === categoryKey)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[
        { name: city.name, url: `/${city.slug}/` },
        { name: categoryInfo.label, url: `/${city.slug}/${categoryInfo.slug}/` },
      ]} />

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{categoryInfo.emoji}</span>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {categoryInfo.label} in {city.name}
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {categoryVenues.length} {categoryInfo.label.toLowerCase()} with active deals and happy hours in {city.name}.
        </p>
      </div>

      {categoryVenues.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryVenues.map(venue => (
            <VenueCard key={venue.id} venue={venue} showCategory={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">{categoryInfo.emoji}</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No {categoryInfo.label.toLowerCase()} listed yet</h2>
          <p className="text-gray-500">We&apos;re adding new venues every day. Check back soon!</p>
        </div>
      )}

      <section className="mt-16">
        <JsonLd data={faqJsonLd([
          { question: `What are the best ${categoryInfo.label.toLowerCase()} deals in ${city.name}?`, answer: `Browse our curated list of ${categoryVenues.length} ${categoryInfo.label.toLowerCase()} with verified happy hours and daily deals in ${city.name}.` },
        ])} />
        <h2 className="text-xl font-bold text-gray-900 mb-4">About {categoryInfo.label} in {city.name}</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600">
            {city.name} has an incredible range of {categoryInfo.label.toLowerCase()} offering deals throughout the week.
            From luxury hotel venues to hidden neighborhood gems, there&apos;s something for every taste and budget.
            Use Love Happy Hours to find what&apos;s happening right now and never miss a deal.
          </p>
        </div>
      </section>
    </div>
  )
}
