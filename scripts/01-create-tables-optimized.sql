-- Optimierte Tabellen für verschlüsselten Chat
-- Diese Skripte erstellen die notwendigen Tabellen für die Chat-App

-- Erstelle users Tabelle
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  encryption_salt TEXT NOT NULL, -- Salt für PBKDF2 Key Derivation
  public_key TEXT, -- Optional: für asymmetrische Verschlüsselung
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle rooms Tabelle
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_encrypted BOOLEAN DEFAULT true, -- Markiert ob Raum verschlüsselt ist
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle room_members Tabelle (Junction Table für Many-to-Many Beziehung)
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true, -- Markiert aktive Mitglieder
  UNIQUE(room_id, user_id)
);

-- Erstelle messages Tabelle
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL, -- Verschlüsselter Nachrichteninhalt
  iv TEXT NOT NULL, -- Initialization Vector für AES-GCM
  message_type TEXT DEFAULT 'text', -- GT für zukünftige Erweiterungen (file, image, etc.)
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- Für Antworten
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON room_members(room_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Erstelle Funktionen für automatische Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger für updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
