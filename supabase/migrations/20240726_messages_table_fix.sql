-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR (auth.uid() = recipient_id AND is_read = true));

-- Create patient_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  estimated_wait_time INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS patient_queue_patient_id_idx ON patient_queue(patient_id);
CREATE INDEX IF NOT EXISTS patient_queue_department_id_idx ON patient_queue(department_id);
CREATE INDEX IF NOT EXISTS patient_queue_status_idx ON patient_queue(status);
CREATE INDEX IF NOT EXISTS patient_queue_priority_idx ON patient_queue(priority);

-- Enable RLS
ALTER TABLE patient_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON patient_queue;
CREATE POLICY "Public read access"
  ON patient_queue FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can insert" ON patient_queue;
CREATE POLICY "Staff can insert"
  ON patient_queue FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update" ON patient_queue;
CREATE POLICY "Staff can update"
  ON patient_queue FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Staff can delete" ON patient_queue;
CREATE POLICY "Staff can delete"
  ON patient_queue FOR DELETE
  USING (true);

-- Enable realtime for messages table
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add tables to realtime publication if they're not already there
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Only add patient_queue to realtime if it's not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'patient_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE patient_queue;
  END IF;
END
$$;