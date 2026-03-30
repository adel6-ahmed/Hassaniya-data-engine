'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface PendingUser {
  id: string
  name: string | null
  email: string
  role: 'REVIEWER' | 'ADMIN'
  isApproved: boolean
  isActive: boolean
  approvalStatus: ApprovalStatus
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ApprovalStatus>('PENDING')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`/api/admin/users?status=${activeTab}`)
        if (!res.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err) {
        setError(String(err) || 'Error loading users')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status, activeTab])

  const handleAction = async (userId: string, action: 'approve' | 'reject' | 'deactivate') => {
    try {
      setActionInProgress(userId)
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Action failed')
      }

      // Remove user from current list
      setUsers(users.filter(u => u.id !== userId))
      setActionInProgress(null)
    } catch (err) {
      setError(String(err) || 'Action failed')
      setActionInProgress(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if ((session?.user as any)?.role !== 'ADMIN') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Access denied. Admin access required.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#1a3a2a' }}>User Approvals</h1>

      {error && (
        <div style={{ background: '#fdedec', border: '1px solid #f5b7b1', color: '#922b21', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ede8de' }}>
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === tab ? '#1a3a2a' : 'transparent',
              color: activeTab === tab ? 'white' : '#4a3f35',
              border: 'none',
              borderRadius: '0.25rem 0.25rem 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#8a7a6a' }}>
          {activeTab === 'PENDING' ? 'No pending approvals' : `No ${activeTab.toLowerCase()} users`}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ede8de' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Created</th>
                {activeTab === 'PENDING' && <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: '#4a3f35' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #ede8de' }}>
                  <td style={{ padding: '1rem', color: '#1a3a2a' }}>{user.name || 'N/A'}</td>
                  <td style={{ padding: '1rem', color: '#1a3a2a' }}>{user.email}</td>
                  <td style={{ padding: '1rem', color: '#1a3a2a' }}>
                    <span style={{ background: user.role === 'ADMIN' ? '#fee' : '#efe', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#1a3a2a' }}>
                    <span
                      style={{
                        background:
                          user.approvalStatus === 'APPROVED'
                            ? '#efe'
                            : user.approvalStatus === 'REJECTED'
                              ? '#fee'
                              : '#fef3cd',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      {user.approvalStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#8a7a6a', fontSize: '0.9rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  {activeTab === 'PENDING' && (
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleAction(user.id, 'approve')}
                          disabled={actionInProgress === user.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: actionInProgress === user.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            opacity: actionInProgress === user.id ? 0.6 : 1,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, 'reject')}
                          disabled={actionInProgress === user.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: actionInProgress === user.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            opacity: actionInProgress === user.id ? 0.6 : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
