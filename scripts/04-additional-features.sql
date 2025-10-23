-- Zusätzliche Features für erweiterte Chat-Funktionalität

-- Tabelle für Nachrichten-Lese-Status
CREATE TABLE IF NOT EXISTS user_room_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_user_room_reads_user_room ON user_room_reads(user_id, room_id);

-- RLS für user_room_reads
ALTER TABLE user_room_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own read status" ON user_room_reads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status" ON user_room_reads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabelle für Benutzer-Sessions (für bessere Authentifizierung)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Index für Session-Token
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- RLS für user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own sessions" ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Funktion um Lese-Status zu aktualisieren
CREATE OR REPLACE FUNCTION mark_room_as_read(user_uuid UUID, room_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_room_reads (user_id, room_id, last_read_at)
  VALUES (user_uuid, room_uuid, NOW())
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET 
    last_read_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um ungelesene Nachrichten zu zählen
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS TABLE (
  room_id UUID,
  room_name TEXT,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    COUNT(m.id) as unread_count
  FROM rooms r
  INNER JOIN room_members rm ON r.id = rm.room_id
  LEFT JOIN messages m ON m.room_id = r.id 
    AND m.sender_id != user_uuid
    AND m.created_at > COALESCE(
      (SELECT urr.last_read_at FROM user_room_reads urr WHERE urr.user_id = user_uuid AND urr.room_id = r.id),
      rm.joined_at
    )
  WHERE rm.user_id = user_uuid AND rm.is_active = true
  GROUP BY r.id, r.name
  HAVING COUNT(m.id) > 0
  ORDER BY unread_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um alte Sessions zu bereinigen
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um Nachrichten-Statistiken zu erhalten
CREATE OR REPLACE FUNCTION get_message_stats(user_uuid UUID)
RETURNS TABLE (
  total_messages BIGINT,
  messages_sent_today BIGINT,
  rooms_active BIGINT,
  total_rooms BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM messages m 
     INNER JOIN room_members rm ON m.room_id = rm.room_id 
     WHERE rm.user_id = user_uuid AND rm.is_active = true) as total_messages,
    (SELECT COUNT(*) FROM messages m 
     INNER JOIN room_members rm ON m.room_id = rm.room_id 
     WHERE rm.user_id = user_uuid AND rm.is_active = true 
     AND m.sender_id = user_uuid 
     AND m.created_at >= CURRENT_DATE) as messages_sent_today,
    (SELECT COUNT(DISTINCT r.id) FROM rooms r
     INNER JOIN room_members rm ON r.id = rm.room_id
     LEFT JOIN messages m ON m.room_id = r.id
     WHERE rm.user_id = user_uuid AND rm.is_active = true
     AND m.created_at >= NOW() - INTERVAL '7 days') as rooms_active,
    (SELECT COUNT(*) FROM room_members rm 
     WHERE rm.user_id = user_uuid AND rm.is_active = true) as total_rooms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
