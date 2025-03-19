-- Mock data for departments
INSERT INTO departments (id, name, floor, created_at)
VALUES
  (gen_random_uuid(), 'Emergency', 1, NOW()),
  (gen_random_uuid(), 'Cardiology', 2, NOW()),
  (gen_random_uuid(), 'Pediatrics', 3, NOW()),
  (gen_random_uuid(), 'Neurology', 2, NOW()),
  (gen_random_uuid(), 'Orthopedics', 1, NOW());

-- Mock data for patients
INSERT INTO patients (id, full_name, date_of_birth, contact_number, email, created_at)
VALUES
  (gen_random_uuid(), 'John Smith', '1975-05-15', '555-123-4567', 'john.smith@example.com', NOW()),
  (gen_random_uuid(), 'Sarah Johnson', '1982-09-23', '555-234-5678', 'sarah.j@example.com', NOW()),
  (gen_random_uuid(), 'Michael Brown', '1968-11-30', '555-345-6789', 'mbrown@example.com', NOW()),
  (gen_random_uuid(), 'Emily Davis', '1990-03-12', '555-456-7890', 'emily.davis@example.com', NOW()),
  (gen_random_uuid(), 'Robert Wilson', '1955-07-28', '555-567-8901', 'rwilson@example.com', NOW()),
  (gen_random_uuid(), 'Jennifer Lee', '1988-01-17', '555-678-9012', 'jlee@example.com', NOW()),
  (gen_random_uuid(), 'David Martinez', '1972-12-05', '555-789-0123', 'dmartinez@example.com', NOW()),
  (gen_random_uuid(), 'Lisa Anderson', '1995-06-20', '555-890-1234', 'lisa.a@example.com', NOW()),
  (gen_random_uuid(), 'James Taylor', '1960-04-10', '555-901-2345', 'jtaylor@example.com', NOW()),
  (gen_random_uuid(), 'Maria Garcia', '1985-08-03', '555-012-3456', 'mgarcia@example.com', NOW());

-- Get department IDs for reference
DO $$
DECLARE
  dept1_id UUID;
  dept2_id UUID;
  dept3_id UUID;
  dept4_id UUID;
  dept5_id UUID;
  patient1_id UUID;
  patient2_id UUID;
  patient3_id UUID;
  patient4_id UUID;
  patient5_id UUID;
  patient6_id UUID;
  patient7_id UUID;
