# AGENTS.md

This document provides architectural guidance and conventions for developers and AI agents working on this codebase.

## Project Overview

**Obsidian & Ink** is a dark minimalist personal essay blog built on TanStack Start (React 19) with GitHub backup integration and persistent storage via Netlify Database (Postgres).

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, TanStack Router v1) |
| Database | Netlify Database (PostgreSQL via `@netlify/database`) with Drizzle ORM |
| Markdown / Content | Content Collections + Marked |
| Backups | GitHub Git Data REST API (Blobs, Trees, Commits, Refs) + JSZip |
| Styling | Tailwind CSS 4 + custom Google Fonts (`Newsreader`, `Plus Jakarta Sans`) |
| Build Tool | Vite 7 |
| Deployment | Netlify |

## Directory Structure

```
├── content/posts/                # Static Markdown essays with YAML frontmatter
│   ├── on-stillness-in-the-hyperconnected-age.md
│   ├── the-craft-of-digital-permanence.md
│   ├── midnight-walks-and-unspoken-cities.md
│   ├── the-art-of-the-unfinished-thought.md
│   └── analog-artifacts-in-a-glass-world.md
├── db/                           # Database schema and client
│   ├── index.ts                  # Drizzle ORM client initialization
│   └── schema.ts                 # PostgreSQL tables (essays, backup_logs, author_questions)
├── netlify/
│   └── database/migrations/      # Drizzle generated SQL migrations
├── src/
│   ├── components/               # React components (Header, UI cards)
│   ├── lib/                      # Types and utilities
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── routes/                   # TanStack Router file-based routes
│   │   ├── __root.tsx            # Global layout, progress bar, header/footer
│   │   ├── index.tsx             # Home: Hero, featured essay, essay stream, search
│   │   ├── posts.$slug.tsx       # Detail: Longform reading view, reader controls, questions form
│   │   ├── backup.tsx            # Backup Hub: GitHub push, ZIP export, audit logs
│   │   ├── questions.tsx         # Q&A / Dialogues Hub: Prompts, submitted questions
│   │   ├── studio.tsx            # Essay Studio: Markdown composer, preview, save
│   │   ├── topics.tsx            # Taxonomy: Categories & tag index
│   │   └── category.$category.tsx# Category-specific post listings
│   ├── server/                   # Server functions & server-only helpers
│   │   ├── essays.functions.ts   # RPC server functions for essays, questions, logs
│   │   ├── essays.server.ts      # Server-only DB query & Content Collections merger
│   │   ├── github.functions.ts   # RPC server functions for GitHub sync & test
│   │   └── github.server.ts      # GitHub Git Data API integration logic
│   ├── router.tsx
│   └── styles.css                # Obsidian theme variables, typography, prose styles
├── content-collections.ts        # Content Collections schema configuration
├── drizzle.config.ts             # Drizzle Kit configuration pointing to netlify/database/migrations
├── package.json
└── README.md
```

## Key Architectural Decisions

1. **Hybrid Content Resolution (`src/server/essays.server.ts`)**:
   - `getAllCombinedEssays()` merges static Markdown files from `content/posts/` with dynamic essays stored in the Postgres `essays` table.
   - Dynamic essays take precedence by slug, allowing in-browser editing and creation while maintaining full fallback reliability.

2. **Atomic GitHub Push Engine (`src/server/github.server.ts`)**:
   - Pushes directly to GitHub using GitHub's Git Data API without requiring a local git binary.
   - Creates individual blobs for every markdown essay + `README.md` + `metadata.json`, constructs a Git Tree, creates a Commit with parent SHA, and updates the branch reference.
   - Records every sync attempt in the `backup_logs` table in Netlify Database.

3. **TanStack Start Server Functions (`src/server/*.functions.ts`)**:
   - Always use `.inputValidator(...)` with Zod or custom validator. (Never use `.validator(...)` which does not exist in TanStack Start).
   - Server-only code lives in `.server.ts` files and is imported only into `.functions.ts` or server routes.

4. **Database Migrations**:
   - Schema defined in `db/schema.ts`.
   - Migrations generated via `npx drizzle-kit generate --name <name>`.
   - Never manually run migration execution commands; Netlify applies them automatically on deploy.
