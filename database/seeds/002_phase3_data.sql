-- Insert default office information
INSERT INTO office_info (name, address, city, state, zip_code, phone, email, latitude, longitude, parking_info, office_hours) VALUES
  ('Dental Tutor Clinic', '123 Main Street', 'New York', 'NY', '10001', '555-0100', 'info@dentaltutor.com', 40.7128, -74.0060, 'Free parking available in rear lot', 
   '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "15:00"}, "saturday": null, "sunday": null}')
ON CONFLICT DO NOTHING;

