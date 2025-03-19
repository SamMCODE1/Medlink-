-- Add mock equipment data if not already present
INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'MRI Scanner', 
  'Imaging', 
  'available', 
  (SELECT id FROM departments ORDER BY name LIMIT 1),
  NOW() - INTERVAL '30 days',
  'High-resolution imaging device'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'MRI Scanner' AND type = 'Imaging');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'CT Scanner', 
  'Imaging', 
  'available', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 1),
  NOW() - INTERVAL '15 days',
  'Full-body scanning capability'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'CT Scanner' AND type = 'Imaging');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Ultrasound Machine', 
  'Imaging', 
  'in_use', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 2),
  NOW() - INTERVAL '45 days',
  'Portable unit'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Ultrasound Machine' AND type = 'Imaging');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Ventilator', 
  'Life Support', 
  'available', 
  (SELECT id FROM departments ORDER BY name LIMIT 1),
  NOW() - INTERVAL '10 days',
  'ICU grade respiratory support'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Ventilator' AND type = 'Life Support');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Defibrillator', 
  'Emergency', 
  'available', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 1),
  NOW() - INTERVAL '60 days',
  'Cardiac emergency response unit'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Defibrillator' AND type = 'Emergency');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'ECG Machine', 
  'Diagnostic', 
  'maintenance', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 2),
  NOW() - INTERVAL '90 days',
  'Scheduled for calibration'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'ECG Machine' AND type = 'Diagnostic');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Surgical Robot', 
  'Surgery', 
  'in_use', 
  (SELECT id FROM departments ORDER BY name LIMIT 1),
  NOW() - INTERVAL '5 days',
  'Precision surgical assistant'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Surgical Robot' AND type = 'Surgery');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'X-Ray Machine', 
  'Imaging', 
  'out_of_order', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 1),
  NOW() - INTERVAL '120 days',
  'Awaiting replacement parts'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'X-Ray Machine' AND type = 'Imaging');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Anesthesia Machine', 
  'Surgery', 
  'available', 
  (SELECT id FROM departments ORDER BY name LIMIT 1 OFFSET 2),
  NOW() - INTERVAL '25 days',
  'General anesthesia delivery system'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Anesthesia Machine' AND type = 'Surgery');

INSERT INTO equipment (id, name, type, status, department_id, last_maintenance_date, notes)
SELECT 
  gen_random_uuid(), 
  'Patient Monitor', 
  'Monitoring', 
  'available', 
  NULL,
  NOW() - INTERVAL '40 days',
  'Vital signs monitoring system'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'Patient Monitor' AND type = 'Monitoring');
