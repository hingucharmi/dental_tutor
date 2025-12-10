import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

// Simple text splitter function
function splitText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // Try to break at sentence boundaries if not at the end
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start = end - chunkOverlap;
      }
    } else {
      start = end;
    }
    
    chunks.push(chunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Dental knowledge base - This can be loaded from files or database
const dentalKnowledgeBase = `
# Dental Clinic Information

## Services Offered
- Routine Checkup: Regular dental examination and cleaning (30 min, $150)
- Teeth Cleaning: Professional teeth cleaning and polishing (45 min, $120)
- Root Canal: Root canal treatment (90 min, $800)
- Tooth Extraction: Simple tooth extraction (30 min, $200)
- Dental Filling: Cavity filling (45 min, $250)
- Teeth Whitening: Professional teeth whitening treatment (60 min, $400)
- Crown: Dental crown placement (60 min, $1200)
- Dental Implant: Dental implant procedure (120 min, $3000)

## Office Hours
- Monday-Thursday: 9:00 AM - 5:00 PM
- Friday: 9:00 AM - 3:00 PM
- Saturday-Sunday: Closed

## Appointment Booking
- Appointments can be booked online through the patient portal
- Same-day appointments may be available for emergencies
- Please arrive 10 minutes early for your appointment
- Cancellations should be made at least 24 hours in advance

## Insurance & Payment
- We accept most major dental insurance plans
- Payment plans available for major procedures
- Credit cards, debit cards, and cash accepted
- Insurance verification available before appointment

## Common Dental Procedures

### Routine Checkup
A comprehensive examination including:
- Visual inspection of teeth and gums
- X-rays if needed
- Professional cleaning
- Oral health assessment
- Recommendations for treatment if needed

### Root Canal
Treatment for infected or damaged tooth pulp:
- Local anesthesia administered
- Removal of infected pulp
- Cleaning and sealing the root canal
- Crown placement may be needed afterward
- Usually completed in 1-2 visits

### Dental Implant
Permanent tooth replacement solution:
- Titanium post surgically placed in jawbone
- Healing period of 3-6 months
- Crown attached to implant
- Looks and functions like natural tooth
- Requires good oral hygiene

## Oral Health Tips
- Brush teeth twice daily with fluoride toothpaste
- Floss daily to remove plaque between teeth
- Use mouthwash to reduce bacteria
- Limit sugary foods and drinks
- Visit dentist every 6 months for checkups
- Replace toothbrush every 3-4 months

## Emergency Care
- For dental emergencies, call our office immediately
- Common emergencies: severe toothache, knocked-out tooth, broken tooth, abscess
- After-hours emergency contact available
- We prioritize urgent cases

## Pre-Appointment Instructions
- Complete medical history forms online before visit
- Bring insurance card and ID
- List current medications
- Arrive 10 minutes early
- For certain procedures, fasting may be required (you'll be notified)

## Post-Treatment Care
- Follow specific instructions provided after treatment
- Take prescribed medications as directed
- Avoid hard foods immediately after procedures
- Use ice packs for swelling if recommended
- Contact office if experiencing unusual pain or complications
`;

// Simple in-memory vector store implementation
interface VectorDocument {
  content: string;
  embedding: number[];
}

let vectorStore: VectorDocument[] | null = null;

async function initializeVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  try {
    // Split documents into chunks
    const chunks = splitText(dentalKnowledgeBase, 1000, 200);

    // Generate embeddings for all chunks
    const embeddingsList = await embeddings.embedDocuments(chunks);

    // Store documents with embeddings
    vectorStore = chunks.map((chunk, index) => ({
      content: chunk,
      embedding: embeddingsList[index],
    }));

    logger.info('Vector store initialized', { documentCount: chunks.length });
    return vectorStore;
  } catch (error) {
    logger.error('Failed to initialize vector store', error as Error);
    throw error;
  }
}

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Search for similar documents
async function similaritySearch(queryText: string, k: number = 4): Promise<string[]> {
  const store = await initializeVectorStore();
  if (!store || store.length === 0) {
    return [];
  }

  // Generate embedding for query
  const queryEmbedding = await embeddings.embedQuery(queryText);

  // Calculate similarities
  const similarities = store.map((doc) => ({
    content: doc.content,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by similarity and return top k
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
    .map((item) => item.content);
}

// Appointment booking and history functions
async function getAvailableSlots(date: string, dentistId?: number, serviceId?: number) {
  try {
    // Business hours configuration (matching slots API)
    const BUSINESS_HOURS: Record<string, { start: string; end: string } | null> = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '15:00' },
      saturday: null,
      sunday: null,
    };

    const SLOT_DURATION = 30;
    const selectedDate = new Date(date + 'T00:00:00');
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
    const hours = BUSINESS_HOURS[dayName];

    if (!hours) {
      return JSON.stringify({ available: false, slots: [], date, message: `No business hours for ${dayName}` });
    }

    // Generate all slots
    const generateSlots = (start: string, end: string): string[] => {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const slots: string[] = [];
      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
        currentMin += SLOT_DURATION;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
      return slots;
    };

    const allSlots = generateSlots(hours.start, hours.end);

    // Get booked appointments
    let bookedQuery = `
      SELECT appointment_time, duration 
      FROM appointments 
      WHERE appointment_date = $1 AND status != 'cancelled'
    `;
    const queryParams: any[] = [date];

    if (dentistId) {
      bookedQuery += ' AND dentist_id = $2';
      queryParams.push(dentistId);
    }

    const bookedResult = await query(bookedQuery, queryParams);
    const bookedSlots = new Set<string>();

    bookedResult.rows.forEach((row) => {
      const [hour, min] = row.appointment_time.split(':').map(Number);
      const duration = row.duration || 30;
      const slotsNeeded = Math.ceil(duration / SLOT_DURATION);

      for (let i = 0; i < slotsNeeded; i++) {
        const slotMin = min + i * SLOT_DURATION;
        const slotHour = hour + Math.floor(slotMin / 60);
        const finalMin = slotMin % 60;
        bookedSlots.add(`${String(slotHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`);
      }
    });

    // Filter out past times if today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = date === todayStr;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const validSlots = isToday 
      ? allSlots.filter((slot) => slot > currentTime)
      : allSlots;

    const availableSlots = validSlots.filter((slot) => !bookedSlots.has(slot));

    return JSON.stringify({
      available: availableSlots.length > 0,
      slots: availableSlots,
      date,
      businessHours: hours
    });
  } catch (error) {
    logger.error('Error fetching slots', error as Error);
    return JSON.stringify({ error: 'Failed to fetch available slots' });
  }
}

async function getServices() {
  try {
    const result = await query('SELECT id, name, description, duration, base_price, category FROM services ORDER BY name ASC');
    
    const services = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      price: parseFloat(row.base_price) || null,
      category: row.category,
    }));
    
    return JSON.stringify(services);
  } catch (error) {
    logger.error('Error fetching services', error as Error);
    return JSON.stringify({ error: 'Failed to fetch services' });
  }
}

