import Link from 'next/link'
import { MapPin, Star, Clock, Tag } from 'lucide-react'
import { type Venue, CATEGORY_MAP, DEAL_TYPE_MAP } from '@/types'
import { formatTimeRange, formatDaysActive, formatPriceRange, isDealActiveNow } from '@/lib/utils'

export default function VenueCard({ venue, showCategory = true }: { venue: Venue; showCategory?: boolean }) {
  const cat = CATEGORY_MAP[venue.category]
  const activeDeal = venue.deals[0]
  const isLive = activeDeal ? isDealActiveNow(activeDeal) : false

  return (
    <Link href={`/venue/${venue.slug}/`} className="group block">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image area */}
        <div className="relative h-48 bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-30">{cat.emoji}</span>
          </div>
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                LIVE NOW
              </span>
            )}
            {venue.isVerified && (
              <span className="bg-brand-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">✓ Verified</span>
            )}
          </div>
          {activeDeal && (
            <div className="absolute bottom-3 right-3">
              <span className={`${DEAL_TYPE_MAP[activeDeal.dealType].color} text-white text-xs font-medium px-2.5 py-1 rounded-full`}>
                {DEAL_TYPE_MAP[activeDeal.dealType].label}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                {venue.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                {showCategory && (
                  <>
                    <span>{cat.emoji} {cat.label}</span>
                    <span>·</span>
                  </>
                )}
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {venue.neighborhood}
                </span>
                <span>·</span>
                <span>{formatPriceRange(venue.priceRange)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-900">{venue.rating}</span>
            </div>
          </div>

          {/* Deal highlight */}
          {activeDeal && (
            <div className="mt-3 p-3 bg-brand-50 rounded-xl">
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-800 truncate">{activeDeal.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-brand-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimeRange(activeDeal.startTime, activeDeal.endTime)}</span>
                    <span>·</span>
                    <span>{formatDaysActive(activeDeal.daysActive)}</span>
                  </div>
                  {activeDeal.discountPercent && (
                    <span className="inline-block mt-1.5 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {activeDeal.discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
