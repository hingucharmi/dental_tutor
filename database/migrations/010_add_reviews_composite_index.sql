-- Add composite index for reviews table to optimize dentist queries
-- This index helps with queries that filter by dentist_id and status together

CREATE INDEX IF NOT EXISTS idx_reviews_dentist_status ON reviews(dentist_id, status) 
WHERE status = 'approved';

-- Also add index on status alone for better filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status) 
WHERE status = 'approved';

