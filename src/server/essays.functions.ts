import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  addQuestion,
  createOrUpdateEssay,
  deleteEssayBySlug,
  getAllCombinedEssays,
  getBackupLogs,
  getEssayBySlug,
  getQuestions,
} from './essays.server'

export const getEssaysList = createServerFn({ method: 'GET' }).handler(async () => {
  return await getAllCombinedEssays()
})

export const getSingleEssay = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await getEssayBySlug(data.slug)
  })

export const saveEssay = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      summary: z.string().min(1),
      content: z.string().min(1),
      category: z.string().min(1),
      tags: z.array(z.string()).optional(),
      readingTime: z.number().optional(),
      featured: z.boolean().optional(),
      status: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return await createOrUpdateEssay(data)
  })

export const deleteEssay = createServerFn({ method: 'POST' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await deleteEssayBySlug(data.slug)
  })

export const fetchQuestions = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug?: string }) => data)
  .handler(async ({ data }) => {
    return await getQuestions(data.slug)
  })

export const submitQuestion = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      essaySlug: z.string().optional(),
      authorName: z.string().min(1),
      question: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    return await addQuestion(data)
  })

export const fetchBackupLogs = createServerFn({ method: 'GET' }).handler(async () => {
  return await getBackupLogs()
})
