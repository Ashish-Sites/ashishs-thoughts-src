import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, FolderOpen } from 'lucide-react'
import { getEssaysList } from '../server/essays.functions'

export const Route = createFileRoute('/category/$category')({
  loader: async ({ params }) => {
    const essays = await getEssaysList()
    const category = decodeURIComponent(params.category)
    const filtered = essays.filter(
      (e) => e.category.toLowerCase() === category.toLowerCase()
    )
    return { category, essays: filtered }
  },
  component: CategoryPageComponent,
})

function CategoryPageComponent() {
  const { category, essays } = Route.useLoaderData()

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to="/topics"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] hover:text-[#d4af37] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </Link>
      </div>

      <header className="space-y-2 border-b border-[#202736] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37]">
          <FolderOpen className="w-4 h-4" />
          <span>Category Archive</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#f0f3f8]">
          {category}
        </h1>
        <p className="font-serif text-sm text-[#8b949e]">
          Showing {essays.length} {essays.length === 1 ? 'reflection' : 'reflections'} in this discipline.
        </p>
      </header>

      {essays.length === 0 ? (
        <div className="py-12 text-center text-xs font-serif text-[#6e7681] border border-dashed border-[#202736] rounded-xl">
          No essays found in this category.
        </div>
      ) : (
        <div className="divide-y divide-[#1b222e]">
          {essays.map((essay) => (
            <article
              key={essay.slug}
              className="group py-6 first:pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 hover:bg-[#11151e]/30 rounded-xl px-3 -mx-3 transition-colors"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 text-xs font-mono text-[#6e7681]">
                  <span>{essay.date}</span>
                  <span>•</span>
                  <span>{essay.readingTime} min read</span>
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#e6edf3] group-hover:text-[#d4af37] transition-colors">
                  <Link
                    to="/posts/$slug"
                    params={{ slug: essay.slug }}
                  >
                    {essay.title}
                  </Link>
                </h2>

                {essay.subtitle && (
                  <p className="font-serif text-sm text-[#8b949e] italic">
                    {essay.subtitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[#7d8799] font-serif leading-relaxed line-clamp-2">
                  {essay.summary}
                </p>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                <Link
                  to="/posts/$slug"
                  params={{ slug: essay.slug }}
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#8b949e] group-hover:text-[#f0f3f8]"
                >
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
