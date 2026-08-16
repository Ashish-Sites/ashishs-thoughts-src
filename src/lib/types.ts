export interface EssayItem {
  id?: number
  slug: string
  title: string
  subtitle?: string
  summary: string
  content: string
  category: string
  tags: string[]
  readingTime: number
  featured?: boolean
  status?: string
  date: string
  source?: 'file' | 'database'
  publishedAt?: string
}

export interface BackupLogItem {
  id?: number
  targetRepo: string
  branch: string
  commitSha?: string | null
  commitMessage: string
  filesCount: number
  status: string
  details?: string | null
  createdAt?: string
}

export interface AuthorQuestionItem {
  id?: number
  essaySlug?: string | null
  authorName: string
  question: string
  answer?: string | null
  isPublic: number
  createdAt?: string
}

export interface GitHubSyncConfig {
  token: string
  repo: string // "owner/repo"
  branch?: string
  commitMessage?: string
  authorName?: string
  authorEmail?: string
}
