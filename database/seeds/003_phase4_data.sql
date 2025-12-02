-- Emergency contacts
INSERT INTO emergency_contacts (name, phone, email, available_24_7, priority) VALUES
  ('Emergency Dental Line', '555-9111', 'emergency@dentaltutor.com', TRUE, 1),
  ('After Hours Service', '555-9112', 'afterhours@dentaltutor.com', TRUE, 2)
ON CONFLICT DO NOTHING;

-- Sample dental tips
INSERT INTO dental_tips (title, content, category, tags, featured) VALUES
  ('Brush Twice Daily', 'Brush your teeth at least twice a day with fluoride toothpaste. Morning and before bed are ideal times.', 'preventive', ARRAY['brushing', 'hygiene'], TRUE),
  ('Floss Daily', 'Flossing removes plaque and food particles between teeth that brushing cannot reach. Make it a daily habit.', 'preventive', ARRAY['flossing', 'hygiene'], TRUE),
  ('Limit Sugary Foods', 'Reduce consumption of sugary foods and drinks. They can lead to tooth decay and cavities.', 'preventive', ARRAY['diet', 'cavities'], FALSE),
  ('Regular Dental Checkups', 'Visit your dentist every 6 months for regular checkups and cleanings to maintain oral health.', 'preventive', ARRAY['checkups', 'prevention'], TRUE)
ON CONFLICT DO NOTHING;

-- Sample FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('How often should I visit the dentist?', 'It is recommended to visit the dentist every 6 months for regular checkups and cleanings. However, your dentist may recommend more frequent visits based on your oral health needs.', 'general', 1),
  ('What should I do in a dental emergency?', 'For severe pain, trauma, or bleeding, contact our emergency line immediately at 555-9111. For less urgent issues, call our office during business hours.', 'emergency', 2),
  ('Do you accept insurance?', 'Yes, we accept most major dental insurance plans. Please bring your insurance card to your appointment, and we will verify your coverage.', 'insurance', 3),
  ('How can I schedule an appointment?', 'You can schedule an appointment online through our website, call our office, or use our chatbot assistant for quick booking.', 'appointments', 4),
  ('What payment methods do you accept?', 'We accept cash, credit cards, debit cards, and most insurance plans. We also offer payment plans for certain treatments.', 'payment', 5)
ON CONFLICT DO NOTHING;

-- Sample preparation instructions
INSERT INTO preparation_instructions (service_id, title, content, display_order) VALUES
  (1, 'Before Your Cleaning', 'Please arrive 10 minutes early. Bring a list of current medications. Avoid eating heavy meals 1 hour before appointment.', 1),
  (1, 'What to Expect', 'The cleaning will take approximately 30-45 minutes. You may experience slight sensitivity during the procedure.', 2)
ON CONFLICT DO NOTHING;

-- Sample care instructions
INSERT INTO care_instructions (treatment_type, title, content, duration_days) VALUES
  ('extraction', 'Post-Extraction Care', 'Avoid rinsing for 24 hours. Apply ice packs to reduce swelling. Take prescribed pain medication as directed. Avoid smoking and drinking through straws.', 7),
  ('filling', 'After Filling Care', 'Avoid hard foods for 24 hours. You may experience sensitivity to hot and cold - this is normal. Maintain good oral hygiene.', 3),
  ('cleaning', 'Post-Cleaning Care', 'Continue regular brushing and flossing. You may experience slight sensitivity - this should subside within 24-48 hours.', 2)
ON CONFLICT DO NOTHING;

-- Sample pain management content
INSERT INTO pain_management_content (title, content, pain_level_min, pain_level_max, recommendations, escalation_threshold) VALUES
  ('Mild Discomfort', 'For mild tooth pain (1-3), try over-the-counter pain relievers like ibuprofen. Rinse with warm salt water. Avoid very hot or cold foods.', 1, 3, 'Take OTC pain reliever, use warm salt water rinse', 4),
  ('Moderate Pain', 'For moderate pain (4-6), take prescribed or OTC pain medication. Apply a cold compress to the outside of your cheek. Avoid chewing on the affected side.', 4, 6, 'Take pain medication, apply cold compress, contact dentist if persists', 7),
  ('Severe Pain', 'For severe pain (7-10), this may indicate a serious issue. Take pain medication and contact our emergency line immediately. Apply cold compress and avoid any pressure on the area.', 7, 10, 'URGENT: Contact emergency dental line immediately', 7)
ON CONFLICT DO NOTHING;

