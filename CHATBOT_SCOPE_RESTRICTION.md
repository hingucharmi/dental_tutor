# Chatbot Scope Restriction Implementation

This document summarizes the implementation of strict scope restrictions for the dental assistant chatbot to only answer questions related to appointments, doctors, and clinic-related topics.

## Overview

The chatbot now has strict restrictions and will only respond to questions about:
- **Appointments**: Booking, scheduling, rescheduling, cancellation, appointment history
- **Doctors/Dentists**: Information about dentists, specialists, and clinic staff
- **Clinic Information**: Hours, location, contact, services, procedures
- **Dental Services**: Treatments, procedures, oral health, dental care
- **User's Medical Records**: Appointment history, dental records, post-op care

For any other questions (entertainment, sports, movies, general knowledge, etc.), the chatbot responds with: **"I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions."**

## Implementation Details

### 1. Scope Validation Function

**Function: `isQuestionInScope(userMessage: string)`**

This function checks if a question is within the allowed scope by:
- Checking for scope-related keywords (appointments, doctors, clinic, dental services)
- Checking for out-of-scope keywords (entertainment, sports, movies, etc.)
- Allowing short greetings and questions about user's own data
- Returning `false` for clearly out-of-scope questions

**Scope Keywords Include:**
- Appointments: appointment, book, schedule, reschedule, cancel, booking, slot, time, date
- Doctors: doctor, dentist, dr., physician, specialist, surgeon
- Clinic: clinic, office, hospital, location, address, phone, contact, hours
- Services: service, treatment, procedure, cleaning, checkup, filling, crown, implant
- Dental: dental, oral, tooth, teeth, gum, hygiene, brushing, flossing
- Medical: pain, ache, cavity, decay, infection, prescription, medication, insurance

**Out-of-Scope Keywords Include:**
- Entertainment: movie, film, actor, celebrity, music, song, artist
- Sports: sport, football, basketball, cricket, game, gaming
- General Knowledge: weather, news, politics, election, president, history, science
- Other: recipe, cooking, food, travel, vacation, shopping, fashion, technology

### 2. Early Rejection

Before processing any question:
1. The system checks if the question is in scope using `isQuestionInScope()`
2. If out of scope, immediately returns: "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions."
3. No RAG search or LLM processing is performed for out-of-scope questions
4. The rejection is logged for monitoring

### 3. Updated System Prompts

**English Prompt:**
- Explicitly states the chatbot can ONLY help with appointments, doctors, and clinic-related questions
- Includes critical restrictions section
- Provides clear instruction to reject out-of-scope questions
- Specifies the exact response format for rejections

**Spanish & French Prompts:**
- Translated versions with same restrictions
- Maintains consistency across languages

### 4. Prompt Reinforcement

The system prompt includes:
- A reminder system message: "REMEMBER: If the user asks about anything outside appointments, doctors, clinic, or dental services..."
- This reinforces the restriction at the prompt level

### 5. Post-Processing Safety Check

As a final safety measure:
- After LLM generates response, checks if original question was out-of-scope
- If response doesn't contain rejection message, overrides with standard rejection
- Ensures even if LLM tries to answer, the response is corrected

## Example Interactions

### ✅ In-Scope Questions (Allowed)

**User:** "I want to book an appointment"
**Chatbot:** "I'd be happy to help you book an appointment! I need a few details..."

**User:** "Who is my dentist?"
**Chatbot:** "Let me check your appointment history..."

**User:** "What services do you offer?"
**Chatbot:** "We offer the following services: Cleaning, Checkup, Filling..."

**User:** "What are your clinic hours?"
**Chatbot:** "Our clinic hours are Monday-Friday 9 AM - 5 PM..."

### ❌ Out-of-Scope Questions (Rejected)

**User:** "Who is the prime minister of India?"
**Chatbot:** "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?"

**User:** "Tell me a joke"
**Chatbot:** "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?"

**User:** "What's the weather today?"
**Chatbot:** "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?"

**User:** "Who won the football match?"
**Chatbot:** "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?"

## Technical Flow

1. **User sends message**
2. **Scope Check**: `isQuestionInScope()` validates the question
3. **If Out-of-Scope**:
   - Return rejection message immediately
   - Log the rejection
   - Save to conversation history
   - End processing
4. **If In-Scope**:
   - Continue with RAG search
   - Process with LLM
   - Generate response
   - Post-process to ensure response is appropriate
   - Return response

## Benefits

1. **Focused Service**: Chatbot stays focused on its core purpose
2. **Better User Experience**: Users get clear guidance on what the chatbot can help with
3. **Reduced Costs**: No unnecessary LLM processing for out-of-scope questions
4. **Compliance**: Ensures chatbot doesn't provide incorrect information on unrelated topics
5. **Professionalism**: Maintains professional boundaries

## Monitoring

The system logs:
- Out-of-scope question rejections
- Conversation ID and user ID
- First 100 characters of rejected message
- Timestamp

This allows monitoring of:
- What types of out-of-scope questions users are asking
- Frequency of rejections
- Potential improvements to scope detection

## Future Enhancements

Potential improvements:
1. **Machine Learning**: Train a model to better detect scope
2. **Contextual Understanding**: Better understanding of ambiguous questions
3. **Suggestions**: Suggest related in-scope questions when rejecting
4. **Analytics Dashboard**: Show scope rejection statistics
5. **Customizable Scope**: Allow admins to configure scope keywords

## Files Modified

- `src/lib/services/rag-chatbot.ts`:
  - Added `isQuestionInScope()` function
  - Updated `getSystemPrompt()` with restrictions
  - Added early rejection logic
  - Added post-processing safety check
  - Updated Spanish and French prompts

