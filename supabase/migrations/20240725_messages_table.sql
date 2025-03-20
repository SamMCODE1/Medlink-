-- Create messages table for direct messaging between staff members
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see messages they sent or received
DROP POLICY IF EXISTS "Users can see their own messages" ON messages;
CREATE POLICY "Users can see their own messages" 
  ON messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create policy to allow users to insert messages they send
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" 
  ON messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Create policy to allow recipients to mark messages as read
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON messages;
CREATE POLICY "Recipients can mark messages as read" 
  ON messages 
  FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id AND is_read = true);

-- Enable realtime for messages - safely add to publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;

-- Create patient_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  department_id UUID REFERENCES departments(id) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  estimated_wait_time INTEGER,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'waiting',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for patient_queue - safely add to publication
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