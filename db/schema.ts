import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const essays = pgTable('essays', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull().default('Philosophy'),
  tags: text('tags').default(''),
  readingTime: integer('reading_time').notNull().default(5),
  featured: integer('featured').notNull().default(0),
  status: text('status').notNull().default('published'),
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const backupLogs = pgTable('backup_logs', {
  id: serial('id').primaryKey(),
  targetRepo: text('target_repo').notNull(),
  branch: text('branch').notNull().default('main'),
  commitSha: text('commit_sha'),
  commitMessage: text('commit_message').notNull(),
  filesCount: integer('files_count').notNull().default(0),
  status: text('status').notNull().default('success'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const authorQuestions = pgTable('author_questions', {
  id: serial('id').primaryKey(),
  essaySlug: text('essay_slug'),
  authorName: text('author_name').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  isPublic: integer('is_public').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
})

export const readingBookmarks = pgTable('reading_bookmarks', {
  id: serial('id').primaryKey(),
  essaySlug: text('essay_slug').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
})
