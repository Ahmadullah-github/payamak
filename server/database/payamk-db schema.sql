-- 1. Create ENUM types first
CREATE TYPE chat_type AS ENUM ('private', 'group');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'away');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'file', 'audio');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE member_role AS ENUM ('member', 'admin');

-- 2. Create users table first (minimal dependencies)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    profile_picture_id BIGINT,
    status user_status DEFAULT 'active',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    socket_id VARCHAR(255)
);

-- 3. Create files table (depends on users for uploaded_by)
CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE
);

-- 4. Add foreign key constraints between users and files
ALTER TABLE users 
ADD CONSTRAINT fk_profile_picture 
FOREIGN KEY (profile_picture_id) REFERENCES files(id) ON DELETE SET NULL;

ALTER TABLE files 
ADD CONSTRAINT fk_uploaded_by
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Create chats table (depends on users)
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    type chat_type NOT NULL,
    name VARCHAR(100),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_id BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    CHECK (type = 'private' AND name IS NULL OR type = 'group' AND name IS NOT NULL)
);

-- 6. Add foreign key for created_by in chats
ALTER TABLE chats 
ADD CONSTRAINT chats_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Create chat_members table (depends on chats and users)
CREATE TABLE chat_members (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role member_role DEFAULT 'member',
    UNIQUE (chat_id, user_id)
);

-- 8. Add foreign keys for chat_members
ALTER TABLE chat_members 
ADD CONSTRAINT chat_members_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_members 
ADD CONSTRAINT chat_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. Create messages table (depends on chats, users, and files)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT,
    media_file_id BIGINT,
    message_type message_type DEFAULT 'text',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status message_status DEFAULT 'sent'
);

-- 10. Add foreign keys for messages
ALTER TABLE messages 
ADD CONSTRAINT messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_media_file_id_fkey 
FOREIGN KEY (media_file_id) REFERENCES files(id) ON DELETE SET NULL;

-- 11. Add foreign key for last_message_id in chats
ALTER TABLE chats 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- 12. Create message_deliveries table (depends on messages and users)
CREATE TABLE message_deliveries (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id)
);

-- 13. Add foreign keys for message_deliveries
ALTER TABLE message_deliveries 
ADD CONSTRAINT message_deliveries_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE message_deliveries 
ADD CONSTRAINT message_deliveries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 14. Create message_reads table (depends on messages and users)
CREATE TABLE message_reads (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id)
);

-- 15. Add foreign keys for message_reads
ALTER TABLE message_reads 
ADD CONSTRAINT message_reads_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE message_reads 
ADD CONSTRAINT message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 16. Create indexes for performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages USING btree (timestamp DESC);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at DESC);
CREATE INDEX idx_message_deliveries_message_id ON message_deliveries(message_id);
CREATE INDEX idx_message_deliveries_user_id ON message_deliveries(user_id);
CREATE INDEX idx_message_deliveries_delivered_at ON message_deliveries(delivered_at DESC);

-- 17. Create composite indexes
CREATE INDEX idx_messages_chat_timestamp ON messages(chat_id, timestamp DESC);
CREATE INDEX idx_messages_sender_timestamp ON messages(sender_id, timestamp DESC);
CREATE INDEX idx_chat_members_user_chat ON chat_members(user_id, chat_id);
CREATE INDEX idx_chats_last_activity ON chats(last_activity DESC);
CREATE INDEX idx_chat_members_user_joined ON chat_members(user_id, joined_at DESC);

-- 18. Create partial indexes
CREATE INDEX idx_messages_unread ON messages(chat_id, timestamp DESC) 
WHERE status IN ('sent', 'delivered');

CREATE INDEX idx_active_users ON users(id, last_seen) WHERE status = 'active';
CREATE INDEX idx_users_online ON users(id, is_online) WHERE is_online = TRUE;

-- 19. Create full-text search index
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));

-- 20. Create materialized view
CREATE MATERIALIZED VIEW chat_list_view AS
SELECT 
    c.id as chat_id,
    c.type,
    c.name,
    c.last_activity,
    c.message_count,
    lm.content as last_message_content,
    lm.timestamp as last_message_time,
    sender.full_name as last_sender_name,
    c.created_by
FROM chats c
LEFT JOIN messages lm ON c.last_message_id = lm.id
LEFT JOIN users sender ON lm.sender_id = sender.id;

-- 21. Create index on materialized view
CREATE INDEX idx_chat_list_view_activity ON chat_list_view(last_activity DESC);

-- 22. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_chat_list_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY chat_list_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 23. Create function to get unread count
CREATE OR REPLACE FUNCTION get_unread_count(user_id_param BIGINT, chat_id_param BIGINT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM messages m
    WHERE m.chat_id = chat_id_param
    AND m.sender_id != user_id_param
    AND m.id NOT IN (
        SELECT mr.message_id 
        FROM message_reads mr 
        WHERE mr.user_id = user_id_param
    );
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 24. Create trigger function for chat activity
CREATE OR REPLACE FUNCTION update_chat_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chats 
        SET 
            last_message_id = NEW.id,
            last_activity = NEW.timestamp,
            message_count = message_count + 1
        WHERE id = NEW.chat_id;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 25. Create trigger for chat activity
CREATE TRIGGER trigger_update_chat_activity
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_activity();

-- 26. Create monitoring views
CREATE VIEW message_stats AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as message_count,
    COUNT(DISTINCT chat_id) as active_chats,
    COUNT(DISTINCT sender_id) as active_users
FROM messages 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

CREATE VIEW chat_activity_stats AS
SELECT 
    c.id,
    c.name,
    c.type,
    COUNT(m.id) as total_messages,
    COUNT(DISTINCT m.sender_id) as unique_senders,
    MAX(m.timestamp) as last_message_time
FROM chats c
LEFT JOIN messages m ON c.id = m.chat_id
GROUP BY c.id, c.name, c.type
ORDER BY total_messages DESC;