-- Row Level Security (RLS) Policies für verschlüsselten Chat mit eigenem Auth-System
-- Diese Skripte aktivieren RLS und definieren Sicherheitsrichtlinien für die Custom Auth App

-- Aktiviere Row Level Security auf allen Tabellen
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lösche bestehende Policies falls vorhanden
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Room creators can update their rooms" ON rooms;
DROP POLICY IF EXISTS "Users can read room memberships" ON room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Room creators can remove members" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_members;
DROP POLICY IF EXISTS "Users can read messages from their rooms" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- USERS Policies - Für Custom Auth System
-- Erlaube alle Operationen auf users Tabelle (da wir eigenes Auth verwenden)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ROOMS Policies - Für Custom Auth System
-- Erlaube alle Operationen auf rooms Tabelle
CREATE POLICY "Allow all operations on rooms" ON rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ROOM_MEMBERS Policies - Für Custom Auth System
-- Erlaube alle Operationen auf room_members Tabelle
CREATE POLICY "Allow all operations on room_members" ON room_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- MESSAGES Policies - Für Custom Auth System
-- Erlaube alle Operationen auf messages Tabelle
CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Falls user_room_reads Tabelle existiert
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_room_reads') THEN
        ALTER TABLE user_room_reads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on user_room_reads" ON user_room_reads;
        CREATE POLICY "Allow all operations on user_room_reads" ON user_room_reads
          FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;

-- Optional: Falls user_sessions Tabelle existiert
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations on user_sessions" ON user_sessions;
        CREATE POLICY "Allow all operations on user_sessions" ON user_sessions
          FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;
