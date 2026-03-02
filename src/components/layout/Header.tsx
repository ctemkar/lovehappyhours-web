'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, MapPin, Clock } from 'lucide-react'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">💜</span>
            <span className="text-xl font-bold text-brand-700">Love Happy Hours</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/bangkok/" className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              <MapPin className="w-4 h-4" />
              Bangkok
            </Link>
            <Link href="/blog/" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Blog
            </Link>
            <Link href="/about/" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              About
            </Link>
            <Link
              href="/bangkok/"
              className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Happening Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-3">
            <Link href="/bangkok/" className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
              <MapPin className="w-4 h-4" /> Bangkok
            </Link>
            <Link href="/blog/" className="block px-2 py-2 text-gray-700 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            <Link href="/about/" className="block px-2 py-2 text-gray-700 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link
              href="/bangkok/"
              className="flex items-center justify-center gap-1.5 bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              <Clock className="w-4 h-4" />
              Happening Now
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
