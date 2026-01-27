-- =============================================
-- AUDIT LOG INSERT POLICIES
-- =============================================
-- Version: 1.0
-- Description: Explicitly allow authenticated users to insert audit logs where they are the actor.

-- Drop existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON ticket_audit_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ticket_audit_logs;

-- Re-create the policy with a clear permission check
CREATE POLICY "Authenticated users can insert audit logs"
ON ticket_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only insert logs where they are the actor
  actor_id = auth.uid()
  -- We removed the EXISTS check on tickets to prevent recursion or lock issues, 
  -- assuming the application logic handles the integrity. 
  -- The constraint on ticket_id (REFERENCES tickets) will still enforce existence.
);
