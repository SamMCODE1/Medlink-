-- This migration adds mock data that will be visible to all users (admin, medical staff, reception)
-- but only admins will be able to edit it

-- First, ensure we have some departments
INSERT INTO departments (id, name, floor, created_at)
VALUES 
  ('d1', 'Emergency', 1, NOW()),
  ('d2', 'Cardiology', 2, NOW()),
  ('d3', 'Pediatrics', 3, NOW()),
  ('d4', 'Radiology', 1, NOW()),
  ('d5', 'Surgery', 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- Add equipment that will be visible to all users
INSERT INTO equipment (id, name, type, status, department_id, notes, created_at)
VALUES
  (uuid_generate_v4(), 'MRI Scanner 1', 'Imaging', 'available', 'd4', 'Last calibrated on July 15, 2024', NOW()),
  (uuid_generate_v4(), 'CT Scanner 2', 'Imaging', 'in_use', 'd4', 'Scheduled maintenance on August 5, 2024', NOW()),
  (uuid_generate_v4(), 'Ultrasound Machine 3', 'Imaging', 'available', 'd4', 'New machine, installed June 2024', NOW()),
  (uuid_generate_v4(), 'Ventilator 1', 'Respiratory', 'in_use', 'd1', 'Currently in use in ER', NOW()),
  (uuid_generate_v4(), 'Ventilator 2', 'Respiratory', 'available', 'd1', 'Backup unit', NOW()),
  (uuid_generate_v4(), 'Defibrillator 1', 'Emergency', 'available', 'd1', 'Checked weekly', NOW()),
  (uuid_generate_v4(), 'ECG Machine 1', 'Cardiology', 'in_use', 'd2', 'Primary unit for cardiology department', NOW()),
  (uuid_generate_v4(), 'Surgical Robot', 'Surgery', 'maintenance', 'd5', 'Under annual maintenance until July 25', NOW()),
  (uuid_generate_v4(), 'X-Ray Machine 1', 'Imaging', 'available', 'd4', 'Portable unit', NOW()),
  (uuid_generate_v4(), 'Anesthesia Machine 1', 'Surgery', 'in_use', 'd5', 'In use in OR 3', NOW()),
  (uuid_generate_v4(), 'Patient Monitor 1', 'Monitoring', 'available', 'd2', 'Wireless unit', NOW()),
  (uuid_generate_v4(), 'Patient Monitor 2', 'Monitoring', 'in_use', 'd3', 'In use in pediatric ICU', NOW()),
  (uuid_generate_v4(), 'Infusion Pump 1', 'Medication', 'available', 'd1', 'Smart pump with drug library', NOW()),
  (uuid_generate_v4(), 'Dialysis Machine 1', 'Nephrology', 'out_of_order', null, 'Awaiting replacement parts', NOW()),
  (uuid_generate_v4(), 'Portable Ultrasound', 'Imaging', 'available', null, 'Available for any department', NOW())
ON CONFLICT DO NOTHING;

-- Add some beds to departments
INSERT INTO beds (id, bed_number, department_id, status, notes, created_at)
VALUES
  (uuid_generate_v4(), 'E101', 'd1', 'available', 'Emergency bed near nurses station', NOW()),
  (uuid_generate_v4(), 'E102', 'd1', 'occupied', 'Patient admitted with chest pain', NOW()),
  (uuid_generate_v4(), 'E103', 'd1', 'cleaning', 'Being prepared for next patient', NOW()),
  (uuid_generate_v4(), 'C201', 'd2', 'available', 'Cardiology monitoring bed', NOW()),
  (uuid_generate_v4(), 'C202', 'd2', 'occupied', 'Post-op cardiac patient', NOW()),
  (uuid_generate_v4(), 'P301', 'd3', 'available', 'Pediatric bed with parent accommodation', NOW()),
  (uuid_generate_v4(), 'P302', 'd3', 'reserved', 'Reserved for scheduled admission', NOW()),
  (uuid_generate_v4(), 'S201', 'd5', 'cleaning', 'Post-surgical cleaning in progress', NOW()),
  (uuid_generate_v4(), 'S202', 'd5', 'available', 'Ready for surgical patient', NOW())
ON CONFLICT DO NOTHING;

-- Add some patients to the queue
INSERT INTO patients (id, full_name, contact_number, email, created_at)
VALUES
  (uuid_generate_v4(), 'John Smith', '555-123-4567', 'john.smith@example.com', NOW()),
  (uuid_generate_v4(), 'Maria Garcia', '555-234-5678', 'maria.garcia@example.com', NOW()),
  (uuid_generate_v4(), 'David Johnson', '555-345-6789', 'david.johnson@example.com', NOW()),
  (uuid_generate_v4(), 'Sarah Williams', '555-456-7890', 'sarah.williams@example.com', NOW()),
  (uuid_generate_v4(), 'Michael Brown', '555-567-8901', 'michael.brown@example.com', NOW())
ON CONFLICT DO NOTHING;

-- Get the IDs of the patients we just inserted
DO $$
DECLARE
  patient1_id uuid;
  patient2_id uuid;
  patient3_id uuid;
  patient4_id uuid;
  patient5_id uuid;
BEGIN
  SELECT id INTO patient1_id FROM patients WHERE full_name = 'John Smith' LIMIT 1;
  SELECT id INTO patient2_id FROM patients WHERE full_name = 'Maria Garcia' LIMIT 1;
  SELECT id INTO patient3_id FROM patients WHERE full_name = 'David Johnson' LIMIT 1;
  SELECT id INTO patient4_id FROM patients WHERE full_name = 'Sarah Williams' LIMIT 1;
  SELECT id INTO patient5_id FROM patients WHERE full_name = 'Michael Brown' LIMIT 1;
  
  -- Add patients to queue
  INSERT INTO patient_queue (id, department_id, patient_id, priority, status, estimated_wait_time, notes, created_at)
  VALUES
    (uuid_generate_v4(), 'd1', patient1_id, 2, 'waiting', 45, 'Chest pain, needs ECG', NOW()),
    (uuid_generate_v4(), 'd2', patient2_id, 3, 'waiting', 30, 'Follow-up appointment', NOW()),
    (uuid_generate_v4(), 'd3', patient3_id, 1, 'in_progress', 0, 'Pediatric emergency', NOW()),
    (uuid_generate_v4(), 'd4', patient4_id, 4, 'waiting', 60, 'Scheduled X-ray', NOW()),
    (uuid_generate_v4(), 'd5', patient5_id, 2, 'waiting', 90, 'Pre-surgical consultation', NOW())
  ON CONFLICT DO NOTHING;
END $$;
