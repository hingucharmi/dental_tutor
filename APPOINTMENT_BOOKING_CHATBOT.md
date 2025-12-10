# Appointment Booking via Chatbot - Implementation Summary

This document summarizes the implementation of appointment booking and appointment history features through the chatbot using LangChain + RAG.

## Overview

The chatbot now acts as a **Personal Medical Coordinator** that can:
1. **Book appointments** directly through conversation
2. **Retrieve appointment history** including past and upcoming appointments
3. **Answer questions** about dental services, procedures, and oral health using RAG

## Features Implemented

### 1. Appointment Booking

Users can book appointments through natural language conversation. The chatbot:

- **Detects booking requests** from phrases like:
  - "I want to book an appointment"
  - "Schedule me for..."
  - "Book appointment for..."

- **Extracts date and time** from multiple formats:
  - ISO format: `2024-12-25`
  - Natural language: "tomorrow", "next week", "3 days from now"
  - Time formats: `14:30`, `2:30 PM`, `10:00 AM`

- **Checks availability** before booking:
  - Queries available slots for the requested date
  - Validates time slot availability
  - Suggests alternative times if requested slot is unavailable

- **Books appointments** directly to the database:
  - Creates appointment record with user ID
  - Sets status to 'scheduled'
  - Returns confirmation with appointment ID

- **Provides context** about:
  - Available services with descriptions and prices
  - Available dentists with specializations
  - Available time slots for upcoming days

### 2. Appointment History

Users can view their appointment history through conversation. The chatbot:

- **Detects history requests** from phrases like:
  - "Show my appointments"
  - "Appointment history"
  - "When is my next appointment?"
  - "My past appointments"

- **Retrieves appointments** from database:
  - Fetches up to 10 most recent appointments
  - Includes past and upcoming appointments
  - Shows appointment details: date, time, service, dentist, status

- **Formats response** clearly:
  - Separates upcoming and past appointments
  - Shows appointment details in readable format
  - Provides helpful context for each appointment

### 3. RAG Integration

The chatbot continues to use RAG for:
- Answering dental health questions
- Providing information about services and procedures
- Guiding users through common dental concerns

## Technical Implementation

### Functions Added (`src/lib/services/rag-chatbot.ts`)

1. **`getAvailableSlots(date, dentistId?, serviceId?)`**
   - Queries database for available time slots
   - Respects business hours (Mon-Fri, 9 AM - 5 PM)
   - Filters out booked slots and past times
   - Returns JSON with available slots

2. **`getServices()`**
   - Fetches all available dental services
   - Returns service details: name, description, duration, price, category

3. **`getDentists()`**
   - Fetches all available dentists
   - Returns dentist details: name, specialization, bio

4. **`bookAppointment(userId, date, time, serviceId?, dentistId?, notes?)`**
   - Validates slot availability
   - Creates appointment record in database
   - Returns booking confirmation or error

5. **`getAppointmentHistory(userId, limit)`**
   - Fetches user's appointment history
   - Joins with services and dentists tables
   - Returns formatted appointment list

### Updated System Prompt

The system prompt now instructs the LLM to:
- Act as a Personal Medical Coordinator
- Help with appointment booking and history
- Use available tools and context
- Be friendly, empathetic, and professional
- Ask for clarification when needed

### Request Detection

The chatbot uses pattern matching to detect:
- **Booking requests**: Contains "book", "schedule", or "appointment" + "want"/"need"
- **History requests**: Contains "history", "my appointments", "upcoming", "when is my"

### Natural Language Processing

Enhanced date/time extraction:
- ISO date format: `YYYY-MM-DD`
- Natural language dates: "tomorrow", "next week", "3 days from now"
- 24-hour time: `14:30`
- 12-hour time: `2:30 PM`, `10:00 AM`

## Usage Examples

### Booking an Appointment

**User:** "I want to book an appointment for tomorrow at 2 PM"

**Chatbot Response:**
```
Great! I've successfully booked your appointment for 2024-12-26 at 14:00. 
Your appointment ID is 123. You'll receive a confirmation reminder before your appointment.
```

### Viewing Appointment History

**User:** "Show my appointments"

**Chatbot Response:**
```
Here's your appointment history:

**Upcoming Appointments:**
- 2024-12-26 at 14:00: Cleaning with Dr. John Smith (Status: scheduled)
- 2025-01-05 at 10:00: Checkup (Status: scheduled)

**Past Appointments:**
- 2024-11-15 at 11:00: Filling with Dr. Jane Doe (Status: completed)
- 2024-10-20 at 09:00: Cleaning (Status: completed)
```

### Checking Availability

**User:** "I need an appointment next week"

**Chatbot Response:**
```
I'd be happy to help you book an appointment! Here are available slots for next week:

2024-12-30: 09:00, 09:30, 10:00, 10:30, 11:00...
2024-12-31: 09:00, 09:30, 10:00, 10:30, 11:00...
2025-01-02: 09:00, 09:30, 10:00, 10:30, 11:00...

Please let me know which date and time works for you, and I'll book it right away!
```

## Database Schema

The implementation uses existing tables:
- `appointments`: Stores appointment records
- `services`: Stores available services
- `dentists`: Stores dentist information
- `users`: Links appointments to users

## Error Handling

The chatbot handles:
- Unavailable time slots (suggests alternatives)
- Invalid date/time formats (asks for clarification)
- Database errors (logs and returns user-friendly message)
- Missing information (asks user for details)

## Future Enhancements

Potential improvements:
1. **Multi-step booking flow**: Guide users through booking process step-by-step
2. **Service/Dentist selection**: Allow users to specify preferred service or dentist
3. **Rescheduling**: Enable rescheduling existing appointments
4. **Cancellation**: Allow canceling appointments through chat
5. **Calendar integration**: Show calendar view of available slots
6. **Appointment reminders**: Remind users about upcoming appointments in chat
7. **Advanced NLP**: Use LLM to better extract dates/times from natural language

## Testing

To test the appointment booking feature:

1. **Start a conversation** with the chatbot
2. **Try booking**: "I want to book an appointment for tomorrow at 2 PM"
3. **Check history**: "Show my appointments"
4. **View availability**: "What times are available next week?"

## Notes

- The chatbot requires user authentication (userId must be provided)
- Appointments are created directly in the database
- The system respects business hours and existing bookings
- All booking actions are logged for audit purposes

