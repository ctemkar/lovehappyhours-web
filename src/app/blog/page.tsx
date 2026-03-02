import { type Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '@/data/blog'
import Breadcrumbs from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Blog — Happy Hour Guides, Tips & Deals',
  description: 'Expert guides to the best happy hours, spa deals, and daily promotions in Bangkok and beyond. Tips, neighborhood guides, and insider recommendations.',
}

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ name: 'Blog', url: '/blog/' }]} />

      <div className="mt-6 mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Blog</h1>
        <p className="mt-2 text-lg text-gray-600">Guides, tips, and insider knowledge on the best deals in town.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}/`} className="group block">
            <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="h-48 bg-gradient-to-br from-brand-200 to-brand-300 flex items-center justify-center p-8">
                <h2 className="text-center font-semibold text-brand-800 group-hover:text-brand-900 transition-colors">{post.title}</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{post.author}</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
