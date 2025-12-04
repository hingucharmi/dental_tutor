-- Comprehensive Static FAQs for Dental Tutor

-- Clear existing FAQs (optional - comment out if you want to keep existing ones)
-- DELETE FROM faqs;

-- General FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('What are your office hours?', 'Our office is open Monday through Thursday from 9:00 AM to 5:00 PM, and Friday from 9:00 AM to 3:00 PM. We are closed on weekends. For emergencies outside business hours, please call our emergency line at 555-9111.', 'general', 1),
  ('Where is your office located?', 'Our dental office is conveniently located in the heart of the city. You can find our complete address, directions, and parking information on our Office Information page. We also offer free parking for all patients.', 'general', 2),
  ('How often should I visit the dentist?', 'It is recommended to visit the dentist every 6 months for regular checkups and cleanings. However, your dentist may recommend more frequent visits based on your oral health needs, such as if you have gum disease or are at high risk for cavities.', 'general', 3),
  ('What should I bring to my first appointment?', 'Please bring a valid ID, your insurance card (if applicable), a list of current medications, and any previous dental records or X-rays if available. Arrive 10-15 minutes early to complete any necessary paperwork.', 'general', 4),
  ('Do you treat children?', 'Yes, we welcome patients of all ages, including children. We recommend children have their first dental visit by age 1 or within 6 months of their first tooth appearing. Our team is experienced in making children feel comfortable during their visits.', 'general', 5),
  ('What services do you offer?', 'We offer a comprehensive range of dental services including routine cleanings, fillings, crowns, root canals, extractions, cosmetic dentistry, teeth whitening, orthodontics, and emergency dental care. Visit our Services page for a complete list.', 'general', 6),
  ('How do I know if I need to see a dentist?', 'You should see a dentist if you experience tooth pain, bleeding gums, sensitivity to hot or cold, loose teeth, persistent bad breath, or if it has been more than 6 months since your last checkup. Regular preventive visits are also important even without symptoms.', 'general', 7)
ON CONFLICT DO NOTHING;

-- Appointment FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('How can I schedule an appointment?', 'You can schedule an appointment in three ways: 1) Online through our website using the "Book Appointment" button, 2) Call our office during business hours, or 3) Use our AI chatbot assistant for quick booking. Online booking is available 24/7.', 'appointments', 10),
  ('Can I reschedule my appointment?', 'Yes, you can reschedule your appointment once through your account dashboard or by calling our office. Please note that appointments can only be rescheduled once. If you need to change it again, you may need to cancel and book a new appointment.', 'appointments', 11),
  ('What is your cancellation policy?', 'We require at least 24 hours notice for appointment cancellations. Late cancellations or no-shows may result in a cancellation fee. You can cancel your appointment through your account dashboard or by calling our office.', 'appointments', 12),
  ('How far in advance can I book an appointment?', 'You can book appointments up to 30 days in advance. For popular time slots, we recommend booking early. You can also join our waitlist if your preferred time is not available.', 'appointments', 13),
  ('What if I need an urgent appointment?', 'For urgent dental issues, we offer same-day appointments when available. Please call our office as early as possible, and we will do our best to accommodate you. For true emergencies, contact our emergency line at 555-9111.', 'appointments', 14),
  ('Can I book appointments for family members?', 'Yes, if you have a family account set up, you can manage appointments for all family members from your dashboard. Each family member will have their own appointment history and records.', 'appointments', 15),
  ('What happens if I''m late for my appointment?', 'We understand that sometimes delays happen. If you''re running late, please call us as soon as possible. We will try to accommodate you, but if you''re more than 15 minutes late, we may need to reschedule your appointment.', 'appointments', 16),
  ('Do you send appointment reminders?', 'Yes, we send appointment reminders via email, SMS, or push notifications based on your preferences. Reminders are typically sent 24 hours before your appointment. You can manage your notification preferences in your account settings.', 'appointments', 17)
ON CONFLICT DO NOTHING;

