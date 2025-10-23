-- Function to get user's rooms with latest message
CREATE OR REPLACE FUNCTION get_user_rooms(user_uuid UUID)
RETURNS TABLE (
  room_id UUID,
  room_name TEXT,
  creator_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  latest_message TEXT,
  latest_message_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.creator_id,
    r.created_at,
    m.encrypted_content,
    m.created_at
  FROM rooms r
  INNER JOIN room_members rm ON r.id = rm.room_id
  LEFT JOIN LATERAL (
    SELECT encrypted_content, created_at
    FROM messages
    WHERE room_id = r.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  WHERE rm.user_id = user_uuid
  ORDER BY COALESCE(m.created_at, r.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get room messages
CREATE OR REPLACE FUNCTION get_room_messages(room_uuid UUID, user_uuid UUID)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_username TEXT,
  encrypted_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = room_uuid AND user_id = user_uuid
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    u.username,
    m.encrypted_content,
    m.created_at
  FROM messages m
  INNER JOIN users u ON m.sender_id = u.id
  WHERE m.room_id = room_uuid
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
