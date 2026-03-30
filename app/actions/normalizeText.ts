'use server'

import { z } from 'zod'

const NormalizeInputSchema = z.object({
  text: z.string().min(1),
})

type NormalizeOutput = { normalized: string; hash: string }

export async function normalizeTextViaEdge(input: { text: string }): Promise<NormalizeOutput> {
  const parsed = NormalizeInputSchema.safeParse(input)
  if (!parsed.success) throw new Error('normalizeTextViaEdge: invalid input')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) throw new Error('normalizeTextViaEdge: missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) throw new Error('normalizeTextViaEdge: missing SUPABASE_SERVICE_ROLE_KEY')

  const res = await fetch(`${supabaseUrl}/functions/v1/normalize-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ text: parsed.data.text }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`normalizeTextViaEdge: edge fn failed (${res.status}) ${txt}`)
  }

  const json = (await res.json()) as any
  if (typeof json?.normalized !== 'string' || typeof json?.hash !== 'string') {
    throw new Error('normalizeTextViaEdge: invalid edge fn response')
  }

  return { normalized: json.normalized, hash: json.hash }
}

