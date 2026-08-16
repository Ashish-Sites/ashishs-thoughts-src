import type { EssayItem } from './types'

export function formatEssayToMarkdown(essay: EssayItem): string {
  const tagsStr =
    essay.tags && essay.tags.length > 0
      ? essay.tags.map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n')
      : ''

  const frontmatter = [
    '---',
    `title: "${(essay.title || '').replace(/"/g, '\\"')}"`,
    essay.subtitle ? `subtitle: "${essay.subtitle.replace(/"/g, '\\"')}"` : '',
    `date: "${essay.date || new Date().toISOString().split('T')[0]}"`,
    `summary: "${(essay.summary || '').replace(/"/g, '\\"')}"`,
    'categories:',
    `  - "${(essay.category || 'Philosophy').replace(/"/g, '\\"')}"`,
    tagsStr ? 'tags:\n' + tagsStr : 'tags: []',
    `slug: "${essay.slug}"`,
    `readingTime: ${essay.readingTime || 5}`,
    `featured: ${Boolean(essay.featured)}`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n')

  return `${frontmatter}\n${essay.content || ''}\n`
}

export function formatArchiveReadme(essays: EssayItem[], repo: string): string {
  const dateStr = new Date().toISOString()
  const essayRows = essays
    .map(
      (e) =>
        `- **[${e.title}](essays/${e.slug}.md)** (${e.category}) - *${e.readingTime} min read* — ${e.summary}`
    )
    .join('\n')

  return `# Personal Essay Archive

> Automated Git Backup & Preservation Repository for **[${repo}](https://github.com/${repo})**  
> Last Synchronized: ${dateStr}

This repository contains full plain-text Markdown backups of personal essays, complete with frontmatter metadata, version history, and tags.

## Catalog of Essays (${essays.length} entries)

${essayRows}

## Format Specification

All essays are preserved in RFC-compliant UTF-8 Markdown with YAML frontmatter.  
To restore or migrate, import the \`essays/\` directory into any static site generator or Obsidian / Foam vault.
`
}
