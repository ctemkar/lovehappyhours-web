import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { blogPosts, getBlogPostBySlug } from '@/data/blog'
import { blogMetadata, blogJsonLd } from '@/lib/seo'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'

export function generateStaticParams() {
  return blogPosts.map(p => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getBlogPostBySlug(params.slug)
  if (!post) return {}
  return blogMetadata(post)
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <>
      <JsonLd data={blogJsonLd(post)} />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { name: 'Blog', url: '/blog/' },
          { name: post.title, url: `/blog/${post.slug}/` },
        ]} />

        <header className="mt-8 mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-balance">{post.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{post.author}</span>
            <span>·</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </time>
            <span>·</span>
            <span>{post.city}</span>
          </div>
        </header>

        <div className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>
            if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.slice(2, -2)}</strong></p>
            if (line.startsWith('---')) return <hr key={i} />
            if (line.trim() === '') return null
            return <p key={i}>{line}</p>
          })}
        </div>
      </article>
    </>
  )
}
