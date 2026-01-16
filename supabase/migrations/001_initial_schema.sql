-- =============================================
-- MAINTENANCE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =============================================
-- Version: 1.0
-- Description: Complete schema for maintenance ticket management system
-- with RBAC (Role-Based Access Control)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

-- User roles
CREATE TYPE user_role AS ENUM ('reporter', 'maintenance', 'sub_director', 'admin');

-- Ticket types
CREATE TYPE ticket_type AS ENUM ('corrective', 'preventive');

-- Categories
CREATE TYPE ticket_category AS ENUM (
  'ac',
  'appliances',
  'plumbing',
  'wifi',
  'furniture',
  'locks',
  'electricity',
  'painting',
  'cleaning',
  'pest_control',
  'other'
);

-- Priorities
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Statuses
CREATE TYPE ticket_status AS ENUM (
  'reported',
  'assigned',
  'in_progress',
  'resolved',
  'closed'
);

-- Attachment types
CREATE TYPE attachment_kind AS ENUM ('image', 'video', 'invoice');

-- Recurrence types for preventive maintenance
CREATE TYPE recurrence_type AS ENUM ('days', 'weeks', 'months');

-- =============================================
-- TABLES
-- =============================================

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'reporter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Units (apartments/rooms within properties)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets (main entity)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
  type ticket_type NOT NULL DEFAULT 'corrective',
  category ticket_category NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'reported',
  description TEXT NOT NULL,
  requires_spend BOOLEAN NOT NULL DEFAULT false,
  -- Assignment (internal users only in v1)
  assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Tracking
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  -- Indexes for common queries
  CONSTRAINT ticket_property_check CHECK (property_id IS NOT NULL)
);

-- Ticket comments
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket attachments (stored in Supabase Storage)
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  kind attachment_kind NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
);

-- Ticket costs (one per ticket)
CREATE TABLE ticket_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  labor_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  parts_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (labor_amount + parts_amount) STORED,
  invoice_attachment_id UUID REFERENCES ticket_attachments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
);

-- Ticket audit logs
CREATE TABLE ticket_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  from_value JSONB,
  to_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property blocks (for maintenance blocking)
CREATE TABLE property_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL,
  blocked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unblocked_at TIMESTAMPTZ
);

-- Preventive maintenance tasks (foundation for scheduler)
CREATE TABLE preventive_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  category ticket_category NOT NULL,
  description TEXT NOT NULL,
  recurrence_type recurrence_type NOT NULL,
  recurrence_interval INTEGER NOT NULL CHECK (recurrence_interval > 0),
  last_generated_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- Units
CREATE INDEX idx_units_property_id ON units(property_id);

-- Tickets (critical for performance)
CREATE INDEX idx_tickets_property_id ON tickets(property_id);
CREATE INDEX idx_tickets_unit_id ON tickets(unit_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_user_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_category ON tickets(category);

-- Comments
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at);

-- Attachments
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- Audit logs
CREATE INDEX idx_ticket_audit_logs_ticket_id ON ticket_audit_logs(ticket_id);
CREATE INDEX idx_ticket_audit_logs_created_at ON ticket_audit_logs(created_at DESC);

-- Property blocks
CREATE INDEX idx_property_blocks_property_id ON property_blocks(property_id);
CREATE INDEX idx_property_blocks_unit_id ON property_blocks(unit_id);
CREATE INDEX idx_property_blocks_is_blocked ON property_blocks(is_blocked);

-- Preventive tasks
CREATE INDEX idx_preventive_tasks_property_id ON preventive_tasks(property_id);
CREATE INDEX idx_preventive_tasks_next_scheduled ON preventive_tasks(next_scheduled_at) WHERE is_active = true;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_costs_updated_at BEFORE UPDATE ON ticket_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preventive_tasks_updated_at BEFORE UPDATE ON preventive_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to set resolved_at when status changes to 'resolved'
CREATE OR REPLACE FUNCTION set_ticket_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_set_resolved_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_resolved_at();

-- Function to set closed_at when status changes to 'closed'
CREATE OR REPLACE FUNCTION set_ticket_closed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_set_closed_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_closed_at();

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View for currently blocked properties/units
CREATE OR REPLACE VIEW active_blocks AS
SELECT 
  pb.*,
  p.name AS property_name,
  u.name AS unit_name,
  prof.full_name AS blocked_by_name,
  EXTRACT(EPOCH FROM (COALESCE(pb.unblocked_at, NOW()) - pb.blocked_at)) / 3600 AS blocked_duration_hours
FROM property_blocks pb
JOIN properties p ON pb.property_id = p.id
LEFT JOIN units u ON pb.unit_id = u.id
JOIN profiles prof ON pb.blocked_by = prof.id
WHERE pb.is_blocked = true AND pb.unblocked_at IS NULL;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE tickets IS 'Main tickets table for maintenance requests';
COMMENT ON TABLE ticket_audit_logs IS 'Audit trail for ticket changes';
COMMENT ON TABLE property_blocks IS 'Track properties/units blocked due to maintenance';
COMMENT ON TABLE preventive_tasks IS 'Recurring maintenance tasks (scheduler-ready)';
