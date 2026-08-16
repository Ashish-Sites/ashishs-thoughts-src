import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CheckCircle2,
  Filter,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AuthorQuestionItem } from '../lib/types'
import {
  fetchQuestions,
  getEssaysList,
  submitQuestion,
} from '../server/essays.functions'

export const Route = createFileRoute('/questions')({
  loader: async () => {
    const [questions, essays] = await Promise.all([
      fetchQuestions({ data: {} }).catch(() => [] as AuthorQuestionItem[]),
      getEssaysList(),
    ])
    return { initialQuestions: questions, essays }
  },
  component: QuestionsPageComponent,
})

function QuestionsPageComponent() {
  const { initialQuestions, essays } = Route.useLoaderData()
  const [questionsList, setQuestionsList] = useState<AuthorQuestionItem[]>(initialQuestions)
  const [selectedSlug, setSelectedSlug] = useState<string>('all')

  // Form State
  const [authorName, setAuthorName] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [formSlug, setFormSlug] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filteredQuestions = useMemo(() => {
    if (selectedSlug === 'all') return questionsList
    return questionsList.filter((q) => q.essaySlug === selectedSlug)
  }, [questionsList, selectedSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim()) return

    setSubmitting(true)
    setSuccessMessage(null)

    try {
      const newQuestion = await submitQuestion({
        data: {
          essaySlug: formSlug ? formSlug : undefined,
          authorName: authorName.trim() || 'Anonymous Inquirer',
          question: questionText.trim(),
        },
      })

      setQuestionsList([newQuestion, ...questionsList])
      setQuestionText('')
      setAuthorName('')
      setSuccessMessage('Your question has been recorded into the inquiry archive!')
    } catch (err) {
      setSuccessMessage('Could not submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Reflective Prompts from the Author
  const reflectivePrompts = [
    {
      title: 'The Solitude Threshold',
      prompt: 'When was the last time you spent 120 consecutive minutes without consuming another human being’s digital opinion?',
      theme: 'Attention & Focus',
    },
    {
      title: 'The 50-Year Text',
      prompt: 'If every centralized platform and social feed dissolved tomorrow, where would your personal record of thoughts reside?',
      theme: 'Digital Permanence',
    },
    {
      title: 'The Vulnerability of Rough Drafts',
      prompt: 'What conviction do you secretly hold that you have not yet found the courage to state plainly?',
      theme: 'Philosophy of Writing',
    },
  ]

  return (
    <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <section className="space-y-4 border-b border-[#202736] pb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-2.5 py-1 rounded-full border border-[#58a6ff]/20">
            <MessageSquare className="w-3.5 h-3.5" />
            Reader Dialogues &amp; Questions
          </span>
          <span className="text-xs font-mono text-[#627083]">
            {questionsList.length} inquiries logged
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-[#f0f3f8]">
          Inquiries, Dialogues &amp; Philosophical Q&amp;A
        </h1>

        <p className="font-serif text-sm sm:text-base text-[#9aa5b8] max-w-2xl leading-relaxed">
          Essays are not monologues—they are catalysts for inquiry. Ask questions about specific essays, propose counter-arguments, or explore questions on technology, stillness, and craft.
        </p>
      </section>

      {/* Author Reflective Prompts Box */}
      <section className="border border-[#232d3f] bg-gradient-to-b from-[#131924] to-[#0f141c] rounded-2xl p-6 sm:p-7 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37]">
          <Lightbulb className="w-4 h-4" />
          <span>Author Prompts for the Reader</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {reflectivePrompts.map((p, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#171e2c]/60 border border-[#26334a] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider">
                  {p.theme}
                </span>
                <h4 className="font-serif text-base text-[#e6edf3] font-medium leading-snug">
                  {p.title}
                </h4>
                <p className="font-serif text-xs text-[#9aa5b8] leading-relaxed italic">
                  &ldquo;{p.prompt}&rdquo;
                </p>
              </div>

              <button
                onClick={() => {
                  setQuestionText(`Regarding "${p.title}": `)
                  window.scrollTo({ top: 600, behavior: 'smooth' })
                }}
                className="text-left text-[11px] font-mono text-[#58a6ff] hover:underline"
              >
                Respond to prompt &rarr;
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Submit Question Section */}
      <section className="bg-[#121620] border border-[#232b3c] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-mono text-[#e6edf3]">
            <HelpCircle className="w-4 h-4 text-[#d4af37]" />
            <span className="font-semibold">Submit an Inquiry</span>
          </div>
          <span className="text-[11px] font-mono text-[#6e7681]">
            Public Dialogue Log
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Your Name / Moniker
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Marcus / Reader from Berlin"
                className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#d4af37]/60 text-xs rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Related Essay (optional)
              </label>
              <select
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#d4af37]/60 text-xs rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
              >
                <option value="">General Inquiry (Entire Archive)</option>
                {essays.map((essay) => (
                  <option key={essay.slug} value={essay.slug}>
                    {essay.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#8b949e]">
              Your Question or Critical Reflection *
            </label>
            <textarea
              rows={4}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Formulate your inquiry or reflection here..."
              className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#d4af37]/60 text-xs rounded-lg p-3 text-[#e6edf3] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {successMessage ? (
              <span className="text-xs font-mono text-[#3fb950] flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {successMessage}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#5e6b7e]">
                Stored persistently in Netlify Postgres Database
              </span>
            )}

            <button
              type="submit"
              disabled={submitting || !questionText.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 text-xs font-medium font-mono flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Post Question'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Questions Filter & Dialogues Stream */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1f2738] pb-4">
          <div className="flex items-center gap-2 text-sm font-mono text-[#e6edf3]">
            <MessageCircle className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-semibold">
              Dialogue Archive ({filteredQuestions.length})
            </span>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
            <Filter className="w-3.5 h-3.5 text-[#5e6b7e]" />
            <span>Filter:</span>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-[#141923] border border-[#252f42] text-xs text-[#e6edf3] rounded-lg px-2.5 py-1 focus:outline-hidden"
            >
              <option value="all">All Questions</option>
              {essays.map((essay) => (
                <option key={essay.slug} value={essay.slug}>
                  {essay.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs font-serif text-[#6e7681] border border-dashed border-[#1f2738] rounded-xl">
            No questions recorded for this selection yet. Submit your question above.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const matchedEssay = essays.find((e) => e.slug === q.essaySlug)

              return (
                <article
                  key={q.id}
                  className="p-6 rounded-2xl bg-[#11151e] border border-[#202738] space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#6e7681]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#e6edf3] font-semibold">{q.authorName}</span>
                      {matchedEssay && (
                        <Link
                          to="/posts/$slug"
                          params={{ slug: matchedEssay.slug }}
                          className="text-[11px] text-[#58a6ff] hover:underline"
                        >
                          on &ldquo;{matchedEssay.title}&rdquo;
                        </Link>
                      )}
                    </div>
                    <span>{q.createdAt ? q.createdAt.slice(0, 10) : 'Recent'}</span>
                  </div>

                  <p className="font-serif text-base text-[#d1d9e2] italic leading-relaxed">
                    &ldquo;{q.question}&rdquo;
                  </p>

                  {q.answer ? (
                    <div className="mt-4 pl-4 border-l-2 border-[#d4af37] pt-2 space-y-1.5 bg-[#161c28]/40 p-4 rounded-r-xl">
                      <div className="text-[11px] font-mono text-[#d4af37] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Author&apos;s Response</span>
                      </div>
                      <p className="font-serif text-sm text-[#a2afc0] leading-relaxed">
                        {q.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-[#6e7681] italic">
                      Awaiting response from author
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
