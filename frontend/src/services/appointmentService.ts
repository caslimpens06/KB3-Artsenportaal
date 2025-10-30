export interface Appointment {
  id: string;
  patientId: number;
  patientName: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  category: string;
  categoryId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface AppointmentFormData {
  description: string;
  start: Date;
  end: Date;
  categoryId?: string;
  allDay?: boolean;
}

const APPOINTMENTS_KEY = 'appointments';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getStoredAppointments = (): Appointment[] => {
  const stored = localStorage.getItem(APPOINTMENTS_KEY);
  if (!stored) return [];
  
  try {
    const appointments = JSON.parse(stored);
    return appointments.map((apt: any) => ({
      ...apt,
      start: new Date(apt.start),
      end: new Date(apt.end),
      createdAt: new Date(apt.createdAt)
    }));
  } catch (error) {
    console.error('Error parsing appointments from localStorage:', error);
    return [];
  }
};

const saveAppointments = (appointments: Appointment[]): void => {
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving appointments to localStorage:', error);
  }
};

export const appointmentService = {
  createAppointment: (
    patientId: number, 
    patientName: string, 
    appointmentData: AppointmentFormData,
    categoryTitle: string = 'Algemeen'
  ): Appointment => {
    const appointments = getStoredAppointments();
    
    const newAppointment: Appointment = {
      id: generateId(),
      patientId,
      patientName,
      title: appointmentData.description,
      description: appointmentData.description,
      start: appointmentData.start,
      end: appointmentData.end,
      category: categoryTitle,
      categoryId: appointmentData.categoryId,
      status: 'scheduled',
      createdAt: new Date()
    };
    
    appointments.push(newAppointment);
    saveAppointments(appointments);
    
    return newAppointment;
  },

  getAppointmentsByPatient: (patientId: number): Appointment[] => {
    const appointments = getStoredAppointments();
    return appointments.filter(apt => apt.patientId === patientId);
  },

  getAllUpcomingAppointments: (): Appointment[] => {
    const appointments = getStoredAppointments();
    const now = new Date();
    
    return appointments
      .filter(apt => apt.start >= now && apt.status === 'scheduled')
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  },

  getAllAppointments: (): Appointment[] => {
    return getStoredAppointments();
  },

  updateAppointmentStatus: (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled'): boolean => {
    const appointments = getStoredAppointments();
    const index = appointments.findIndex(apt => apt.id === appointmentId);
    
    if (index === -1) return false;
    
    appointments[index].status = status;
    saveAppointments(appointments);
    return true;
  },

  deleteAppointment: (appointmentId: string): boolean => {
    const appointments = getStoredAppointments();
    const filteredAppointments = appointments.filter(apt => apt.id !== appointmentId);
    
    if (filteredAppointments.length === appointments.length) return false;
    
    saveAppointments(filteredAppointments);
    return true;
  },

    getAppointmentsForCalendar: (patientId?: number): any[] => {
        const appointments = patientId
            ? getStoredAppointments().filter(apt => apt.patientId === patientId)
            : getStoredAppointments();

        return appointments.map(apt => ({
            _id: apt.id,
            title: apt.category,
            description: apt.description,
            start: apt.start,
            end: apt.end,
            patientId: apt.patientId,
            patientName: apt.patientName,
            categoryId: apt.categoryId,
            categoryTitle: apt.category
        }));
    },


  deleteAppointmentsByPatientName: (patientName: string): number => {
    const appointments = getStoredAppointments();
    const filteredAppointments = appointments.filter(apt => apt.patientName !== patientName);
    const deletedCount = appointments.length - filteredAppointments.length;
    
    if (deletedCount > 0) {
      saveAppointments(filteredAppointments);
    }
    
    return deletedCount;
  }
}; 