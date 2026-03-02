import Link from 'next/link'

interface CategoryCardProps {
  emoji: string
  label: string
  slug: string
  count: number
  citySlug: string
}

export default function CategoryCard({ emoji, label, slug, count, citySlug }: CategoryCardProps) {
  return (
    <Link
      href={`/${citySlug}/${slug}/`}
      className="group flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200"
    >
      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{emoji}</span>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span className="text-xs text-gray-500 mt-0.5">{count} venues</span>
    </Link>
  )
}