-- Insurance FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('Do you accept insurance?', 'Yes, we accept most major dental insurance plans including Delta Dental, Cigna, Aetna, MetLife, and many others. Please bring your insurance card to your appointment, and we will verify your coverage and benefits before treatment.', 'insurance', 20),
  ('How do I know if my insurance is accepted?', 'You can verify your insurance coverage by calling our office or checking your insurance information in your online account. We can verify your benefits before your appointment to give you an estimate of coverage.', 'insurance', 21),
  ('What if my insurance doesn''t cover a procedure?', 'If your insurance doesn''t cover a procedure, you will be responsible for the full cost. We will discuss all treatment options and costs with you before proceeding. We also offer payment plans for certain treatments.', 'insurance', 22),
  ('Do you accept Medicaid or Medicare?', 'We accept some Medicaid plans depending on your state and coverage. Medicare typically does not cover routine dental care, but may cover certain procedures. Please contact us to verify your specific coverage.', 'insurance', 23),
  ('Will you file my insurance claim?', 'Yes, we will file your insurance claim on your behalf. You will only be responsible for your copayment, deductible, and any non-covered services at the time of your visit.', 'insurance', 24),
  ('What is a pre-authorization?', 'A pre-authorization is when we submit a treatment plan to your insurance company before treatment to determine what they will cover. Some procedures require pre-authorization, and we will handle this process for you.', 'insurance', 25)
ON CONFLICT DO NOTHING;

-- Payment FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('What payment methods do you accept?', 'We accept cash, all major credit cards (Visa, MasterCard, American Express, Discover), debit cards, personal checks, and most insurance plans. We also offer flexible payment plans for certain treatments.', 'payment', 30),
  ('Do you offer payment plans?', 'Yes, we offer payment plans for certain treatments. Payment plans are typically interest-free and can be arranged based on your needs. Please speak with our office manager to discuss payment plan options.', 'payment', 31),
  ('When is payment due?', 'Payment is due at the time of service unless other arrangements have been made. For patients with insurance, you will pay your copayment, deductible, and any non-covered services at the time of your visit.', 'payment', 32),
  ('Can I pay my bill online?', 'Yes, you can pay your bill online through your patient portal. Simply log in to your account, view your invoices, and make a payment using a credit or debit card. You can also set up automatic payments.', 'payment', 33),
  ('What if I can''t afford treatment?', 'We understand that dental care can be expensive. We offer payment plans and can work with you to find a solution that fits your budget. We also accept CareCredit and other third-party financing options. Please speak with us about your situation.', 'payment', 34),
  ('Do you offer discounts?', 'We offer discounts for seniors, students, and military personnel. We also have promotional offers throughout the year. Check our website or ask our staff about current promotions and discounts.', 'payment', 35),
  ('Can I get an estimate before treatment?', 'Yes, we will provide you with a treatment plan and cost estimate before any procedure. If you have insurance, we will verify your benefits and provide an estimate of what your insurance will cover and what you will owe.', 'payment', 36)
ON CONFLICT DO NOTHING;

-- Emergency FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('What should I do in a dental emergency?', 'For severe pain, trauma, or bleeding, contact our emergency line immediately at 555-9111. For less urgent issues, call our office during business hours. If you have a life-threatening emergency, call 911 or go to your nearest emergency room.', 'emergency', 40),
  ('What constitutes a dental emergency?', 'Dental emergencies include severe tooth pain, knocked-out teeth, broken teeth, facial swelling, uncontrolled bleeding, or trauma to the mouth or jaw. If you''re unsure, it''s better to call us - we can help assess the situation.', 'emergency', 41),
  ('Do you offer emergency appointments?', 'Yes, we reserve time slots each day for emergency appointments. Please call our office as early as possible, and we will do our best to see you the same day. For after-hours emergencies, call our emergency line.', 'emergency', 42),
  ('What should I do if I knock out a tooth?', 'If you knock out a permanent tooth, try to place it back in the socket without touching the root. If that''s not possible, keep it moist in milk or saliva and get to a dentist immediately - within 30 minutes for the best chance of saving the tooth.', 'emergency', 43),
  ('What if I have a toothache?', 'For a toothache, rinse your mouth with warm water, floss to remove any food particles, and take over-the-counter pain medication if needed. Avoid placing aspirin directly on the tooth. Call us to schedule an appointment - persistent pain should be evaluated.', 'emergency', 44),
  ('What should I do if my tooth is chipped or broken?', 'Rinse your mouth with warm water, apply a cold compress to reduce swelling, and save any broken tooth pieces if possible. Call us immediately - we can often repair chipped or broken teeth the same day.', 'emergency', 45),
  ('Is there an after-hours emergency service?', 'Yes, we have an after-hours emergency line available 24/7. Call 555-9111 for urgent dental issues outside of business hours. Our on-call dentist will assess your situation and provide guidance or arrange emergency care if needed.', 'emergency', 46)
ON CONFLICT DO NOTHING;

