-- Create reports table for flagging inappropriate items
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(reason) >= 3 AND length(reason) <= 500),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_item_id ON reports(item_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);

-- Prevent duplicate pending reports from same user on same item
CREATE UNIQUE INDEX idx_reports_unique_pending 
  ON reports(item_id, reporter_id) 
  WHERE status = 'pending';

-- Updated_at trigger
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can report items
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can read all reports
CREATE POLICY "Admins can read all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update reports (status, admin_note)
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can withdraw their own pending reports
CREATE POLICY "Users can delete own pending reports"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = reporter_id AND status = 'pending');
