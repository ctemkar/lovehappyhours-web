import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import JsonLd from './JsonLd'
import { breadcrumbJsonLd } from '@/lib/seo'

interface BreadcrumbItem {
  name: string
  url: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto">
        <Link href="/" className="shrink-0 hover:text-brand-600 transition-colors">Home</Link>
        {items.map((item, i) => (
          <span key={item.url} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="w-3.5 h-3.5" />
            {i === items.length - 1 ? (
              <span className="text-gray-900 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-brand-600 transition-colors">{item.name}</Link>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
