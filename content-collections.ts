import { defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '**/*.md',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional().default(''),
    summary: z.string(),
    categories: z.array(z.string()).default(['Philosophy']),
    tags: z.array(z.string()).optional().default([]),
    slug: z.string().optional(),
    image: z.string().optional().default(''),
    date: z.string(),
    readingTime: z.number().optional().default(5),
    featured: z.boolean().optional().default(false),
    content: z.string(),
  }),
  transform: async (doc) => {
    const derivedSlug =
      doc.slug ||
      doc._meta.fileName
        .replace(/\.md$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
    return {
      ...doc,
      slug: derivedSlug,
    }
  },
})

export default defineConfig({
  collections: [posts],
})
