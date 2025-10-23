-- Update existing tables to match the expected schema

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS encryption_salt TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make public_key nullable if it's not already
ALTER TABLE users 
ALTER COLUMN public_key DROP NOT NULL;

-- Add missing columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update messages table structure
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS ciphertext TEXT,
ADD COLUMN IF NOT EXISTS iv TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);

-- If encrypted_content exists, we might need to migrate data
-- This is a placeholder - you might need to handle data migration separately
-- ALTER TABLE messages DROP COLUMN IF EXISTS encrypted_content;

-- Create additional indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
