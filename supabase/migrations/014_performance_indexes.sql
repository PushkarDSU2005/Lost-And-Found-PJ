-- =============================================================================
-- Migration 014: Performance Optimization Indexes
-- =============================================================================
-- Purpose: Improve query performance for Browse page and common queries
-- Task: 16b - Performance optimization (Lighthouse)
-- =============================================================================

-- ── Index for Browse page main query ─────────────────────────────────────────
-- Query: SELECT * FROM items WHERE status = 'open' AND report_type = ? ORDER BY created_at DESC
-- Already exists: idx_items_type_status_created
-- But let's add a covering index to avoid table lookups

CREATE INDEX IF NOT EXISTS idx_items_browse_covering
ON items(status, report_type, created_at DESC, category)
WHERE status = 'open';

-- ── Index for location-based filtering ───────────────────────────────────────
-- Query: Browse filtered by location
CREATE INDEX IF NOT EXISTS idx_items_location_status
ON items(location_id, status, created_at DESC)
WHERE location_id IS NOT NULL AND status = 'open';

-- ── Index for category-based filtering ───────────────────────────────────────
-- Query: Browse filtered by category
CREATE INDEX IF NOT EXISTS idx_items_category_status
ON items(category, status, report_type, created_at DESC)
WHERE status = 'open';

-- ── Index for user dashboard "My Posts" tab ──────────────────────────────────
-- Query: SELECT * FROM items WHERE reporter_id = ? ORDER BY created_at DESC
-- Existing index: Already covered by idx_items_reporter_id (from 003_indexes.sql)

-- ── Index for claims lookup by item ──────────────────────────────────────────
-- Query: SELECT * FROM claims WHERE item_id = ? ORDER BY created_at DESC
-- Already exists: idx_claims_item_id

-- ── Index for notification polling query ─────────────────────────────────────
-- Query: SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL
-- Already exists: idx_notifications_user_unread (partial index)

-- ── Analyze tables after creating indexes ────────────────────────────────────
-- Update statistics for query planner
ANALYZE items;
ANALYZE claims;
ANALYZE notifications;

-- ── Add comment on new indexes ───────────────────────────────────────────────
COMMENT ON INDEX idx_items_browse_covering IS 'Covering index for Browse page - includes category to avoid table lookup';
COMMENT ON INDEX idx_items_location_status IS 'Index for location-filtered Browse queries';
COMMENT ON INDEX idx_items_category_status IS 'Index for category-filtered Browse queries';
