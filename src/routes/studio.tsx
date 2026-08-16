import { createFileRoute } from '@tanstack/react-router'
import {
  CheckCircle2,
  Download,
  Edit3,
  Save,
} from 'lucide-react'
import { marked } from 'marked'
import { useMemo, useState } from 'react'
import { formatEssayToMarkdown } from '../lib/formatters'
import type { EssayItem } from '../lib/types'
import { saveEssay } from '../server/essays.functions'

export const Route = createFileRoute('/studio')({
  loader: async () => {
    return {}
  },
  component: StudioPageComponent,
})

function StudioPageComponent() {

  // Composer State
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Philosophy')
  const [tagsInput, setTagsInput] = useState('')
  const [content, setContent] = useState(`## The Initial Impulse

Begin your reflection here. What is the fundamental tension you are exploring?

> "Write to discover what you did not know you believed."

### Key Observations

* The observation in daily life
* The contradiction
* The tentative conclusion
`)
  const [summary, setSummary] = useState('')
  const [featured, setFeatured] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split')

  // Status
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Auto-generate slug from title if slug isn't customized yet
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generated)
    }
  }

  // Word count & reading time
  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    const chars = content.length
    const readingTime = Math.max(1, Math.round(words / 200))
    return { words, chars, readingTime }
  }, [content])

  const htmlPreview = useMemo(() => {
    return marked(content || '')
  }, [content])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !slug.trim()) {
      setErrorMessage('Title, Slug, and Content are required.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSavedSuccess(null)

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const autoSummary =
      summary.trim() ||
      content
        .replace(/[#*`_>]/g, '')
        .trim()
        .slice(0, 160) + '...'

    try {
      await saveEssay({
        data: {
          slug: slug.trim(),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          summary: autoSummary,
          content: content.trim(),
          category: category.trim(),
          tags: tagsArray,
          readingTime: stats.readingTime,
          featured,
          status: 'published',
        },
      })

      setSavedSuccess(`Essay "${title}" saved successfully to Netlify Database!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Failed to save: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const essayItem: EssayItem = {
      slug: slug || 'untitled-essay',
      title: title || 'Untitled Reflection',
      subtitle,
      summary: summary || content.slice(0, 120),
      content,
      category,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      readingTime: stats.readingTime,
      featured,
      date: new Date().toISOString().split('T')[0],
      source: 'database',
    }

    const md = formatEssayToMarkdown(essayItem)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${essayItem.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadEssayTemplate = (type: 'memoir' | 'critique' | 'fragment') => {
    if (type === 'memoir') {
      setTitle('Notes from an Empty Platform')
      setSubtitle('Memories of transit and unrecorded hours')
      setCategory('Memoir')
      setTagsInput('Transit, Memory, Night')
      setContent(`There is a quiet rhythm to suburban train platforms at 1:00 AM...

> "We are shaped by the places where nothing was required of us."

### The Texture of Waiting

When the destination is removed, observation becomes pure. You notice the hum of fluorescent ballasts and the chill of night air against your palms.
`)
    } else if (type === 'critique') {
      setTitle('The Pathology of the Notification')
      setSubtitle('How perpetual availability fractures the interior monologue')
      setCategory('Technology')
      setTagsInput('Attention, Technology, Focus')
      setContent(`Every vibration in your pocket is an unsolicited bid for your consciousness...

### The Cost of Continuous Partial Attention

When we allow external servers to punctuate our thinking every three minutes, long-form contemplation becomes biologically impossible.
`)
    } else {
      setTitle('Fragments on Solitude')
      setSubtitle('Inquiries and unpolished hypotheses')
      setCategory('Philosophy')
      setTagsInput('Solitude, Notes, Inquiry')
      setContent(`* Fragment 1: Solitude is not loneliness; it is the space where one meets oneself without mediation.
* Fragment 2: Silence is an active presence, not a vacuum.
* Fragment 3: Writing with ink forces a commitment to cadence.
`)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202736] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37]">
            <Edit3 className="w-4 h-4" />
            <span>Essay Composer &amp; Studio</span>
          </div>
          <h1 className="font-serif text-3xl text-[#f0f3f8]">
            Craft a New Personal Essay
          </h1>
        </div>

        {/* Templates Quick Pick */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[#5e6b7e]">Templates:</span>
          <button
            onClick={() => loadEssayTemplate('memoir')}
            className="px-2.5 py-1 rounded bg-[#151a24] hover:bg-[#1f2736] text-[#8b949e] hover:text-[#e6edf3] border border-[#222b3b]"
          >
            Memoir
          </button>
          <button
            onClick={() => loadEssayTemplate('critique')}
            className="px-2.5 py-1 rounded bg-[#151a24] hover:bg-[#1f2736] text-[#8b949e] hover:text-[#e6edf3] border border-[#222b3b]"
          >
            Tech Critique
          </button>
          <button
            onClick={() => loadEssayTemplate('fragment')}
            className="px-2.5 py-1 rounded bg-[#151a24] hover:bg-[#1f2736] text-[#8b949e] hover:text-[#e6edf3] border border-[#222b3b]"
          >
            Fragments
          </button>
        </div>
      </section>

      {/* Editor Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Metadata Controls */}
        <div className="p-6 rounded-2xl bg-[#11151e] border border-[#202738] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Essay Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. On the Fragility of Digital Memory"
                className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-sm font-serif rounded-lg px-3 py-2 text-[#f0f3f8] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Why plain text outlasts proprietary platforms"
                className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-sm font-serif rounded-lg px-3 py-2 text-[#f0f3f8] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="on-the-fragility-of-digital-memory"
                className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-xs font-mono rounded-lg px-3 py-2 text-[#d4af37] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-xs rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
              >
                <option value="Philosophy">Philosophy</option>
                <option value="Craft & Systems">Craft &amp; Systems</option>
                <option value="Urban Notes">Urban Notes</option>
                <option value="Writing">Writing</option>
                <option value="Tactile Life">Tactile Life</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8b949e]">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Solitude, Git, Focus"
                className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-xs font-mono rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#8b949e]">
              Summary / Excerpt (used for catalog cards and RSS)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A concise 1-2 sentence lead thought..."
              className="w-full bg-[#171d2a] border border-[#283449] focus:border-[#d4af37]/60 text-xs font-serif rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="featuredCheck"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-[#283449] text-[#d4af37] focus:ring-0"
            />
            <label
              htmlFor="featuredCheck"
              className="text-xs font-mono text-[#9aa5b8] cursor-pointer"
            >
              Mark as Featured Essay (highlighted on homepage)
            </label>
          </div>
        </div>

        {/* View Mode Bar & Statistics */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#8b949e] px-1">
          <div className="flex items-center gap-1 bg-[#121620] border border-[#232b3c] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded text-xs ${
                activeTab === 'editor'
                  ? 'bg-[#1e2534] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden md:block px-3 py-1 rounded text-xs ${
                activeTab === 'split'
                  ? 'bg-[#1e2534] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded text-xs ${
                activeTab === 'preview'
                  ? 'bg-[#1e2534] text-[#f0f3f8]'
                  : 'text-[#6e7888] hover:text-[#e6edf3]'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.readingTime} min read</span>
            <span>•</span>
            <span>{stats.chars} characters</span>
          </div>
        </div>

        {/* Markdown Content / Preview Area */}
        <div
          className={`grid gap-4 ${
            activeTab === 'split'
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {/* Editor Pane */}
          {(activeTab === 'editor' || activeTab === 'split') && (
            <div className="space-y-1">
              <textarea
                rows={18}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Draft your essay in Markdown..."
                className="w-full bg-[#11151e] border border-[#202738] focus:border-[#d4af37]/60 rounded-2xl p-4 text-sm font-mono text-[#f0f3f8] leading-relaxed focus:outline-hidden resize-y min-h-[420px]"
              />
            </div>
          )}

          {/* Live Preview Pane */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div className="p-6 rounded-2xl bg-[#0f131a] border border-[#1e2637] min-h-[420px] overflow-y-auto space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] border-b border-[#1c2331] pb-2">
                Live Editorial Preview
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#f0f3f8]">
                  {title || 'Untitled Reflection'}
                </h2>
                {subtitle && (
                  <p className="font-serif text-sm text-[#9aa5b8] italic mt-1">
                    {subtitle}
                  </p>
                )}
              </div>

              <div
                className="editorial-prose editorial-dropcap text-[1.1rem] leading-relaxed max-w-none pt-2"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            </div>
          )}
        </div>

        {/* Feedback & Action Buttons */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-[#202738] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {savedSuccess && (
              <span className="text-xs font-mono text-[#3fb950] flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {savedSuccess}
              </span>
            )}
            {errorMessage && (
              <span className="text-xs font-mono text-[#f85149] animate-fade-in">
                {errorMessage}
              </span>
            )}
            {!savedSuccess && !errorMessage && (
              <span className="text-xs font-mono text-[#5e6b7e]">
                Changes persist to Netlify Database and can be pushed to GitHub anytime.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-[#181f2c] hover:bg-[#20293a] text-xs font-mono text-[#9aa5b8] hover:text-[#e6edf3] border border-[#273449] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Download .md</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 text-xs font-medium font-mono flex items-center gap-2 transition-all disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Save & Publish Essay'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