async function getDentists() {
  try {
    const result = await query(`
      SELECT d.id, u.first_name, u.last_name, d.specialization, d.bio
      FROM dentists d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY u.first_name ASC, u.last_name ASC
    `);
    
    const dentists = result.rows.map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      specialization: row.specialization,
      bio: row.bio,
    }));
    
    return JSON.stringify(dentists);
  } catch (error) {
    logger.error('Error fetching dentists', error as Error);
    return JSON.stringify({ error: 'Failed to fetch dentists' });
  }
}

async function checkDuplicateAppointment(userId: number, serviceId: number | null, appointmentDate: string) {
  try {
    if (!serviceId) {
      return null; // No service specified, can't check for duplicates
    }

    const duplicateCheck = await query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status,
              s.name as service_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.user_id = $1 
       AND a.service_id = $2 
       AND a.appointment_date = $3 
       AND a.status != 'cancelled'`,
      [userId, serviceId, appointmentDate]
    );

    if (duplicateCheck.rows.length > 0) {
      const existing = duplicateCheck.rows[0];
      return {
        exists: true,
        appointment: {
          id: existing.id,
          date: existing.appointment_date,
          time: existing.appointment_time,
          service: existing.service_name,
          status: existing.status
        }
      };
    }

    return { exists: false };
  } catch (error) {
    logger.error('Error checking duplicate appointment', error as Error);
    return null;
  }
}

async function bookAppointment(userId: number, appointmentDate: string, appointmentTime: string, serviceId?: number, dentistId?: number, notes?: string) {
  try {
    // Check for duplicate appointment (same service on same date)
    if (serviceId) {
      const duplicateCheck = await checkDuplicateAppointment(userId, serviceId, appointmentDate);
      if (duplicateCheck?.exists && duplicateCheck.appointment) {
        return JSON.stringify({ 
          success: false, 
          error: `You already have an appointment for ${duplicateCheck.appointment.service} on ${appointmentDate} at ${duplicateCheck.appointment.time}. Please choose a different date or service.`,
          duplicateAppointment: duplicateCheck.appointment
        });
      }
    }
    
    // Check if slot is available first
    const slotsData = await getAvailableSlots(appointmentDate, dentistId, serviceId);
    const slots = JSON.parse(slotsData);
    
    if (!slots.available || !slots.slots.includes(appointmentTime)) {
      return JSON.stringify({ 
        success: false, 
        error: `The time slot ${appointmentTime} is not available on ${appointmentDate}. Available slots: ${slots.slots.join(', ')}` 
      });
    }
    
    // Create appointment in database
    try {
      const result = await query(
        `INSERT INTO appointments 
         (user_id, dentist_id, service_id, appointment_date, appointment_time, duration, status, notes)
         VALUES ($1, $2, $3, $4, $5, 
           COALESCE((SELECT duration FROM services WHERE id = $3), 30),
           'scheduled', $6)
         RETURNING id, appointment_date, appointment_time, status`,
        [
          userId,
          dentistId || null,
          serviceId || null,
          appointmentDate,
          appointmentTime,
          notes || null,
        ]
      );
      
      const appointment = result.rows[0];
      logger.info('Appointment booked via chatbot', { appointmentId: appointment.id, userId });
      
      return JSON.stringify({
        success: true,
        appointment: {
          id: appointment.id,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          status: appointment.status
        }
      });
    } catch (dbError: any) {
      // Handle database constraint errors (in case duplicate check missed something)
      if (dbError.code === '23505' || dbError.message?.includes('duplicate') || dbError.message?.includes('already exists')) {
        return JSON.stringify({ 
          success: false, 
          error: 'This appointment could not be booked. You may already have an appointment for this service on this date.' 
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    logger.error('Error booking appointment', error as Error);
    return JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to book appointment' 
    });
  }
}

async function cancelAppointment(userId: number, appointmentId: number, reason?: string) {
  try {
    // Check if appointment exists and belongs to user
    const checkResult = await query(
      'SELECT id, status, has_been_cancelled, cancel_count FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, userId]
    );

    if (checkResult.rows.length === 0) {
      return JSON.stringify({ 
        success: false, 
        error: 'Appointment not found or you do not have permission to cancel it.' 
      });
    }

    const appointment = checkResult.rows[0];

    // Check if already cancelled
    if (appointment.has_been_cancelled || appointment.cancel_count > 0) {
      return JSON.stringify({ 
        success: false, 
        error: 'This appointment has already been cancelled.' 
      });
    }

    // Soft delete - mark as cancelled
    await query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           has_been_cancelled = TRUE,
           cancel_count = cancel_count + 1,
           notes = COALESCE(notes || E'\\nCancellation reason: ' || $1, $1)
       WHERE id = $2`,
      [reason || null, appointmentId]
    );

    logger.info('Appointment cancelled via chatbot', { appointmentId, userId });

    return JSON.stringify({
      success: true,
      message: 'Appointment cancelled successfully',
      appointmentId
    });
  } catch (error: any) {
    logger.error('Error cancelling appointment', error as Error);
    return JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to cancel appointment' 
    });
  }
}

