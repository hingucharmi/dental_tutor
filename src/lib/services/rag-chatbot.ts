import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { query, withTransaction } from '@/lib/db';
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

// Initialize LLM for intent classification (lower temperature for more consistent results)
const intentLLM = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.3,
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

// Use global cache to persist across Next.js serverless function instances
// This ensures the vector store persists within the same Node.js process
declare global {
  // eslint-disable-next-line no-var
  var __vectorStore: VectorDocument[] | undefined;
}

// Initialize vector store with global cache
async function initializeVectorStore() {
  // Check global cache first (persists across serverless function instances in same process)
  if (global.__vectorStore) {
    return global.__vectorStore;
  }

  // Check module-level cache (for same instance)
  if (typeof global.__vectorStore === 'undefined') {
    try {
      // Split documents into chunks
      const chunks = splitText(dentalKnowledgeBase, 1000, 200);

      // Generate embeddings for all chunks
      const embeddingsList = await embeddings.embedDocuments(chunks);

      // Store documents with embeddings
      const store = chunks.map((chunk, index) => ({
        content: chunk,
        embedding: embeddingsList[index],
      }));

      // Cache in global object
      global.__vectorStore = store;

      logger.info('Vector store initialized', { documentCount: chunks.length });
      return store;
    } catch (error) {
      logger.error('Failed to initialize vector store', error as Error);
      throw error;
    }
  }

  return global.__vectorStore;
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
    
    const services = result.rows.map((row: any) => ({
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
    
    const dentists = result.rows.map((row: any) => ({
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
    return await withTransaction(async (client) => {
      // Check for duplicate appointment (same service on same date) - within transaction
      if (serviceId) {
        // First check for duplicates (without JOIN to avoid FOR UPDATE issues)
        const duplicateCheck = await client.query(
          `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.service_id
           FROM appointments a
           WHERE a.user_id = $1 
           AND a.service_id = $2 
           AND a.appointment_date = $3 
           AND a.status != 'cancelled'
           FOR UPDATE`,
          [userId, serviceId, appointmentDate]
        );

        if (duplicateCheck.rows.length > 0) {
          const existing = duplicateCheck.rows[0];
          // Get service name separately if needed
          let serviceName = 'this service';
          if (existing.service_id) {
            const serviceResult = await client.query(
              'SELECT name FROM services WHERE id = $1',
              [existing.service_id]
            );
            if (serviceResult.rows.length > 0) {
              serviceName = serviceResult.rows[0].name;
            }
          }
          
          return JSON.stringify({ 
            success: false, 
            error: `You already have an appointment for ${serviceName} on ${appointmentDate} at ${existing.appointment_time}. Please choose a different date or service.`,
            duplicateAppointment: {
              id: existing.id,
              date: existing.appointment_date,
              time: existing.appointment_time,
              service: serviceName,
              status: existing.status
            }
          });
        }
      }
      
      // Check if slot is available - within transaction with row-level locking
      let bookedQuery = `
        SELECT appointment_time, duration 
        FROM appointments 
        WHERE appointment_date = $1 AND status != 'cancelled'
        FOR UPDATE
      `;
      const queryParams: any[] = [appointmentDate];

      if (dentistId) {
        bookedQuery += ' AND dentist_id = $2';
        queryParams.push(dentistId);
      }

      const bookedResult = await client.query(bookedQuery, queryParams);
      const bookedSlots = new Set<string>();
      const SLOT_DURATION = 30;

      bookedResult.rows.forEach((row: any) => {
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

      if (bookedSlots.has(appointmentTime)) {
        // Get available slots for error message
        const slotsData = await getAvailableSlots(appointmentDate, dentistId, serviceId);
        const slots = JSON.parse(slotsData);
        return JSON.stringify({ 
          success: false, 
          error: `The time slot ${appointmentTime} is not available on ${appointmentDate}. Available slots: ${slots.slots.join(', ')}` 
        });
      }
      
      // Create appointment in database
      const result = await client.query(
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
    });
  } catch (error: any) {
    logger.error('Error booking appointment', error as Error);
    // Handle database constraint errors
    if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      return JSON.stringify({ 
        success: false, 
        error: 'This appointment could not be booked. You may already have an appointment for this service on this date.' 
      });
    }
    return JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to book appointment' 
    });
  }
}

async function cancelAppointment(userId: number, appointmentId: number, reason?: string) {
  try {
    return await withTransaction(async (client) => {
      // Check if appointment exists and belongs to user - with row-level lock
      const checkResult = await client.query(
        'SELECT id, status, has_been_cancelled, cancel_count FROM appointments WHERE id = $1 AND user_id = $2 FOR UPDATE',
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
      await client.query(
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
    return await withTransaction(async (client) => {
      // Check if appointment exists and belongs to user - with row-level lock
      const checkResult = await client.query(
        'SELECT id, status, service_id, dentist_id FROM appointments WHERE id = $1 AND user_id = $2 FOR UPDATE',
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

      // Check for duplicate appointment (same service on same date) - within transaction
      if (appointment.service_id) {
        // Check for duplicates without JOIN to avoid FOR UPDATE issues
        const duplicateCheck = await client.query(
          `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.service_id
           FROM appointments a
           WHERE a.user_id = $1 
           AND a.service_id = $2 
           AND a.appointment_date = $3 
           AND a.status != 'cancelled'
           AND a.id != $4
           FOR UPDATE`,
          [userId, appointment.service_id, newDate, appointmentId]
        );

        if (duplicateCheck.rows.length > 0) {
          const existing = duplicateCheck.rows[0];
          // Get service name separately if needed
          let serviceName = 'this service';
          if (existing.service_id) {
            const serviceResult = await client.query(
              'SELECT name FROM services WHERE id = $1',
              [existing.service_id]
            );
            if (serviceResult.rows.length > 0) {
              serviceName = serviceResult.rows[0].name;
            }
          }
          
          return JSON.stringify({ 
            success: false, 
            error: `You already have an appointment for ${serviceName} on ${newDate} at ${existing.appointment_time}. Please choose a different date or service.`
          });
        }
      }

      // Check if new slot is available - within transaction with row-level locking
      let bookedQuery = `
        SELECT appointment_time, duration 
        FROM appointments 
        WHERE appointment_date = $1 AND status != 'cancelled'
        FOR UPDATE
      `;
      const queryParams: any[] = [newDate];

      if (appointment.dentist_id) {
        bookedQuery += ' AND dentist_id = $2';
        queryParams.push(appointment.dentist_id);
      }

      const bookedResult = await client.query(bookedQuery, queryParams);
      const bookedSlots = new Set<string>();
      const SLOT_DURATION = 30;

      bookedResult.rows.forEach((row: any) => {
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

      if (bookedSlots.has(newTime)) {
        // Get available slots for error message
        const slotsData = await getAvailableSlots(newDate, appointment.dentist_id, appointment.service_id);
        const slots = JSON.parse(slotsData);
        return JSON.stringify({ 
          success: false, 
          error: `The time slot ${newTime} is not available on ${newDate}. Available slots: ${slots.slots.join(', ')}` 
        });
      }

      // Update appointment
      await client.query(
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

// Parse natural language dates (supports English and Spanish)
function parseNaturalLanguageDate(text: string, language: string = 'en'): string | null {
  const lowerText = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (language === 'es') {
    // Spanish date parsing
    if (lowerText.includes('mañana') || lowerText.includes('mañ')) {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    }
    if (lowerText.includes('pasado mañana')) {
      today.setDate(today.getDate() + 2);
      return today.toISOString().split('T')[0];
    }
    if (lowerText.includes('próxima semana') || lowerText.includes('proxima semana')) {
      today.setDate(today.getDate() + 7);
      return today.toISOString().split('T')[0];
    }
    // Day of week parsing
    const daysOfWeekEs: Record<string, number> = {
      'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
    };
    for (const [dayEs, dayNum] of Object.entries(daysOfWeekEs)) {
      if (lowerText.includes(dayEs)) {
        const currentDay = today.getDay();
        let daysToAdd = (dayNum - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // Next week if today
        today.setDate(today.getDate() + daysToAdd);
        return today.toISOString().split('T')[0];
      }
    }
    // "en X días" format
    const diasMatch = lowerText.match(/(\d+)\s*d[ií]a[s]?/);
    if (diasMatch) {
      today.setDate(today.getDate() + parseInt(diasMatch[1]));
      return today.toISOString().split('T')[0];
    }
  } else {
    // English date parsing
    if (lowerText.includes('today')) {
      const result = today.toISOString().split('T')[0];
      logger.info('Parsed "today" as date', { input: text.substring(0, 50), result });
      return result;
    }
    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = tomorrow.toISOString().split('T')[0];
      logger.info('Parsed "tomorrow" as date', { input: text.substring(0, 50), result, today: today.toISOString().split('T')[0] });
      return result;
    }
    if (lowerText.includes('day after tomorrow')) {
      today.setDate(today.getDate() + 2);
      return today.toISOString().split('T')[0];
    }
    if (lowerText.includes('next week')) {
      today.setDate(today.getDate() + 7);
      return today.toISOString().split('T')[0];
    }
    // Day of week parsing
    const daysOfWeekEn: Record<string, number> = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 0
    };
    for (const [dayEn, dayNum] of Object.entries(daysOfWeekEn)) {
      if (lowerText.includes(dayEn)) {
        const currentDay = today.getDay();
        let daysToAdd = (dayNum - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // Next week if today
        today.setDate(today.getDate() + daysToAdd);
        return today.toISOString().split('T')[0];
      }
    }
    // Absolute date parsing: "December 17th", "Dec 17", "December 17", etc.
    const monthNames: Record<string, number> = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    // Try to match month name and day
    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      if (lowerText.includes(monthName)) {
        // Match patterns like "December 17th", "Dec 17", "December 17", "Dec 17th"
        const dateMatch = lowerText.match(new RegExp(`${monthName}\\s+(\\d+)`, 'i'));
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          
          // Create date for this year
          const targetDate = new Date(currentYear, monthIndex, day);
          targetDate.setHours(0, 0, 0, 0);
          
          // If the date has passed this year, use next year
          if (targetDate < today || (monthIndex < currentMonth) || (monthIndex === currentMonth && day < today.getDate())) {
            targetDate.setFullYear(currentYear + 1);
          }
          
          const result = targetDate.toISOString().split('T')[0];
          logger.info('Parsed absolute date', { input: text.substring(0, 50), monthName, day, result, year: targetDate.getFullYear() });
          return result;
        }
      }
    }
    // "in X days" format
    const daysMatch = lowerText.match(/(\d+)\s*(day|days)\s*(from now|later)/);
    if (daysMatch) {
      today.setDate(today.getDate() + parseInt(daysMatch[1]));
      return today.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Parse natural language time (supports English and Spanish)
function parseNaturalLanguageTime(text: string, language: string = 'en'): string | null {
  const lowerText = text.toLowerCase();
  
  // Try ISO format first (HH:MM)
  const isoMatch = text.match(/\d{1,2}:\d{2}/);
  if (isoMatch) {
    return isoMatch[0].padStart(5, '0');
  }
  
  // Try AM/PM format
  const amPmMatch = text.match(/(\d{1,2})\s*(am|pm)/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1]);
    const period = amPmMatch[2].toLowerCase();
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:00`;
  }
  
  if (language === 'es') {
    // Spanish time parsing: "las 2 de la tarde", "a las 3pm", "las 14:30"
    const lasMatch = lowerText.match(/las\s+(\d{1,2})(?:\s+de\s+la\s+(tarde|mañana|noche))?/);
    if (lasMatch) {
      let hour = parseInt(lasMatch[1]);
      const period = lasMatch[2];
      if (period === 'tarde' || period === 'noche') {
        if (hour !== 12) hour += 12;
      }
      return `${String(hour).padStart(2, '0')}:00`;
    }
    // "a las X" format
    const aLasMatch = lowerText.match(/a\s+las\s+(\d{1,2})(?:\s*(am|pm))?/i);
    if (aLasMatch) {
      let hour = parseInt(aLasMatch[1]);
      const period = aLasMatch[2]?.toLowerCase();
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:00`;
    }
  }
  
  return null;
}

// Extract entities from user message using LLM
async function extractEntities(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  availableServices: Array<{ id: number; name: string }>,
  availableDentists: Array<{ id: number; name: string }>,
  language: string = 'en'
): Promise<{
  date?: string;
  time?: string;
  serviceId?: number;
  serviceName?: string;
  dentistId?: number;
  dentistName?: string;
  appointmentId?: number;
}> {
  try {
    const historyContext = conversationHistory
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const servicesList = availableServices.map(s => `${s.id}: ${s.name}`).join(', ');
    const dentistsList = availableDentists.map(d => `${d.id}: ${d.name}`).join(', ');
    
    // Get current date for relative date interpretation
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayFormatted = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const prompt = language === 'es'
      ? `Extrae entidades del mensaje del usuario. Responde SOLO con JSON en este formato exacto:
{
  "date": "YYYY-MM-DD" o null,
  "time": "HH:MM" o null,
  "serviceId": número o null,
  "serviceName": "nombre del servicio" o null,
  "dentistId": número o null,
  "dentistName": "nombre del dentista" o null,
  "appointmentId": número o null
}

IMPORTANTE - Fecha actual: ${todayStr} (${todayFormatted})
- Para fechas relativas como "hoy", "mañana", "pasado mañana", "próxima semana", "17 de diciembre", etc., calcula la fecha basándote en la fecha actual.
- Si menciona un mes y día sin año (ej: "diciembre 17"), asume el año actual si la fecha aún no ha pasado, o el próximo año si ya pasó.
- SIEMPRE calcula fechas futuras basándote en la fecha actual proporcionada.

Instrucciones:
- Fecha: Extrae fechas en formato YYYY-MM-DD. Calcula fechas relativas basándote en la fecha actual.
- Hora: Extrae horas en formato HH:MM (24 horas). Si menciona "2pm", "las 2 de la tarde", etc., convierte a formato 24 horas.
- Servicio: Busca en la lista de servicios disponibles y extrae el ID y nombre si se menciona.
- Dentista: Busca en la lista de dentistas disponibles y extrae el ID y nombre si se menciona.
- ID de cita: Extrae el número de ID de cita si se menciona (ej: "cita 123", "appointment 456").

Servicios disponibles: ${servicesList}
Dentistas disponibles: ${dentistsList}
${historyContext ? `\nHistorial reciente:\n${historyContext}` : ''}

Mensaje del usuario: ${userMessage}

Responde SOLO con el JSON, sin texto adicional:`
      : `Extract entities from the user's message. Respond ONLY with JSON in this exact format:
{
  "date": "YYYY-MM-DD" or null,
  "time": "HH:MM" or null,
  "serviceId": number or null,
  "serviceName": "service name" or null,
  "dentistId": number or null,
  "dentistName": "dentist name" or null,
  "appointmentId": number or null
}

IMPORTANT - Current date: ${todayStr} (${todayFormatted})
- For relative dates like "today", "tomorrow", "day after tomorrow", "next week", "December 17th", etc., calculate the date based on the current date.
- If mentions a month and day without year (e.g., "December 17"), assume current year if the date hasn't passed yet, or next year if it has already passed.
- ALWAYS calculate future dates based on the current date provided.

Instructions:
- Date: Extract dates in YYYY-MM-DD format. Calculate relative dates based on the current date.
- Time: Extract times in HH:MM format (24-hour). If mentions "2pm", "2:30 PM", etc., convert to 24-hour format.
- Service: Search in available services list and extract ID and name if mentioned.
- Dentist: Search in available dentists list and extract ID and name if mentioned.
- Appointment ID: Extract appointment ID number if mentioned (e.g., "appointment 123", "appointment #456").

Available services: ${servicesList}
Available dentists: ${dentistsList}
${historyContext ? `\nRecent history:\n${historyContext}` : ''}

User message: ${userMessage}

Respond ONLY with the JSON, no additional text:`;

    const response = await intentLLM.invoke(prompt);
    const content = response.content.toString().trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        date: parsed.date || undefined,
        time: parsed.time || undefined,
        serviceId: parsed.serviceId || undefined,
        serviceName: parsed.serviceName || undefined,
        dentistId: parsed.dentistId || undefined,
        dentistName: parsed.dentistName || undefined,
        appointmentId: parsed.appointmentId || undefined,
      };
    }
    
    return {};
  } catch (error) {
    logger.error('Error extracting entities', error as Error);
    return {};
  }
}

// Classify user intent using LLM
async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  language: string = 'en'
): Promise<{ intent: 'book' | 'cancel' | 'reschedule' | 'history' | 'question'; confidence: number }> {
  try {
    const historyContext = conversationHistory
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = language === 'es'
      ? `Analiza el mensaje del usuario y determina su intención. Responde SOLO con JSON en este formato exacto:
{
  "intent": "book" | "cancel" | "reschedule" | "history" | "question",
  "confidence": 0.0-1.0
}

Intenciones:
- "book": Usuario quiere reservar/agendar una cita nueva
- "cancel": Usuario quiere cancelar una cita existente
- "reschedule": Usuario quiere cambiar/reprogramar una cita existente
- "history": Usuario quiere ver su historial de citas
- "question": Usuario hace una pregunta general sobre servicios, doctores, clínica, etc.

Mensaje del usuario: ${userMessage}
${historyContext ? `\nHistorial reciente:\n${historyContext}` : ''}

Responde SOLO con el JSON, sin texto adicional:`
      : `Analyze the user's message and determine their intent. Respond ONLY with JSON in this exact format:
{
  "intent": "book" | "cancel" | "reschedule" | "history" | "question",
  "confidence": 0.0-1.0
}

Intents:
- "book": User wants to book/schedule a new appointment
- "cancel": User wants to cancel an existing appointment
- "reschedule": User wants to change/reschedule an existing appointment
- "history": User wants to view their appointment history
- "question": User is asking a general question about services, doctors, clinic, etc.

User message: ${userMessage}
${historyContext ? `\nRecent history:\n${historyContext}` : ''}

Respond ONLY with the JSON, no additional text:`;

    const response = await intentLLM.invoke(prompt);
    const content = response.content.toString().trim();
    
    // Extract JSON from response (handle cases where LLM adds markdown or extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent || 'question',
        confidence: parsed.confidence || 0.5
      };
    }
    
    // Fallback to question if parsing fails
    return { intent: 'question', confidence: 0.5 };
  } catch (error) {
    logger.error('Error classifying intent', error as Error);
    // Fallback to question on error
    return { intent: 'question', confidence: 0.5 };
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

// Translation map for system messages
type TranslationValue = string | ((...args: any[]) => string);

const translations: Record<string, Record<string, TranslationValue>> = {
  en: {
    outOfScope: "I don't have knowledge about it. I can only help you with appointments, doctors, and clinic-related questions. How can I assist you with your dental care needs?",
    bookingSuccess: (serviceName: string, date: string, time: string, id: number) => 
      `Great! I've successfully booked your appointment${serviceName ? ` for ${serviceName}` : ''} on ${date} at ${time}. Your appointment ID is ${id}. You'll receive a confirmation reminder before your appointment. The appointment list on the website will be updated automatically.`,
    bookingFailed: (error: string) => `Booking attempt failed: ${error}`,
    slotUnavailable: (time: string, date: string, slots: string[]) => 
      `The time slot ${time} is not available on ${date}. Available slots: ${slots.join(', ')}`,
    duplicateAppointment: (service: string, date: string, time: string) => 
      `I see you already have an appointment for ${service} on ${date} at ${time}. Please choose a different date or service.`,
    noUpcomingAppointments: "You don't have any upcoming appointments to cancel.",
    noUpcomingToReschedule: "You don't have any upcoming appointments to reschedule.",
    cancellationSuccess: (id: number) => `I've successfully cancelled your appointment (ID: ${id}). The appointment list on the website will be updated automatically.`,
    rescheduleSuccess: (date: string, time: string) => `I've successfully rescheduled your appointment to ${date} at ${time}. The appointment list on the website will be updated automatically.`,
  },
  es: {
    outOfScope: "No tengo conocimiento sobre eso. Solo puedo ayudarte con citas, doctores y preguntas relacionadas con la clínica. ¿Cómo puedo ayudarte con tus necesidades de cuidado dental?",
    bookingSuccess: (serviceName: string, date: string, time: string, id: number) => 
      `¡Excelente! He reservado tu cita${serviceName ? ` para ${serviceName}` : ''} el ${date} a las ${time}. Tu ID de cita es ${id}. Recibirás un recordatorio de confirmación antes de tu cita. La lista de citas en el sitio web se actualizará automáticamente.`,
    bookingFailed: (error: string) => `Intento de reserva fallido: ${error}`,
    slotUnavailable: (time: string, date: string, slots: string[]) => 
      `El horario ${time} no está disponible el ${date}. Horarios disponibles: ${slots.join(', ')}`,
    duplicateAppointment: (service: string, date: string, time: string) => 
      `Veo que ya tienes una cita para ${service} el ${date} a las ${time}. Por favor elige una fecha o servicio diferente.`,
    noUpcomingAppointments: "No tienes citas próximas para cancelar.",
    noUpcomingToReschedule: "No tienes citas próximas para reprogramar.",
    cancellationSuccess: (id: number) => `He cancelado exitosamente tu cita (ID: ${id}). La lista de citas en el sitio web se actualizará automáticamente.`,
    rescheduleSuccess: (date: string, time: string) => `He reprogramado exitosamente tu cita al ${date} a las ${time}. La lista de citas en el sitio web se actualizará automáticamente.`,
  },
};

const getTranslation = (language: string, key: string, ...args: any[]): string => {
  const lang = language === 'es' ? 'es' : 'en';
  const translation = translations[lang]?.[key];
  if (!translation) {
    const fallback = translations.en[key];
    return typeof fallback === 'function' ? fallback(...args) : (fallback || '');
  }
  return typeof translation === 'function' ? translation(...args) : translation;
};

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
- When booking appointments, the system will check available slots automatically - you do NOT need to call tools
- DO NOT generate tool calls in your responses (like [Using tool: ...]) - tools are called automatically by the system
- If the context includes "[IMPORTANT: For the current booking request, use these validated values: ...]", you MUST use those exact validated dates/times, not dates from conversation history
- Use the exact date format YYYY-MM-DD (e.g., 2024-12-25) when mentioning dates
- Use the exact time format HH:MM (e.g., 14:30) when mentioning times
- Confirm appointment details before booking
- For appointment history, the system will retrieve it automatically
- Be friendly, empathetic, and professional
- If you don't have enough information, ask the user for clarification

Use the provided context and tools to help the user. 

CRITICAL: You MUST respond ALWAYS in English. All your responses must be completely in English, do not mix languages.`,
    es: `Eres un Coordinador Médico Personal para una clínica dental. SOLO puedes ayudar con:

1. **Reserva de Citas**: Reservar citas para el usuario. Usa las herramientas disponibles para:
   - Obtener servicios disponibles
   - Obtener dentistas disponibles
   - Verificar horarios disponibles para una fecha
   - Reservar citas con fecha, hora, servicio y dentista opcional

2. **Historial de Citas**: Recuperar y discutir el historial de citas del usuario, citas próximas y visitas pasadas.

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

INSTRUCCIONES IMPORTANTES:
- Al reservar citas, el sistema verificará los horarios disponibles automáticamente - NO necesitas llamar herramientas
- NO generes llamadas a herramientas en tus respuestas (como [Usando herramienta: ...]) - las herramientas se llaman automáticamente por el sistema
- Si el contexto incluye "[IMPORTANTE: Para la solicitud de reserva actual, usa estos valores validados: ...]", DEBES usar esas fechas/horas exactas validadas, no fechas del historial de conversación
- Usa el formato de fecha exacto YYYY-MM-DD (ejemplo: 2024-12-25) al mencionar fechas
- Usa el formato de hora exacto HH:MM (ejemplo: 14:30) al mencionar horas
- Confirma los detalles de la cita antes de reservar
- Para el historial de citas, el sistema lo recuperará automáticamente
- Sé amigable, empático y profesional
- Si no tienes suficiente información, pide aclaración al usuario

IMPORTANTE: DEBES responder SIEMPRE en español. Todas tus respuestas deben estar completamente en español, sin mezclar inglés.`,
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

// Conversation state interface
interface ConversationState {
  pendingAction?: 'book' | 'cancel' | 'reschedule';
  collectedInfo?: {
    serviceId?: number;
    serviceName?: string;
    date?: string;
    time?: string;
    dentistId?: number;
    dentistName?: string;
    appointmentId?: number;
  };
  missingInfo?: string[];
  availableSlots?: string[]; // Store available slots when user needs to select one
}

// Load conversation state from metadata
async function loadConversationState(conversationId: number): Promise<ConversationState | null> {
  try {
    const result = await query(
      'SELECT metadata FROM conversations WHERE id = $1',
      [conversationId]
    );
    
    if (result.rows.length === 0) return null;
    
    const metadata = result.rows[0].metadata || {};
    return {
      pendingAction: metadata.pendingAction,
      collectedInfo: metadata.collectedInfo || {},
      missingInfo: metadata.missingInfo || [],
    };
  } catch (error) {
    logger.error('Error loading conversation state', error as Error);
    return null;
  }
}

// Save conversation state to metadata
async function saveConversationState(conversationId: number, state: ConversationState | null): Promise<void> {
  try {
    if (state === null) {
      // Clear state
      await query(
        'UPDATE conversations SET metadata = \'{}\'::jsonb WHERE id = $1',
        [conversationId]
      );
    } else {
      await query(
        'UPDATE conversations SET metadata = $1::jsonb WHERE id = $2',
        [JSON.stringify(state), conversationId]
      );
    }
  } catch (error) {
    logger.error('Error saving conversation state', error as Error);
  }
}

export async function getRAGChatResponse(
  userMessage: string,
  conversationId: number | null,
  userId: number,
  language: string = 'en'
): Promise<{ response: string; conversationId: number; appointmentAction?: 'booked' | 'cancelled' | 'rescheduled' | null; appointmentId?: number | null }> {
  try {
    let convId: number;

    // Get or create conversation
    if (!conversationId) {
      const convResult = await query(
        `INSERT INTO conversations (user_id, started_at, last_message_at, metadata)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{}'::jsonb)
         RETURNING id`,
        [userId]
      );
      convId = convResult.rows[0].id;
    } else {
      // Verify conversation exists and belongs to user
      const convCheck = await query(
        `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
        [conversationId, userId]
      );
      
      if (convCheck.rows.length === 0) {
        // Conversation doesn't exist or doesn't belong to user - create a new one
        logger.warn('Conversation not found or access denied, creating new conversation', { 
          conversationId, 
          userId 
        });
        const convResult = await query(
          `INSERT INTO conversations (user_id, started_at, last_message_at, metadata)
           VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{}'::jsonb)
           RETURNING id`,
          [userId]
        );
        convId = convResult.rows[0].id;
      } else {
        convId = conversationId;
        // Update last message time
        await query(
          `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [convId]
        );
      }
    }
    
    // Load conversation state
    const conversationState = await loadConversationState(convId);

    // Get conversation history
    const historyResult = await query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY timestamp ASC 
       LIMIT 10`,
      [convId]
    );

    // Classify intent first to handle booking-related messages
    const intentResult = await classifyIntent(userMessage, historyResult.rows.map(r => ({ role: r.role, content: r.content })), language);
    const isBookingRelatedIntent = intentResult.intent === 'book' || intentResult.intent === 'cancel' || intentResult.intent === 'reschedule';
    
    logger.info('Intent classified', {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      isBookingRelatedIntent,
      message: userMessage.substring(0, 100)
    });

    // Check if question is in scope before processing (skip for booking-related intents)
    if (!isBookingRelatedIntent && !isQuestionInScope(userMessage)) {
      const outOfScopeResponse = getTranslation(language, 'outOfScope');
      
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

    // Lower confidence threshold for booking (0.5) to catch more booking requests
    const isBookingRequest = intentResult.intent === 'book' && intentResult.confidence > 0.5;
    const isHistoryRequest = intentResult.intent === 'history' && intentResult.confidence > 0.6;
    const isCancelRequest = intentResult.intent === 'cancel' && intentResult.confidence > 0.6;
    const isRescheduleRequest = intentResult.intent === 'reschedule' && intentResult.confidence > 0.6;

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
        finalResponse = getTranslation(language, 'noUpcomingAppointments');
        toolCallsMade = true;
      } else {
        // Try to extract appointment ID from message
        const idMatch = userMessage.match(/appointment\s*#?\s*(\d+)/i) || userMessage.match(/(\d+)/);
        if (idMatch) {
          const aptId = parseInt(idMatch[1]);
          const cancelResult = await cancelAppointment(userId, aptId);
          const cancel = JSON.parse(cancelResult);
          
          if (cancel.success) {
            finalResponse = getTranslation(language, 'cancellationSuccess', aptId);
            toolCallsMade = true;
            appointmentAction = 'cancelled';
            appointmentId = aptId;
          } else {
            finalResponse = language === 'es' 
              ? `No pude cancelar esa cita. ${cancel.error}`
              : `I couldn't cancel that appointment. ${cancel.error}`;
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
        finalResponse = getTranslation(language, 'noUpcomingToReschedule');
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
            finalResponse = getTranslation(language, 'rescheduleSuccess', newDate, newTime);
            toolCallsMade = true;
            appointmentAction = 'rescheduled';
            appointmentId = aptId;
          } else {
            finalResponse = language === 'es'
              ? `No pude reprogramar esa cita. ${reschedule.error}`
              : `I couldn't reschedule that appointment. ${reschedule.error}`;
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

    // Handle booking requests with multi-turn flow
    if (isBookingRequest || conversationState?.pendingAction === 'book') {
      logger.info('Processing booking request', { 
        isBookingRequest, 
        hasPendingAction: !!conversationState?.pendingAction,
        conversationState 
      });
      
      // Get available services and dentists for context
      const servicesData = await getServices();
      const dentistsData = await getDentists();
      const services = JSON.parse(servicesData);
      const dentists = JSON.parse(dentistsData);
      
      // Use LLM entity extraction
      let entities;
      try {
        entities = await extractEntities(userMessage, chatHistory, services, dentists, language);
        logger.info('Entities extracted', { entities });
      } catch (error) {
        logger.error('Entity extraction failed, using fallback parsing', error as Error);
        entities = {};
      }
      
      // Validate extracted dates - reject past dates and ask user to clarify
      if (entities.date) {
        const extractedDate = new Date(entities.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (extractedDate < today) {
          logger.warn('LLM extracted past date, rejecting and will ask user to clarify', { extractedDate: entities.date, userMessage: userMessage.substring(0, 100) });
          delete entities.date; // Remove the invalid past date - user needs to provide a future date
        }
      }
      
      // Only use fallback time parsing if LLM didn't extract time (time parsing is simpler and reliable)
      if (!entities.time) {
        const parsedTime = parseNaturalLanguageTime(userMessage, language);
        if (parsedTime) {
          entities.time = parsedTime;
          logger.info('Fallback time parsing found', { time: parsedTime });
        }
      }
      
      // Check if user is selecting a slot from available slots (e.g., "Slot1", "slot 1", "first slot")
      let selectedTimeFromSlot: string | null = null;
      if (conversationState?.availableSlots && conversationState.availableSlots.length > 0 && !entities.time) {
        const lowerMessage = userMessage.toLowerCase();
        // Try to match patterns like "slot1", "slot 1", "first slot", "1st slot", etc.
        const slotMatch = lowerMessage.match(/slot\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*slot|first\s*slot|second\s*slot|third\s*slot|fourth\s*slot|fifth\s*slot/i);
        if (slotMatch) {
          let slotIndex: number;
          if (slotMatch[1]) {
            // "slot1" or "slot 1"
            slotIndex = parseInt(slotMatch[1]) - 1; // Convert to 0-based index
          } else if (slotMatch[2]) {
            // "1st slot"
            slotIndex = parseInt(slotMatch[2]) - 1;
          } else {
            // "first slot", "second slot", etc.
            const slotWords: Record<string, number> = {
              'first': 0, 'second': 1, 'third': 2, 'fourth': 3, 'fifth': 4
            };
            slotIndex = slotWords[lowerMessage.match(/(first|second|third|fourth|fifth)/)?.[1] || 'first'] || 0;
          }
          
          if (slotIndex >= 0 && slotIndex < conversationState.availableSlots.length) {
            selectedTimeFromSlot = conversationState.availableSlots[slotIndex];
            logger.info('User selected slot from list', { slotIndex: slotIndex + 1, selectedTime: selectedTimeFromSlot, availableSlots: conversationState.availableSlots });
          }
        }
      }
      
      // Merge with conversation state
      const collectedInfo = {
        ...(conversationState?.collectedInfo || {}),
        ...(entities.serviceId ? { serviceId: entities.serviceId, serviceName: entities.serviceName } : {}),
        ...(entities.date ? { date: entities.date } : {}),
        ...(entities.time ? { time: entities.time } : selectedTimeFromSlot ? { time: selectedTimeFromSlot } : {}),
        ...(entities.dentistId ? { dentistId: entities.dentistId, dentistName: entities.dentistName } : {}),
      };
      
      logger.info('Collected info after merge', { collectedInfo, missingInfo: !collectedInfo.date ? 'date' : !collectedInfo.time ? 'time' : 'none', selectedTimeFromSlot });
      
      // Determine what's missing (service is optional, only date and time are required)
      const missingInfo: string[] = [];
      // Service is optional, so don't add it to missingInfo
      if (!collectedInfo.date) missingInfo.push('date');
      if (!collectedInfo.time) missingInfo.push('time');
      
      // If we have required info (date and time), proceed with booking
      if (collectedInfo.date && collectedInfo.time) {
        const serviceId = collectedInfo.serviceId;
        const date = collectedInfo.date;
        const time = collectedInfo.time;
        
        // Check for duplicate appointment before booking
        if (serviceId) {
          logger.info('Checking for duplicate appointment', { userId, serviceId, date });
          const duplicateCheck = await checkDuplicateAppointment(userId, serviceId, date);
          logger.info('Duplicate check result', { exists: duplicateCheck?.exists, appointment: duplicateCheck?.appointment });
          if (duplicateCheck?.exists && duplicateCheck.appointment) {
            finalResponse = getTranslation(language, 'duplicateAppointment', duplicateCheck.appointment.service, date, duplicateCheck.appointment.time);
            toolCallsMade = true;
            logger.info('Duplicate appointment found, setting response', { finalResponse: finalResponse.substring(0, 100) });
            // Clear state
            await saveConversationState(convId, null);
          }
        }
        
        if (!toolCallsMade) {
          // Check slots first
          logger.info('Checking available slots for booking', { date, time, serviceId, dentistId: collectedInfo.dentistId });
          const slotsData = await getAvailableSlots(date, collectedInfo.dentistId, serviceId);
          const slots = JSON.parse(slotsData);
          
          logger.info('Slots check result', { 
            available: slots.available, 
            slots: slots.slots, 
            requestedTime: time,
            timeInSlots: slots.slots?.includes(time)
          });
          
          if (slots.available && slots.slots && slots.slots.includes(time)) {
            logger.info('Slot available, proceeding with booking', { date, time, serviceId });
            const bookingResult = await bookAppointment(userId, date, time, serviceId, collectedInfo.dentistId);
            const booking = JSON.parse(bookingResult);
            
            logger.info('Booking result', { success: booking.success, appointmentId: booking.appointment?.id, error: booking.error });
            
            if (booking.success && booking.appointment) {
              const serviceName = serviceId ? services.find((s: any) => s.id === serviceId)?.name || '' : '';
              finalResponse = getTranslation(language, 'bookingSuccess', serviceName, date, time, booking.appointment.id);
              toolCallsMade = true;
              appointmentAction = 'booked';
              appointmentId = booking.appointment.id;
              // Clear state after successful booking
              await saveConversationState(convId, null);
            } else {
              // Set finalResponse directly for booking failures
              finalResponse = getTranslation(language, 'bookingFailed', booking.error);
              toolCallsMade = true; // Mark as handled
            }
          } else {
            logger.warn('Slot not available', { 
              available: slots.available, 
              requestedTime: time, 
              availableSlots: slots.slots,
              date,
              dayOfWeek: new Date(date + 'T00:00:00').getDay()
            });
            
            // If we have available slots (even if requested time isn't available), save them in conversation state so user can select one
            if (slots.slots && slots.slots.length > 0) {
              const newState: ConversationState = {
                pendingAction: 'book',
                collectedInfo: {
                  ...collectedInfo,
                  // Keep the date, but user will select a different time slot
                },
                missingInfo: ['time'], // User needs to select a time slot
                availableSlots: slots.slots, // Store available slots for selection
              };
              await saveConversationState(convId, newState);
              logger.info('Saved available slots in conversation state for user selection', { availableSlots: slots.slots });
            } else {
              // No slots available at all - check why
              const selectedDate = new Date(date + 'T00:00:00');
              const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
              logger.warn('No slots available', { date, dayName, available: slots.available, message: slots.message });
            }
            
            // Set finalResponse directly instead of adding to context
            finalResponse = getTranslation(language, 'slotUnavailable', time, date, slots.slots || []);
            toolCallsMade = true; // Mark as handled so LLM doesn't override
          }
        }
      } else {
        // Missing information - save state and ask user
        const newState: ConversationState = {
          pendingAction: 'book',
          collectedInfo,
          missingInfo,
        };
        await saveConversationState(convId, newState);
        
        // Format services and dentists for context
        const servicesList = services.map((s: any) => `- ${s.name} (ID: ${s.id}, ${s.duration} min${s.price ? `, $${s.price}` : ''})`).join('\n');
        const dentistsList = dentists.map((d: any) => `- ${d.name}${d.specialization ? ` (${d.specialization})` : ''}`).join('\n');
        
        // Ask for missing information in user's language
        const missingInfoText = missingInfo.map(info => {
          if (language === 'es') {
            if (info === 'service') return 'servicio';
            if (info === 'date') return 'fecha';
            if (info === 'time') return 'hora';
            return info;
          }
          return info;
        }).join(', ');
        
        additionalContext += `\n\nAvailable Services:\n${servicesList}\n\nAvailable Dentists:\n${dentistsList}`;
        
        if (language === 'es') {
          additionalContext += `\n\nNecesito más información para reservar tu cita. Por favor proporciona: ${missingInfoText}.`;
        } else {
          additionalContext += `\n\nI need more information to book your appointment. Please provide: ${missingInfoText}.`;
        }
      }
    }
    
    // If there's a pending booking action, add validated date/time to context so LLM knows what to use
    if (conversationState?.pendingAction === 'book' && conversationState?.collectedInfo) {
      const collectedInfo = conversationState.collectedInfo;
      if (collectedInfo.date || collectedInfo.time) {
        const dateTimeInfo: string[] = [];
        if (collectedInfo.date) {
          dateTimeInfo.push(`Date: ${collectedInfo.date}`);
        }
        if (collectedInfo.time) {
          dateTimeInfo.push(`Time: ${collectedInfo.time}`);
        }
        if (collectedInfo.serviceName) {
          dateTimeInfo.push(`Service: ${collectedInfo.serviceName}`);
        }
        if (dateTimeInfo.length > 0) {
          additionalContext += `\n\n[IMPORTANT: For the current booking request, use these validated values: ${dateTimeInfo.join(', ')}. When making tool calls or mentioning dates/times, use these exact values, not dates from the conversation history.]`;
        }
      }
    }

    // Create prompt template with additional context
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', getSystemPrompt(language)],
      ['system', `Context from knowledge base:\n\n${context}${additionalContext}`],
      ['system', `REMEMBER: If the user asks about anything outside appointments, doctors, clinic, or dental services (like entertainment, sports, movies, general knowledge, etc.), you MUST respond with: "${getTranslation(language, 'outOfScope')}"`],
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
      // But skip this check for booking-related intents (already handled earlier)
      const outOfScopeLower = getTranslation(language, 'outOfScope').toLowerCase();
      if (!isBookingRelatedIntent && !isQuestionInScope(userMessage) && !finalResponse.toLowerCase().includes(outOfScopeLower.substring(0, 20))) {
        finalResponse = getTranslation(language, 'outOfScope');
      }
    } else if (toolCallsMade) {
      // If we already have a response from booking/cancellation/rescheduling and toolCallsMade is true,
      // use the response directly without LLM formatting to avoid confusion
      // The response is already properly formatted and in the correct language
      logger.info('Using direct response without LLM formatting', { finalResponse: finalResponse.substring(0, 100) });
    } else {
      // If we have a response but toolCallsMade is false, use LLM to format it nicely
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