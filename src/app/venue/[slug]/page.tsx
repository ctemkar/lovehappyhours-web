import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Star, Phone, Globe, Instagram, Clock, Tag, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { venues, getVenueBySlug } from '@/data/venues'
import { CATEGORY_MAP, DEAL_TYPE_MAP } from '@/types'
import { venueMetadata, venueJsonLd } from '@/lib/seo'
import { formatTimeRange, formatDaysActive, formatPriceRange, isDealActiveNow } from '@/lib/utils'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import MapPlaceholder from '@/components/venue/MapPlaceholder'
import { PhotoGallery } from '@/components/photo-gallery'

export function generateStaticParams() {
  return venues.map(v => ({ slug: v.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const venue = getVenueBySlug(params.slug)
  if (!venue) return {}
  return venueMetadata(venue)
}

export default function VenuePage({ params }: { params: { slug: string } }) {
  const venue = getVenueBySlug(params.slug)
  if (!venue) notFound()

  const cat = CATEGORY_MAP[venue.category]
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  return (
    <>
      <JsonLd data={venueJsonLd(venue)} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { name: venue.city, url: `/${venue.citySlug}/` },
          { name: cat.label, url: `/${venue.citySlug}/${cat.slug}/` },
          { name: venue.name, url: `/venue/${venue.slug}/` },
        ]} />

        {/* Hero */}
        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center relative">
                <span className="text-8xl opacity-30">{cat.emoji}</span>
                <div className="absolute top-4 left-4 flex gap-2">
                  {venue.isVerified && (
                    <span className="bg-brand-600 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{venue.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <Link href={`/${venue.citySlug}/${venue.neighborhoodSlug}/`} className="hover:text-brand-600 transition-colors">
                          {venue.neighborhood}
                        </Link>
                      </span>
                      <span>{formatPriceRange(venue.priceRange)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl shrink-0">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-lg font-bold text-gray-900">{venue.rating}</span>
                    <span className="text-sm text-gray-500">({venue.reviewCount.toLocaleString()})</span>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 leading-relaxed">{venue.description}</p>
                {venue.subcategories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {venue.subcategories.map(sub => (
                      <span key={sub} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">{sub}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            {venue.photos && venue.photos.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Photos</h2>
                <PhotoGallery photos={venue.photos} venueName={venue.name} />
              </div>
            )}

            {/* Deals */}
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deals & Happy Hours</h2>
              <div className="space-y-4">
                {venue.deals.map(deal => {
                  const isLive = isDealActiveNow(deal)
                  return (
                    <div key={deal.id} className={`bg-white rounded-2xl border ${isLive ? 'border-green-200 ring-2 ring-green-100' : 'border-gray-100'} shadow-sm p-6`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isLive && (
                              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE NOW
                              </span>
                            )}
                            <span className={`${DEAL_TYPE_MAP[deal.dealType].color} text-white text-xs font-medium px-2.5 py-1 rounded-full`}>
                              {DEAL_TYPE_MAP[deal.dealType].label}
                            </span>
                            {!deal.isVerified && (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-gray-900">{deal.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{deal.description}</p>
                        </div>
                        {deal.discountPercent && (
                          <div className="shrink-0 bg-green-50 text-green-700 text-2xl font-extrabold px-4 py-2 rounded-xl text-center">
                            {deal.discountPercent}%<br /><span className="text-xs font-medium">OFF</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {formatTimeRange(deal.startTime, deal.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" /> {formatDaysActive(deal.daysActive)}
                        </span>
                        {deal.originalPrice && deal.dealPrice && (
                          <span>
                            <span className="line-through text-gray-400">฿{deal.originalPrice}</span>
                            {' → '}
                            <span className="font-semibold text-green-700">฿{deal.dealPrice}</span>
                          </span>
                        )}
                        {!deal.originalPrice && deal.dealPrice && (
                          <span className="font-semibold text-green-700">฿{deal.dealPrice}</span>
                        )}
                      </div>
                      {deal.dealTerms && (
                        <p className="mt-3 text-xs text-gray-400 italic">{deal.dealTerms}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Opening Hours */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Opening Hours</h2>
              <div className="space-y-2">
                {dayNames.map(day => {
                  const hours = venue.openingHours[day]
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day
                  return (
                    <div key={day} className={`flex justify-between text-sm ${isToday ? 'font-semibold text-brand-700' : 'text-gray-600'}`}>
                      <span className="capitalize">{day}{isToday ? ' (Today)' : ''}</span>
                      <span>{hours?.open === '00:00' && hours?.close === '00:00' ? 'Closed' : `${hours?.open} – ${hours?.close}`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Contact & Location</h2>
              <address className="not-italic text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                <span>{venue.address}</span>
              </address>
              {venue.phone && (
                <a href={`tel:${venue.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  <Phone className="w-4 h-4 text-brand-600" /> {venue.phone}
                </a>
              )}
              {venue.website && (
                <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors">
                  <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {venue.instagram && (
                <a href={`https://instagram.com/${venue.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  <Instagram className="w-4 h-4 text-brand-600" /> @{venue.instagram}
                </a>
              )}
              {venue.lineId && (
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  💬 LINE: {venue.lineId}
                </span>
              )}
            </div>

            {/* Map */}
            <MapPlaceholder
              latitude={venue.latitude}
              longitude={venue.longitude}
              label={`View ${venue.name} on Maps`}
              className="h-48"
            />

            {/* CTA */}
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <h3 className="font-semibold text-brand-900 mb-2">Is this your venue?</h3>
              <p className="text-sm text-brand-700 mb-4">Claim your listing to update deals, add photos, and reach more customers.</p>
              <a
                href="https://app.lovehappyhours.com"
                className="block text-center bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Claim This Listing
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
