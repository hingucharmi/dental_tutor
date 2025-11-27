-- Seed services
INSERT INTO services (name, description, duration, base_price, category) VALUES
  ('Routine Checkup', 'Regular dental examination and cleaning', 30, 150.00, 'preventive'),
  ('Teeth Cleaning', 'Professional teeth cleaning and polishing', 45, 120.00, 'preventive'),
  ('Root Canal', 'Root canal treatment', 90, 800.00, 'restorative'),
  ('Tooth Extraction', 'Simple tooth extraction', 30, 200.00, 'surgery'),
  ('Dental Filling', 'Cavity filling', 45, 250.00, 'restorative'),
  ('Teeth Whitening', 'Professional teeth whitening treatment', 60, 400.00, 'cosmetic'),
  ('Crown', 'Dental crown placement', 60, 1200.00, 'restorative'),
  ('Dental Implant', 'Dental implant procedure', 120, 3000.00, 'surgery')
ON CONFLICT DO NOTHING;

