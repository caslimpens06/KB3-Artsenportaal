// src/pages/PatientOverview.tsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import CmasScoreChart from '../components/CmasScoreChart';
import MultiLabResultChart from '../components/MultiLabResultChart';
import MeasurementsCalendar from '../components/measurementscalendar';
import AddNotePopup from '../components/addnotepopup';
import { Patient } from "../abstracts/ImportsModels";
import { appointmentService } from "../services/appointmentService";
import { notesService } from "../services/notesService";

// Interfaces for patient data
interface CmasScore {
	id: number;
	date: string;
	score: number;
	category: string;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
}



interface LabResult {
	id: number;
	resultName: string;
	unit: string;
	labResultId: string;
	value: string;
	measurements: {
		id: number;
		measurementId: string;
		dateTime: string;
		value: string;
	}[];
}

interface LabResultGroup {
	id: number;
	groupName: string;
	groupId: string;
	lab_results: LabResult[];
}

interface PatientData {
	id: number;
	name: string;
	patientId: string;
	cmas_scores: CmasScore[];
}

interface PatientListItem {
	id: number;
	name: string;
	patientId?: string;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
}

type ViewMode = 'patient-data' | 'appointments';

// Add PatientSearch component before PatientOverview
const PatientSearch: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const findAndRedirectToPatient = async () => {
			const patientName = location.state?.patientName;
			const appointmentContext = location.state?.appointmentContext;
			const fromDashboard = location.state?.fromDashboard;

			if (!patientName) {
				setError("No patient name provided");
				setLoading(false);
				return;
			}

			try {
				// Get all patients and search for a match by name
				const response = await axios.get('http://localhost:1337/api/patients', {
					params: {
						populate: {
							cmas_scores: {
								sort: ['date:asc']
							}
						}
					}
				});

				if (response.data?.data) {
					// Find patient by name match - prioritize exact matches first
					let foundPatient = response.data.data.find((p: any) => 
						p.name.toLowerCase() === patientName.toLowerCase()
					);
					
					// If no exact match, try partial matching but be more restrictive
					if (!foundPatient) {
						foundPatient = response.data.data.find((p: any) => {
							const patientNameLower = p.name.toLowerCase();
							const searchNameLower = patientName.toLowerCase();
							
							// Only match if one name completely contains the other
							// and they share significant overlap (more than 50% of the shorter name)
							const longerName = patientNameLower.length > searchNameLower.length ? patientNameLower : searchNameLower;
							const shorterName = patientNameLower.length <= searchNameLower.length ? patientNameLower : searchNameLower;
							
							return longerName.includes(shorterName) && 
								   (shorterName.length / longerName.length) > 0.5;
						});
					}

					if (foundPatient) {
						// Redirect to the correct patient overview page
						navigate(`/patient/${foundPatient.id}`, {
							state: {
								appointmentContext,
								fromDashboard
							},
							replace: true
						});
						return;
					}
				}

				setError(`Patient "${patientName}" not found`);
				setLoading(false);
			} catch (err) {
				console.error('Error searching for patient:', err);
				setError("Error searching for patient");
				setLoading(false);
			}
		};

		findAndRedirectToPatient();
	}, [location.state, navigate]);

	if (loading) return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
				<p className="mt-4 text-gray-600">Patiënt zoeken...</p>
			</div>
		</div>
	);

	if (error) return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center max-w-md">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-red-800 mb-2">Patiënt niet gevonden</h2>
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => navigate('/dashboard')}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Terug naar dashboard
					</button>
				</div>
			</div>
		</div>
	);

	return null;
};

