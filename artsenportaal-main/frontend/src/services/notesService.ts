export interface PatientNote {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  content: string;
  createdAt: Date;
  specialistName: string;
}

const NOTES_KEY = 'patient_notes';

// Helper function to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to get all notes from localStorage
const getStoredNotes = (): PatientNote[] => {
  const stored = localStorage.getItem(NOTES_KEY);
  if (!stored) return [];
  
  try {
    const notes = JSON.parse(stored);
    // Convert date strings back to Date objects
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt)
    }));
  } catch (error) {
    console.error('Error parsing notes from localStorage:', error);
    return [];
  }
};

// Helper function to save notes to localStorage
const saveNotes = (notes: PatientNote[]): void => {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to localStorage:', error);
  }
};

export const notesService = {
  // Create a new note
  createNote: (
    patientId: string,
    patientName: string,
    title: string,
    content: string,
    specialistName: string = 'Dr. Johannes Doe'
  ): PatientNote => {
    const notes = getStoredNotes();
    
    const newNote: PatientNote = {
      id: generateId(),
      patientId,
      patientName,
      title,
      content,
      createdAt: new Date(),
      specialistName
    };
    
    notes.push(newNote);
    saveNotes(notes);
    
    return newNote;
  },

  // Get all notes for a specific patient
  getNotesByPatient: (patientId: string): PatientNote[] => {
    const notes = getStoredNotes();
    return notes.filter(note => note.patientId === patientId);
  },

  // Get all notes
  getAllNotes: (): PatientNote[] => {
    return getStoredNotes();
  },

  // Update a note
  updateNote: (noteId: string, updates: Partial<PatientNote>): boolean => {
    const notes = getStoredNotes();
    const index = notes.findIndex(note => note.id === noteId);
    
    if (index === -1) return false;
    
    notes[index] = { ...notes[index], ...updates };
    saveNotes(notes);
    return true;
  },

  // Delete a note
  deleteNote: (noteId: string): boolean => {
    const notes = getStoredNotes();
    const filteredNotes = notes.filter(note => note.id !== noteId);
    
    if (filteredNotes.length === notes.length) return false;
    
    saveNotes(filteredNotes);
    return true;
  }
}; 