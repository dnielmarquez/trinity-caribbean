-- Add assigned_to_user_id to preventive_tasks
ALTER TABLE preventive_tasks
ADD COLUMN assigned_to_user_id UUID REFERENCES profiles(id);

-- Add index for performance
CREATE INDEX idx_preventive_tasks_assigned_to ON preventive_tasks(assigned_to_user_id);
