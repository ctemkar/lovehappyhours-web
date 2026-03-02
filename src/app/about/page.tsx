import { type Metadata } from 'next'
import Link from 'next/link'
import { Heart, MapPin, Clock, Shield, Users, Sparkles } from 'lucide-react'
import Breadcrumbs from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = {
  title: 'About Love Happy Hours',
  description: 'Love Happy Hours is a real-time deals discovery platform helping you find the best happy hours, daily deals, and promotions at bars, restaurants, spas, and more.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ name: 'About', url: '/about/' }]} />

      <div className="mt-8 mb-16">
        <div className="text-center">
          <span className="text-6xl mb-4 block">💜</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">About Love Happy Hours</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            We believe everyone deserves to enjoy the best a city has to offer — without overpaying.
            Love Happy Hours helps you discover real-time deals at bars, restaurants, spas, salons, and more.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        {[
          { icon: Clock, title: 'Real-Time Deals', desc: 'See what\'s happening right now. Our "Happening Now" feature shows live deals based on the actual time and day.' },
          { icon: MapPin, title: 'Local Discovery', desc: 'From rooftop bars to neighborhood massage shops, we cover every category — not just food and drinks.' },
          { icon: Shield, title: 'Verified Listings', desc: 'We verify deals directly with venues. Look for the ✓ Verified badge for confirmed promotions.' },
          { icon: Users, title: 'For Venues Too', desc: 'Business owners can list deals for free. More visibility means more happy customers.' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
            <item.icon className="w-8 h-8 text-brand-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="bg-brand-50 rounded-3xl p-8 sm:p-12 mb-16 border border-brand-100">
        <h2 className="text-2xl font-bold text-brand-900 mb-4">Our Mission</h2>
        <p className="text-brand-800 leading-relaxed mb-4">
          We started Love Happy Hours in Bangkok because we kept asking the same question: &quot;What deals are on tonight?&quot;
          Happy hours, spa promotions, early bird specials — the information exists, but it&apos;s scattered across Instagram stories,
          Google Maps notes, and word of mouth.
        </p>
        <p className="text-brand-800 leading-relaxed mb-4">
          We&apos;re building the platform we wished existed: one place to discover every deal, updated in real time,
          across every lifestyle category — from cocktail bars to massage shops to hair salons.
        </p>
        <p className="text-brand-800 leading-relaxed">
          Starting with Bangkok, expanding to Bali, Singapore, Dubai, and beyond. If your city has happy hours, we want to be there.
        </p>
      </div>

      {/* For businesses */}
      <div className="text-center mb-16">
        <Sparkles className="w-10 h-10 text-brand-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Own a Venue?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-6">
          List your deals for free and reach thousands of customers actively searching for promotions near them.
          Manage your listing, update deals in real time, and track customer discovery.
        </p>
        <a
          href="https://app.lovehappyhours.com"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-700 transition-colors"
        >
          List Your Venue — Free
        </a>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h2>
        <p className="text-gray-600 mb-4">Questions, partnerships, or just want to say hello?</p>
        <a href="mailto:hello@lovehappyhours.com" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
          hello@lovehappyhours.com
        </a>
      </div>
    </div>
  )
}