async function rescheduleAppointment(userId: number, appointmentId: number, newDate: string, newTime: string) {
  try {
    // Check if appointment exists and belongs to user
    const checkResult = await query(
      'SELECT id, status, service_id, dentist_id FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, userId]
    );

    if (checkResult.rows.length === 0) {
      return JSON.stringify({ 
        success: false, 
        error: 'Appointment not found or you do not have permission to reschedule it.' 
      });
    }

    const appointment = checkResult.rows[0];

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return JSON.stringify({ 
        success: false, 
        error: 'Cannot reschedule a cancelled appointment.' 
      });
    }

    // Check if new slot is available
    const slotsData = await getAvailableSlots(newDate, appointment.dentist_id, appointment.service_id);
    const slots = JSON.parse(slotsData);
    
    if (!slots.available || !slots.slots.includes(newTime)) {
      return JSON.stringify({ 
        success: false, 
        error: `The time slot ${newTime} is not available on ${newDate}. Available slots: ${slots.slots.join(', ')}` 
      });
    }

    // Check for duplicate appointment (same service on same date)
    if (appointment.service_id) {
      const duplicateCheck = await checkDuplicateAppointment(userId, appointment.service_id, newDate);
      if (duplicateCheck?.exists && duplicateCheck.appointment && duplicateCheck.appointment.id !== appointmentId) {
        return JSON.stringify({ 
          success: false, 
          error: `You already have an appointment for ${duplicateCheck.appointment.service} on ${newDate} at ${duplicateCheck.appointment.time}. Please choose a different date or service.`
        });
      }
    }

    // Update appointment
    await query(
      `UPDATE appointments 
       SET appointment_date = $1, 
           appointment_time = $2,
           has_been_rescheduled = TRUE,
           reschedule_count = reschedule_count + 1,
           status = 'scheduled'
       WHERE id = $3`,
      [newDate, newTime, appointmentId]
    );

    logger.info('Appointment rescheduled via chatbot', { appointmentId, userId, newDate, newTime });

    return JSON.stringify({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: {
        id: appointmentId,
        date: newDate,
        time: newTime,
        status: 'scheduled'
      }
    });
  } catch (error: any) {
    logger.error('Error rescheduling appointment', error as Error);
    return JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to reschedule appointment' 
    });
  }
}

