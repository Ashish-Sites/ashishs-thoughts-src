import { allPosts, type Post } from 'content-collections'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  authorQuestions,
  backupLogs,
  essays as essaysTable,
} from '../../db/schema.js'
import type { AuthorQuestionItem, BackupLogItem, EssayItem } from '../lib/types'

export async function getAllCombinedEssays(): Promise<EssayItem[]> {
  const staticItems: EssayItem[] = allPosts.map((post: Post) => ({
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle || '',
    summary: post.summary,
    content: post.content,
    category: post.categories?.[0] || 'Philosophy',
    tags: post.tags || [],
    readingTime: post.readingTime || Math.max(1, Math.round(post.content.split(/\s+/).length / 200)),
    featured: Boolean(post.featured),
    status: 'published',
    date: post.date || new Date().toISOString().split('T')[0],
    source: 'file' as const,
  }))

  try {
    const dbEssays = await db.select().from(essaysTable).orderBy(desc(essaysTable.publishedAt))
    
    const dbItems: EssayItem[] = dbEssays.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle || '',
      summary: item.summary,
      content: item.content,
      category: item.category,
      tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      readingTime: item.readingTime,
      featured: Boolean(item.featured),
      status: item.status,
      date: item.publishedAt ? item.publishedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      source: 'database' as const,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : undefined,
    }))

    // Map by slug, db items take precedence over file items with the same slug
    const map = new Map<string, EssayItem>()
    for (const item of staticItems) {
      map.set(item.slug, item)
    }
    for (const item of dbItems) {
      map.set(item.slug, item)
    }

    const merged = Array.from(map.values())
    // Sort descending by date
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return merged
  } catch (error) {
    console.warn('Could not query database for essays, using content collections fallback:', error)
    return staticItems
  }
}

export async function getEssayBySlug(slug: string): Promise<EssayItem | null> {
  try {
    const dbRows = await db.select().from(essaysTable).where(eq(essaysTable.slug, slug)).limit(1)
    if (dbRows.length > 0) {
      const item = dbRows[0]
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle || '',
        summary: item.summary,
        content: item.content,
        category: item.category,
        tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        readingTime: item.readingTime,
        featured: Boolean(item.featured),
        status: item.status,
        date: item.publishedAt ? item.publishedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        source: 'database',
      }
    }
  } catch (err) {
    console.warn(`Database lookup for slug ${slug} failed, checking static files:`, err)
  }

  const staticPost = allPosts.find((p) => p.slug === slug)
  if (staticPost) {
    return {
      slug: staticPost.slug,
      title: staticPost.title,
      subtitle: staticPost.subtitle || '',
      summary: staticPost.summary,
      content: staticPost.content,
      category: staticPost.categories?.[0] || 'Philosophy',
      tags: staticPost.tags || [],
      readingTime: staticPost.readingTime || Math.max(1, Math.round(staticPost.content.split(/\s+/).length / 200)),
      featured: Boolean(staticPost.featured),
      status: 'published',
      date: staticPost.date || new Date().toISOString().split('T')[0],
      source: 'file',
    }
  }

  return null
}

export async function createOrUpdateEssay(data: {
  slug: string
  title: string
  subtitle?: string
  summary: string
  content: string
  category: string
  tags?: string[]
  readingTime?: number
  featured?: boolean
  status?: string
}): Promise<EssayItem> {
  const calculatedReadingTime =
    data.readingTime ||
    Math.max(1, Math.round((data.content || '').split(/\s+/).filter(Boolean).length / 200))
  const tagsString = (data.tags || []).join(', ')

  const existing = await db.select().from(essaysTable).where(eq(essaysTable.slug, data.slug)).limit(1)

  if (existing.length > 0) {
    const [updated] = await db
      .update(essaysTable)
      .set({
        title: data.title,
        subtitle: data.subtitle || '',
        summary: data.summary,
        content: data.content,
        category: data.category,
        tags: tagsString,
        readingTime: calculatedReadingTime,
        featured: data.featured ? 1 : 0,
        status: data.status || 'published',
        updatedAt: new Date(),
      })
      .where(eq(essaysTable.slug, data.slug))
      .returning()

    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      subtitle: updated.subtitle || '',
      summary: updated.summary,
      content: updated.content,
      category: updated.category,
      tags: updated.tags ? updated.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      readingTime: updated.readingTime,
      featured: Boolean(updated.featured),
      status: updated.status,
      date: updated.publishedAt ? updated.publishedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      source: 'database',
    }
  }

  const [inserted] = await db
    .insert(essaysTable)
    .values({
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle || '',
      summary: data.summary,
      content: data.content,
      category: data.category,
      tags: tagsString,
      readingTime: calculatedReadingTime,
      featured: data.featured ? 1 : 0,
      status: data.status || 'published',
      publishedAt: new Date(),
    })
    .returning()

  return {
    id: inserted.id,
    slug: inserted.slug,
    title: inserted.title,
    subtitle: inserted.subtitle || '',
    summary: inserted.summary,
    content: inserted.content,
    category: inserted.category,
    tags: inserted.tags ? inserted.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    readingTime: inserted.readingTime,
    featured: Boolean(inserted.featured),
    status: inserted.status,
    date: inserted.publishedAt ? inserted.publishedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    source: 'database',
  }
}

