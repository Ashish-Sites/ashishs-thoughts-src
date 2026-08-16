import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Compass,
  FolderOpen,
  Tag,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { EssayItem } from '../lib/types'
import { getEssaysList } from '../server/essays.functions'

export const Route = createFileRoute('/topics')({
  loader: async () => {
    const essays = await getEssaysList()
    return { essays }
  },
  component: TopicsPageComponent,
})

function TopicsPageComponent() {
  const { essays } = Route.useLoaderData()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Group essays by category
  const categoriesMap = useMemo(() => {
    const map = new Map<string, EssayItem[]>()
    for (const essay of essays) {
      const cat = essay.category || 'Uncategorized'
      if (!map.has(cat)) {
        map.set(cat, [])
      }
      map.get(cat)!.push(essay)
    }
    return map
  }, [essays])

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagCount = new Map<string, number>()
    for (const essay of essays) {
      for (const tag of essay.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
      }
    }
    return Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1])
  }, [essays])

  const tagFilteredEssays = useMemo(() => {
    if (!selectedTag) return null
    return essays.filter((e) => e.tags.includes(selectedTag))
  }, [essays, selectedTag])

  return (
    <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <section className="space-y-4 border-b border-[#202736] pb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/20">
            <Compass className="w-3.5 h-3.5" />
            Taxonomy &amp; Themes
          </span>
          <span className="text-xs font-mono text-[#627083]">
            {categoriesMap.size} Categories • {allTags.length} Themes
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-[#f0f3f8]">
          Explore by Category &amp; Philosophical Theme
        </h1>

        <p className="font-serif text-sm sm:text-base text-[#9aa5b8] max-w-2xl leading-relaxed">
          Navigate the archive through overarching philosophical disciplines or drill down into specific recurring concepts and tags.
        </p>
      </section>

      {/* Themes / Tags Cloud */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#58a6ff]">
            <Tag className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Concept Index</span>
          </div>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs font-mono text-[#d4af37] underline"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allTags.map(([tag, count]) => {
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 shadow-sm'
                    : 'bg-[#121620] text-[#8b949e] hover:text-[#f0f3f8] border border-[#202738] hover:border-[#2d374d]'
                }`}
              >
                <span>#{tag}</span>
                <span className="text-[10px] text-[#5e6b7e] bg-[#0c0e12] px-1.5 py-0.2 rounded-full">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tag Filtered Results (if a tag is clicked) */}
      {selectedTag && tagFilteredEssays && (
        <section className="space-y-4 p-6 rounded-2xl bg-[#121620] border border-[#232b3c] animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#1e2637] pb-3 text-xs font-mono text-[#d4af37]">
            <span>Showing essays tagged with #{selectedTag}</span>
            <span>{tagFilteredEssays.length} entries</span>
          </div>

          <div className="divide-y divide-[#1b222e]">
            {tagFilteredEssays.map((essay) => (
              <div
                key={essay.slug}
                className="py-4 first:pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <h3 className="font-serif text-lg text-[#e6edf3]">
                    <Link
                      to="/posts/$slug"
                      params={{ slug: essay.slug }}
                      className="hover:text-[#d4af37] transition-colors"
                    >
                      {essay.title}
                    </Link>
                  </h3>
                  <p className="text-xs font-serif text-[#8b949e] line-clamp-1 mt-1">
                    {essay.summary}
                  </p>
                </div>
                <Link
                  to="/posts/$slug"
                  params={{ slug: essay.slug }}
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#58a6ff] shrink-0"
                >
                  Read &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Categories Sections */}
      {!selectedTag && (
        <div className="space-y-10">
          {Array.from(categoriesMap.entries()).map(([category, items]) => (
            <section
              key={category}
              className="p-6 sm:p-7 rounded-2xl bg-[#11151e] border border-[#202738] space-y-6 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-[#1e2637] pb-4">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-[#d4af37]" />
                  <h2 className="font-serif text-xl sm:text-2xl text-[#f0f3f8]">
                    {category}
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#6e7681]">
                  {items.length} {items.length === 1 ? 'Essay' : 'Essays'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((essay) => (
                  <Link
                    key={essay.slug}
                    to="/posts/$slug"
                    params={{ slug: essay.slug }}
                    className="group block p-4 rounded-xl bg-[#151a24] hover:bg-[#1a212e] border border-[#222b3c] hover:border-[#d4af37]/30 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#6e7681]">
                        <span>{essay.date}</span>
                        <span>•</span>
                        <span>{essay.readingTime} min read</span>
                      </div>
                      <h3 className="font-serif text-base text-[#e6edf3] group-hover:text-[#d4af37] transition-colors leading-snug">
                        {essay.title}
                      </h3>
                      <p className="font-serif text-xs text-[#8a95a5] line-clamp-2 leading-relaxed">
                        {essay.summary}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                      <div className="flex flex-wrap gap-1">
                        {essay.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[#5e6b7e]">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[#d4af37] group-hover:translate-x-0.5 transition-transform">
                        Read &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
