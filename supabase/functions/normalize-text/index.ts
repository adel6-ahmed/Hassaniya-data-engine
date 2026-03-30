// Supabase Edge Function: /functions/v1/normalize-text
// Normalizes Hassaniya/Arabic text and returns a SHA-256 hash of the normalized output.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(text)
  return crypto.subtle.digest('SHA-256', data).then((buf) => {
    const bytes = new Uint8Array(buf)
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  })
}

serve(async (req) => {
  // Edge Function Protection (Fix 3 requirement)
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const body = await req.json().catch(() => null)
  const text = body?.text
  if (typeof text !== 'string' || text.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Normalization steps in exact order (as requested)
  let normalized = text.normalize('NFKC')
  // أ إ آ → ا (all hamza forms on alef → bare alef)
  normalized = normalized.replace(/[إأآ]/g, 'ا')
  // ى → ي (alef maqsura → ya)
  normalized = normalized.replace(/ى/g, 'ي')
  // ة → ه (ta marbuta → ha)
  normalized = normalized.replace(/ة/g, 'ه')
  // ؤ → و (waw with hamza → waw)
  normalized = normalized.replace(/ؤ/g, 'و')
  // ئ → ي (ya with hamza → ya)
  normalized = normalized.replace(/ئ/g, 'ي')
  // Remove diacritics: \u0610–\u061A and \u064B–\u065F
  normalized = normalized.replace(/[\u0610-\u061A\u064B-\u065F]/g, '')
  // Remove tatweel: \u0640
  normalized = normalized.replace(/\u0640/g, '')
  // Remove zero-width chars: \u200B \u200C \u200D \uFEFF
  normalized = normalized.replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
  // Normalize whitespace: collapse multiple spaces, trim
  normalized = normalized.replace(/\s+/g, ' ').trim()

  const hash = await sha256Hex(normalized)

  return new Response(JSON.stringify({ normalized, hash }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

