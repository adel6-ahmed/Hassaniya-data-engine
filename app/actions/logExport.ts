'use server'

import { prisma } from '@/lib/prisma'

export type LogExportInput = {
  userId: string
  exportType: string
  datasetVersion: string
  recordCount: number
  fileUrl?: string | null
  fileSize?: number | null
  exportHash?: string | null
}

// Records every successful dataset export for auditability.
// Called from the export API route after the file content is generated.
export async function logExport(input: LogExportInput) {
  if (!input.userId) throw new Error('logExport: missing userId')

  const exportLogDelegate = (prisma as unknown as { exportLog?: { create: (args: unknown) => Promise<unknown> } }).exportLog

  // Some DB states (after introspection) may not expose ExportLog.
  // Skip non-critical audit insert rather than failing the export request.
  if (!exportLogDelegate?.create) return null

  return exportLogDelegate.create({
    data: {
      userId: input.userId,
      exportType: input.exportType,
      datasetVersion: input.datasetVersion,
      recordCount: input.recordCount,
      fileUrl: input.fileUrl ?? null,
      fileSize: input.fileSize ?? null,
      exportHash: input.exportHash ?? null,
    },
  })
}