export async function deleteEssayBySlug(slug: string): Promise<boolean> {
  const result = await db.delete(essaysTable).where(eq(essaysTable.slug, slug)).returning()
  return result.length > 0
}

export async function getBackupLogs(): Promise<BackupLogItem[]> {
  try {
    const logs = await db.select().from(backupLogs).orderBy(desc(backupLogs.createdAt)).limit(20)
    return logs.map((log) => ({
      id: log.id,
      targetRepo: log.targetRepo,
      branch: log.branch,
      commitSha: log.commitSha,
      commitMessage: log.commitMessage,
      filesCount: log.filesCount,
      status: log.status,
      details: log.details,
      createdAt: log.createdAt ? log.createdAt.toISOString() : undefined,
    }))
  } catch (err) {
    console.warn('Error fetching backup logs:', err)
    return []
  }
}

export async function logBackupEvent(entry: {
  targetRepo: string
  branch: string
  commitSha?: string
  commitMessage: string
  filesCount: number
  status: string
  details?: string
}): Promise<void> {
  try {
    await db.insert(backupLogs).values({
      targetRepo: entry.targetRepo,
      branch: entry.branch || 'main',
      commitSha: entry.commitSha,
      commitMessage: entry.commitMessage,
      filesCount: entry.filesCount,
      status: entry.status,
      details: entry.details,
      createdAt: new Date(),
    })
  } catch (err) {
    console.warn('Could not record backup log in database:', err)
  }
}

export async function getQuestions(essaySlug?: string): Promise<AuthorQuestionItem[]> {
  const defaultQuestions: AuthorQuestionItem[] = [
    {
      id: 1,
      essaySlug: 'on-stillness-in-the-hyperconnected-age',
      authorName: 'Marcus V.',
      question: 'How do you balance the need for deep silence with the professional demand for fast asynchronous communication?',
      answer: 'Batching is the only honest remedy. I designate two discrete 30-minute windows daily for correspondence. Outside those intervals, the inbox daemon is dead, and the mind is allowed to stay in one room.',
      isPublic: 1,
      createdAt: '2026-08-11T14:20:00Z',
    },
    {
      id: 2,
      essaySlug: 'the-craft-of-digital-permanence',
      authorName: 'Elena R.',
      question: 'Why not use hosted CMS platforms like Substack or Ghost instead of raw Markdown + Git backups?',
      answer: 'Hosted platforms provide convenience today at the expense of your sovereign archive tomorrow. When you hold raw text files in Git, you own the substrate. You can re-render your thoughts in any decade, on any medium, without asking permission from an algorithm.',
      isPublic: 1,
      createdAt: '2026-08-04T09:15:00Z',
    },
    {
      id: 3,
      essaySlug: 'the-art-of-the-unfinished-thought',
      authorName: 'Julian K.',
      question: 'Is there a risk that publishing unfinished fragments lowers your editorial standard?',
      answer: 'Only if confusion is presented as mastery. If you label a fragment honestly as an inquiry, it invites intellectual companionship rather than superficial appraisal.',
      isPublic: 1,
      createdAt: '2026-07-16T18:40:00Z',
    },
  ]

  try {
    let query = db.select().from(authorQuestions).where(eq(authorQuestions.isPublic, 1))
    if (essaySlug) {
      query = db
        .select()
        .from(authorQuestions)
        .where(eq(authorQuestions.essaySlug, essaySlug))
    }
    const dbQuestions = await query.orderBy(desc(authorQuestions.createdAt))

    if (dbQuestions.length === 0) {
      return essaySlug
        ? defaultQuestions.filter((q) => q.essaySlug === essaySlug)
        : defaultQuestions
    }

    return dbQuestions.map((q) => ({
      id: q.id,
      essaySlug: q.essaySlug,
      authorName: q.authorName,
      question: q.question,
      answer: q.answer,
      isPublic: q.isPublic,
      createdAt: q.createdAt ? q.createdAt.toISOString() : undefined,
    }))
  } catch (err) {
    console.warn('Error fetching questions from database:', err)
    return essaySlug
      ? defaultQuestions.filter((q) => q.essaySlug === essaySlug)
      : defaultQuestions
  }
}

export async function addQuestion(data: {
  essaySlug?: string
  authorName: string
  question: string
}): Promise<AuthorQuestionItem> {
  try {
    const [inserted] = await db
      .insert(authorQuestions)
      .values({
        essaySlug: data.essaySlug || null,
        authorName: data.authorName.trim() || 'Anonymous Inquirer',
        question: data.question.trim(),
        answer: null,
        isPublic: 1,
        createdAt: new Date(),
      })
      .returning()

    return {
      id: inserted.id,
      essaySlug: inserted.essaySlug,
      authorName: inserted.authorName,
      question: inserted.question,
      answer: inserted.answer,
      isPublic: inserted.isPublic,
      createdAt: inserted.createdAt ? inserted.createdAt.toISOString() : undefined,
    }
  } catch (err) {
    console.warn('Failed to insert question to database:', err)
    return {
      id: Date.now(),
      essaySlug: data.essaySlug,
      authorName: data.authorName,
      question: data.question,
      answer: null,
      isPublic: 1,
      createdAt: new Date().toISOString(),
    }
  }
}
