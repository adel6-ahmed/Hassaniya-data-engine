// lib/mock-users.ts
// Mock user data for offline/development mode

export const mockUsers = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@hassaniya-dataset.com',
    role: 'ADMIN',
    isActive: true,
    isApproved: true,
    approvalStatus: 'APPROVED',
    emailVerified: null,
    image: null,
    region: 'NOUAKCHOTT',
    passwordHash: '$2b$12$lxYwOv/f9IycKJyXvNwX4uv0OjWJAz6e/3QMVTiGuiahuRuipf/26',
  },
  {
    id: '2',
    name: 'Reviewer',
    email: 'reviewer@hassaniya-dataset.com',
    role: 'REVIEWER',
    isActive: true,
    isApproved: true,
    approvalStatus: 'APPROVED',
    emailVerified: null,
    image: null,
    region: 'NOUADHIBOU',
    passwordHash: '$2b$12$6tEX5XwchRy8qzohZaGF0u5gcwJBmuIGLJDUyuBN4sA/48pPxV6eK',
  },
  {
    id: '3',
    name: 'Contributor Demo',
    email: 'contributor@hassaniya-dataset.com',
    role: 'CONTRIBUTOR',
    isActive: true,
    isApproved: true,
    approvalStatus: 'APPROVED',
    emailVerified: null,
    image: null,
    region: 'KIFFA',
    passwordHash: '$2b$12$dscuX3NZ2aYGJD/77EzXGekEDjR9bHO51Vs6HWlioht.hAnQ.2xRy',
  },
  {
    id: '4',
    name: 'Test User',
    email: 'test@example.com',
    role: 'CONTRIBUTOR',
    isActive: true,
    isApproved: true,
    approvalStatus: 'APPROVED',
    emailVerified: null,
    image: null,
    region: 'OTHER',
  },
]

export function findMockUser(email: string) {
  return mockUsers.find(u => u.email === email)
}

export function getMockUserByEmail(email: string) {
  const user = findMockUser(email)
  if (!user) return null
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isApproved: user.isApproved,
    approvalStatus: user.approvalStatus,
    passwordHash: user.passwordHash || null,
  }
}
