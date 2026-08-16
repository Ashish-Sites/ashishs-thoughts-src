import { createFileRoute } from '@tanstack/react-router'
import JSZip from 'jszip'
import {
  AlertCircle,
  Archive,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  FolderGit2,
  GitBranch,
  GitCommit,
  Github,
  HelpCircle,
  Key,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { formatArchiveReadme, formatEssayToMarkdown } from '../lib/formatters'
import type { BackupLogItem } from '../lib/types'
import { fetchBackupLogs, getEssaysList } from '../server/essays.functions'
import { testGitHubAccess, triggerGitHubBackup } from '../server/github.functions'

export const Route = createFileRoute('/backup')({
  loader: async () => {
    const [essays, backupLogs] = await Promise.all([
      getEssaysList(),
      fetchBackupLogs().catch(() => [] as BackupLogItem[]),
    ])
    return { essays, initialLogs: backupLogs }
  },
  component: BackupPageComponent,
})

function BackupPageComponent() {
  const { essays, initialLogs } = Route.useLoaderData()
  const [logs, setLogs] = useState<BackupLogItem[]>(initialLogs)

  // Form State
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [customMessage, setCustomMessage] = useState('')

  // Connection & Push State
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{
    valid: boolean
    message: string
    repoFullName?: string
  } | null>(null)

  const [pushing, setPushing] = useState(false)
  const [pushSuccess, setPushSuccess] = useState<{
    message: string
    commitSha?: string
    commitUrl?: string
    backedUpCount: number
    targetRepo: string
    branch: string
    timestamp: string
  } | null>(null)
  const [pushError, setPushError] = useState<string | null>(null)

  // Download ZIP state
  const [zipping, setZipping] = useState(false)
  const [zipSuccess, setZipSuccess] = useState(false)

  // Copy JSON State
  const [copiedJson, setCopiedJson] = useState(false)

  // Test Connection
  const handleTestConnection = async () => {
    if (!token.trim() || !repo.trim()) {
      setTestResult({
        valid: false,
        message: 'Please provide both a GitHub Token and Repository name (owner/repo).',
      })
      return
    }

    setTestingConnection(true)
    setTestResult(null)

    try {
      const res = await testGitHubAccess({
        data: {
          token: token.trim(),
          repo: repo.trim(),
        },
      })
      setTestResult(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setTestResult({
        valid: false,
        message: `Error testing connection: ${msg}`,
      })
    } finally {
      setTestingConnection(false)
    }
  }

  // Direct GitHub Push
  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim() || !repo.trim()) {
      setPushError('GitHub Token and Repository name are required.')
      return
    }

    setPushing(true)
    setPushError(null)
    setPushSuccess(null)

    try {
      const result = await triggerGitHubBackup({
        data: {
          token: token.trim(),
          repo: repo.trim(),
          branch: branch.trim() || 'main',
          commitMessage:
            customMessage.trim() ||
            `Sync ${essays.length} essays archive [${new Date().toISOString().slice(0, 16)}]`,
        },
      })

      setPushSuccess(result)

      // Add to local logs
      setLogs([
        {
          targetRepo: result.targetRepo,
          branch: result.branch,
          commitSha: result.commitSha,
          commitMessage: customMessage.trim() || `Backup ${essays.length} essays archive`,
          filesCount: result.backedUpCount,
          status: 'success',
          createdAt: result.timestamp,
        },
        ...logs,
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPushError(msg)
    } finally {
      setPushing(false)
    }
  }

  // Download Complete ZIP Archive
  const handleDownloadZip = async () => {
    setZipping(true)
    try {
      const zip = new JSZip()
      const essaysFolder = zip.folder('essays')

      // Add each essay
      for (const essay of essays) {
        const mdContent = formatEssayToMarkdown(essay)
        essaysFolder?.file(`${essay.slug}.md`, mdContent)
      }

      // Add README.md
      const readme = formatArchiveReadme(essays, repo || 'personal-essay-archive')
      zip.file('README.md', readme)

      // Add metadata.json
      const metadata = {
        exportedAt: new Date().toISOString(),
        siteTitle: 'Obsidian & Ink Personal Essay Blog',
        totalEssays: essays.length,
        essays: essays.map((e) => ({
          slug: e.slug,
          title: e.title,
          subtitle: e.subtitle,
          category: e.category,
          date: e.date,
          tags: e.tags,
          readingTime: e.readingTime,
        })),
      }
      zip.file('metadata.json', JSON.stringify(metadata, null, 2))

      // Add .gitattributes for plain text line endings
      zip.file('.gitattributes', '* text=auto eol=lf\n*.md text\n')

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      const dateTag = new Date().toISOString().split('T')[0]
      a.download = `essay-archive-backup-${dateTag}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setZipSuccess(true)
      setTimeout(() => setZipSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to create zip archive:', err)
    } finally {
      setZipping(false)
    }
  }

  const handleCopyJsonBackup = () => {
    const data = {
      archiveTitle: 'Obsidian & Ink Essay Blog',
      backupDate: new Date().toISOString(),
      essaysCount: essays.length,
      essays,
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <section className="space-y-4 border-b border-[#202736] pb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#3fb950] bg-[#3fb950]/10 px-2.5 py-1 rounded-full border border-[#3fb950]/20">
            <Github className="w-3.5 h-3.5" />
            GitHub Backup &amp; Preservation Hub
          </span>
          <span className="text-xs font-mono text-[#627083]">
            {essays.length} essays ready for sync
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-[#f0f3f8]">
          Sovereign Git Archive &amp; Remote Backup
        </h1>

        <p className="font-serif text-sm sm:text-base text-[#9aa5b8] max-w-2xl leading-relaxed">
          Never rely solely on a single database. Direct-push all your markdown essays, tags, and frontmatter to any GitHub repository or download complete offline ZIP archives in seconds.
        </p>
      </section>

      {/* Main Grid: Direct Push Form & Offline Backup Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Direct GitHub Sync (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121620] border border-[#232b3c] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-[#e6edf3]">
                <FolderGit2 className="w-4 h-4 text-[#3fb950]" />
                <span className="font-semibold">Direct GitHub Sync</span>
              </div>
              <span className="text-[11px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded border border-[#58a6ff]/20">
                Git Trees API
              </span>
            </div>

            <form onSubmit={handlePushToGitHub} className="space-y-4">
              {/* Token Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#8b949e] flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Personal Access Token (PAT) *</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Essay+Blog+Backup"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-[#58a6ff] hover:underline flex items-center gap-1"
                  >
                    Generate Token <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                  className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#3fb950] text-xs font-mono rounded-lg px-3 py-2.5 text-[#e6edf3] focus:outline-hidden"
                />
                <p className="text-[11px] font-mono text-[#586577]">
                  Requires &apos;repo&apos; scope permissions. Token is only used for the API request and never logged.
                </p>
              </div>

              {/* Repository & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-mono text-[#8b949e]">
                    Repository (owner/repo) *
                  </label>
                  <input
                    type="text"
                    required
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="e.g. yourname/essay-archive"
                    className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#3fb950] text-xs font-mono rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#8b949e] flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-[#5e6b7e]" />
                    <span>Branch</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#3fb950] text-xs font-mono rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Custom Commit Message */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#8b949e]">
                  Commit Message (optional)
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Backup ${essays.length} essays archive`}
                  className="w-full bg-[#181f2c] border border-[#293548] focus:border-[#3fb950] text-xs font-mono rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-hidden"
                />
              </div>

              {/* Test Connection Button & Status */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !token.trim() || !repo.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#192230] hover:bg-[#222e42] text-xs font-mono text-[#9aa5b8] hover:text-[#e6edf3] border border-[#2b3950] transition-colors disabled:opacity-40"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>

                {testResult && (
                  <span
                    className={`text-xs font-mono flex items-center gap-1 ${
                      testResult.valid ? 'text-[#3fb950]' : 'text-[#f85149]'
                    }`}
                  >
                    {testResult.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{testResult.message}</span>
                  </span>
                )}
              </div>

              {/* Push Success or Error Message */}
              {pushSuccess && (
                <div className="p-4 rounded-xl bg-[#13221b] border border-[#238636] text-xs font-mono space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[#3fb950] font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Backup Committed Successfully!</span>
                  </div>
                  <p className="text-[#9aa5b8]">{pushSuccess.message}</p>
                  {pushSuccess.commitSha && (
                    <div className="pt-1 flex items-center gap-2 text-[#e6edf3]">
                      <span>Commit SHA:</span>
                      <a
                        href={pushSuccess.commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                      >
                        {pushSuccess.commitSha.slice(0, 7)}{' '}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {pushError && (
                <div className="p-4 rounded-xl bg-[#2a1317] border border-[#f85149]/50 text-xs font-mono text-[#f85149] space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Backup Failed</span>
                  </div>
                  <p>{pushError}</p>
                </div>
              )}

              {/* Submit Push Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pushing || !token.trim() || !repo.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs font-mono flex items-center justify-center gap-2 shadow-lg hover:shadow-[#238636]/20 transition-all disabled:opacity-40"
                >
                  <Github className="w-4 h-4" />
                  <span>
                    {pushing
                      ? 'Creating Tree & Committing...'
                      : `Push ${essays.length} Essays to GitHub`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Offline Archives & Token Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Offline Export Cards */}
          <div className="bg-[#121620] border border-[#232b3c] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-mono text-[#e6edf3]">
              <Archive className="w-4 h-4 text-[#d4af37]" />
              <span className="font-semibold">Offline Export Bundles</span>
            </div>
            <p className="text-xs font-serif text-[#8b949e] leading-relaxed">
              Prefer manual Git commits? Export the complete essay archive as a ready-to-commit ZIP package.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleDownloadZip}
                disabled={zipping}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#181f2c] hover:bg-[#20293a] border border-[#28354a] hover:border-[#d4af37]/40 text-xs font-mono text-[#e6edf3] transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold">Download ZIP Archive</div>
                    <div className="text-[11px] text-[#6e7681]">
                      Includes {essays.length} .md files + README + JSON
                    </div>
                  </div>
                </div>
                {zipSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
                ) : (
                  <span className="text-[10px] text-[#8b949e] uppercase">
                    .zip
                  </span>
                )}
              </button>

              <button
                onClick={handleCopyJsonBackup}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#151a24] hover:bg-[#1b2230] border border-[#222b3c] text-xs font-mono text-[#9aa5b8] hover:text-[#e6edf3] transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-[#58a6ff]" />
                  <span>Copy Complete JSON Payload</span>
                </div>
                {copiedJson ? (
                  <span className="text-xs text-[#3fb950]">Copied</span>
                ) : (
                  <span className="text-[10px] text-[#5e6b7e]">.json</span>
                )}
              </button>
            </div>
          </div>

          {/* Token Security & Structure Specs */}
          <div className="bg-[#10141c] border border-[#1e2636] rounded-2xl p-6 space-y-3 text-xs font-mono text-[#8b949e]">
            <div className="flex items-center gap-2 text-[#d4af37]">
              <Shield className="w-4 h-4" />
              <span className="font-semibold">Repo Architecture</span>
            </div>
            <div className="bg-[#090c10] p-3 rounded-lg border border-[#1b2230] text-[11px] space-y-1 text-[#c9d1d9]">
              <div>/ (repository root)</div>
              <div>├── README.md &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Catalog &amp; Metadata</div>
              <div>├── metadata.json &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Full manifest</div>
              <div>└── essays/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Plain text markdown</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;├── on-stillness.md</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;└── ...</div>
            </div>
            <p className="text-[11px] text-[#5e6b7e] leading-relaxed">
              This structure is 100% compatible with Obsidian, Astro, Hugo, Next.js, and static markdown parsers.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Audit Log & History (Netlify Database) */}
      <section className="bg-[#11151e] border border-[#202736] rounded-2xl p-6 sm:p-7 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-mono text-[#e6edf3]">
            <GitCommit className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-semibold">Backup History &amp; Audit Log</span>
          </div>
          <span className="text-xs font-mono text-[#5e6b7e]">
            Recorded in Netlify Database
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[#5e6b7e] border border-dashed border-[#1c2331] rounded-xl">
            No backup history recorded yet. Perform your first GitHub push above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f2738] text-[#6e7681]">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Repository</th>
                  <th className="pb-2 font-medium">Branch</th>
                  <th className="pb-2 font-medium">Commit Message</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">SHA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#19202c]">
                {logs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-[#151a24]/50">
                    <td className="py-2.5 text-[#8b949e]">
                      {log.createdAt ? log.createdAt.slice(0, 16).replace('T', ' ') : 'Just now'}
                    </td>
                    <td className="py-2.5 text-[#e6edf3]">{log.targetRepo}</td>
                    <td className="py-2.5 text-[#58a6ff]">{log.branch}</td>
                    <td className="py-2.5 text-[#9aa5b8] max-w-xs truncate">
                      {log.commitMessage}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.status === 'success'
                            ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                            : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#d4af37]">
                      {log.commitSha ? log.commitSha.slice(0, 7) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Frequently Asked Questions on GitHub Backup */}
      <section className="border border-[#202736] bg-[#0e1218] rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37]">
          <HelpCircle className="w-4 h-4" />
          <span>Backup Principles &amp; FAQ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#121620] border border-[#1f2738] space-y-1.5">
            <h4 className="font-semibold text-[#e6edf3]">
              Why backup to GitHub instead of relying on cloud databases?
            </h4>
            <p className="text-[#8b949e] font-serif leading-relaxed">
              Cloud databases can be deleted, corrupted, or locked behind platform changes. A Git repository gives you a cryptographically verifiable, versioned history that you can clone to any laptop or server in the world.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121620] border border-[#1f2738] space-y-1.5">
            <h4 className="font-semibold text-[#e6edf3]">
              How does the GitHub API push work under the hood?
            </h4>
            <p className="text-[#8b949e] font-serif leading-relaxed">
              The server uses the GitHub Git Data API (Blobs &rarr; Trees &rarr; Commits &rarr; References). It calculates SHA hashes for all markdown files and creates an atomic commit without needing a local Git client installed.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
