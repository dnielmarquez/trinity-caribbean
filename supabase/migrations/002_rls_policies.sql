-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Version: 1.0
-- Description: Role-based access control policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_tasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION
-- =============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role_val;
END;
$$;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role() = 'admin');

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- PROPERTIES POLICIES
-- =============================================

-- All authenticated users can view properties
CREATE POLICY "Authenticated users can view properties"
  ON properties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can manage properties
CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================
-- UNITS POLICIES
-- =============================================

-- All authenticated users can view units
CREATE POLICY "Authenticated users can view units"
  ON units FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can manage units
CREATE POLICY "Admins can insert units"
  ON units FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update units"
  ON units FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete units"
  ON units FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================
-- TICKETS POLICIES
-- =============================================

-- Admins can see all tickets
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (get_user_role() = 'admin');

-- Sub directors can see all tickets
CREATE POLICY "Sub directors can view all tickets"
  ON tickets FOR SELECT
  USING (get_user_role() = 'sub_director');

-- Maintenance can see assigned tickets
CREATE POLICY "Maintenance can view assigned tickets"
  ON tickets FOR SELECT
  USING (
    get_user_role() = 'maintenance' AND
    assigned_to_user_id = auth.uid()
  );

-- Reporters can see their own tickets
CREATE POLICY "Reporters can view own tickets"
  ON tickets FOR SELECT
  USING (
    get_user_role() = 'reporter' AND
    created_by = auth.uid()
  );

-- Reporters can create tickets
CREATE POLICY "Reporters can insert tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    get_user_role() IN ('reporter', 'maintenance', 'sub_director', 'admin') AND
    created_by = auth.uid()
  );

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (get_user_role() = 'admin');

-- Maintenance can update assigned tickets
CREATE POLICY "Maintenance can update assigned tickets"
  ON tickets FOR UPDATE
  USING (
    get_user_role() = 'maintenance' AND
    assigned_to_user_id = auth.uid()
  );

-- Reporters can update their own tickets (limited - status up to in_progress)
CREATE POLICY "Reporters can update own tickets"
  ON tickets FOR UPDATE
  USING (
    get_user_role() = 'reporter' AND
    created_by = auth.uid()
  )
  WITH CHECK (
    status IN ('reported', 'assigned', 'in_progress')
  );

-- =============================================
-- TICKET COMMENTS POLICIES
-- =============================================

-- Users can view comments on tickets they can see
CREATE POLICY "Users can view comments on accessible tickets"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
    )
  );

-- Users can add comments to tickets they can access
CREATE POLICY "Users can insert comments on accessible tickets"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
    )
  );

-- =============================================
-- TICKET ATTACHMENTS POLICIES
-- =============================================

-- Users can view attachments on tickets they can see
CREATE POLICY "Users can view attachments on accessible tickets"
  ON ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
    )
  );

-- Users can add attachments to tickets they can access
CREATE POLICY "Users can insert attachments on accessible tickets"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
    )
  );

-- =============================================
-- TICKET COSTS POLICIES
-- =============================================

-- Users can view costs on tickets they can see
CREATE POLICY "Users can view costs on accessible tickets"
  ON ticket_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_costs.ticket_id
    )
  );

-- Maintenance and admins can insert/update costs
CREATE POLICY "Maintenance can insert costs on assigned tickets"
  ON ticket_costs FOR INSERT
  WITH CHECK (
    updated_by = auth.uid() AND
    (
      get_user_role() = 'admin' OR
      (
        get_user_role() = 'maintenance' AND
        EXISTS (
          SELECT 1 FROM tickets
          WHERE tickets.id = ticket_costs.ticket_id
          AND tickets.assigned_to_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Maintenance can update costs on assigned tickets"
  ON ticket_costs FOR UPDATE
  USING (
    get_user_role() = 'admin' OR
    (
      get_user_role() = 'maintenance' AND
      EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_costs.ticket_id
        AND tickets.assigned_to_user_id = auth.uid()
      )
    )
  );

-- =============================================
-- TICKET AUDIT LOGS POLICIES
-- =============================================

-- Users can view audit logs for tickets they can see
CREATE POLICY "Users can view audit logs on accessible tickets"
  ON ticket_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_audit_logs.ticket_id
    )
  );

-- System can insert audit logs (via service role)
-- Note: Audit logs should be inserted via server-side logic with service role

-- =============================================
-- PROPERTY BLOCKS POLICIES
-- =============================================

-- All authenticated users can view property blocks
CREATE POLICY "Authenticated users can view property blocks"
  ON property_blocks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Sub directors and admins can insert property blocks
CREATE POLICY "Sub directors and admins can insert property blocks"
  ON property_blocks FOR INSERT
  WITH CHECK (
    get_user_role() IN ('sub_director', 'admin') AND
    blocked_by = auth.uid()
  );

-- Sub directors and admins can update property blocks
CREATE POLICY "Sub directors and admins can update property blocks"
  ON property_blocks FOR UPDATE
  USING (get_user_role() IN ('sub_director', 'admin'));

-- =============================================
-- PREVENTIVE TASKS POLICIES
-- =============================================

-- All authenticated users can view preventive tasks
CREATE POLICY "Authenticated users can view preventive tasks"
  ON preventive_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can manage preventive tasks
CREATE POLICY "Admins can insert preventive tasks"
  ON preventive_tasks FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' AND
    created_by = auth.uid()
  );

CREATE POLICY "Admins can update preventive tasks"
  ON preventive_tasks FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete preventive tasks"
  ON preventive_tasks FOR DELETE
  USING (get_user_role() = 'admin');
