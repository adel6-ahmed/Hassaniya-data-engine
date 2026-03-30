'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { signIn, getCsrfToken } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const githubEnabled = Boolean(process.env.NEXT_PUBLIC_GITHUB_CONFIGURED)
const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED)

const getCallbackFromUrl = () => {
  if (typeof window === 'undefined') return '/dashboard'
  const params = new URLSearchParams(window.location.search)
  return params.get('callbackUrl') || '/dashboard'
}

const getErrorFromUrl = () => {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  return params.get('error') === 'pending-approval'
    ? 'Your account is pending admin approval. Please contact an administrator.'
    : ''
}

export default function SignInPage() {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const csrfRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(getErrorFromUrl())
  const [callbackUrl] = useState(getCallbackFromUrl())
  const router = useRouter()

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // Fetch CSRF token from API
        const response = await fetch('/api/auth/csrf')
        const data = await response.json()
        const token = data.csrfToken
        
        if (csrfRef.current && token) {
          csrfRef.current.value = token
          console.log('CSRF token set:', token.substring(0, 10) + '...')
        } else {
          console.error('No CSRF token received')
        }
      } catch (error) {
        console.error('Failed to get CSRF token:', error)
      }
    }
    fetchCsrfToken()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value ?? ''
    const isDevMode = process.env.NODE_ENV === 'development'

    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!isDevMode && !password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    const res = await signIn('credentials', {
      email,
      password: password || undefined,
      redirect: false,
      callbackUrl,
    })

    if (res?.error) {
      if (res.error === 'Account pending approval') {
        setError('Your account is pending admin approval. Please contact an administrator.')
      } else if (res.error === 'Account is inactive') {
        setError('Your account is inactive. Please contact an administrator.')
      } else {
        setError('Invalid email or password')
      }
      setLoading(false)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1a3a2a', fontSize: '1.8rem' }}>
          Hassaniya Platform
        </h1>
        {error && (
          <div style={{ background: '#fdedec', border: '1px solid #f5b7b1', color: '#922b21', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* CSRF Token for NextAuth */}
          <input ref={csrfRef} name="csrfToken" type="hidden" />
          
          {/* Hidden anti-autofill hints for browsers/password managers */}
          <input type="text" name="fake-username" autoComplete="off" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />
          <input type="password" name="fake-password" autoComplete="new-password" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Email</label>
            <input
              type="email"
              ref={emailRef}
              name="email"
              autoComplete="off"
              required
              dir="ltr"
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Password</label>
            <input
              type="password"
              ref={passwordRef}
              name="password"
              autoComplete="new-password"
              required
              dir="ltr"
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: '#1a3a2a', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
        <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ede8de' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {githubEnabled && (
            <button
              type="button"
              onClick={() => signIn('github', { callbackUrl })}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #ddd5c5', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign in with GitHub
            </button>
          )}
          {googleEnabled && (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #ddd5c5', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign in with Google
            </button>
          )}
          {!githubEnabled && !googleEnabled && (
            <p style={{ color: '#8a7a6a', fontSize: '0.9rem', textAlign: 'center' }}>
              OAuth providers are not configured.
            </p>
          )}
        </div>
        <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ede8de' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8a7a6a', fontSize: '0.9rem' }}>
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" style={{ color: '#1a3a2a', textDecoration: 'none', fontWeight: 600 }}>
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
