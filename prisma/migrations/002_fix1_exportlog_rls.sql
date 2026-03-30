-- =============================================================
-- FIX 1 — ExportLog RLS (ADMIN only)
-- =============================================================

ALTER TABLE "export_logs" ENABLE ROW LEVEL SECURITY;

-- ADMIN can read ExportLog rows
DROP POLICY IF EXISTS "admin_exportlog_select" ON "export_logs";
CREATE POLICY "admin_exportlog_select"
ON "export_logs"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ADMIN can insert ExportLog rows
DROP POLICY IF EXISTS "admin_exportlog_insert" ON "export_logs";
CREATE POLICY "admin_exportlog_insert"
ON "export_logs"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ADMIN can update ExportLog rows
DROP POLICY IF EXISTS "admin_exportlog_update" ON "export_logs";
CREATE POLICY "admin_exportlog_update"
ON "export_logs"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- ADMIN can delete ExportLog rows
DROP POLICY IF EXISTS "admin_exportlog_delete" ON "export_logs";
CREATE POLICY "admin_exportlog_delete"
ON "export_logs"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

