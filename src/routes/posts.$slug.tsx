import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Github,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { marked } from 'marked'
import { useEffect, useMemo, useState } from 'react'
import { formatEssayToMarkdown } from '../lib/formatters'
import type { AuthorQuestionItem } from '../lib/types'
import {
  fetchQuestions,
  getSingleEssay,
  submitQuestion,
} from '../server/essays.functions'

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const essay = await getSingleEssay({ data: { slug: params.slug } })
    if (!essay) {
      throw new Error(`Essay "${params.slug}" not found`)
    }
    const questions = await fetchQuestions({ data: { slug: params.slug } }).catch(
      () => [] as AuthorQuestionItem[]
    )
    return { essay, initialQuestions: questions }
  },
  component: EssayPostComponent,
})

function EssayPostComponent() {
  const { essay, initialQuestions } = Route.useLoaderData()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')
  const [copied, setCopied] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Question Form State
  const [questionsList, setQuestionsList] = useState<AuthorQuestionItem[]>(initialQuestions)
  const [authorName, setAuthorName] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Word count & stats
  const stats = useMemo(() => {
    const words = (essay.content || '').trim().split(/\s+/).filter(Boolean).length
    const chars = (essay.content || '').length
    return { words, chars }
  }, [essay.content])

  const handleCopyMarkdown = () => {
    const md = formatEssayToMarkdown(essay)
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const md = formatEssayToMarkdown(essay)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${essay.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 2000)
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim()) return

    setSubmitting(true)
    setSubmitMessage(null)

    try {
      const newQuestion = await submitQuestion({
        data: {
          essaySlug: essay.slug,
          authorName: authorName.trim() || 'Anonymous Reader',
          question: questionText.trim(),
        },
      })
      setQuestionsList([newQuestion, ...questionsList])
      setQuestionText('')
      setSubmitMessage('Thank you for your question. It has been recorded in the dialogue archives!')
    } catch (err) {
      setSubmitMessage('Could not submit question. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const htmlContent = useMemo(() => {
    return marked(essay.content || '')
  }, [essay.content])

  const fontSizeClass =
    fontSize === 'large'
      ? 'text-[1.3rem] leading-[2rem]'
      : fontSize === 'xlarge'
      ? 'text-[1.45rem] leading-[2.2rem]'
      : 'text-[1.18rem] leading-[1.85rem]'

  const fontClass = fontFamily === 'sans' ? 'font-sans' : 'font-serif'

  return (
    <article className="max-w-3xl mx-auto space-y-12 animate-fade-in relative">
      {/* Top Fixed Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#151a24] z-50">
        <div
          className="h-full bg-gradient-to-r from-[#d4af37] via-[#58a6ff] to-[#3fb950] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Nav & Breadcrumbs */}
      <div className="flex items-center justify-between pt-2 border-b border-[#1c2331] pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] hover:text-[#d4af37] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Essays</span>
        </Link>

        {/* Reader Customizer Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center bg-[#131822] border border-[#232b3c] rounded-lg p-0.5">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-1 rounded text-[11px] ${
                fontFamily === 'serif'
                  ? 'bg-[#1f2736] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
              title="Serif font"
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-1 rounded text-[11px] ${
                fontFamily === 'sans'
                  ? 'bg-[#1f2736] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
              title="Sans font"
            >
              Sans
            </button>
          </div>

          <div className="flex items-center bg-[#131822] border border-[#232b3c] rounded-lg p-0.5">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded text-[11px] ${
                fontSize === 'normal'
                  ? 'bg-[#1f2736] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded text-[11px] ${
                fontSize === 'large'
                  ? 'bg-[#1f2736] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Essay Header */}
      <header className="space-y-6 pt-2">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8b949e]">
          <span className="text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-0.5 rounded-full border border-[#d4af37]/20 font-sans font-medium">
            {essay.category}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#5e6b7e]" />
            {essay.date}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#5e6b7e]" />
            {essay.readingTime} min read ({stats.words} words)
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#f0f3f8] leading-[1.18]">
            {essay.title}
          </h1>

          {essay.subtitle && (
            <p className="font-serif text-lg sm:text-xl text-[#9aa5b8] italic leading-relaxed">
              {essay.subtitle}
            </p>
          )}
        </div>

        {/* Excerpt / Lead Callout */}
        <div className="p-5 rounded-xl bg-[#111620] border-l-2 border-[#d4af37] border-y border-r border-[#1e2636] text-[#c9d3e0] font-serif text-base italic leading-relaxed">
          &ldquo;{essay.summary}&rdquo;
        </div>
      </header>

      {/* Action Bar (Export, Backup, Copy) */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-[#10141c] border border-[#1d2535] text-xs font-mono text-[#8b949e]">
        <div className="flex items-center gap-2">
          <span className="text-[#5e6b7e]">Source:</span>
          <span className="text-[#d4af37] font-semibold">{essay.slug}.md</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181f2c] hover:bg-[#222b3d] text-[#c9d1d9] border border-[#273449] transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#3fb950]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181f2c] hover:bg-[#222b3d] text-[#c9d1d9] border border-[#273449] transition-colors"
          >
            {downloadSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
            )}
            <span>Export .md</span>
          </button>

          <Link
            to="/backup"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181f2c] hover:bg-[#222b3d] text-[#3fb950] border border-[#273449] transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Sync to GitHub</span>
          </Link>
        </div>
      </div>

      {/* Essay Main Content */}
      <div
        className={`editorial-prose editorial-dropcap ${fontClass} ${fontSizeClass} max-w-none pt-4`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Tags & Metadata Footer */}
      <div className="pt-8 border-t border-[#1f2738] space-y-4">
        {essay.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#5e6b7e]">Themes:</span>
            {essay.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono text-[#8b949e] bg-[#121620] px-2.5 py-1 rounded-md border border-[#222b3a]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-[#0f131a] border border-[#1e2637] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37]">
            <Sparkles className="w-4 h-4" />
            <span>About this Reflection</span>
          </div>
          <p className="font-serif text-sm text-[#8a95a5] leading-relaxed">
            This piece is preserved under open plain-text terms. You are free to quote, excerpt, or save it into your personal digital archives.
          </p>
        </div>
      </div>

      {/* Interactive Inquiries / Questions Section */}
      <section className="pt-8 border-t border-[#1f2738] space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#58a6ff]">
            <MessageSquare className="w-4 h-4" />
            <span>Reader Inquiries</span>
          </div>
          <h3 className="font-serif text-2xl text-[#f0f3f8]">
            Questions on this Essay
          </h3>
          <p className="font-serif text-sm text-[#8a95a5]">
            Have a question, counter-argument, or thought regarding this essay? Submit it to the author&apos;s dialogue log.
          </p>
        </div>

        {/* Submit Question Form */}
        <form
          onSubmit={handleQuestionSubmit}
          className="p-5 rounded-2xl bg-[#11151e] border border-[#222a3b] space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">
                Your Name or Moniker
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Marcus / Reader"
                className="w-full bg-[#181e2b] border border-[#2a3449] focus:border-[#d4af37]/60 text-xs rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">
                Context
              </label>
              <input
                type="text"
                disabled
                value={`Regarding: ${essay.title}`}
                className="w-full bg-[#141822] border border-[#1f2738] text-xs rounded-lg px-3 py-2 text-[#5e6b7e] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">
              Your Question or Reflection *
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="What questions did this essay raise for you?"
              className="w-full bg-[#181e2b] border border-[#2a3449] focus:border-[#d4af37]/60 text-xs rounded-lg p-3 text-[#e6edf3] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            {submitMessage ? (
              <span className="text-xs font-mono text-[#3fb950] animate-fade-in">
                {submitMessage}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#5e6b7e]">
                Stored securely in Netlify Postgres Database
              </span>
            )}

            <button
              type="submit"
              disabled={submitting || !questionText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 text-xs font-medium transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Send Question'}</span>
            </button>
          </div>
        </form>

        {/* Existing Questions & Author Answers */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-[#6e7681]">
            Recorded Dialogues ({questionsList.length})
          </div>

          {questionsList.length === 0 ? (
            <div className="py-8 text-center text-xs font-serif text-[#6e7681] border border-dashed border-[#1c2331] rounded-xl">
              No questions recorded yet for this essay. Be the first to inquire.
            </div>
          ) : (
            <div className="space-y-4">
              {questionsList.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-xl bg-[#121620] border border-[#202738] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#6e7681]">
                    <span className="text-[#e6edf3] font-semibold">{q.authorName}</span>
                    <span>{q.createdAt ? q.createdAt.slice(0, 10) : 'Recent'}</span>
                  </div>

                  <p className="font-serif text-sm text-[#c9d3e0] italic">
                    &ldquo;{q.question}&rdquo;
                  </p>

                  {q.answer && (
                    <div className="mt-3 pl-4 border-l-2 border-[#d4af37] pt-1 space-y-1 bg-[#161c28]/40 p-3 rounded-r-lg">
                      <div className="text-[11px] font-mono text-[#d4af37] flex items-center gap-1">
                        <span>Author&apos;s Answer</span>
                      </div>
                      <p className="font-serif text-sm text-[#a2afc0] leading-relaxed">
                        {q.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </article>
  )
}
