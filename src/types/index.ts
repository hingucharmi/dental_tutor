export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
}

export interface Appointment {
  id: number;
  userId: number;
  dentistId?: number;
  serviceId?: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  basePrice?: number;
  category?: string;
}

export interface Dentist {
  id: number;
  userId?: number;
  specialization?: string;
  bio?: string;
  availabilitySchedule?: Record<string, { start: string; end: string }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

