import { formatArchiveReadme, formatEssayToMarkdown } from '../lib/formatters'
import type { EssayItem, GitHubSyncConfig } from '../lib/types'

export { formatArchiveReadme, formatEssayToMarkdown }

export interface GitHubBackupResult {
  success: boolean
  message: string
  commitSha: string
  commitUrl: string
  backedUpCount: number
  targetRepo: string
  branch: string
  timestamp: string
}

export async function pushEssaysToGitHub(
  config: GitHubSyncConfig,
  essaysList: EssayItem[]
): Promise<GitHubBackupResult> {
  const token = config.token?.trim()
  const repoRaw = config.repo?.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
  const branch = config.branch?.trim() || 'main'
  const message =
    config.commitMessage?.trim() ||
    `Backup ${essaysList.length} essays archive [${new Date().toISOString().slice(0, 16)}]`

  if (!token) {
    throw new Error('GitHub Personal Access Token is required.')
  }
  if (!repoRaw || !repoRaw.includes('/')) {
    throw new Error('Invalid repository name. Expected format: owner/repository (e.g. "username/essay-archive").')
  }

  const [owner, repoName] = repoRaw.split('/')
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Personal-Essay-Blog-Agent',
    'Content-Type': 'application/json',
  }

  // 1. Verify access to repository
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers,
  })

  if (repoRes.status === 404) {
    throw new Error(
      `Repository "${owner}/${repoName}" was not found. Please create the repository on GitHub or check permissions for your token.`
    )
  }
  if (repoRes.status === 401) {
    throw new Error('GitHub token is invalid or expired (HTTP 401).')
  }
  if (!repoRes.ok) {
    const errText = await repoRes.text()
    throw new Error(`GitHub API Error (${repoRes.status}): ${errText}`)
  }

  // 2. Prepare files to commit
  const files: { path: string; content: string }[] = []

  // Add all essays
  for (const essay of essaysList) {
    const md = formatEssayToMarkdown(essay)
    files.push({
      path: `essays/${essay.slug}.md`,
      content: md,
    })
  }

  // Add README and metadata.json
  files.push({
    path: 'README.md',
    content: formatArchiveReadme(essaysList, `${owner}/${repoName}`),
  })

  files.push({
    path: 'metadata.json',
    content: JSON.stringify(
      {
        backupDate: new Date().toISOString(),
        repository: `${owner}/${repoName}`,
        branch,
        totalEssays: essaysList.length,
        essays: essaysList.map((e) => ({
          slug: e.slug,
          title: e.title,
          category: e.category,
          date: e.date,
          tags: e.tags,
          readingTime: e.readingTime,
        })),
      },
      null,
      2
    ),
  })

  // 3. Check for existing branch reference
  let latestCommitSha: string | null = null
  let baseTreeSha: string | null = null

  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branch}`,
    { headers }
  )

  if (branchRes.ok) {
    const refData = (await branchRes.json()) as { object: { sha: string } }
    latestCommitSha = refData.object.sha

    // Fetch commit to get tree SHA
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
      { headers }
    )
    if (commitRes.ok) {
      const commitData = (await commitRes.json()) as { tree: { sha: string } }
      baseTreeSha = commitData.tree.sha
    }
  } else if (branchRes.status === 404) {
    // If branch doesn't exist, check default branch or create initial commit
    const defaultRepoData = (await repoRes.json()) as { default_branch?: string }
    const defaultBranch = defaultRepoData.default_branch || 'main'

    const defaultRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
      { headers }
    )
    if (defaultRefRes.ok) {
      const defaultRefData = (await defaultRefRes.json()) as { object: { sha: string } }
      latestCommitSha = defaultRefData.object.sha
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
        { headers }
      )
      if (commitRes.ok) {
        const commitData = (await commitRes.json()) as { tree: { sha: string } }
        baseTreeSha = commitData.tree.sha
      }
    } else {
      // Completely empty repo without any commits: initialize with README first
      const initRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/README.md`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: 'Initialize essay archive repository',
            content: Buffer.from('# Essay Archive\nInitializing backup repository.').toString(
              'base64'
            ),
            branch,
          }),
        }
      )
      if (!initRes.ok) {
        const initErr = await initRes.text()
        throw new Error(`Failed to initialize empty repository: ${initErr}`)
      }
      const initData = (await initRes.json()) as { commit: { sha: string } }
      latestCommitSha = initData.commit.sha
    }
  }

  // 4. Create Git Blobs for all files
  const treeNodes: { path: string; mode: string; type: string; sha: string }[] = []

  for (const file of files) {
    const blobRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      }
    )

    if (!blobRes.ok) {
      const err = await blobRes.text()
      throw new Error(`Failed to create blob for ${file.path}: ${err}`)
    }

    const blobData = (await blobRes.json()) as { sha: string }
    treeNodes.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    })
  }

  // 5. Create Git Tree
  const treeBody: Record<string, unknown> = {
    tree: treeNodes,
  }
  if (baseTreeSha) {
    treeBody.base_tree = baseTreeSha
  }

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(treeBody),
    }
  )

  if (!treeRes.ok) {
    const err = await treeRes.text()
    throw new Error(`Failed to create git tree: ${err}`)
  }
  const treeData = (await treeRes.json()) as { sha: string }
  const newTreeSha = treeData.sha

  // 6. Create Git Commit
  const commitPayload: Record<string, unknown> = {
    message,
    tree: newTreeSha,
    parents: latestCommitSha ? [latestCommitSha] : [],
  }

  if (config.authorName) {
    commitPayload.author = {
      name: config.authorName,
      email: config.authorEmail || 'author@personal-essay-blog.local',
      date: new Date().toISOString(),
    }
  }

  const newCommitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(commitPayload),
    }
  )

  if (!newCommitRes.ok) {
    const err = await newCommitRes.text()
    throw new Error(`Failed to create git commit: ${err}`)
  }
  const newCommitData = (await newCommitRes.json()) as { sha: string; html_url?: string }
  const commitSha = newCommitData.sha

  // 7. Update or Create Branch Ref
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: commitSha,
        force: true,
      }),
    }
  )

  if (!updateRefRes.ok) {
    // If PATCH failed because ref didn't exist yet, try creating ref
    const createRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: commitSha,
        }),
      }
    )
    if (!createRefRes.ok) {
      const err = await createRefRes.text()
      throw new Error(`Failed to update branch reference '${branch}': ${err}`)
    }
  }

  const commitUrl = `https://github.com/${owner}/${repoName}/commit/${commitSha}`

  return {
    success: true,
    message: `Successfully backed up ${essaysList.length} essays to GitHub repository ${owner}/${repoName} (${branch})!`,
    commitSha,
    commitUrl,
    backedUpCount: essaysList.length,
    targetRepo: `${owner}/${repoName}`,
    branch,
    timestamp: new Date().toISOString(),
  }
}
