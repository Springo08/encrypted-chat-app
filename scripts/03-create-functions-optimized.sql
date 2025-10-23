-- Optimierte Funktionen für verschlüsselten Chat
-- Diese Funktionen bieten sichere und performante Zugriffe auf die Chat-Daten

-- Funktion um Benutzer-Räume mit neuester Nachricht zu erhalten
CREATE OR REPLACE FUNCTION get_user_rooms(user_uuid UUID)
RETURNS TABLE (
  room_id UUID,
  room_name TEXT,
  creator_id UUID,
  is_encrypted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  latest_message_ciphertext TEXT,
  latest_message_iv TEXT,
  latest_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.creator_id,
    r.is_encrypted,
    r.created_at,
    m.ciphertext,
    m.iv,
    m.created_at,
    COALESCE(unread.unread_count, 0) as unread_count
  FROM rooms r
  INNER JOIN room_members rm ON r.id = rm.room_id
  LEFT JOIN LATERAL (
    SELECT ciphertext, iv, created_at
    FROM messages
    WHERE room_id = r.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM messages msg
    WHERE msg.room_id = r.id 
    AND msg.created_at > COALESCE(
      (SELECT last_read_at FROM user_room_reads WHERE user_id = user_uuid AND room_id = r.id),
      rm.joined_at
    )
    AND msg.sender_id != user_uuid
  ) unread ON true
  WHERE rm.user_id = user_uuid
  AND rm.is_active = true
  ORDER BY COALESCE(m.created_at, r.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um Raum-Nachrichten zu erhalten
CREATE OR REPLACE FUNCTION get_room_messages(room_uuid UUID, user_uuid UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_username TEXT,
  ciphertext TEXT,
  iv TEXT,
  message_type TEXT,
  is_edited BOOLEAN,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID,
  reply_to_sender_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Prüfe ob Benutzer Mitglied des Raumes ist
  IF NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = room_uuid AND user_id = user_uuid AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    u.username,
    m.ciphertext,
    m.iv,
    m.message_type,
    m.is_edited,
    m.edited_at,
    m.reply_to_id,
    reply_user.username,
    m.created_at
  FROM messages m
  INNER JOIN users u ON m.sender_id = u.id
  LEFT JOIN messages reply_msg ON m.reply_to_id = reply_msg.id
  LEFT JOIN users reply_user ON reply_msg.sender_id = reply_user.id
  WHERE m.room_id = room_uuid
  ORDER BY m.created_at ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um einen neuen Raum zu erstellen
CREATE OR REPLACE FUNCTION create_room(
  room_name TEXT,
  creator_uuid UUID,
  member_usernames TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
  new_room_id UUID;
  member_user_id UUID;
BEGIN
  -- Erstelle den Raum
  INSERT INTO rooms (name, creator_id, is_encrypted)
  VALUES (room_name, creator_uuid, true)
  RETURNING id INTO new_room_id;

  -- Füge Ersteller als Mitglied hinzu
  INSERT INTO room_members (room_id, user_id)
  VALUES (new_room_id, creator_uuid);

  -- Füge andere Mitglieder hinzu
  FOREACH member_user_id IN ARRAY (
    SELECT id FROM users WHERE username = ANY(member_usernames)
  )
  LOOP
    INSERT INTO room_members (room_id, user_id)
    VALUES (new_room_id, member_user_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END LOOP;

  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um eine Nachricht zu senden
CREATE OR REPLACE FUNCTION send_message(
  room_uuid UUID,
  sender_uuid UUID,
  message_ciphertext TEXT,
  message_iv TEXT,
  message_type TEXT DEFAULT 'text',
  reply_to_message_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
BEGIN
  -- Prüfe ob Sender Mitglied des Raumes ist
  IF NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = room_uuid AND user_id = sender_uuid AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;

  -- Prüfe ob reply_to_message_id gültig ist (falls angegeben)
  IF reply_to_message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM messages WHERE id = reply_to_message_id AND room_id = room_uuid
  ) THEN
    RAISE EXCEPTION 'Reply message does not exist in this room';
  END IF;

  -- Erstelle die Nachricht
  INSERT INTO messages (room_id, sender_id, ciphertext, iv, message_type, reply_to_id)
  VALUES (room_uuid, sender_uuid, message_ciphertext, message_iv, message_type, reply_to_message_id)
  RETURNING id INTO new_message_id;

  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um Raum-Mitglieder zu erhalten
CREATE OR REPLACE FUNCTION get_room_members(room_uuid UUID, requesting_user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Prüfe ob anfragender Benutzer Mitglied des Raumes ist
  IF NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = room_uuid AND user_id = requesting_user_uuid AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;

  RETURN QUERY
  SELECT 
    rm.user_id,
    u.username,
    rm.joined_at,
    rm.is_active
  FROM room_members rm
  INNER JOIN users u ON rm.user_id = u.id
  WHERE rm.room_id = room_uuid
  ORDER BY rm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion um Benutzer-Registrierung zu handhaben
CREATE OR REPLACE FUNCTION register_user(
  user_username TEXT,
  user_password_hash TEXT,
  user_encryption_salt TEXT
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Prüfe ob Benutzername bereits existiert
  IF EXISTS (SELECT 1 FROM users WHERE username = user_username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  -- Erstelle neuen Benutzer
  INSERT INTO users (username, password_hash, encryption_salt)
  VALUES (user_username, user_password_hash, user_encryption_salt)
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
