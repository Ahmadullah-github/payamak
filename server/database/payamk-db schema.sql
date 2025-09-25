
-- Re-create the ENUM types
CREATE TYPE chat_type AS ENUM ('private', 'group');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'away');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'file', 'audio');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE member_role AS ENUM ('member', 'admin');


-- Create the tables WITHOUT foreign keys first
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    profile_picture_id BIGINT,
    status user_status DEFAULT 'active',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Now, add the foreign key constraints using ALTER TABLE
ALTER TABLE users 
ADD CONSTRAINT fk_profile_picture 
FOREIGN KEY (profile_picture_id) REFERENCES files(id) ON DELETE SET NULL;

ALTER TABLE files 
ADD CONSTRAINT fk_uploaded_by
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

-- Re-create the rest of your excellent schema which depends on users and files
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    type chat_type NOT NULL,
    name VARCHAR(100),
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (type = 'private' AND name IS NULL OR type = 'group' AND name IS NOT NULL)
);

CREATE TABLE chat_members (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role member_role DEFAULT 'member',
    UNIQUE (chat_id, user_id)
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_file_id BIGINT REFERENCES files(id) ON DELETE SET NULL,
    message_type message_type DEFAULT 'text',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status message_status DEFAULT 'sent'
);

CREATE TABLE message_reads (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id)
);

-- Indexes for performance (PG-specific: partial indexes where useful)
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages USING btree (timestamp DESC);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at DESC);
-- Optional: Full-text search on messages.content
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));