import Link from 'next/link'
import { ArrowRight, MapPin, Clock, Sparkles, Search } from 'lucide-react'
import { venues } from '@/data/venues'
import { cities } from '@/data/cities'
import { blogPosts } from '@/data/blog'
import { CATEGORY_MAP } from '@/types'
import VenueCard from '@/components/venue/VenueCard'
import CategoryCard from '@/components/venue/CategoryCard'
import JsonLd from '@/components/seo/JsonLd'

export default function HomePage() {
  const featuredVenues = venues.slice(0, 6)
  const activeCities = cities.filter(c => c.isActive)
  const categories = Object.entries(CATEGORY_MAP)

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Love Happy Hours',
        url: 'https://lovehappyhours.com',
        description: 'Discover the best happy hours and daily deals at bars, restaurants, spas, and more.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://lovehappyhours.com/bangkok/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                Real-time deals
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-500/90 text-white text-sm font-medium px-3 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                Live Now
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
              Find the best deals
              <br />
              <span className="text-brand-200">happening right now</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-100 max-w-2xl">
              Happy hours, daily deals, and promotions at bars, restaurants, spas, salons, and more.
              Discover what&apos;s on near you — updated in real time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/bangkok/"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 px-6 py-3.5 rounded-full text-base font-semibold hover:bg-brand-50 transition-colors shadow-lg"
              >
                <MapPin className="w-5 h-5" />
                Explore Bangkok
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about/"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3.5 rounded-full text-base font-medium hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <Sparkles className="w-5 h-5" />
                List Your Venue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="mt-1 text-gray-500">Deals across every lifestyle category</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {categories.map(([key, cat]) => {
            const count = venues.filter(v => v.category === key).length
            return (
              <CategoryCard
                key={key}
                emoji={cat.emoji}
                label={cat.label}
                slug={cat.slug}
                count={count}
                citySlug={activeCities[0]?.slug || 'bangkok'}
              />
            )
          })}
        </div>
      </section>

      {/* Featured Deals */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Deals</h2>
              <p className="mt-1 text-gray-500">Hand-picked deals at the best venues</p>
            </div>
            <Link href="/bangkok/" className="hidden sm:inline-flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVenues.map(venue => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/bangkok/" className="inline-flex items-center gap-1 text-brand-600 font-medium">
              View all deals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Cities</h2>
          <p className="mt-1 text-gray-500">Find deals across {cities.filter(c => c.isActive).length} cities worldwide.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map(city => (
            <div key={city.id} className={`relative rounded-2xl overflow-hidden border ${city.isActive ? 'border-brand-200 shadow-sm' : 'border-gray-200 opacity-60'}`}>
              <div className="h-32 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <span className="text-5xl">{city.emoji}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{city.name}</h3>
                  {city.isActive ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Live</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{city.venueCount} venues · {city.country}</p>
                {city.isActive && (
                  <Link href={`/${city.slug}/`} className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
                    Explore deals <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">From the Blog</h2>
              <p className="mt-1 text-gray-500">Guides, tips, and the best deals in town</p>
            </div>
            <Link href="/blog/" className="hidden sm:inline-flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700">
              All posts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}/`} className="group block">
                <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                  <div className="h-40 bg-gradient-to-br from-brand-200 to-brand-300 flex items-center justify-center p-6">
                    <h3 className="text-center text-sm font-semibold text-brand-800 line-clamp-3">{post.title}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                    <p className="mt-2 text-xs text-gray-400">{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'What is Love Happy Hours?', acceptedAnswer: { '@type': 'Answer', text: 'Love Happy Hours is a real-time deals discovery platform. We help you find happy hours, daily deals, and promotions at bars, restaurants, spas, salons, and more — all in one place.' }},
            { '@type': 'Question', name: 'How do I find deals happening right now?', acceptedAnswer: { '@type': 'Answer', text: 'Our "Happening Now" feature shows you deals that are currently active based on the time and day. Just visit a city page and look for the green "LIVE NOW" badges.' }},
            { '@type': 'Question', name: 'Which cities are available?', acceptedAnswer: { '@type': 'Answer', text: 'We are live in Bangkok, Mumbai, Pattaya, and New York City with 340+ venues. More cities coming soon!' }},
            { '@type': 'Question', name: 'How can I list my venue?', acceptedAnswer: { '@type': 'Answer', text: 'Visit app.lovehappyhours.com to create a free business account. You can add your venue, manage deals, and track how many customers discover you through our platform.' }},
          ],
        }} />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'What is Love Happy Hours?', a: 'A real-time deals discovery platform. We help you find happy hours, daily deals, and promotions at bars, restaurants, spas, salons, and more — all in one place.' },
            { q: 'How do I find deals happening right now?', a: 'Our "Happening Now" feature shows deals currently active based on the time and day. Visit a city page and look for the green "LIVE NOW" badges.' },
            { q: 'Which cities are available?', a: 'We are live in Bangkok, Mumbai, Pattaya, and New York City with 340+ venues. More cities coming soon!' },
            { q: 'How can I list my venue?', a: 'Visit app.lovehappyhours.com to create a free business account. Add your venue, manage deals, and track customer discovery.' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
