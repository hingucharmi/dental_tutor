# Chatbot Appointment Updates Implementation

This document summarizes the implementation of automatic appointment list updates on the website when appointments are booked, cancelled, or rescheduled through the chatbot.

## Overview

When users book, cancel, or reschedule appointments through the chatbot, the appointments list on the website automatically refreshes to show the updated information without requiring a manual page refresh.

## Features Implemented

### 1. Appointment Booking via Chatbot

**User Flow:**
- User requests booking: "I want to book an appointment for tomorrow at 2 PM"
- Chatbot books the appointment
- Website appointments list automatically refreshes
- New appointment appears in upcoming appointments

**Example:**
```
User: "Book me an appointment for 2024-12-25 at 14:00"
Chatbot: "Great! I've successfully booked your appointment for Cleaning on 2024-12-25 at 14:00. 
          Your appointment ID is 123. You'll receive a confirmation reminder before your appointment. 
          The appointment list on the website will be updated automatically."
```

### 2. Appointment Cancellation via Chatbot

**User Flow:**
- User requests cancellation: "Cancel my appointment #123" or "Cancel appointment 123"
- Chatbot cancels the appointment
- Website appointments list automatically refreshes automatically
- Cancelled appointment is removed from upcoming list

**Example:**
```
User: "Cancel appointment 123"
Chatbot: "I've successfully cancelled your appointment (ID: 123). 
          The appointment list on the website will be updated automatically."
```

### 3. Appointment Rescheduling via Chatbot

**User Flow:**
- User requests reschedule: "Reschedule appointment 123 to 2024-12-26 at 15:00"
- Chatbot reschedules the appointment
- Website appointments list automatically refreshes
- Updated appointment appears with new date/time

**Example:**
```
User: "Reschedule appointment 123 to 2024-12-26 at 15:00"
Chatbot: "I've successfully rescheduled your appointment to 2024-12-26 at 15:00. 
          The appointment list on the website will be updated automatically."
```

## Technical Implementation

### 1. New Functions Added (`src/lib/services/rag-chatbot.ts`)

#### `cancelAppointment(userId, appointmentId, reason?)`
- Cancels an appointment by setting status to 'cancelled'
- Checks if appointment belongs to user
- Prevents double cancellation
- Returns success/error status

#### `rescheduleAppointment(userId, appointmentId, newDate, newTime)`
- Reschedules an appointment to new date/time
- Checks slot availability
- Checks for duplicate appointments
- Updates appointment record
- Returns success/error status

### 2. Request Detection

/lib/services/rag-chatbot.ts`)

Added detection for:
- **Cancel requests**: Messages containing "cancel" and "appointment"
- **Reschedule requests**: Messages containing "reschedule", "change", or "move" + "appointment"

### 3. Action Tracking

The chatbot now tracks:
- `appointmentAction`: 'booked' | 'cancelled' | 'rescheduled' | null
- `appointmentId`: ID of the appointment that was modified

These are returned in the API response and used to trigger page refreshes.

### 4. Event Dispatching (`src/components/chat/ChatWidget.tsx`)

When chatbot response includes appointment action:
- **Booked**: Dispatches `appointment-created` event
- **Cancelled**: Dispatches `appointment-cancelled` event
- **Rescheduled**: Dispatches `appointment-rescheduled` event

### 5. Event Listening (`src/app/appointments/page.tsx`)

The appointments page listens for:
- `appointment-created` event
- `appointment-cancelled` event
- `appointment-rescheduled` event

When any of these events fire, `fetchAppointments()` is called to refresh the list.

## API Changes

### Updated Response Format (`src/app/api/chat/message/route.ts`)

The chat message API now returns:
```json
{
  "success": true,
  "data": {
    "response": "Chatbot response text",
    "conversationId": 123,
    "appointmentAction": "booked" | "cancelled" | "rescheduled" | null,
    "appointmentId": 456 | null
  }
}
```

## User Experience Flow

### Booking Flow:
1. User types: "Book appointment for tomorrow at 2 PM"
2. Chatbot processes request
3. Appointment created in database
4. Chatbot responds with confirmation
5. `appointment-created` event dispatched
6. Appointments page automatically refreshes
7. New appointment appears in list

### Cancellation Flow:
1. User types: "Cancel appointment 123"
2. Chatbot processes request
3. Appointment status updated to 'cancelled'
4. Chatbot responds with confirmation
5. `appointment-cancelled` event dispatched
6. Appointments page automatically refreshes
7. Cancelled appointment removed from list

### Reschedule Flow:
1. User types: "Reschedule appointment 123 to 2024-12-26 at 15:00"
2. Chatbot processes request
3. Appointment date/time updated
4. Chatbot responds with confirmation
5. `appointment-rescheduled` event dispatched
6. Appointments page automatically refreshes
7. Updated appointment appears with new date/time

## Error Handling

The chatbot handles:
- **Invalid appointment ID**: "Appointment not found or you do not have permission..."
- **Already cancelled**: "This appointment has already been cancelled."
- **Slot unavailable**: "The time slot is not available. Available slots: ..."
- **Duplicate appointment**: "You already have an appointment for this service on this date."

## Benefits

1. **Real-time Updates**: Appointments list updates immediately without page refresh
2. **Better UX**: Users see changes instantly after chatbot actions
3. **Consistent State**: Website and chatbot stay in sync
4. **No Manual Refresh**: Automatic updates reduce user friction

## Testing

To test the implementation:

1. **Test Booking:**
   - Open chatbot
   - Book an appointment
   - Check appointments page - should show new appointment

2. **Test Cancellation:**
   - Open chatbot
   - Cancel an appointment (mention ID)
   - Check appointments page - cancelled appointment should be removed

3. **Test Rescheduling:**
   - Open chatbot
   - Reschedule an appointment
   - Check appointments page - should show updated date/time

## Files Modified

- `src/lib/services/rag-chatbot.ts`:
  - Added `cancelAppointment()` function
  - Added `rescheduleAppointment()` function
  - Added cancel/reschedule request detection
  - Added action tracking (appointmentAction, appointmentId)
  - Updated return type to include action metadata

- `src/app/api/chat/message/route.ts`:
  - Updated to return appointmentAction and appointmentId

- `src/components/chat/ChatWidget.tsx`:
  - Added event dispatching for appointment actions
  - Dispatches `appointment-created`, `appointment-cancelled`, `appointment-rescheduled` events

- `src/app/appointments/page.tsx`:
  - Added listeners for `appointment-cancelled` and `appointment-rescheduled` events
  - Refreshes appointments list when events fire

## Future Enhancements

Potential improvements:
1. **Visual Feedback**: Show loading state while appointment is being processed
2. **Toast Notifications**: Display success/error messages when appointments are modified
3. **Optimistic Updates**: Update UI immediately, then sync with server
4. **Conflict Resolution**: Better handling of concurrent modifications
5. **Undo Functionality**: Allow users to undo cancellations within a time window

