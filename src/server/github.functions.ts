import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { formatEssayToMarkdown } from '../lib/formatters'
import { getAllCombinedEssays, logBackupEvent } from './essays.server'
import { pushEssaysToGitHub } from './github.server'

export const testGitHubAccess = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      token: z.string().min(1),
      repo: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const token = data.token.trim()
    const cleanRepo = data.repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
    const [owner, repoName] = cleanRepo.split('/')

    if (!owner || !repoName) {
      return {
        valid: false,
        message: 'Invalid repository format. Please enter "owner/repo" (e.g., octocat/essays).',
      }
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Personal-Essay-Blog-Agent',
        },
      })

      if (res.status === 200) {
        const repoData = (await res.json()) as { full_name: string; private: boolean; default_branch: string }
        return {
          valid: true,
          repoFullName: repoData.full_name,
          isPrivate: repoData.private,
          defaultBranch: repoData.default_branch || 'main',
          message: `Connected successfully to GitHub repository: ${repoData.full_name} (${repoData.private ? 'Private' : 'Public'})`,
        }
      } else if (res.status === 404) {
        return {
          valid: false,
          message: `Repository "${cleanRepo}" not found. Verify the name or check that your Personal Access Token has 'repo' scope.`,
        }
      } else if (res.status === 401) {
        return {
          valid: false,
          message: 'GitHub Personal Access Token is invalid or expired (401 Unauthorized).',
        }
      } else {
        const errorMsg = await res.text()
        return {
          valid: false,
          message: `GitHub API error (${res.status}): ${errorMsg}`,
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        valid: false,
        message: `Network error connecting to GitHub: ${msg}`,
      }
    }
  })

export const triggerGitHubBackup = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      token: z.string().min(1),
      repo: z.string().min(1),
      branch: z.string().optional(),
      commitMessage: z.string().optional(),
      authorName: z.string().optional(),
      authorEmail: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const essaysList = await getAllCombinedEssays()
    const cleanRepo = data.repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
    const branch = data.branch || 'main'

    try {
      const result = await pushEssaysToGitHub(data, essaysList)

      await logBackupEvent({
        targetRepo: cleanRepo,
        branch,
        commitSha: result.commitSha,
        commitMessage: data.commitMessage || `Backup ${essaysList.length} essays archive`,
        filesCount: essaysList.length,
        status: 'success',
        details: `Committed ${essaysList.length} essays to ${branch} branch. Commit SHA: ${result.commitSha?.slice(0, 7)}`,
      })

      return result
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)

      await logBackupEvent({
        targetRepo: cleanRepo,
        branch,
        commitMessage: data.commitMessage || `Backup ${essaysList.length} essays archive`,
        filesCount: essaysList.length,
        status: 'failed',
        details: errorMsg,
      })

      throw new Error(errorMsg)
    }
  })

export const getExportableArchive = createServerFn({ method: 'GET' }).handler(async () => {
  const essaysList = await getAllCombinedEssays()
  const files = essaysList.map((essay) => ({
    filename: `essays/${essay.slug}.md`,
    content: formatEssayToMarkdown(essay),
    slug: essay.slug,
    title: essay.title,
    category: essay.category,
    readingTime: essay.readingTime,
  }))

  return {
    total: essaysList.length,
    date: new Date().toISOString(),
    files,
  }
})
