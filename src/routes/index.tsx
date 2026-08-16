import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Feather,
  Github,
  HelpCircle,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BackupLogItem } from '../lib/types'
import { fetchBackupLogs, getEssaysList } from '../server/essays.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [essays, backupLogs] = await Promise.all([
      getEssaysList(),
      fetchBackupLogs().catch(() => [] as BackupLogItem[]),
    ])
    return { essays, backupLogs }
  },
  component: HomePage,
})

function HomePage() {
  const { essays, backupLogs } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = useMemo(() => {
    const set = new Set<string>()
    essays.forEach((e) => {
      if (e.category) set.add(e.category)
    })
    return ['All', ...Array.from(set)]
  }, [essays])

  const filteredEssays = useMemo(() => {
    return essays.filter((essay) => {
      const matchesCat =
        selectedCategory === 'All' || essay.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesCat

      const matchesSearch =
        essay.title.toLowerCase().includes(q) ||
        (essay.subtitle && essay.subtitle.toLowerCase().includes(q)) ||
        essay.summary.toLowerCase().includes(q) ||
        essay.tags.some((t) => t.toLowerCase().includes(q))

      return matchesCat && matchesSearch
    })
  }, [essays, selectedCategory, searchQuery])

  const featuredEssay = useMemo(() => {
    return essays.find((e) => e.featured) || essays[0]
  }, [essays])

  const regularEssays = useMemo(() => {
    return filteredEssays.filter((e) => e.slug !== featuredEssay?.slug)
  }, [filteredEssays, featuredEssay])

  const latestBackup = backupLogs?.[0]

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Editorial Masthead / Hero */}
      <section className="relative border-b border-[#202736] pb-12 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/20">
                <Feather className="w-3.5 h-3.5" />
                Personal Essay Archive
              </span>
              <span className="text-xs font-mono text-[#627083]">
                {essays.length} essays recorded
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#f0f3f8] leading-[1.15]">
              Reflections on Stillness, Craft &amp; Digital Permanence
            </h1>

            <p className="text-sm sm:text-base text-[#9aa5b8] font-serif leading-relaxed max-w-xl">
              An unhurried space for personal essays, marginalia, and philosophical inquiries—written in plain Markdown, backed up continuously to GitHub.
            </p>
          </div>

          {/* GitHub Status Summary Card */}
          <div className="bg-[#131720] border border-[#222938] rounded-xl p-4 w-full md:w-72 shadow-lg shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2331]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c9d1d9]">
                <Github className="w-4 h-4 text-[#3fb950]" />
                <span className="font-semibold">GitHub Backup</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#3fb950] bg-[#3fb950]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <div className="pt-3 space-y-2 text-xs text-[#8b949e]">
              <div className="flex justify-between items-center font-mono text-[11px]">
                <span>Archive Status:</span>
                <span className="text-[#e6edf3]">100% Plain Text</span>
              </div>
              {latestBackup ? (
                <div className="text-[11px] font-mono text-[#6e7681] truncate">
                  Latest: {latestBackup.commitMessage.slice(0, 28)}...
                </div>
              ) : (
                <div className="text-[11px] font-mono text-[#6e7681]">
                  Target: /essays/*.md
                </div>
              )}
              <Link
                to="/backup"
                className="mt-2 block w-full text-center py-1.5 px-3 rounded bg-[#1c2330] hover:bg-[#252f40] text-xs font-medium text-[#58a6ff] border border-[#2a364a] transition-colors"
              >
                Manage Backups &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Essay Spotlight (when not searching or when All is selected) */}
      {!searchQuery && selectedCategory === 'All' && featuredEssay && (
        <section className="space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Featured Reflection
          </div>
          <Link
            to="/posts/$slug"
            params={{ slug: featuredEssay.slug }}
            className="group block bg-gradient-to-b from-[#151a24] to-[#10141d] border border-[#263044] hover:border-[#d4af37]/40 rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-xl hover:shadow-[#d4af37]/5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8b949e]">
                <span className="text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-0.5 rounded-full border border-[#d4af37]/20 font-sans font-medium">
                  {featuredEssay.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5e6b7e]" />
                  {featuredEssay.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5e6b7e]" />
                  {featuredEssay.readingTime} min read
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#f0f3f8] group-hover:text-[#d4af37] transition-colors leading-tight">
                  {featuredEssay.title}
                </h2>
                {featuredEssay.subtitle && (
                  <p className="font-serif text-base sm:text-lg text-[#9aa5b8] italic mt-2">
                    {featuredEssay.subtitle}
                  </p>
                )}
              </div>

              <p className="text-sm sm:text-base text-[#8a95a5] font-serif leading-relaxed line-clamp-3">
                {featuredEssay.summary}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {featuredEssay.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono text-[#6e7681] bg-[#0c0e12] px-2 py-0.5 rounded border border-[#1f2735]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-[#d4af37] group-hover:translate-x-1 transition-transform">
                  Read Essay <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Filter & Search Toolbar */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-[#1e2533] text-[#f0f3f8] border border-[#354157] shadow-xs'
                    : 'bg-[#10141c] text-[#8b949e] hover:text-[#f0f3f8] border border-[#1b222f] hover:border-[#283345]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#5e6b7e]" />
            <input
              type="text"
              placeholder="Search essays, tags, concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#11151e] border border-[#202736] focus:border-[#d4af37]/60 focus:outline-hidden text-xs rounded-lg pl-9 pr-3 py-2 text-[#e6edf3] placeholder-[#5e6b7e] transition-colors"
            />
          </div>
        </div>

        {/* Essays Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#5e6b7e] border-b border-[#1b222e] pb-2">
            <span>
              {filteredEssays.length}{' '}
              {filteredEssays.length === 1 ? 'Essay' : 'Essays'} Available
            </span>
            <span>Sorted by Date</span>
          </div>

          {filteredEssays.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#202736] rounded-2xl bg-[#0e1117] space-y-3">
              <BookOpen className="w-8 h-8 text-[#5e6b7e] mx-auto opacity-50" />
              <p className="text-sm font-serif text-[#9aa5b8]">
                No essays match your filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="text-xs font-mono text-[#d4af37] underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1b222e]">
              {(searchQuery || selectedCategory !== 'All'
                ? filteredEssays
                : regularEssays
              ).map((essay) => (
                <article
                  key={essay.slug}
                  className="group py-6 first:pt-2 transition-all hover:bg-[#11151e]/40 rounded-xl px-3 sm:px-4 -mx-3 sm:-mx-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2.5 text-xs font-mono text-[#6e7681]">
                        <span className="text-[#d4af37]">{essay.category}</span>
                        <span>•</span>
                        <span>{essay.date}</span>
                        <span>•</span>
                        <span>{essay.readingTime} min</span>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#e6edf3] group-hover:text-[#d4af37] transition-colors">
                        <Link
                          to="/posts/$slug"
                          params={{ slug: essay.slug }}
                          className="hover:underline underline-offset-4 decoration-[#d4af37]/40"
                        >
                          {essay.title}
                        </Link>
                      </h3>

                      {essay.subtitle && (
                        <p className="font-serif text-sm text-[#8b949e] italic">
                          {essay.subtitle}
                        </p>
                      )}

                      <p className="text-xs sm:text-sm text-[#7d8799] font-serif leading-relaxed line-clamp-2">
                        {essay.summary}
                      </p>

                      {essay.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {essay.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono text-[#586577] bg-[#0c0e12] px-2 py-0.5 rounded border border-[#1c2331]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <Link
                        to="/posts/$slug"
                        params={{ slug: essay.slug }}
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#8b949e] group-hover:text-[#f0f3f8] group-hover:translate-x-0.5 transition-all"
                      >
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reader Inquiries / Dialogues Teaser */}
      <section className="border border-[#202736] bg-[#11151e] rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#58a6ff]">
              <MessageSquare className="w-4 h-4" />
              <span>Reader Dialogues &amp; Questions</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#f0f3f8]">
              Ask Questions to the Author
            </h2>
            <p className="text-xs sm:text-sm font-serif text-[#8b949e] max-w-xl">
              Personal essays are invitations to continuous inquiry. Ask philosophical questions, challenge premises, or explore themes directly.
            </p>
          </div>

          <Link
            to="/questions"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a212e] hover:bg-[#222b3c] border border-[#2b374c] text-xs font-medium text-[#e6edf3] transition-all"
          >
            <HelpCircle className="w-4 h-4 text-[#d4af37]" />
            <span>Open Questions Hub</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