async function getAppointmentHistory(userId: number, limit: number = 10) {
  try {
    const result = await query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.duration,
              s.name as service_name, s.description as service_description,
              d.id as dentist_id, u.first_name as dentist_first_name, u.last_name as dentist_last_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN dentists d ON a.dentist_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE a.user_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT $2`,
      [userId, limit]
    );
    
    const appointments = result.rows.map((row) => ({
      id: row.id,
      date: row.appointment_date,
      time: row.appointment_time,
      status: row.status,
      duration: row.duration,
      service: row.service_name || 'General',
      dentist: row.dentist_first_name && row.dentist_last_name 
        ? `${row.dentist_first_name} ${row.dentist_last_name}` 
        : null,
    }));
    
    return JSON.stringify({ appointments });
  } catch (error) {
    logger.error('Error fetching appointment history', error as Error);
    return JSON.stringify({ error: 'Failed to fetch appointment history' });
  }
}

// Check if question is in scope (appointments, doctors, clinic, dental services)
function isQuestionInScope(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase();
  
  // Keywords related to appointments, doctors, clinic, dental services
  const scopeKeywords = [
    // Appointments
    'appointment', 'book', 'schedule', 'reschedule', 'cancel', 'booking', 'slot', 'time', 'date',
    'when is my', 'my appointment', 'upcoming', 'past appointment',
    
    // Doctors/Dentists
    'doctor', 'dentist', 'dr.', 'dr ', 'physician', 'specialist', 'surgeon', 'orthodontist',
    'endodontist', 'periodontist', 'prosthodontist',
    
    // Clinic
    'clinic', 'office', 'hospital', 'dental office', 'dental clinic', 'practice',
    'location', 'address', 'phone', 'contact', 'hours', 'open', 'closed',
    
    // Services
    'service', 'treatment', 'procedure', 'cleaning', 'checkup', 'examination',
    'filling', 'crown', 'implant', 'root canal', 'extraction', 'whitening',
    'braces', 'orthodontics', 'dental', 'oral', 'tooth', 'teeth', 'gum', 'gums',
    
    // Medical/Dental related
    'pain', 'ache', 'cavity', 'decay', 'infection', 'hygiene', 'brushing', 'flossing',
    'x-ray', 'xray', 'radiograph', 'prescription', 'medication', 'insurance',
    'payment', 'cost', 'price', 'fee', 'bill', 'invoice',
    
    // Post-op care
    'care', 'recovery', 'after', 'post', 'follow-up', 'followup', 'instructions',
    
    // Medical records
    'record', 'history', 'medical record', 'dental record', 'chart', 'file',
    
    // General greetings and clinic-related
    'hello', 'hi', 'help', 'thanks', 'thank you', 'bye', 'goodbye'
  ];
  
  // Check if message contains any scope keywords
  const hasScopeKeyword = scopeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for common out-of-scope topics
  const outOfScopeKeywords = [
    'movie', 'film', 'actor', 'actress', 'celebrity', 'sport', 'football', 'basketball',
    'cricket', 'game', 'gaming', 'music', 'song', 'artist', 'recipe', 'cooking', 'food',
    'recipe', 'weather', 'temperature', 'rain', 'snow', 'news', 'politics', 'election',
    'president', 'prime minister', 'country', 'capital', 'history', 'science', 'math',
    'physics', 'chemistry', 'biology', 'geography', 'entertainment', 'joke', 'funny',
    'comedy', 'tv show', 'television', 'series', 'book', 'novel', 'story', 'travel',
    'vacation', 'holiday', 'trip', 'hotel', 'restaurant', 'shopping', 'fashion',
    'clothing', 'car', 'vehicle', 'technology', 'computer', 'phone', 'internet',
    'social media', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'
  ];
  
  const hasOutOfScopeKeyword = outOfScopeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // If it has out-of-scope keywords and no scope keywords, it's out of scope
  if (hasOutOfScopeKeyword && !hasScopeKeyword) {
    return false;
  }
  
  // If it has scope keywords, it's in scope
  if (hasScopeKeyword) {
    return true;
  }
  
  // Very short messages or greetings are in scope
  if (lowerMessage.trim().length < 20 && (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help'))) {
    return true;
  }
  
  // Default: if unclear, check if it's a question about the user's data
  if (lowerMessage.includes('my ') || lowerMessage.includes('i ') || lowerMessage.includes('me ')) {
    return true; // User asking about their own data is likely in scope
  }
  
  // Otherwise, out of scope
  return false;
}

// Language-specific system prompts
const getSystemPrompt = (language: string = 'en'): string => {
  const prompts: Record<string, string> = {
    en: `You are a Personal Medical Coordinator for a dental clinic. You can ONLY help with:

1. **Appointment Booking**: Book appointments for the user. Use the available tools to:
   - Get available services
   - Get available dentists
   - Check available time slots for a date
   - Book appointments with date, time, service, and optional dentist

2. **Appointment History**: Retrieve and discuss the user's appointment history, upcoming appointments, and past visits.

3. **Dental/Clinic Information**: Answer questions ONLY about:
   - Dental services and procedures
   - Clinic information (hours, location, contact)
   - Dentists and doctors at the clinic
   - User's medical/dental records
   - Post-operative care instructions
   - Insurance and payment information

CRITICAL RESTRICTIONS:
- You MUST ONLY answer questions related to appointments, doctors, clinic, and dental services
- For ANY question outside this scope (entertainment, general knowledge, sports, movies, etc.), respond with: "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions."
- Do NOT answer questions about topics like movies, sports, entertainment, general knowledge, politics, etc.
- Stay focused on dental clinic operations and user's dental care

IMPORTANT INSTRUCTIONS:
- When booking appointments, ALWAYS check available slots first using getAvailableSlots
- Use the exact date format YYYY-MM-DD (e.g., 2024-12-25)
- Use the exact time format HH:MM (e.g., 14:30)
- Confirm appointment details before booking
- For appointment history, use getAppointmentHistory to get the user's appointments
- Be friendly, empathetic, and professional
- If you don't have enough information, ask the user for clarification

Use the provided context and tools to help the user. Always respond in English.`,
    es: `Eres un Coordinador Médico Personal para una clínica dental. SOLO puedes ayudar con:

1. **Reserva de Citas**: Reservar citas para el usuario
2. **Historial de Citas**: Recuperar y discutir el historial de citas del usuario
3. **Información Dental/Clínica**: Responder preguntas SOLO sobre:
   - Servicios y procedimientos dentales
   - Información de la clínica (horarios, ubicación, contacto)
   - Dentistas y doctores de la clínica
   - Registros médicos/dentales del usuario
   - Instrucciones de cuidado postoperatorio
   - Información de seguro y pago

RESTRICCIONES CRÍTICAS:
- DEBES responder SOLO preguntas relacionadas con citas, doctores, clínica y servicios dentales
- Para CUALQUIER pregunta fuera de este alcance (entretenimiento, conocimiento general, deportes, películas, etc.), responde con: "No tengo conocimiento sobre eso. Solo puedo ayudarte con citas, doctores y preguntas relacionadas con la clínica."
- NO respondas preguntas sobre temas como películas, deportes, entretenimiento, conocimiento general, política, etc.
- Mantente enfocado en las operaciones de la clínica dental y el cuidado dental del usuario

Siempre responde en español.`,
    fr: `Vous êtes un Coordinateur Médical Personnel pour une clinique dentaire. Vous pouvez UNIQUEMENT aider avec:

1. **Réservation de Rendez-vous**: Réserver des rendez-vous pour l'utilisateur
2. **Historique des Rendez-vous**: Récupérer et discuter de l'historique des rendez-vous de l'utilisateur
3. **Informations Dentaires/Clinique**: Répondre UNIQUEMENT aux questions sur:
   - Services et procédures dentaires
   - Informations sur la clinique (heures, emplacement, contact)
   - Dentistes et médecins de la clinique
   - Dossiers médicaux/dentaires de l'utilisateur
   - Instructions de soins postopératoires
   - Informations sur l'assurance et le paiement

RESTRICTIONS CRITIQUES:
- Vous DEVEZ répondre UNIQUEMENT aux questions liées aux rendez-vous, médecins, clinique et services dentaires
- Pour TOUTE question hors de ce domaine (divertissement, connaissances générales, sports, films, etc.), répondez par: "Je n'ai pas de connaissances à ce sujet. Je ne peux vous aider qu'avec les rendez-vous, les médecins et les questions liées à la clinique."
- NE répondez PAS aux questions sur des sujets comme les films, les sports, le divertissement, les connaissances générales, la politique, etc.
- Restez concentré sur les opérations de la clinique dentaire et les soins dentaires de l'utilisateur

Répondez toujours en français.`,
  };

  return prompts[language] || prompts.en;
};

export async function getRAGChatResponse(
  userMessage: string,
  conversationId: number | null,
  userId: number,
  language: string = 'en'
): Promise<{ response: string; conversationId: number; appointmentAction?: 'booked' | 'cancelled' | 'rescheduled' | null; appointmentId?: number | null }> {
  try {
    let convId = conversationId;

    // Get or create conversation
    if (!convId) {
      const convResult = await query(
        `INSERT INTO conversations (user_id, started_at, last_message_at)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [userId]
      );
      convId = convResult.rows[0].id;
    } else {
      // Update last message time
      await query(
        `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [convId]
      );
    }

    // Get conversation history
    const historyResult = await query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY timestamp ASC 
       LIMIT 10`,
      [convId]
    );

    // Check if question is in scope before processing
    if (!isQuestionInScope(userMessage)) {
      const outOfScopeResponse = "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?";
      
      // Save messages to database
      await query(
        `INSERT INTO messages (conversation_id, role, content, timestamp)
         VALUES ($1, 'user', $2, CURRENT_TIMESTAMP),
                ($1, 'assistant', $3, CURRENT_TIMESTAMP)`,
        [convId, userMessage, outOfScopeResponse]
      );

      logger.info('Out-of-scope question rejected', { 
        conversationId: convId, 
        userId,
        message: userMessage.substring(0, 100)
      });

      return {
        response: outOfScopeResponse,
        conversationId: convId as number,
      };
    }

    // Retrieve relevant documents using RAG (only for in-scope questions)
    const relevantDocs = await similaritySearch(userMessage, 4);

    // Build context from retrieved documents
    const context = relevantDocs.join('\n\n');

    // Get user's appointment history for context
    const historyData = await getAppointmentHistory(userId, 5);
    const appointmentHistory = JSON.parse(historyData);

    // Build conversation history
    const chatHistory = historyResult.rows.map((row) => ({
      role: row.role === 'user' ? 'user' : 'assistant',
      content: row.content,
    }));

    // Detect if user wants to book, cancel, reschedule, or view history
    const lowerMessage = userMessage.toLowerCase();
    const isBookingRequest = lowerMessage.includes('book') || lowerMessage.includes('schedule') || 
                            lowerMessage.includes('make an appointment') || lowerMessage.includes('set up appointment') ||
                            (lowerMessage.includes('appointment') && (lowerMessage.includes('want') || lowerMessage.includes('need') || lowerMessage.includes('like') || lowerMessage.includes('for')));
    const isHistoryRequest = lowerMessage.includes('history') || lowerMessage.includes('past appointments') || 
                            lowerMessage.includes('my appointments') || lowerMessage.includes('upcoming') ||
                            lowerMessage.includes('when is my') || lowerMessage.includes('show my appointments');
    const isCancelRequest = lowerMessage.includes('cancel') && lowerMessage.includes('appointment');
    const isRescheduleRequest = lowerMessage.includes('reschedule') || 
                               (lowerMessage.includes('change') && lowerMessage.includes('appointment')) ||
                               (lowerMessage.includes('appointment') && (lowerMessage.includes('move') || lowerMessage.includes('change')));

    let finalResponse = '';
    let toolCallsMade = false;
    let additionalContext = '';
    let appointmentAction: 'booked' | 'cancelled' | 'rescheduled' | null = null;
    let appointmentId: number | null = null;

    // Handle cancel requests
    if (isCancelRequest) {
      // Get user's upcoming appointments
      const historyData = await getAppointmentHistory(userId, 10);
      const history = JSON.parse(historyData);
      
      const upcoming = history.appointments?.filter((apt: any) => 
        new Date(apt.date) >= new Date() && apt.status === 'scheduled'
      ) || [];
      
      if (upcoming.length === 0) {
        finalResponse = "You don't have any upcoming appointments to cancel.";
        toolCallsMade = true;
      } else {
        // Try to extract appointment ID from message
        const idMatch = userMessage.match(/appointment\s*#?\s*(\d+)/i) || userMessage.match(/(\d+)/);
        if (idMatch) {
          const aptId = parseInt(idMatch[1]);
          const cancelResult = await cancelAppointment(userId, aptId);
          const cancel = JSON.parse(cancelResult);
          
          if (cancel.success) {
            finalResponse = `I've successfully cancelled your appointment (ID: ${aptId}). The appointment list on the website will be updated automatically.`;
            toolCallsMade = true;
            appointmentAction = 'cancelled';
            appointmentId = aptId;
          } else {
            finalResponse = `I couldn't cancel that appointment. ${cancel.error}`;
            toolCallsMade = true;
          }
        } else {
          // Show list of upcoming appointments for user to choose
          let appointmentsList = '\n\n**Your Upcoming Appointments:**\n';
          upcoming.forEach((apt: any, index: number) => {
            appointmentsList += `${index + 1}. ID ${apt.id}: ${apt.date} at ${apt.time} - ${apt.service}\n`;
          });
          additionalContext += appointmentsList + '\n\nPlease specify which appointment you want to cancel by mentioning its ID.';
        }
      }
    }

    // Handle reschedule requests
    if (isRescheduleRequest) {
      // Get user's upcoming appointments
      const historyData = await getAppointmentHistory(userId, 10);
      const history = JSON.parse(historyData);
      
      const upcoming = history.appointments?.filter((apt: any) => 
        new Date(apt.date) >= new Date() && apt.status === 'scheduled'
      ) || [];
      
      if (upcoming.length === 0) {
        finalResponse = "You don't have any upcoming appointments to reschedule.";
        toolCallsMade = true;
      } else {
        // Try to extract appointment ID and new date/time
        const idMatch = userMessage.match(/appointment\s*#?\s*(\d+)/i) || userMessage.match(/(\d+)/);
        const dateMatch = userMessage.match(/\d{4}-\d{2}-\d{2}/);
        const timeMatch = userMessage.match(/\d{1,2}:\d{2}/);
        
        if (idMatch && dateMatch && timeMatch) {
          const aptId = parseInt(idMatch[1]);
          const newDate = dateMatch[0];
          const newTime = timeMatch[0].padStart(5, '0');
          
          const rescheduleResult = await rescheduleAppointment(userId, aptId, newDate, newTime);
          const reschedule = JSON.parse(rescheduleResult);
          
          if (reschedule.success && reschedule.appointment) {
            finalResponse = `I've successfully rescheduled your appointment to ${newDate} at ${newTime}. The appointment list on the website will be updated automatically.`;
            toolCallsMade = true;
            appointmentAction = 'rescheduled';
            appointmentId = aptId;
          } else {
            finalResponse = `I couldn't reschedule that appointment. ${reschedule.error}`;
            toolCallsMade = true;
          }
        } else {
          // Show list and ask for details
          let appointmentsList = '\n\n**Your Upcoming Appointments:**\n';
          upcoming.forEach((apt: any, index: number) => {
            appointmentsList += `${index + 1}. ID ${apt.id}: ${apt.date} at ${apt.time} - ${apt.service}\n`;
          });
          additionalContext += appointmentsList + '\n\nPlease specify which appointment you want to reschedule (mention the ID) and provide the new date (YYYY-MM-DD) and time (HH:MM).';
        }
      }
    }

    // Handle appointment history requests
    if (isHistoryRequest) {
      const historyData = await getAppointmentHistory(userId, 10);
      const history = JSON.parse(historyData);
      
      if (history.appointments && history.appointments.length > 0) {
        const upcoming = history.appointments.filter((apt: any) => 
          new Date(apt.date) >= new Date() && apt.status === 'scheduled'
        );
        const past = history.appointments.filter((apt: any) => 
          new Date(apt.date) < new Date() || apt.status === 'completed'
        );
        
        let historyText = '';
        if (upcoming.length > 0) {
          historyText += `\n\n**Upcoming Appointments:**\n`;
          upcoming.forEach((apt: any) => {
            historyText += `- ${apt.date} at ${apt.time}: ${apt.service}${apt.dentist ? ` with Dr. ${apt.dentist}` : ''} (Status: ${apt.status})\n`;
          });
        }
        if (past.length > 0) {
          historyText += `\n\n**Past Appointments:**\n`;
          past.slice(0, 5).forEach((apt: any) => {
            historyText += `- ${apt.date} at ${apt.time}: ${apt.service}${apt.dentist ? ` with Dr. ${apt.dentist}` : ''} (Status: ${apt.status})\n`;
          });
        }
        
        additionalContext = `\n\nUser's Appointment History:\n${historyText}`;
        toolCallsMade = true;
      } else {
        additionalContext = '\n\nUser has no appointments yet.';
        toolCallsMade = true;
      }
    }

    // Handle booking requests
    if (isBookingRequest) {
      // Get available services and dentists for context
      const servicesData = await getServices();
      const dentistsData = await getDentists();
      const services = JSON.parse(servicesData);
      const dentists = JSON.parse(dentistsData);
      
      // Format services and dentists for context
      const servicesList = services.map((s: any) => `- ${s.name} (ID: ${s.id}, ${s.duration} min${s.price ? `, $${s.price}` : ''})`).join('\n');
      const dentistsList = dentists.map((d: any) => `- ${d.name}${d.specialization ? ` (${d.specialization})` : ''}`).join('\n');
      
      // Extract service from conversation history or current message
      let serviceId: number | undefined = undefined;
      const lowerMsg = userMessage.toLowerCase();
      
      // Try to match service name from conversation history or current message
      for (const service of services) {
        const serviceNameLower = service.name.toLowerCase();
        // Check current message
        if (lowerMsg.includes(serviceNameLower)) {
          serviceId = service.id;
          break;
        }
        // Check conversation history
        for (const msg of chatHistory) {
          if (msg.content.toLowerCase().includes(serviceNameLower)) {
            serviceId = service.id;
            break;
          }
        }
        if (serviceId) break;
      }
      
      // Check user's existing appointments for the same service/date
      if (serviceId && appointmentHistory.appointments) {
        const upcomingAppts = appointmentHistory.appointments.filter((apt: any) => 
          apt.service && apt.service.toLowerCase().includes(services.find((s: any) => s.id === serviceId)?.name.toLowerCase() || '')
        );
        if (upcomingAppts.length > 0) {
          additionalContext += `\n\n⚠️ Note: You already have upcoming appointments: ${upcomingAppts.map((apt: any) => `${apt.service} on ${apt.date}`).join(', ')}`;
        }
      }
      
      additionalContext += `\n\nAvailable Services:\n${servicesList}\n\nAvailable Dentists:\n${dentistsList}`;
      
      // Try to extract date and time from message (multiple formats)
      let date: string | null = null;
      let time: string | null = null;
      
      // Try YYYY-MM-DD format first
      const dateMatch = userMessage.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        date = dateMatch[0];
      } else {
        // Try to parse natural language dates (tomorrow, next week, etc.)
        const today = new Date();
        if (lowerMsg.includes('tomorrow')) {
          today.setDate(today.getDate() + 1);
          date = today.toISOString().split('T')[0];
        } else if (lowerMsg.includes('next week')) {
          today.setDate(today.getDate() + 7);
          date = today.toISOString().split('T')[0];
        } else if (lowerMsg.match(/\d+\s*(day|days)\s*(from now|later)/)) {
          const daysMatch = userMessage.match(/(\d+)\s*(day|days)/);
          if (daysMatch) {
            today.setDate(today.getDate() + parseInt(daysMatch[1]));
            date = today.toISOString().split('T')[0];
          }
        }
      }
      
      // Try to extract time
      const timeMatch = userMessage.match(/\d{1,2}:\d{2}/);
      if (timeMatch) {
        time = timeMatch[0].padStart(5, '0');
      } else {
        // Try AM/PM format
        const amPmMatch = userMessage.match(/(\d{1,2})\s*(am|pm)/i);
        if (amPmMatch) {
          let hour = parseInt(amPmMatch[1]);
          const period = amPmMatch[2].toLowerCase();
          if (period === 'pm' && hour !== 12) hour += 12;
          if (period === 'am' && hour === 12) hour = 0;
          time = `${String(hour).padStart(2, '0')}:00`;
        }
      }
      
      if (date && time) {
        // Check for duplicate appointment before booking
        if (serviceId) {
          const duplicateCheck = await checkDuplicateAppointment(userId, serviceId, date);
          if (duplicateCheck?.exists && duplicateCheck.appointment) {
            finalResponse = `I see you already have an appointment for ${duplicateCheck.appointment.service} on ${date} at ${duplicateCheck.appointment.time}. Please choose a different date or service.`;
            toolCallsMade = true;
          }
        }
        
        if (!toolCallsMade) {
          // Check slots first
          const slotsData = await getAvailableSlots(date, undefined, serviceId);
          const slots = JSON.parse(slotsData);
          
          if (slots.available && slots.slots.includes(time)) {
            const bookingResult = await bookAppointment(userId, date, time, serviceId);
            const booking = JSON.parse(bookingResult);
            
            if (booking.success && booking.appointment) {
              const serviceName = serviceId ? services.find((s: any) => s.id === serviceId)?.name || '' : '';
              finalResponse = `Great! I've successfully booked your appointment${serviceName ? ` for ${serviceName}` : ''} on ${date} at ${time}. Your appointment ID is ${booking.appointment.id}. You'll receive a confirmation reminder before your appointment. The appointment list on the website will be updated automatically.`;
              toolCallsMade = true;
              // Mark that an appointment was booked (will be used to trigger refresh)
              additionalContext += `\n\n[ACTION: appointment-booked, ID: ${booking.appointment.id}]`;
            } else {
              additionalContext += `\n\nBooking attempt failed: ${booking.error}`;
            }
          } else {
            additionalContext += `\n\nThe time slot ${time} is not available on ${date}. Available slots: ${slots.slots.join(', ')}`;
          }
        }
      } else {
        // Get available slots for next few days to help user
        const today = new Date();
        const datesToCheck = [];
        for (let i = 1; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + i);
          datesToCheck.push(checkDate.toISOString().split('T')[0]);
        }
        
        let slotsInfo = '';
        for (const checkDate of datesToCheck.slice(0, 3)) {
          const slotsData = await getAvailableSlots(checkDate, undefined, serviceId);
          const slots = JSON.parse(slotsData);
          if (slots.available && slots.slots.length > 0) {
            slotsInfo += `\n${checkDate}: ${slots.slots.slice(0, 5).join(', ')}${slots.slots.length > 5 ? '...' : ''}`;
          }
        }
        
        if (slotsInfo) {
          additionalContext += `\n\nAvailable slots for upcoming days:\n${slotsInfo}`;
        }
      }
    }

    // Create prompt template with additional context
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', getSystemPrompt(language)],
      ['system', `Context from knowledge base:\n\n${context}${additionalContext}`],
      ['system', `REMEMBER: If the user asks about anything outside appointments, doctors, clinic, or dental services (like entertainment, sports, movies, general knowledge, etc.), you MUST respond with: "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions."`],
      ...chatHistory.map((msg) => [msg.role, msg.content] as [string, string]),
      ['user', '{input}'],
    ]);

    // Create chain
    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    // Generate response
    if (!finalResponse) {
      finalResponse = await chain.invoke({
        input: userMessage,
      });
      
      // Double-check: if response seems to answer out-of-scope question, override it
      if (!isQuestionInScope(userMessage) && !finalResponse.toLowerCase().includes("don't have knowledge") && !finalResponse.toLowerCase().includes("can only help")) {
        finalResponse = "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?";
      }
    } else {
      // If we already have a response from booking, still use LLM to format it nicely
      const formattedResponse = await chain.invoke({
        input: `${userMessage}\n\n[System: ${finalResponse}]`,
      });
      finalResponse = formattedResponse || finalResponse;
    }

    // Save messages to database
    await query(
      `INSERT INTO messages (conversation_id, role, content, timestamp)
       VALUES ($1, 'user', $2, CURRENT_TIMESTAMP),
              ($1, 'assistant', $3, CURRENT_TIMESTAMP)`,
      [convId, userMessage, finalResponse]
    );

    logger.info('RAG chat response generated', { 
      conversationId: convId, 
      userId,
      retrievedDocs: relevantDocs.length,
      toolCallsMade
    });

    return {
      response: finalResponse,
      conversationId: convId as number,
      appointmentAction, // 'booked' | 'cancelled' | 'rescheduled' | null
      appointmentId, // ID of the appointment that was modified
    };
  } catch (error) {
    logger.error('RAG chatbot error', error as Error);
    throw new Error('Failed to generate chat response');
  }
}

export async function getConversationHistory(conversationId: number, userId?: number) {
  // Verify conversation belongs to user if userId is provided
  if (userId) {
    const convCheck = await query(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    
    if (convCheck.rows.length === 0) {
      throw new Error('Conversation not found or access denied');
    }
  }

  const result = await query(
    `SELECT role, content, timestamp FROM messages 
     WHERE conversation_id = $1 
     ORDER BY timestamp ASC`,
    [conversationId]
  );

  return result.rows.map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
    timestamp: row.timestamp,
  }));
}

export async function getUserConversations(userId: number) {
  const result = await query(
    `SELECT id, started_at, last_message_at 
     FROM conversations 
     WHERE user_id = $1 
     ORDER BY last_message_at DESC`,
    [userId]
  );

  return result.rows;
}

