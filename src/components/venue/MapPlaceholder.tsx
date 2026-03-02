'use client'

import { MapPin } from 'lucide-react'

interface MapPlaceholderProps {
  latitude: number
  longitude: number
  label?: string
  className?: string
}

export default function MapPlaceholder({ latitude, longitude, label, className = '' }: MapPlaceholderProps) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block relative bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-medium text-brand-700">
          {label || 'View on Google Maps'}
        </span>
        <span className="text-xs text-brand-500">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, #7e22ce 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
    </a>
  )
}
