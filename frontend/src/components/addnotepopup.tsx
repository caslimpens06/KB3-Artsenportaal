import React, { useState } from 'react';
import { notesService } from '../services/notesService';

interface AddNotePopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onNoteAdded?: () => void;
}

const AddNotePopup: React.FC<AddNotePopupProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onNoteAdded
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Vul zowel de titel als de inhoud in');
      return;
    }

    try {
      setSaving(true);
      
      // Create the note
      notesService.createNote(
        patientId,
        patientName,
        title.trim(),
        content.trim()
      );

      // Reset form
      setTitle('');
      setContent('');
      
      // Notify parent component
      if (onNoteAdded) {
        onNoteAdded();
      }
      
      // Close popup
      onClose();
      
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Er is een fout opgetreden bij het opslaan van de notitie');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nieuwe notitie</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Notitie voor: <span className="font-medium text-blue-600">{patientName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titel *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Controle afspraak, Behandelplan, etc."
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Inhoud *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Schrijf hier de notitie..."
                required
                disabled={saving}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={saving}
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Opslaan...' : 'Notitie opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNotePopup; 