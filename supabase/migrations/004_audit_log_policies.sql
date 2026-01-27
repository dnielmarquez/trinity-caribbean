-- =============================================
-- AUDIT LOG POLICIES
-- =============================================
-- Version: 1.0
-- Description: Additional policies for ticket_audit_logs to allow insertion
-- =============================================

-- Allow authenticated users to insert audit logs
-- This is required because server actions (running as the user) insert logs
CREATE POLICY "Authenticated users can insert audit logs"
ON ticket_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure the user is only logging actions for themselves
  actor_id = auth.uid() AND
  -- Ensure the ticket exists (basic integrity check)
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_audit_logs.ticket_id
  )
);
