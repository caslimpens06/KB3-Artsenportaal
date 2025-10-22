import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import CmasScoreChart from '../components/CmasScoreChart';
import MultiLabResultChart from '../components/MultiLabResultChart';
import MeasurementsCalendar from '../components/measurementscalendar';
import AddNotePopup from '../components/addnotepopup';
import { Patient } from '../abstracts/ImportsModels';
import { notesService } from "../services/notesService";

// Interfaces moved from test-strapi page
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

interface Measurement {
  id: number;
  measurementId: string;
  dateTime: string;
  value: string;
}

interface LabResult {
  id: number;
  resultName: string;
  labResultId: string;
  value: string;
  unit: string;
  measurements: Measurement[];
}

interface LabResultGroup {
  id: number;
  groupName: string;
  groupId: string;
  lab_results: LabResult[];
}

interface PatientData {
  id: number;
  attributes: {
    name: string;
    patientId: string;
    cmas_scores: CmasScore[];
  };
}

// Enhanced patient interface for the list
interface PatientListItem {
  id: number;
  name: string;
  patientId?: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  lab_results: Array<{
    id: number;
    documentId: string;
    resultName: string;
    value: string | null;
    unit: string;
    labResultId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    measurements?: Array<{
      id: number;
      measurementId: string;
      value: string;
      dateTime: string;
    }>;
  }>;
}

type ViewMode = 'patient-data' | 'appointments';

const PatientPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for patient list
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for selected patient and detailed data
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('patient-data');

  // State for lab results (moved from test-strapi)
  const [labGroups, setLabGroups] = useState<LabResultGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null); // Default to CMAS (null)
  const [selectedResults, setSelectedResults] = useState<LabResult[]>([]);
  
  // Persistent state for easy comparison across patients
  const [persistentGroupName, setPersistentGroupName] = useState<string | null>(null);
  const [persistentResultNames, setPersistentResultNames] = useState<string[]>([]);

  // Note popup state
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);

  // Fetch patients list
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Simplified API call without complex populate and auth header for initial load
        const response = await fetch('http://localhost:1337/api/patients');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched patients:', data);
        
        if (!data || !data.data) {
          throw new Error('Invalid data structure received from API');
        }
        
        // Transform the data to match our interface
        const transformedPatients = data.data.map((patient: any) => ({
          id: patient.id,
          name: patient.name,
          patientId: patient.patientId,
          documentId: patient.documentId,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          publishedAt: patient.publishedAt,
          lab_results: [] // We'll fetch this separately when patient is selected
        }));
        
        setPatients(transformedPatients);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Fetch detailed patient data when patient is selected
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatient) return;

      try {
        const response = await axios.get('http://localhost:1337/api/patients', {
          params: {
            filters: {
              id: selectedPatient.id
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
          setSelectedPatient({
            id: patientData.id,
            attributes: {
              name: patientData.name,
              patientId: patientData.patientId,
              cmas_scores: patientData.cmas_scores || []
            }
          });
        }
      } catch (err) {
        console.error('Error fetching patient details:', err);
      }
    };

    fetchPatientDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.id]);

  // Fetch lab groups when a patient is selected (moved from test-strapi)
  useEffect(() => {
    const fetchLabGroups = async () => {
      if (!selectedPatient?.id) return;

      try {
        const patientId = selectedPatient.id;
        
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
          
          // Restore previous selection if available
          if (persistentGroupName && filteredGroups.length > 0) {
            const matchingGroup = filteredGroups.find(group => group.groupName === persistentGroupName);
            if (matchingGroup) {
              setSelectedGroupId(matchingGroup.id);
              
              if (persistentResultNames.length > 0) {
                const matchingResults = matchingGroup.lab_results.filter((result: LabResult) => 
                  persistentResultNames.includes(result.resultName) && 
                  result.measurements && 
                  result.measurements.length > 0
                );
                if (matchingResults.length > 0) {
                  setSelectedResults(matchingResults);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching lab groups:', err);
      }
    };

    fetchLabGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.id, persistentGroupName, persistentResultNames]);

  // Function to clear persistent selection and switch to CMAS
  const switchToCMAS = () => {
    setSelectedGroupId(null);
    setSelectedResults([]);
    setPersistentGroupName(null);
    setPersistentResultNames([]);
  };

  // Clear selected results when group changes
  useEffect(() => {
    if (selectedGroupId !== null) {
      setSelectedResults([]);
    }
  }, [selectedGroupId]);

  // Toggle lab result selection
  const toggleLabResult = (result: LabResult) => {
    const isSelected = selectedResults.some(r => r.id === result.id);
    
    if (isSelected) {
      const newSelected = selectedResults.filter(r => r.id !== result.id);
      setSelectedResults(newSelected);
      setPersistentResultNames(newSelected.map(r => r.resultName));
    } else {
      const newSelected = [...selectedResults, result];
      setSelectedResults(newSelected);
      setPersistentResultNames(newSelected.map(r => r.resultName));
    }
  };

  const handlePatientClick = useCallback((patientId: number) => {
    // Instead of navigating to a different page, select the patient in current page
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient({
        id: patient.id,
        attributes: {
          name: patient.name,
          patientId: patient.patientId || '',
          cmas_scores: []
        }
      });
      
      // Reset to CMAS view by default for each patient
      setSelectedGroupId(null);
      setSelectedResults([]);
      
      // Update URL without page navigation
      window.history.replaceState(null, '', `/patients?patient=${patientId}`);
    }
  }, [patients]);

  // Auto-select first patient to show the layout immediately, or preserve from navigation
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      // Check if there's a patient to preserve from navigation state
      const preservePatientId = location.state?.preserveSelectedPatient;
      if (preservePatientId) {
        const targetPatient = patients.find(p => p.id === preservePatientId);
        if (targetPatient) {
          handlePatientClick(targetPatient.id);
          return;
        }
      }
      
      // Otherwise, select the first patient by default
      handlePatientClick(patients[0].id);
    }
  }, [patients, selectedPatient, handlePatientClick, location.state]);

  // Handle navigation state for pre-selecting a patient
  useEffect(() => {
    if (location.state?.fromCalendar && location.state?.patientId) {
      const selectedPatientId = location.state.patientId;
      
      // Only handle if we have patients loaded
      if (patients.length > 0) {
        const targetPatient = patients.find(p => p.id === selectedPatientId);
        if (targetPatient) {
          handlePatientClick(targetPatient.id);
        }
      }
    }
  }, [location.state, patients, handlePatientClick]);

  // Create a mock Patient object for the appointments calendar
  const createMockPatient = (patientData: PatientData): Patient => {
    return new Patient(
      patientData.attributes.name.split(' ')[0] || 'Unknown',
      patientData.attributes.name.split(' ').slice(1).join(' ') || 'Patient',
      `${patientData.attributes.patientId}@example.com`,
      30, // Default age
      '000-000-0000',
      'contact@example.com',
      '000-000-0000',
      'Unknown'
    );
  };

  // Get current group
  const currentGroup = labGroups.find(group => group.id === selectedGroupId);

  // Handle navigation from dashboard
  useEffect(() => {
    if (location.state) {
      const { selectedPatientId, viewMode: incomingViewMode } = location.state as any;
      
      if (selectedPatientId && incomingViewMode) {
        // Set the view mode first
        setViewMode(incomingViewMode);
        
        // Find and select the patient when patients list is loaded
        if (patients.length > 0) {
          const targetPatient = patients.find(p => p.id === selectedPatientId);
          if (targetPatient) {
            handlePatientClick(targetPatient.id);
          }
        }
      }
    }
  }, [location.state, patients, handlePatientClick]);

  // Note-related functions
  const loadPatientNotes = () => {
    if (selectedPatient?.id) {
      const notes = notesService.getNotesByPatient(selectedPatient.id.toString());
      setPatientNotes(notes);
    }
  };

  const handleNoteAdded = () => {
    loadPatientNotes(); // Refresh notes after adding
  };

  const handleAddNoteClick = () => {
    setShowNotePopup(true);
  };

  // Load patient notes when selected patient changes
  useEffect(() => {
    loadPatientNotes();
  }, [selectedPatient]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Patiënten laden...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fout bij laden</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200 flex-shrink-0">
        <h1 className="text-3xl font-bold text-blue-900">Patiëntenoverzicht</h1>
        <hr className="mt-3 h-0.5 border-2 border-blue-800 w-1/5 max-w-xs bg-blue-800" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Patient List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Alle patiënten</h2>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              🔄 Vernieuwen
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {patients.length === 0 ? (
              <div className="p-4 text-gray-500">Geen patiënten gevonden</div>
            ) : (
              <div className="space-y-1">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientClick(patient.id)}
                    className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-600">{patient.patientId || 'Geen ID'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Klik om gegevens te bekijken
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Patient Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPatient ? (
            <>
              {/* Patient Header with Action Buttons */}
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedPatient.attributes.name}</h2>
                    <p className="text-sm text-gray-600">Patiënt ID: {selectedPatient.attributes.patientId}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('patient-data')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        viewMode === 'patient-data'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Gegevens
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
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {viewMode === 'patient-data' ? (
                  <div className="flex h-full">
                    {/* Data Categories Sidebar */}
                    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                      {/* CMAS Section */}
                      <div className="p-4 border-b border-gray-200 flex-shrink-0">
                        <button
                          onClick={switchToCMAS}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedGroupId === null
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="font-medium">CMAS Scores</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {selectedPatient.attributes.cmas_scores?.length || 0} metingen
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
                                  setPersistentGroupName(group.groupName);
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
                        <div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto flex-shrink-0">
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
                                  {result.resultName} ({result.measurements.length})
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
                        selectedPatient.attributes.cmas_scores && selectedPatient.attributes.cmas_scores.length > 0 ? (
                          <div className="h-full">
                            <CmasScoreChart data={selectedPatient.attributes.cmas_scores} />
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
                  </div>
                ) : (
                  // Appointments View
                  <div className="h-full overflow-y-auto">
                    <MeasurementsCalendar 
                      patient={createMockPatient(selectedPatient)} 
                      onViewMeasurements={() => setViewMode('patient-data')}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <p className="text-xl">Selecteer een patiënt</p>
                <p className="text-sm mt-2">Kies een patiënt uit de lijst om gegevens te bekijken</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Popup */}
      {selectedPatient && (
        <AddNotePopup
          isOpen={showNotePopup}
          onClose={() => setShowNotePopup(false)}
          patientId={selectedPatient.id.toString()}
          patientName={selectedPatient.attributes.name}
          onNoteAdded={handleNoteAdded}
        />
      )}
    </div>
  );
};

export default PatientPage;