BEGIN
  -- Get department IDs
  SELECT id INTO dept1_id FROM departments WHERE name = 'Emergency' LIMIT 1;
  SELECT id INTO dept2_id FROM departments WHERE name = 'Cardiology' LIMIT 1;
  SELECT id INTO dept3_id FROM departments WHERE name = 'Pediatrics' LIMIT 1;
  SELECT id INTO dept4_id FROM departments WHERE name = 'Neurology' LIMIT 1;
  SELECT id INTO dept5_id FROM departments WHERE name = 'Orthopedics' LIMIT 1;
  
  -- Get patient IDs
  SELECT id INTO patient1_id FROM patients WHERE full_name = 'John Smith' LIMIT 1;
  SELECT id INTO patient2_id FROM patients WHERE full_name = 'Sarah Johnson' LIMIT 1;
  SELECT id INTO patient3_id FROM patients WHERE full_name = 'Michael Brown' LIMIT 1;
  SELECT id INTO patient4_id FROM patients WHERE full_name = 'Emily Davis' LIMIT 1;
  SELECT id INTO patient5_id FROM patients WHERE full_name = 'Robert Wilson' LIMIT 1;
  SELECT id INTO patient6_id FROM patients WHERE full_name = 'Jennifer Lee' LIMIT 1;
  SELECT id INTO patient7_id FROM patients WHERE full_name = 'David Martinez' LIMIT 1;
  
  -- Insert beds
  INSERT INTO beds (id, department_id, bed_number, status, patient_id, notes, created_at)
  VALUES
    (gen_random_uuid(), dept1_id, '101', 'occupied', patient1_id, 'Patient under observation', NOW()),
    (gen_random_uuid(), dept1_id, '102', 'available', NULL, 'Ready for new patient', NOW()),
    (gen_random_uuid(), dept1_id, '103', 'cleaning', NULL, 'Needs sanitization', NOW()),
    (gen_random_uuid(), dept2_id, '201', 'occupied', patient2_id, 'Post-surgery recovery', NOW()),
    (gen_random_uuid(), dept2_id, '202', 'reserved', NULL, 'Reserved for incoming transfer', NOW()),
    (gen_random_uuid(), dept2_id, '203', 'available', NULL, NULL, NOW()),
    (gen_random_uuid(), dept3_id, '301', 'occupied', patient3_id, 'Pediatric patient with parent', NOW()),
    (gen_random_uuid(), dept3_id, '302', 'occupied', patient4_id, NULL, NOW()),
    (gen_random_uuid(), dept3_id, '303', 'available', NULL, 'Recently cleaned', NOW()),
    (gen_random_uuid(), dept4_id, '401', 'occupied', patient5_id, 'Requires neurological monitoring', NOW()),
    (gen_random_uuid(), dept4_id, '402', 'cleaning', NULL, 'Deep cleaning required', NOW()),
    (gen_random_uuid(), dept4_id, '403', 'available', NULL, NULL, NOW()),
    (gen_random_uuid(), dept5_id, '501', 'occupied', patient6_id, 'Post-hip replacement', NOW()),
    (gen_random_uuid(), dept5_id, '502', 'occupied', patient7_id, 'Traction setup', NOW()),
    (gen_random_uuid(), dept5_id, '503', 'reserved', NULL, 'Reserved for scheduled surgery', NOW());
    
  -- Insert staff
  INSERT INTO staff (id, full_name, role, department_id, contact_number, email, created_at)
  VALUES
    (gen_random_uuid(), 'Dr. James Wilson', 'doctor', dept1_id, '555-111-2222', 'jwilson@hospital.com', NOW()),
    (gen_random_uuid(), 'Dr. Elizabeth Chen', 'doctor', dept2_id, '555-222-3333', 'echen@hospital.com', NOW()),
    (gen_random_uuid(), 'Dr. Robert Johnson', 'doctor', dept3_id, '555-333-4444', 'rjohnson@hospital.com', NOW()),
    (gen_random_uuid(), 'Dr. Patricia Martinez', 'doctor', dept4_id, '555-444-5555', 'pmartinez@hospital.com', NOW()),
    (gen_random_uuid(), 'Dr. Thomas Lee', 'doctor', dept5_id, '555-555-6666', 'tlee@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse Sarah Adams', 'nurse', dept1_id, '555-666-7777', 'sadams@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse Michael Brown', 'nurse', dept2_id, '555-777-8888', 'mbrown@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse Jennifer Lopez', 'nurse', dept3_id, '555-888-9999', 'jlopez@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse David Kim', 'nurse', dept4_id, '555-999-0000', 'dkim@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse Emily Davis', 'nurse', dept5_id, '555-000-1111', 'edavis@hospital.com', NOW()),
    (gen_random_uuid(), 'Admin Jessica Taylor', 'admin', NULL, '555-123-7890', 'jtaylor@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse William Garcia', 'nurse', dept1_id, '555-234-8901', 'wgarcia@hospital.com', NOW()),
    (gen_random_uuid(), 'Dr. Olivia Martin', 'doctor', dept2_id, '555-345-9012', 'omartin@hospital.com', NOW()),
    (gen_random_uuid(), 'Nurse Sophia Rodriguez', 'nurse', dept3_id, '555-456-0123', 'srodriguez@hospital.com', NOW()),
    (gen_random_uuid(), 'Admin Daniel Thompson', 'admin', NULL, '555-567-1234', 'dthompson@hospital.com', NOW());
    
  -- Insert equipment
  INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes, created_at)
  VALUES
    (gen_random_uuid(), 'Ventilator A', 'Respiratory', 'in_use', dept1_id, '2024-06-15', 'In use for patient in bed 101', NOW()),
    (gen_random_uuid(), 'ECG Machine 1', 'Cardiac', 'available', dept2_id, '2024-06-20', NULL, NOW()),
    (gen_random_uuid(), 'Pediatric Incubator', 'Neonatal', 'in_use', dept3_id, '2024-06-10', 'Currently in use', NOW()),
    (gen_random_uuid(), 'MRI Scanner', 'Imaging', 'maintenance', dept4_id, '2024-05-30', 'Scheduled maintenance', NOW()),
    (gen_random_uuid(), 'Orthopedic Traction', 'Orthopedic', 'in_use', dept5_id, '2024-06-25', 'In use for patient in bed 502', NOW()),
    (gen_random_uuid(), 'Defibrillator 1', 'Emergency', 'available', dept1_id, '2024-06-18', 'Recently calibrated', NOW()),
    (gen_random_uuid(), 'Ultrasound Machine', 'Imaging', 'in_use', dept2_id, '2024-06-05', NULL, NOW()),
    (gen_random_uuid(), 'Infant Warmer', 'Pediatric', 'available', dept3_id, '2024-06-22', NULL, NOW()),
    (gen_random_uuid(), 'EEG Machine', 'Neurological', 'out_of_order', dept4_id, '2024-05-15', 'Awaiting replacement part', NOW()),
    (gen_random_uuid(), 'Surgical Drill', 'Orthopedic', 'available', dept5_id, '2024-06-12', NULL, NOW()),
    (gen_random_uuid(), 'Portable X-Ray', 'Imaging', 'in_use', dept1_id, '2024-06-08', 'In use for emergency cases', NOW()),
    (gen_random_uuid(), 'Heart Monitor 3', 'Cardiac', 'available', dept2_id, '2024-06-17', NULL, NOW()),
    (gen_random_uuid(), 'Oxygen Concentrator', 'Respiratory', 'in_use', dept3_id, '2024-06-14', NULL, NOW()),
    (gen_random_uuid(), 'CT Scanner', 'Imaging', 'available', dept4_id, '2024-06-01', 'Recently serviced', NOW()),
    (gen_random_uuid(), 'Physical Therapy Equipment', 'Rehabilitation', 'maintenance', dept5_id, '2024-06-03', 'Scheduled maintenance', NOW());
    
  -- Insert patient queue
  INSERT INTO patient_queue (id, department_id, patient_id, priority, status, estimated_wait_time, notes, created_at)
  SELECT 
    gen_random_uuid(), 
    dept_id, 
    patient_id, 
    priority, 
    status, 
    wait_time, 
    notes, 
    NOW()
  FROM (
    VALUES
      (dept1_id, (SELECT id FROM patients WHERE full_name = 'Lisa Anderson' LIMIT 1), 1, 'waiting', 15, 'Severe chest pain'),
      (dept1_id, (SELECT id FROM patients WHERE full_name = 'James Taylor' LIMIT 1), 3, 'waiting', 45, 'Minor laceration'),
      (dept2_id, (SELECT id FROM patients WHERE full_name = 'Maria Garcia' LIMIT 1), 2, 'in_progress', 0, 'Cardiac evaluation'),
      (dept3_id, patient1_id, 4, 'waiting', 60, 'Routine checkup'),
      (dept4_id, patient2_id, 2, 'in_progress', 0, 'Neurological assessment'),
      (dept5_id, patient3_id, 3, 'waiting', 30, 'Joint pain evaluation'),
      (dept1_id, patient4_id, 1, 'in_progress', 0, 'Possible appendicitis'),
      (dept2_id, patient5_id, 5, 'completed', 0, 'Follow-up appointment'),
      (dept3_id, patient6_id, 2, 'waiting', 25, 'Pediatric fever'),
      (dept4_id, patient7_id, 4, 'cancelled', 0, 'Patient rescheduled')
    ) AS t(dept_id, patient_id, priority, status, wait_time, notes);
    
 END $$;
