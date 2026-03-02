import { type Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCityBySlug, cities } from '@/data/cities'
import { getVenuesByCity } from '@/data/venues'
import { CATEGORY_MAP } from '@/types'
import { cityMetadata } from '@/lib/seo'
import VenueCard from '@/components/venue/VenueCard'
import CategoryCard from '@/components/venue/CategoryCard'
import NeighborhoodCard from '@/components/venue/NeighborhoodCard'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import { faqJsonLd } from '@/lib/seo'

export function generateStaticParams() {
  return cities.filter(c => c.isActive).map(c => ({ city: c.slug }))
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = getCityBySlug(params.city)
  if (!city) return {}
  return cityMetadata(city)
}

export default function CityPage({ params }: { params: { city: string } }) {
  const city = getCityBySlug(params.city)
  if (!city || !city.isActive) notFound()

  const venues = getVenuesByCity(params.city)
  const categories = Object.entries(CATEGORY_MAP)

  return (
    <>
      <JsonLd data={faqJsonLd([
        { question: `What are the best happy hours in ${city.name}?`, answer: `Browse ${venues.length}+ venues with happy hours and deals in ${city.name} on Love Happy Hours.` },
        { question: `How many venues are listed in ${city.name}?`, answer: `We have ${venues.length} venues with deals in ${city.name}, including bars, restaurants, spas, and more.` },
      ])} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ name: city.name, url: `/${city.slug}/` }]} />

        {/* Hero */}
        <div className="mt-6 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{city.emoji}</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Happy Hours & Deals in {city.name}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Discover {venues.length}+ deals at bars, restaurants, spas, and more across {city.name}.
            From rooftop cocktail deals to spa promotions — find what&apos;s happening now.
          </p>
        </div>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.map(([key, cat]) => {
              const count = venues.filter(v => v.category === key).length
              if (count === 0) return null
              return (
                <CategoryCard
                  key={key}
                  emoji={cat.emoji}
                  label={cat.label}
                  slug={cat.slug}
                  count={count}
                  citySlug={city.slug}
                />
              )
            })}
          </div>
        </section>

        {/* Neighborhoods */}
        {city.neighborhoods.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Explore Neighborhoods</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {city.neighborhoods.map(n => {
                const count = venues.filter(v => v.neighborhoodSlug === n.slug).length
                return (
                  <NeighborhoodCard
                    key={n.slug}
                    name={n.name}
                    slug={n.slug}
                    description={n.description}
                    venueCount={count}
                    citySlug={city.slug}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* All Venues */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Deals in {city.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(venue => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
