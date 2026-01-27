-- =============================================
-- AUDIT LOG SELECT POLICIES
-- =============================================
-- Version: 1.0
-- Description: Allow authenticated users to view audit logs for tickets they have access to.

CREATE POLICY "Authenticated users can view audit logs"
ON ticket_audit_logs FOR SELECT
TO authenticated
USING (
  -- User can see the log if they can see the ticket
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_audit_logs.ticket_id
  )
);
