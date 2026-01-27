-- =============================================
-- TICKET EXPENSES
-- =============================================
-- Version: 1.0
-- Description: Create ticket_expenses table to track list of costs per ticket.

-- Create table
CREATE TABLE ticket_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Attachments will be stored in ticket_attachments potentially, or just a URL here.
  -- "with the possibility to upload a photo": we can store the URL directly here for simplicity,
  -- or link to ticket_attachments. 
  -- Storing URL directly is easier for a "line item" attachment.
  attachment_url TEXT, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
);

-- Enable RLS
ALTER TABLE ticket_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view expenses on tickets they can accessible
CREATE POLICY "Users can view expenses on accessible tickets"
  ON ticket_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_expenses.ticket_id
    )
  );

-- Maintenance and Admins can manage expenses
CREATE POLICY "Maintenance and Admins can insert expenses"
  ON ticket_expenses FOR INSERT
  WITH CHECK (
    get_user_role() IN ('admin', 'sub_director') OR
    (get_user_role() = 'maintenance' AND EXISTS (
       SELECT 1 FROM tickets 
       WHERE tickets.id = ticket_expenses.ticket_id AND tickets.assigned_to_user_id = auth.uid()
    ))
  );

CREATE POLICY "Maintenance and Admins can delete expenses"
  ON ticket_expenses FOR DELETE
  USING (
    get_user_role() IN ('admin', 'sub_director') OR
    (get_user_role() = 'maintenance' AND created_by = auth.uid())
  );

-- Trigger to update requires_spend on tickets
CREATE OR REPLACE FUNCTION update_ticket_requires_spend()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the ticket's requires_spend flag based on existence of expenses
  UPDATE tickets
  SET requires_spend = EXISTS (
    SELECT 1 FROM ticket_expenses WHERE ticket_id = COALESCE(NEW.ticket_id, OLD.ticket_id)
  )
  WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_requires_spend_on_expense_change
AFTER INSERT OR DELETE OR UPDATE ON ticket_expenses
FOR EACH ROW EXECUTE FUNCTION update_ticket_requires_spend();
