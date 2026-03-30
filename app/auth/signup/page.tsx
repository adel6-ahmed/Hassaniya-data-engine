'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'CONTRIBUTOR' | 'REVIEWER' | 'ADMIN'>('REVIEWER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // For contributors, auto sign in
      if (role === 'CONTRIBUTOR') {
        await signIn('credentials', {
          email,
          password,
          callbackUrl: '/dashboard',
        })
      } else {
        // For reviewers/admins, show pending approval message
        setError('')
        alert(data.message || 'Account request submitted. Please wait for admin approval.')
        router.push('/auth/signin')
      }
    } catch {
      setError('Connection error')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#1a3a2a', fontSize: '1.8rem' }}>
          Create Account
        </h1>
        <p style={{ textAlign: 'center', color: '#8a7a6a', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Join Hassaniya Dataset Platform
        </p>

        {error && (
          <div style={{ background: '#fdedec', border: '1px solid #f5b7b1', color: '#922b21', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Hidden anti-autofill hints for browsers/password managers */}
          <input type="text" name="fake-username" autoComplete="off" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />
          <input type="password" name="fake-password" autoComplete="new-password" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              name="fullname"
              autoComplete="off"
              required
              placeholder="Your name"
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Account Type</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'CONTRIBUTOR' | 'REVIEWER' | 'ADMIN')}
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            >
              <option value="CONTRIBUTOR">Contributor (Public)</option>
              <option value="REVIEWER">Reviewer (Requires Approval)</option>
              <option value="ADMIN">Admin (Requires Approval)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              name="email"
              autoComplete="off"
              required
              dir="ltr"
              placeholder="example@email.com"
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#4a3f35' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              name="password"
              autoComplete="new-password"
              required
              dir="ltr"
              placeholder="Min 6 characters"
              style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #ddd5c5', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: '#1a3a2a', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ede8de' }} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8a7a6a', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <a href="/auth/signin" style={{ color: '#1a3a2a', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
