-- Create Administration department if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Administration') THEN
    INSERT INTO departments (id, name, floor)
    VALUES (gen_random_uuid(), 'Administration', 1);
  END IF;
END;
$$;

-- Add mock data for patient queue
INSERT INTO patient_queue (id, patient_id, department_id, status, priority, notes, estimated_wait_time)
SELECT
  gen_random_uuid(),
  p.id,
  d.id,
  data.status,
  data.priority,
  data.notes,
  data.estimated_wait_time
FROM (
  -- Patient 1 - High priority in Emergency
  SELECT 
    (SELECT id FROM patients WHERE full_name = 'John Smith' LIMIT 1) as patient_id,
    (SELECT id FROM departments WHERE name = 'Emergency Department' LIMIT 1) as department_id,
    'waiting' as status,
    2 as priority,
    'Severe chest pain, needs immediate attention' as notes,
    15 as estimated_wait_time
  UNION ALL
  -- Patient 2 - Medium in Emergency
  SELECT 
    (SELECT id FROM patients WHERE full_name = 'Maria Garcia' LIMIT 1) as patient_id,
    (SELECT id FROM departments WHERE name = 'Emergency Department' LIMIT 1) as department_id,
    'waiting' as status,
    1 as priority,
    'Broken arm, moderate pain' as notes,
    25 as estimated_wait_time
  UNION ALL
  -- Patient 3 - Low in Emergency
  SELECT 
    (SELECT id FROM patients WHERE full_name = 'Robert Johnson' LIMIT 1) as patient_id,
    (SELECT id FROM departments WHERE name = 'Emergency Department' LIMIT 1) as department_id,
    'waiting' as status,
    0 as priority,
    'Fever and headache' as notes,
    40 as estimated_wait_time
  UNION ALL
  -- Patient 4 - Medium in Cardiology
  SELECT 
    (SELECT id FROM patients WHERE full_name = 'Sarah Williams' LIMIT 1) as patient_id,
    (SELECT id FROM departments WHERE name = 'Cardiology' LIMIT 1) as department_id,
    'in_progress' as status,
    1 as priority,
    'Regular checkup for heart condition' as notes,
    0 as estimated_wait_time
  UNION ALL
  -- Patient 5 - Medium in Orthopedics
  SELECT 
    (SELECT id FROM patients WHERE full_name = 'David Brown' LIMIT 1) as patient_id,
    (SELECT id FROM departments WHERE name = 'Orthopedics' LIMIT 1) as department_id,
    'waiting' as status,
    1 as priority,
    'Follow-up for knee surgery' as notes,
    30 as estimated_wait_time
) as data
JOIN patients p ON p.id = data.patient_id
JOIN departments d ON d.id = data.department_id
WHERE NOT EXISTS (
  SELECT 1 FROM patient_queue
  WHERE patient_id = data.patient_id AND status != 'completed'
);

-- Add mock data for equipment with valid status values
INSERT INTO equipment (id, name, type, status, department_id, notes, last_maintenance_date)
SELECT
  gen_random_uuid(),
  data.name,
  data.type,
  data.status,
  d.id,
  data.notes,
  CURRENT_DATE - (data.maintenance_days * INTERVAL '1 day')
FROM (
  -- Equipment 1 - Ventilator in ICU
  SELECT 
    'Ventilator 1' as name,
    'respiratory' as type,
    'available' as status,
    'Intensive Care' as dept_name,
    'Recently serviced' as notes,
    15 as maintenance_days
  UNION ALL
  -- Equipment 2 - MRI Machine in Radiology
  SELECT 
    'MRI Machine 1' as name,
    'imaging' as type,
    'available' as status,
    'Radiology' as dept_name,
    'Scheduled for software update next month' as notes,
    30 as maintenance_days
  UNION ALL
  -- Equipment 3 - Anesthesia Machine in Surgical
  SELECT 
    'Anesthesia Machine 2' as name,
    'surgical' as type,
    'available' as status,
    'Surgery' as dept_name,
    'Needs gas sensor replacement' as notes,
    110 as maintenance_days
  UNION ALL
  -- Equipment 4 - Ultrasound in Maternity
  SELECT 
    'Ultrasound Machine 3' as name,
    'imaging' as type,
    'available' as status,
    'Maternity' as dept_name,
    'New model, high resolution' as notes,
    60 as maintenance_days
  UNION ALL
  -- Equipment 5 - Defibrillator in Emergency
  SELECT 
    'Defibrillator 2' as name,
    'emergency' as type,
    'available' as status,
    'Emergency Department' as dept_name,
    'Battery replaced last month' as notes,
    10 as maintenance_days
  UNION ALL
  -- Equipment 6 - ECG Machine in Cardiology
  SELECT 
    'ECG Machine 1' as name,
    'diagnostic' as type,
    'available' as status,
    'Cardiology' as dept_name,
    'Calibration needed soon' as notes,
    50 as maintenance_days
  UNION ALL
  -- Equipment 7 - X-Ray in Radiology
  SELECT 
    'X-Ray Machine 2' as name,
    'imaging' as type,
    'available' as status,
    'Radiology' as dept_name,
    'Currently undergoing annual maintenance' as notes,
    90 as maintenance_days
  UNION ALL
  -- Equipment 8 - Infusion Pump in Oncology
  SELECT 
    'Infusion Pump 5' as name,
    'medication' as type,
    'available' as status,
    'Oncology' as dept_name,
    'New model with improved flow control' as notes,
    55 as maintenance_days
) as data
JOIN departments d ON d.name = data.dept_name
WHERE NOT EXISTS (
  SELECT 1 FROM equipment WHERE name = data.name AND department_id = d.id
);

-- Assign admin users to admin department if not already assigned
UPDATE staff
SET department_id = (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1)
WHERE role = 'admin' AND (department_id IS NULL OR department_id != (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1));

-- Make sure the realtime publication includes these tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'patient_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE patient_queue;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'equipment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'staff'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END;
$$;