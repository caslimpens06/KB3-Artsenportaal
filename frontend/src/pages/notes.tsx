import React, { useState, useEffect } from "react";
import { notesService, PatientNote } from "../services/notesService";

// Utility function to highlight matching text
const highlightText = (text: string, searchTerm: string): JSX.Element => {
	if (!searchTerm.trim()) {
		return <span>{text}</span>;
	}

	const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	const parts = text.split(regex);

	return (
		<span>
			{parts.map((part, index) => 
				regex.test(part) ? (
					<mark key={index} className="bg-yellow-200 text-yellow-900 font-medium px-1 rounded">
						{part}
					</mark>
				) : (
					<span key={index}>{part}</span>
				)
			)}
		</span>
	);
};

// Patient Note List Item Component
const PatientNoteListItem: React.FC<{ 
	note: PatientNote; 
	searchTerm: string; 
	isMatch: boolean;
}> = ({ note, searchTerm, isMatch }) => {
	const formatDate = (date: Date): string => {
		return date.toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const baseClasses = "p-4 border rounded-lg bg-white transition-all duration-200";
	const matchClasses = isMatch 
		? "border-2 border-blue-400 shadow-lg bg-blue-50 ring-2 ring-blue-200" 
		: "border-gray-200 hover:bg-gray-50";

	return (
		<div className={`${baseClasses} ${matchClasses}`}>
			{/* Match indicator */}
			{isMatch && (
				<div className="flex items-center gap-2 mb-2 text-blue-600 text-sm font-medium">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
					</svg>
					<span>Zoekresultaat</span>
				</div>
			)}

			<div className="flex justify-between items-start mb-2">
				<h3 className={`font-medium ${isMatch ? 'text-blue-700' : 'text-blue-600'}`}>
					{highlightText(note.title, searchTerm)}
				</h3>
				<span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
			</div>
			<div className="grid grid-cols-4 gap-4 text-sm">
				<div>
					<span className="font-medium text-gray-600">Notitie:</span>
					<div className={`font-medium ${isMatch ? 'text-blue-700' : 'text-blue-600'}`}>
						{highlightText(note.title, searchTerm)}
					</div>
				</div>
				<div>
					<span className="font-medium text-gray-600">Specialist:</span>
					<div>{highlightText(note.specialistName, searchTerm)}</div>
				</div>
				<div>
					<span className="font-medium text-gray-600">Patiënt:</span>
					<div>{highlightText(note.patientName, searchTerm)}</div>
				</div>
				<div>
					<span className="font-medium text-gray-600">Inhoud:</span>
					<div className="text-gray-700 line-clamp-2" title={note.content}>
						{highlightText(
							note.content.length > 50 ? `${note.content.substring(0, 50)}...` : note.content,
							searchTerm
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

const Notes: React.FC = () => {
	const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
	const [filteredNotes, setFilteredNotes] = useState<PatientNote[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [sortField, setSortField] = useState<'title' | 'specialist' | 'patient' | 'date' | null>(null);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

	// Load patient notes from localStorage
	useEffect(() => {
		const loadPatientNotes = () => {
			const allPatientNotes = notesService.getAllNotes();
			setPatientNotes(allPatientNotes);
		};

		loadPatientNotes();

		// Refresh every 5 seconds to catch new notes
		const interval = setInterval(loadPatientNotes, 5000);
		return () => clearInterval(interval);
	}, []);

	// Check if a note matches the search term
	const isNoteMatch = (note: PatientNote, term: string): boolean => {
		if (!term.trim()) return false;
		const searchLower = term.toLowerCase();
		return (
			note.title.toLowerCase().includes(searchLower) ||
			note.content.toLowerCase().includes(searchLower) ||
			note.patientName.toLowerCase().includes(searchLower) ||
			note.specialistName.toLowerCase().includes(searchLower)
		);
	};

	// Filter and sort notes when data changes
	useEffect(() => {
		let filtered = [...patientNotes];

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(note => 
				note.title.toLowerCase().includes(term) ||
				note.content.toLowerCase().includes(term) ||
				note.patientName.toLowerCase().includes(term) ||
				note.specialistName.toLowerCase().includes(term)
			);

			// Sort matching notes to the top when searching
			filtered = filtered.sort((a, b) => {
				const aMatches = isNoteMatch(a, searchTerm);
				const bMatches = isNoteMatch(b, searchTerm);
				
				if (aMatches && !bMatches) return -1;
				if (!aMatches && bMatches) return 1;
				return 0;
			});
		}

		// Apply sorting
		if (sortField) {
			filtered.sort((a, b) => {
				let aValue: string | Date;
				let bValue: string | Date;

				switch (sortField) {
					case 'title':
						aValue = a.title;
						bValue = b.title;
						break;
					case 'specialist':
						aValue = a.specialistName;
						bValue = b.specialistName;
						break;
					case 'patient':
						aValue = a.patientName;
						bValue = b.patientName;
						break;
					case 'date':
						aValue = a.createdAt;
						bValue = b.createdAt;
						break;
					default:
						return 0;
				}

				if (sortField === 'date') {
					const dateA = new Date(aValue).getTime();
					const dateB = new Date(bValue).getTime();
					return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
				} else {
					const stringA = String(aValue).toLowerCase();
					const stringB = String(bValue).toLowerCase();
					if (stringA < stringB) return sortDirection === 'asc' ? -1 : 1;
					if (stringA > stringB) return sortDirection === 'asc' ? 1 : -1;
					return 0;
				}
			});
		}

		setFilteredNotes(filtered);
	}, [patientNotes, searchTerm, sortField, sortDirection]);

	// Handle sorting
	const handleSort = (field: 'title' | 'specialist' | 'patient' | 'date') => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
	};

	// Get sort arrow icon
	const getSortIcon = (field: 'title' | 'specialist' | 'patient' | 'date') => {
		if (sortField !== field) {
			return "Images/dropdown_arrow.png";
		}
		return sortDirection === 'asc' ? "Images/dropdown_arrow.png" : "Images/dropdown_arrow_reverse.png";
	};

	return (
		<div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
			{/* Header */}
			<div className="p-6 bg-white border-b border-gray-200">
				<h1 className="text-3xl font-bold text-blue-900">Notities</h1>
				<hr className="mt-3 h-0.5 border-2 border-blue-800 w-32 bg-blue-800" />
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-hidden p-6">
				<div className="bg-white h-full rounded-xl shadow-sm border border-gray-200 flex flex-col">
					
					{/* Search bar */}
					<div className="p-4 border-b border-gray-200">
						<div className="relative">
							<input 
								type="text" 
								placeholder="Zoek notitie..." 
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full p-3 border border-gray-300 rounded-lg pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
							/>
							{searchTerm && (
								<div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
									<span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
										{filteredNotes.length} resultaat{filteredNotes.length !== 1 ? 'en' : ''}
									</span>
									<button
										onClick={() => setSearchTerm('')}
										className="text-gray-400 hover:text-gray-600 p-1"
										title="Zoekterm wissen"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							)}
						</div>
					</div>
					
					{/* Table headers */}
					<div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
						<div className="grid grid-cols-4 gap-4">
							<div className="flex items-center space-x-3">
								<h2 className="text-sm font-semibold text-gray-700">Notitie</h2>
								<button onClick={() => handleSort('title')} className="bg-transparent border-none p-0">
									<img src={getSortIcon('title')} alt="Arrow down" className="h-6 w-4" />
								</button>
							</div>
							<div className="flex items-center space-x-3">
								<h2 className="text-sm font-semibold text-gray-700">Specialist</h2>
								<button onClick={() => handleSort('specialist')} className="bg-transparent border-none p-0">
									<img src={getSortIcon('specialist')} alt="Arrow down" className="h-6 w-4" />
								</button>
							</div>
							<div className="flex items-center space-x-3">
								<h2 className="text-sm font-semibold text-gray-700">Patiënt</h2>
								<button onClick={() => handleSort('patient')} className="bg-transparent border-none p-0">
									<img src={getSortIcon('patient')} alt="Arrow down" className="h-6 w-4" />
								</button>
							</div>
							<div className="flex items-center space-x-3">
								<h2 className="text-sm font-semibold text-gray-700">Datum</h2>
								<button onClick={() => handleSort('date')} className="bg-transparent border-none p-0">
									<img src={getSortIcon('date')} alt="Arrow down" className="h-6 w-4" />
								</button>
							</div>
						</div>
					</div>

					{/* List of notes */}
					<div className="flex-1 overflow-y-auto p-4">
						<div className="space-y-3">
							{filteredNotes.length > 0 ? (
								filteredNotes.map((note) => (
									<PatientNoteListItem 
										key={note.id} 
										note={note} 
										searchTerm={searchTerm}
										isMatch={isNoteMatch(note, searchTerm)}
									/>
								))
							) : patientNotes.length > 0 ? (
								<div className="text-center py-12 text-gray-500">
									<p className="text-lg">Geen notities gevonden voor "{searchTerm}"</p>
									<p className="text-sm mt-2">Probeer een andere zoekterm</p>
								</div>
							) : (
								<div className="text-center py-12 text-gray-500">
									<p className="text-lg">Nog geen notities toegevoegd</p>
									<p className="text-sm mt-2">Voeg notities toe via de patiëntpagina's</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Notes;
