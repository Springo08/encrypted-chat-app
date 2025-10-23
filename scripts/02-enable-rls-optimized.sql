-- Row Level Security (RLS) Policies für verschlüsselten Chat
-- Diese Skripte aktivieren RLS und definieren Sicherheitsrichtlinien

-- Aktiviere Row Level Security auf allen Tabellen
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lösche bestehende Policies falls vorhanden
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can read room memberships" ON room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON room_members;
DROP POLICY IF EXISTS "Users can read messages from their rooms" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON messages;

-- USERS Policies
-- Benutzer können ihre eigenen Daten lesen
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Benutzer können ihre eigenen Daten aktualisieren
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Benutzer können neue Konten erstellen (für Registrierung)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ROOMS Policies
-- Benutzer können Räume lesen, in denen sie Mitglieder sind
CREATE POLICY "Users can read rooms they are members of" ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = rooms.id
      AND room_members.user_id = auth.uid()
      AND room_members.is_active = true
    )
  );

-- Benutzer können neue Räume erstellen
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Raum-Ersteller können ihre Räume aktualisieren
CREATE POLICY "Room creators can update their rooms" ON rooms
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- ROOM_MEMBERS Policies
-- Benutzer können Mitgliedschaften für Räume lesen, in denen sie Mitglieder sind
CREATE POLICY "Users can read room memberships" ON room_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
      AND rm.is_active = true
    )
  );

-- Raum-Ersteller können Mitglieder hinzufügen
CREATE POLICY "Room creators can add members" ON room_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.creator_id = auth.uid()
    )
  );

-- Benutzer können sich selbst zu Räumen hinzufügen (falls erlaubt)
CREATE POLICY "Users can join rooms" ON room_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Raum-Ersteller können Mitglieder entfernen
CREATE POLICY "Room creators can remove members" ON room_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.creator_id = auth.uid()
    )
  );

-- Benutzer können sich selbst aus Räumen entfernen
CREATE POLICY "Users can leave rooms" ON room_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- MESSAGES Policies
-- Benutzer können Nachrichten aus Räumen lesen, in denen sie Mitglieder sind
CREATE POLICY "Users can read messages from their rooms" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = messages.room_id
      AND room_members.user_id = auth.uid()
      AND room_members.is_active = true
    )
  );

-- Benutzer können Nachrichten in Räume senden, in denen sie Mitglieder sind
CREATE POLICY "Users can send messages to their rooms" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = messages.room_id
      AND room_members.user_id = auth.uid()
      AND room_members.is_active = true
    )
  );

-- Benutzer können ihre eigenen Nachrichten bearbeiten
CREATE POLICY "Users can edit their own messages" ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Benutzer können ihre eigenen Nachrichten löschen
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE
  USING (auth.uid() = sender_id);