const PatientOverview: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	
	// Get context from navigation state
	const appointmentContext = location.state?.appointmentContext;
	const fromDashboard = location.state?.fromDashboard || false;
	const fromPatients = location.state?.fromPatients || false; // New: detect navigation from patients page

	// Patient data state
	const [patient, setPatient] = useState<PatientData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Patient selector state
	const [allPatients, setAllPatients] = useState<PatientListItem[]>([]);
	const [showPatientSelector, setShowPatientSelector] = useState(fromPatients); // Show by default if from patients page
	const [patientsLoading, setPatientsLoading] = useState(false);

	// View mode and lab results state
	const [viewMode, setViewMode] = useState<ViewMode>('patient-data');
	const [labGroups, setLabGroups] = useState<LabResultGroup[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null); // Default to CMAS (null)
	const [selectedResults, setSelectedResults] = useState<LabResult[]>([]);

	// Note popup state
	const [showNotePopup, setShowNotePopup] = useState(false);
	const [patientNotes, setPatientNotes] = useState<any[]>([]);

	// Fetch all patients for the selector
	const fetchAllPatients = async () => {
		if (allPatients.length > 0) return; // Already loaded
		
		try {
			setPatientsLoading(true);
			const response = await fetch('http://localhost:1337/api/patients');
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (data?.data) {
				const transformedPatients = data.data.map((patient: any) => ({
					id: patient.id,
					name: patient.name,
					patientId: patient.patientId,
					documentId: patient.documentId,
					createdAt: patient.createdAt,
					updatedAt: patient.updatedAt,
					publishedAt: patient.publishedAt,
				}));
				
				setAllPatients(transformedPatients);
			}
		} catch (err) {
			console.error('Error fetching patients list:', err);
		} finally {
			setPatientsLoading(false);
		}
	};

	// Handle navigation state for showing CMAS scores
	// Restore view mode from navigation state and auto-load patients if from patients page
	useEffect(() => {
		if (location.state?.preserveViewMode) {
			setViewMode(location.state.preserveViewMode);
		}
		
		// Auto-load patient list if coming from patients page
		if (fromPatients) {
			fetchAllPatients();
		}
	}, [location.state, fromPatients, fetchAllPatients]);

	// Fetch current patient data
	useEffect(() => {
		const fetchPatient = async () => {
			if (!id) return;

			try {
				setLoading(true);
				const response = await axios.get('http://localhost:1337/api/patients', {
					params: {
						filters: {
							id: parseInt(id)
						},
						populate: {
							cmas_scores: {
								sort: ['date:asc']
							}
						}
					}
				});

				if (response.data?.data && response.data.data.length > 0) {
					const patientData = response.data.data[0];
					setPatient({
						id: patientData.id,
						name: patientData.name,
						patientId: patientData.patientId,
						cmas_scores: patientData.cmas_scores || []
					});
				} else {
					setError("Patiënt niet gevonden");
				}
			} catch (err) {
				console.error('Error fetching patient:', err);
				setError("Fout bij laden van patiënt");
			} finally {
				setLoading(false);
			}
		};

		fetchPatient();
	}, [id]);

	// Load appointments when patient is loaded
	useEffect(() => {
		if (patient && appointmentContext) {
			// Current appointment is available for display purposes if needed
		}
	}, [patient, appointmentContext]);

	// Load patient notes when patient is loaded
	useEffect(() => {
		loadPatientNotes();
	}, [patient]);

	// Fetch lab groups when patient is loaded
	useEffect(() => {
		const fetchLabGroups = async () => {
			if (!patient?.id) return;

			try {
				const patientId = patient.id;
				
				// First try to fetch lab results for the selected patient
				let response = await axios.get(
					`http://localhost:1337/api/lab-results`,
					{
						params: {
							filters: {
								patient: {
									id: patientId
								}
							},
							populate: ['measurements', 'lab_result_group'],
							pagination: {
								pageSize: 200
							}
						}
					}
				);

				// If no results found for this patient, fall back to all results
				if (!response.data?.data || response.data.data.length === 0) {
					response = await axios.get(
						`http://localhost:1337/api/lab-results`,
						{
							params: {
								populate: ['measurements', 'lab_result_group'],
								pagination: {
									pageSize: 200
								}
							}
						}
					);
				}

				if (response.data?.data) {
					// Group the lab results by their lab_result_group
					const resultsByGroup = new Map();
					
					response.data.data.forEach((result: any) => {
						const group = result.lab_result_group;
						if (!group) return;
						
						if (!resultsByGroup.has(group.id)) {
							resultsByGroup.set(group.id, {
								id: group.id,
								groupName: group.groupName || 'Ungrouped',
								groupId: group.groupId || '',
								lab_results: []
							});
						}
						
						resultsByGroup.get(group.id).lab_results.push({
							id: result.id,
							resultName: result.resultName || '',
							labResultId: result.labResultId || '',
							value: result.value || '',
							unit: result.unit || '',
							measurements: (result.measurements || []).map((m: any) => ({
								id: m.id,
								measurementId: m.measurementId || '',
								dateTime: m.dateTime || '',
								value: m.value || ''
							})).sort((a: { dateTime: string }, b: { dateTime: string }) => 
								new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
							)
						});
					});

					const groups = Array.from(resultsByGroup.values());
					const filteredGroups = groups.filter((group: any) => 
						group.lab_results && 
						group.lab_results.length > 0 && 
						group.lab_results.some((result: any) => 
							result.measurements && result.measurements.length > 0
						)
					);

					setLabGroups(filteredGroups);

					// Don't auto-select any lab group - stay on CMAS by default
					// selectedGroupId remains null (CMAS) unless user explicitly selects a lab group
				}
			} catch (err) {
				console.error('Error fetching lab groups:', err);
			}
		};

		fetchLabGroups();
	}, [patient]);

	// Toggle lab result selection
	const toggleLabResult = (result: LabResult) => {
		const isSelected = selectedResults.some(r => r.id === result.id);
		
		if (isSelected) {
			const newSelected = selectedResults.filter(r => r.id !== result.id);
			setSelectedResults(newSelected);
		} else {
			const newSelected = [...selectedResults, result];
			setSelectedResults(newSelected);
		}
	};

	// Create a mock Patient object for the appointments calendar
	const createMockPatient = (patientData: PatientData): Patient => {
		return new Patient(
			patientData.name.split(' ')[0] || 'Unknown',
			patientData.name.split(' ').slice(1).join(' ') || 'Patient',
			`${patientData.patientId}@example.com`,
			30, // Default age
			'000-000-0000',
			'contact@example.com',
			'000-000-0000',
			'Unknown'
		);
	};

	// Get current group
	const currentGroup = labGroups.find(group => group.id === selectedGroupId);

	// Get appointment info if navigated from dashboard
	const currentAppointment = appointmentContext ? 
		appointmentService.getAllAppointments().find(apt => apt.id === appointmentContext) : null;

	// Format date for display
	const formatDate = (date: Date): string => {
		return date.toLocaleDateString('nl-NL', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};

	const formatTime = (date: Date): string => {
		return date.toLocaleTimeString('nl-NL', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// Toggle patient selector and fetch patients if needed
	const handleTogglePatientSelector = () => {
		// Don't allow hiding if from patients page
		if (fromPatients) return;
		
		if (!showPatientSelector) {
			fetchAllPatients();
		}
		setShowPatientSelector(!showPatientSelector);
	};

	// Handle patient selection from the selector
	const handlePatientSelect = (patientId: number) => {
		if (patientId === patient?.id) {
			if (!fromPatients) {
				setShowPatientSelector(false);
			}
			return;
		}
		
		// Navigate to the new patient while preserving view mode and appointment context
		navigate(`/patient/${patientId}`, {
			state: {
				appointmentContext,
				fromDashboard,
				fromPatients,
				preserveViewMode: viewMode
			},
			replace: true
		});
		
		if (!fromPatients) {
			setShowPatientSelector(false);
		}
	};

	// Note-related functions
	const loadPatientNotes = () => {
		if (patient?.id) {
			const notes = notesService.getNotesByPatient(patient.id.toString());
			setPatientNotes(notes);
		}
	};

	const handleNoteAdded = () => {
		loadPatientNotes(); // Refresh notes after adding
	};

	const handleAddNoteClick = () => {
		setShowNotePopup(true);
	};

	if (loading) return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
				<p className="mt-4 text-gray-600">Patiënt laden...</p>
			</div>
		</div>
	);

	if (error || !patient) return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center max-w-md">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-red-800 mb-2">Fout bij laden</h2>
					<p className="text-red-600 mb-4">{error || "Patiënt niet gevonden"}</p>
					<button
						onClick={() => navigate('/dashboard')}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Terug naar dashboard
					</button>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						{/* Patient Selector Toggle - only show if NOT from patients page */}
						{!fromPatients && (
							<button
								onClick={handleTogglePatientSelector}
								className={`p-2 rounded-lg border transition-colors ${
									showPatientSelector
										? 'bg-blue-100 text-blue-700 border-blue-300'
										: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
								}`}
								title="Selecteer andere patiënt"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239" />
								</svg>
							</button>
						)}
						
						<div>
							<h1 className="text-3xl font-bold text-blue-900">{patient.name}</h1>
							<div className="flex items-center gap-4 mt-2">
								<p className="text-sm text-gray-600">Patiënt ID: {patient.patientId}</p>
								{fromDashboard && currentAppointment && (
									<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
										Afspraak: {currentAppointment.category}
									</span>
								)}
							</div>
							<hr className="mt-3 h-0.5 border-2 border-blue-800 w-32 bg-blue-800" />
						</div>
					</div>
					
					{/* Action Buttons */}
					<div className="flex space-x-2">
						<button
							onClick={() => setViewMode('patient-data')}
							className={`px-4 py-2 rounded-lg border transition-colors ${
								viewMode === 'patient-data'
									? 'bg-blue-500 text-white border-blue-500'
									: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
							}`}
						>
							Gegevens & Grafieken
						</button>
						<button
							onClick={() => setViewMode('appointments')}
							className={`px-4 py-2 rounded-lg border transition-colors ${
								viewMode === 'appointments'
									? 'bg-blue-500 text-white border-blue-500'
									: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
							}`}
						>
							Afspraken
						</button>
						<button
							onClick={handleAddNoteClick}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
							title="Voeg notitie toe"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Notitie ({patientNotes.length})
						</button>
						<button
							onClick={() => navigate('/patients', { 
								state: { 
									preserveSelectedPatient: patient?.id 
								}
							})}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							← Patiënten
						</button>
					</div>
				</div>

				{/* Single Appointment Context Banner */}
				{fromDashboard && currentAppointment && (
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-blue-900">Aankomende afspraak</h3>
								<p className="text-blue-700 text-sm mt-1">
									{formatDate(currentAppointment.start)} om {formatTime(currentAppointment.start)} - {formatTime(currentAppointment.end)}
								</p>
								<p className="text-blue-600 text-sm">{currentAppointment.description}</p>
							</div>
							<div className="text-right">
								<span className="px-3 py-1 bg-blue-200 text-blue-800 text-sm font-medium rounded-full">
									{currentAppointment.category}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex h-[calc(100vh-120px)]">
				{/* Patient Selector Sidebar */}
				{showPatientSelector && (
					<div className={`${fromPatients ? 'w-72' : 'w-80'} bg-white border-r border-gray-200 flex flex-col`}>
						<div className="p-3 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Alle patiënten</h2>
							{patientsLoading && (
								<div className="text-sm text-gray-500 mt-1">Laden...</div>
							)}
						</div>
						
						<div className="flex-1 overflow-y-auto">
							{allPatients.length === 0 && !patientsLoading ? (
								<div className="p-3 text-gray-500">Geen patiënten gevonden</div>
							) : (
								<div className="space-y-0">
									{allPatients.map((patientItem) => (
										<div
											key={patientItem.id}
											onClick={() => handlePatientSelect(patientItem.id)}
											className={`p-2 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
												patient?.id === patientItem.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
											}`}
										>
											<div className="font-medium text-gray-900 text-sm">{patientItem.name}</div>
											<div className="text-xs text-gray-600">{patientItem.patientId || 'Geen ID'}</div>
											{!fromPatients && (
												<div className="text-xs text-gray-500 mt-1">
													{patient?.id === patientItem.id ? 'Huidig geselecteerd' : 'Klik om te selecteren'}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{viewMode === 'patient-data' ? (
					<>
						{/* Data Categories Sidebar */}
						<div className="w-64 bg-white border-r border-gray-200 flex flex-col">
							{/* CMAS Section */}
							<div className="p-4 border-b border-gray-200">
								<button
									onClick={() => {
										console.log('CMAS button clicked');
										console.log('Current patient:', patient);
										console.log('Current patient CMAS scores:', patient?.cmas_scores);
										setSelectedGroupId(null);
										setSelectedResults([]);
									}}
									className={`w-full text-left p-3 rounded-lg transition-colors ${
										selectedGroupId === null
											? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
											: 'hover:bg-gray-100 text-gray-700'
									}`}
								>
									<div className="font-medium">CMAS Scores</div>
									<div className="text-sm text-gray-500 mt-1">
										{patient.cmas_scores?.length || 0} metingen
									</div>
								</button>
							</div>

							{/* Lab Results Groups */}
							<div className="flex-1 overflow-y-auto">
								<div className="p-4">
									<h3 className="font-medium text-gray-900 mb-3">Lab Resultaten</h3>
									<div className="space-y-2">
										{labGroups.map((group) => (
											<button
												key={group.id}
												onClick={() => {
													setSelectedGroupId(group.id);
													setSelectedResults([]);
												}}
												className={`w-full text-left p-3 rounded-lg transition-colors ${
													selectedGroupId === group.id
														? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
														: 'hover:bg-gray-100 text-gray-700'
												}`}
											>
												<div className="font-medium">{group.groupName}</div>
												<div className="text-sm text-gray-500 mt-1">
													{group.lab_results?.length || 0} resultaten
												</div>
											</button>
										))}
									</div>
								</div>
							</div>

							{/* Lab Results Selection */}
							{currentGroup && (
								<div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
									<h4 className="font-medium text-gray-900 mb-2">Selecteer Metingen</h4>
									<div className="space-y-1">
										{currentGroup.lab_results
											.filter(result => result.measurements && result.measurements.length > 0)
											.map((result) => (
												<button
													key={result.id}
													onClick={() => toggleLabResult(result)}
													className={`w-full text-left p-2 rounded text-sm transition-colors ${
														selectedResults.some(r => r.id === result.id)
															? 'bg-green-100 text-green-700 border-2 border-green-300'
															: 'hover:bg-gray-100 text-gray-700'
													}`}
												>
													{result.resultName} {result.unit && `(${result.unit})`} ({result.measurements.length})
												</button>
											))}
									</div>
								</div>
							)}
						</div>

						{/* Chart Area */}
						<div className="flex-1 p-4 overflow-y-auto">
							{selectedGroupId === null ? (
								// CMAS Chart
								patient.cmas_scores && patient.cmas_scores.length > 0 ? (
									<div className="h-full">
										<CmasScoreChart data={patient.cmas_scores} />
									</div>
								) : (
									<div className="flex items-center justify-center h-full text-gray-500">
										<div className="text-center">
											<p className="text-lg">Geen CMAS data beschikbaar</p>
											<p className="text-sm mt-2">Deze patiënt heeft geen CMAS scores</p>
										</div>
									</div>
								)
							) : selectedResults.length > 0 ? (
								// Lab Results Chart
								<div className="h-full">
									<MultiLabResultChart selectedResults={selectedResults} />
								</div>
							) : (
								<div className="flex items-center justify-center h-full text-gray-500">
									<div className="text-center">
										<p className="text-lg">Selecteer metingen om te vergelijken</p>
										<p className="text-sm mt-2">Kies een of meer metingen uit de linker zijbalk</p>
									</div>
								</div>
							)}
						</div>
					</>
				) : (
					// Appointments View
					<div className="flex-1 overflow-y-auto">
						<MeasurementsCalendar 
							patient={createMockPatient(patient)} 
							onViewMeasurements={() => setViewMode('patient-data')}
						/>
					</div>
				)}
			</div>

			{/* Add Note Popup */}
			{patient && (
				<AddNotePopup
					isOpen={showNotePopup}
					onClose={() => setShowNotePopup(false)}
					patientId={patient.id.toString()}
					patientName={patient.name}
					onNoteAdded={handleNoteAdded}
				/>
			)}
		</div>
	);
};

export default PatientOverview;
export { PatientSearch };
