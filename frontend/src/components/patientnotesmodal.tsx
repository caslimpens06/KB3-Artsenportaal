import React, { useState, useEffect } from "react";
import AddNotePopup from "./addnotepopup";
import { notesService } from "../services/notesService";

interface PatientNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    onNotesUpdated?: () => void;
}

const PatientNotesModal: React.FC<PatientNotesModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    onNotesUpdated
}) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [showAddNote, setShowAddNote] = useState(false);

    const loadNotes = () => {
        const fetchedNotes = notesService.getNotesByPatient(patientId);
        setNotes(fetchedNotes);
    };

    const handleNoteAdded = () => {
        setShowAddNote(false);
        loadNotes();
        if (onNotesUpdated) onNotesUpdated();
    };

    const handleDeleteNote = (noteId: string) => {
        notesService.deleteNote(noteId);
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        if (onNotesUpdated) onNotesUpdated();
    };

    useEffect(() => {
        if (isOpen) loadNotes();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg w-4/5 max-w-5xl h-4/5 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Notities van {patientName} ({notes.length})</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {notes.length === 0 ? (
                        <p className="text-gray-500 text-center text-lg">Geen notities beschikbaar</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="p-6 border rounded-lg bg-gray-50 flex justify-between items-start space-x-4">
                                <div>
                                    <div className="text-lg font-semibold text-gray-800 mb-1">{note.title}</div>
                                    <div className="text-gray-800 mb-2">{note.content}</div>
                                    <div className="text-sm text-gray-600">{new Date(note.createdAt).toLocaleString()}</div>
                                </div>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors self-start"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={() => setShowAddNote(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                    >
                        Nieuwe notitie
                    </button>
                </div>
            </div>
            <AddNotePopup
                isOpen={showAddNote}
                onClose={() => setShowAddNote(false)}
                patientId={patientId}
                patientName={patientName}
                onNoteAdded={handleNoteAdded}
            />
        </div>
    );
};

export default PatientNotesModal;