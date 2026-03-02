import Link from 'next/link'
import { CATEGORY_MAP } from '@/types'

const categoryLinks = Object.values(CATEGORY_MAP).slice(0, 8)

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💜</span>
              <span className="text-lg font-bold text-white">Love Happy Hours</span>
            </Link>
            <p className="text-sm text-gray-400">
              Discover the best happy hours, daily deals, and promotions near you. Real-time deals at bars, restaurants, spas, and more.
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Cities</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/bangkok/" className="hover:text-white transition-colors">Bangkok 🇹🇭</Link></li>
              <li><span className="text-gray-500">Bali 🇮🇩 (Coming Soon)</span></li>
              <li><span className="text-gray-500">Singapore 🇸🇬 (Coming Soon)</span></li>
              <li><span className="text-gray-500">Dubai 🇦🇪 (Coming Soon)</span></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {categoryLinks.map(cat => (
                <li key={cat.slug}>
                  <Link href={`/bangkok/${cat.slug}/`} className="hover:text-white transition-colors">
                    {cat.emoji} {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog/" className="hover:text-white transition-colors">Blog</Link></li>
              <li><a href="https://app.lovehappyhours.com" className="hover:text-white transition-colors">Business Login</a></li>
              <li><a href="mailto:hello@lovehappyhours.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Love Happy Hours. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/about/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/about/" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
