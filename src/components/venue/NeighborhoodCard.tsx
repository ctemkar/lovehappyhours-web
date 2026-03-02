import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface NeighborhoodCardProps {
  name: string
  slug: string
  description: string
  venueCount: number
  citySlug: string
}

export default function NeighborhoodCard({ name, slug, description, venueCount, citySlug }: NeighborhoodCardProps) {
  return (
    <Link
      href={`/${citySlug}/${slug}/`}
      className="group block p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-brand-600" />
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{name}</h3>
        <span className="text-xs text-gray-500 ml-auto">{venueCount} deals</span>
      </div>
      <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
    </Link>
  )
}
