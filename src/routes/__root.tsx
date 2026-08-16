import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import Header from '../components/Header'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OBSIDIAN & INK — Personal Essay Archive & Git Backup',
      },
      {
        name: 'description',
        content:
          'A quiet, dark-minimalist haven for deep personal essays, philosophical contemplation, and sovereign Git-backed archives.',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col bg-[#0c0e12] text-[#f0f3f8] antialiased selection:bg-[#d4af37]/20 selection:text-[#fefefe]">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        <footer className="w-full border-t border-[#202736] bg-[#090b0e] py-12 text-xs text-[#8a95a5]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2 text-[#e6edf3]">
                <span className="font-serif font-medium text-sm">OBSIDIAN &amp; INK</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161b22] border border-[#262d3d] text-[#d4af37]">
                  v2.6 Git-Synced
                </span>
              </div>
              <p className="text-[#6d798a] font-serif italic text-xs leading-relaxed">
                &ldquo;Plain text is durable. When you store your reflections in version control, you own your words across decades.&rdquo;
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <Link
                to="/backup"
                className="flex items-center gap-1.5 text-[#3fb950] hover:text-[#56d364] transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Archive</span>
              </Link>
              <span className="text-[#30363d]">•</span>
              <Link
                to="/questions"
                className="text-[#9aa5b8] hover:text-[#f0f3f8] transition-colors"
              >
                Reader Dialogues
              </Link>
              <span className="text-[#30363d]">•</span>
              <Link
                to="/studio"
                className="text-[#9aa5b8] hover:text-[#f0f3f8] transition-colors"
              >
                Essay Studio
              </Link>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-[#181e28] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#556272] font-mono gap-2">
            <div>Built with TanStack Start &amp; Netlify Database</div>
            <div>Markdown Native • Zero Cloud Lock-In</div>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
