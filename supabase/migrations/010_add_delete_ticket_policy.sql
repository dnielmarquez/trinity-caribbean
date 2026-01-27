-- =============================================
-- ADD DELETE POLICY FOR TICKETS
-- =============================================
-- Version: 1.0
-- Description: Allow Admins and Sub-Directors to delete tickets.

CREATE POLICY "Admins and Sub Directors can delete tickets"
  ON tickets FOR DELETE
  USING (get_user_role() IN ('admin', 'sub_director'));
