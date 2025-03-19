-- Mock data for departments
INSERT INTO departments (id, name, floor, created_at)
VALUES
  ('d1', 'Emergency', 1, NOW()),
  ('d2', 'Cardiology', 2, NOW()),
  ('d3', 'Pediatrics', 3, NOW()),
  ('d4', 'Neurology', 2, NOW()),
  ('d5', 'Orthopedics', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for patients
INSERT INTO patients (id, full_name, date_of_birth, contact_number, email, created_at)
VALUES
  ('p1', 'John Smith', '1975-05-15', '555-123-4567', 'john.smith@example.com', NOW()),
  ('p2', 'Sarah Johnson', '1982-09-23', '555-234-5678', 'sarah.j@example.com', NOW()),
  ('p3', 'Michael Brown', '1968-11-30', '555-345-6789', 'mbrown@example.com', NOW()),
  ('p4', 'Emily Davis', '1990-03-12', '555-456-7890', 'emily.davis@example.com', NOW()),
  ('p5', 'Robert Wilson', '1955-07-28', '555-567-8901', 'rwilson@example.com', NOW()),
  ('p6', 'Jennifer Lee', '1988-01-17', '555-678-9012', 'jlee@example.com', NOW()),
  ('p7', 'David Martinez', '1972-12-05', '555-789-0123', 'dmartinez@example.com', NOW()),
  ('p8', 'Lisa Anderson', '1995-06-20', '555-890-1234', 'lisa.a@example.com', NOW()),
  ('p9', 'James Taylor', '1960-04-10', '555-901-2345', 'jtaylor@example.com', NOW()),
  ('p10', 'Maria Garcia', '1985-08-03', '555-012-3456', 'mgarcia@example.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for beds
INSERT INTO beds (id, department_id, bed_number, status, patient_id, notes, created_at)
VALUES
  ('b1', 'd1', '101', 'occupied', 'p1', 'Patient under observation', NOW()),
  ('b2', 'd1', '102', 'available', NULL, 'Ready for new patient', NOW()),
  ('b3', 'd1', '103', 'cleaning', NULL, 'Needs sanitization', NOW()),
  ('b4', 'd2', '201', 'occupied', 'p2', 'Post-surgery recovery', NOW()),
  ('b5', 'd2', '202', 'reserved', NULL, 'Reserved for incoming transfer', NOW()),
  ('b6', 'd2', '203', 'available', NULL, NULL, NOW()),
  ('b7', 'd3', '301', 'occupied', 'p3', 'Pediatric patient with parent', NOW()),
  ('b8', 'd3', '302', 'occupied', 'p4', NULL, NOW()),
  ('b9', 'd3', '303', 'available', NULL, 'Recently cleaned', NOW()),
  ('b10', 'd4', '401', 'occupied', 'p5', 'Requires neurological monitoring', NOW()),
  ('b11', 'd4', '402', 'cleaning', NULL, 'Deep cleaning required', NOW()),
  ('b12', 'd4', '403', 'available', NULL, NULL, NOW()),
  ('b13', 'd5', '501', 'occupied', 'p6', 'Post-hip replacement', NOW()),
  ('b14', 'd5', '502', 'occupied', 'p7', 'Traction setup', NOW()),
  ('b15', 'd5', '503', 'reserved', NULL, 'Reserved for scheduled surgery', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for staff
INSERT INTO staff (id, full_name, role, department_id, contact_number, email, created_at)
VALUES
  ('s1', 'Dr. James Wilson', 'doctor', 'd1', '555-111-2222', 'jwilson@hospital.com', NOW()),
  ('s2', 'Dr. Elizabeth Chen', 'doctor', 'd2', '555-222-3333', 'echen@hospital.com', NOW()),
  ('s3', 'Dr. Robert Johnson', 'doctor', 'd3', '555-333-4444', 'rjohnson@hospital.com', NOW()),
  ('s4', 'Dr. Patricia Martinez', 'doctor', 'd4', '555-444-5555', 'pmartinez@hospital.com', NOW()),
  ('s5', 'Dr. Thomas Lee', 'doctor', 'd5', '555-555-6666', 'tlee@hospital.com', NOW()),
  ('s6', 'Nurse Sarah Adams', 'nurse', 'd1', '555-666-7777', 'sadams@hospital.com', NOW()),
  ('s7', 'Nurse Michael Brown', 'nurse', 'd2', '555-777-8888', 'mbrown@hospital.com', NOW()),
  ('s8', 'Nurse Jennifer Lopez', 'nurse', 'd3', '555-888-9999', 'jlopez@hospital.com', NOW()),
  ('s9', 'Nurse David Kim', 'nurse', 'd4', '555-999-0000', 'dkim@hospital.com', NOW()),
  ('s10', 'Nurse Emily Davis', 'nurse', 'd5', '555-000-1111', 'edavis@hospital.com', NOW()),
  ('s11', 'Admin Jessica Taylor', 'admin', NULL, '555-123-7890', 'jtaylor@hospital.com', NOW()),
  ('s12', 'Nurse William Garcia', 'nurse', 'd1', '555-234-8901', 'wgarcia@hospital.com', NOW()),
  ('s13', 'Dr. Olivia Martin', 'doctor', 'd2', '555-345-9012', 'omartin@hospital.com', NOW()),
  ('s14', 'Nurse Sophia Rodriguez', 'nurse', 'd3', '555-456-0123', 'srodriguez@hospital.com', NOW()),
  ('s15', 'Admin Daniel Thompson', 'admin', NULL, '555-567-1234', 'dthompson@hospital.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for equipment
INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes, created_at)
VALUES
  ('e1', 'Ventilator A', 'Respiratory', 'in_use', 'd1', '2024-06-15', 'In use for patient in bed 101', NOW()),
  ('e2', 'ECG Machine 1', 'Cardiac', 'available', 'd2', '2024-06-20', NULL, NOW()),
  ('e3', 'Pediatric Incubator', 'Neonatal', 'in_use', 'd3', '2024-06-10', 'Currently in use', NOW()),
  ('e4', 'MRI Scanner', 'Imaging', 'maintenance', 'd4', '2024-05-30', 'Scheduled maintenance', NOW()),
  ('e5', 'Orthopedic Traction', 'Orthopedic', 'in_use', 'd5', '2024-06-25', 'In use for patient in bed 502', NOW()),
  ('e6', 'Defibrillator 1', 'Emergency', 'available', 'd1', '2024-06-18', 'Recently calibrated', NOW()),
  ('e7', 'Ultrasound Machine', 'Imaging', 'in_use', 'd2', '2024-06-05', NULL, NOW()),
  ('e8', 'Infant Warmer', 'Pediatric', 'available', 'd3', '2024-06-22', NULL, NOW()),
  ('e9', 'EEG Machine', 'Neurological', 'out_of_order', 'd4', '2024-05-15', 'Awaiting replacement part', NOW()),
  ('e10', 'Surgical Drill', 'Orthopedic', 'available', 'd5', '2024-06-12', NULL, NOW()),
  ('e11', 'Portable X-Ray', 'Imaging', 'in_use', 'd1', '2024-06-08', 'In use for emergency cases', NOW()),
  ('e12', 'Heart Monitor 3', 'Cardiac', 'available', 'd2', '2024-06-17', NULL, NOW()),
  ('e13', 'Oxygen Concentrator', 'Respiratory', 'in_use', 'd3', '2024-06-14', NULL, NOW()),
  ('e14', 'CT Scanner', 'Imaging', 'available', 'd4', '2024-06-01', 'Recently serviced', NOW()),
  ('e15', 'Physical Therapy Equipment', 'Rehabilitation', 'maintenance', 'd5', '2024-06-03', 'Scheduled maintenance', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for patient queue
INSERT INTO patient_queue (id, department_id, patient_id, priority, status, estimated_wait_time, notes, created_at)
VALUES
  ('q1', 'd1', 'p8', 1, 'waiting', 15, 'Severe chest pain', NOW()),
  ('q2', 'd1', 'p9', 3, 'waiting', 45, 'Minor laceration', NOW()),
  ('q3', 'd2', 'p10', 2, 'in_progress', 0, 'Cardiac evaluation', NOW()),
  ('q4', 'd3', 'p1', 4, 'waiting', 60, 'Routine checkup', NOW()),
  ('q5', 'd4', 'p2', 2, 'in_progress', 0, 'Neurological assessment', NOW()),
  ('q6', 'd5', 'p3', 3, 'waiting', 30, 'Joint pain evaluation', NOW()),
  ('q7', 'd1', 'p4', 1, 'in_progress', 0, 'Possible appendicitis', NOW()),
  ('q8', 'd2', 'p5', 5, 'completed', 0, 'Follow-up appointment', NOW()),
  ('q9', 'd3', 'p6', 2, 'waiting', 25, 'Pediatric fever', NOW()),
  ('q10', 'd4', 'p7', 4, 'cancelled', 0, 'Patient rescheduled', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mock data for notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES
  ('n1', (SELECT user_id FROM staff WHERE id = 's1' LIMIT 1), 'New Patient Assigned', 'You have been assigned to patient John Smith in Emergency', 'assignment', false, NOW()),
  ('n2', (SELECT user_id FROM staff WHERE id = 's2' LIMIT 1), 'Equipment Available', 'ECG Machine 1 is now available in Cardiology', 'equipment', false, NOW()),
  ('n3', (SELECT user_id FROM staff WHERE id = 's3' LIMIT 1), 'Bed Status Update', 'Bed 303 in Pediatrics is now available', 'bed', false, NOW()),
  ('n4', (SELECT user_id FROM staff WHERE id = 's4' LIMIT 1), 'Maintenance Alert', 'MRI Scanner scheduled for maintenance tomorrow', 'maintenance', false, NOW()),
  ('n5', (SELECT user_id FROM staff WHERE id = 's5' LIMIT 1), 'Patient Queue Update', 'New high-priority patient in Orthopedics queue', 'queue', false, NOW()),
  ('n6', (SELECT user_id FROM staff WHERE id = 's6' LIMIT 1), 'Department Meeting', 'Emergency department meeting at 3 PM today', 'meeting', false, NOW()),
  ('n7', (SELECT user_id FROM staff WHERE id = 's7' LIMIT 1), 'Shift Change', 'Your shift has been updated for next week', 'schedule', false, NOW()),
  ('n8', (SELECT user_id FROM staff WHERE id = 's8' LIMIT 1), 'New Protocol', 'New pediatric medication protocol available', 'protocol', false, NOW()),
  ('n9', (SELECT user_id FROM staff WHERE id = 's9' LIMIT 1), 'Training Reminder', 'Required safety training due by end of week', 'training', false, NOW()),
  ('n10', (SELECT user_id FROM staff WHERE id = 's10' LIMIT 1), 'Staff Meeting', 'All-staff meeting tomorrow at 9 AM', 'meeting', false, NOW())
ON CONFLICT (id) DO NOTHING;
