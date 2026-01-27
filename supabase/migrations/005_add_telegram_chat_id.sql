-- =============================================
-- ADD TELEGRAM CHAT ID
-- =============================================
-- Version: 1.0
-- Description: Add telegram_chat_id to profiles for notifications
-- =============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Add checking constraints if needed, but for now free text is fine
-- We just ensure it's not too long if we wanted, but TEXT is flexible.
