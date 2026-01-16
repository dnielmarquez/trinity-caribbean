-- =============================================
-- SEED DATA
-- =============================================
-- Version: 1.0
-- Description: Initial data for development and testing
-- =============================================

-- Insert demo properties
INSERT INTO properties (id, name, address) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sunset Apartments', '123 Beach Ave, Miami, FL'),
  ('22222222-2222-2222-2222-222222222222', 'Ocean View Condos', '456 Ocean Dr, Miami, FL'),
  ('33333333-3333-3333-3333-333333333333', 'Palm Tree Residences', '789 Palm St, Miami, FL');

-- Insert demo units
INSERT INTO units (property_id, name, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apt 101', 'Ground floor, 2BR'),
  ('11111111-1111-1111-1111-111111111111', 'Apt 102', 'Ground floor, 1BR'),
  ('11111111-1111-1111-1111-111111111111', 'Apt 201', 'Second floor, 2BR'),
  ('22222222-2222-2222-2222-222222222222', 'Unit A', 'Oceanfront, 3BR'),
  ('22222222-2222-2222-2222-222222222222', 'Unit B', 'Oceanfront, 2BR'),
  ('33333333-3333-3333-3333-333333333333', 'Penthouse', 'Top floor, luxury suite');

-- =============================================
-- DEMO USERS
-- =============================================
-- Note: These users need to be created via Supabase Auth UI or API
-- After creating users in Auth, insert their profiles here
--
-- Demo credentials (create these in Supabase Dashboard):
-- 1. admin@maintenance.app (password: Admin123!) - Admin
-- 2. subdirector@maintenance.app (password: SubDir123!) - Sub Director  
-- 3. technician@maintenance.app (password: Tech123!) - Maintenance
-- 4. coordinator@maintenance.app (password: Coord123!) - Reporter
--
-- After creating in Auth, run this to add profiles:
--
-- INSERT INTO profiles (id, full_name, role) VALUES
--   ('<admin-user-id>', 'Admin User', 'admin'),
--   ('<subdirector-user-id>', 'Sub Director', 'sub_director'),
--   ('<technician-user-id>', 'John Technician', 'maintenance'),
--   ('<coordinator-user-id>', 'Maria Coordinator', 'reporter');

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Sample tickets (uncomment after creating demo users)
-- INSERT INTO tickets (
--   property_id,
--   unit_id,
--   type,
--   category,
--   priority,
--   status,
--   description,
--   created_by
-- ) VALUES
--   (
--     '11111111-1111-1111-1111-111111111111',
--     (SELECT id FROM units WHERE name = 'Apt 101' LIMIT 1),
--     'corrective',
--     'ac',
--     'high',
--     'reported',
--     'Air conditioning not cooling properly. Temperature stays at 80°F.',
--     '<reporter-user-id>'
--   ),
--   (
--     '22222222-2222-2222-2222-222222222222',
--     (SELECT id FROM units WHERE name = 'Unit A' LIMIT 1),
--     'corrective',
--     'plumbing',
--     'urgent',
--     'assigned',
--     'Toilet is leaking water from the base. Floor is getting wet.',
--     '<reporter-user-id>'
--   );
