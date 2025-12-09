-- Create monthly_goals table for storing revenue and transaction targets
CREATE TABLE IF NOT EXISTS monthly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  revenue_goal DECIMAL(12,2) DEFAULT 0,
  transactions_goal INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Enable RLS
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all goals
CREATE POLICY "Allow authenticated users to read goals"
  ON monthly_goals
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert/update goals
CREATE POLICY "Allow authenticated users to modify goals"
  ON monthly_goals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_monthly_goals_month_year ON monthly_goals(year DESC, month DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER monthly_goals_updated_at
  BEFORE UPDATE ON monthly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_goals_updated_at();
