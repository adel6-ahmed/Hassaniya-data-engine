// Enforce that Supabase service keys are never exposed to the client
// by accidentally prefixing them with `NEXT_PUBLIC_`.
if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Invalid env var: SUPABASE service role key must not be prefixed with NEXT_PUBLIC_.')
}

const nextConfig = { reactStrictMode: true }

export default nextConfig
