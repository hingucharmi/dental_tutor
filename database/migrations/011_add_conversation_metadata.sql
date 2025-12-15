-- Add metadata column to conversations table for state tracking
-- This enables multi-turn conversation flows and state persistence

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries (GIN index for efficient JSONB queries)
CREATE INDEX IF NOT EXISTS idx_conversations_metadata 
ON conversations USING GIN (metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN conversations.metadata IS 'Stores conversation state for multi-turn flows. Example: {"pendingAction": "book", "collectedInfo": {"service": "cleaning"}, "missingInfo": ["date", "time"]}';

