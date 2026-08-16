# Obsidian & Ink — Personal Essay Blog & Git Backup Hub

**Obsidian & Ink** is a dark minimalist, typography-forward personal essay blog built with TanStack Start, Content Collections, and Netlify Database. It features native GitHub backup integration, allowing writers to direct-push plain-text Markdown archives directly into any GitHub repository or download complete offline ZIP packages.

## Key Features

- **Dark Minimalist Editorial Design**: Bespoke Obsidian/Charcoal visual atmosphere pairing *Newsreader* serif typography for long-form prose with *Plus Jakarta Sans* for UI and metadata.
- **Sovereign GitHub Backup**: Direct remote backup engine using the GitHub REST / Git Trees API. Back up all essays as standalone `.md` files with YAML frontmatter + `README.md` + `metadata.json` into any GitHub repository with custom commit messages.
- **Offline Archival Bundles**: One-click export of the entire blog archive into a standardized ZIP bundle or single JSON manifest compatible with Obsidian, Astro, and Hugo.
- **Reader Dialogues & Philosophical Inquiries**: Interactive question submission system where readers can submit reflections on essays and view author responses, stored persistently in Netlify Database.
- **Essay Studio**: In-browser Markdown composer with live preview, word counter, reading time estimator, frontmatter manager, and instant publishing.
- **Hybrid Content Layer**: Seamlessly serves both static files (from `content/posts/*.md` via Content Collections) and dynamic essays authored in the database.
- **Focused Reading Experience**: Reading progress indicator bar, customizable typography controls (Serif/Sans, font sizing), drop-caps, and blockquotes with gold accent borders.

## Tech Stack

- **Framework**: TanStack Start (React 19 + TanStack Router v1)
- **Database**: Netlify Database (Managed PostgreSQL) with Drizzle ORM
- **Content Engine**: Content Collections + Marked
- **Backup & Archival**: GitHub REST / Git Data API + JSZip
- **Styling**: Tailwind CSS v4 with custom typography and CSS variables
- **Deployment**: Netlify

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` to view the blog.

## GitHub Backup Setup

To back up essays directly to GitHub from the UI:
1. Navigate to `/backup` in the application.
2. Generate a GitHub Personal Access Token (PAT) with `repo` scope permissions.
3. Enter your repository name (`owner/repo`) and target branch.
4. Click **Test Connection** and then **Push to GitHub**. All essays will be committed and versioned immediately.
