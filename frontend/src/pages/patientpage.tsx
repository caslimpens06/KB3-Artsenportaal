import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import CmasScoreChart from '../components/CmasScoreChart';
import MultiLabResultChart from '../components/MultiLabResultChart';
import MeasurementsCalendar from '../components/measurementscalendar';
import { Patient } from '../abstracts/ImportsModels';
import { notesService } from "../services/notesService";
import { useMemo } from 'react';
import PatientNotesModal from '../components/patientnotesmodal'

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

const createPatientInstance = (data: PatientData): Patient => {
    const [firstName, ...lastNameParts] = data.attributes.name.split(' ');
    const lastName = lastNameParts.join(' ') || 'Unknown';

    const patient = new Patient(
        firstName,
        lastName,
        `${data.attributes.patientId || 'unknown'}@example.com`,
        30,
        '000-000-0000',
        'contact@example.com',
        '000-000-0000',
        'Unknown',
        '',
        []
    );

    patient.Id = Number(data.attributes.patientId) || data.id;
    return patient;
};


const PatientPage: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const location = useLocation();
    const navigate = useNavigate();
    const [showPatientNotesModal, setShowPatientNotesModal] = useState(false);
  
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('patient-data');

  const [labGroups, setLabGroups] = useState<LabResultGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedResults, setSelectedResults] = useState<LabResult[]>([]);
  
  const [persistentGroupName, setPersistentGroupName] = useState<string | null>(null);
  const [persistentResultNames, setPersistentResultNames] = useState<string[]>([]);

  const [showNotePopup, setShowNotePopup] = useState(false);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:1337/api/patients');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched patients:', data);
        
        if (!data || !data.data) {
          throw new Error('Invalid data structure received from API');
        }
        
        const transformedPatients = data.data.map((patient: any) => ({
          id: patient.id,
          name: patient.name,
          patientId: patient.patientId,
          documentId: patient.documentId,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          publishedAt: patient.publishedAt,
          lab_results: []
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
  }, [selectedPatient?.id]);

  useEffect(() => {
    const fetchLabGroups = async () => {
      if (!selectedPatient?.id) return;

      try {
        const patientId = selectedPatient.id;
        
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
  }, [selectedPatient?.id, persistentGroupName, persistentResultNames]);

  const switchToCMAS = () => {
    setSelectedGroupId(null);
    setSelectedResults([]);
    setPersistentGroupName(null);
    setPersistentResultNames([]);
  };

  useEffect(() => {
    if (selectedGroupId !== null) {
      setSelectedResults([]);
    }
  }, [selectedGroupId]);

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

            setSelectedGroupId(null);
            setSelectedResults([]);

            localStorage.setItem('selectedPatientId', patient.id.toString());

            window.history.replaceState(null, '', `/patients?patient=${patientId}`);
        }
    }, [patients]);


    useEffect(() => {
        if (patients.length > 0 && !selectedPatient) {
            const savedPatientId = localStorage.getItem('selectedPatientId');
            if (savedPatientId) {
                const targetPatient = patients.find(p => p.id === Number(savedPatientId));
                if (targetPatient) {
                    handlePatientClick(targetPatient.id);
                    return;
                }
            }

            handlePatientClick(patients[0].id);
        }
    }, [patients, selectedPatient, handlePatientClick]);

  useEffect(() => {
    if (location.state?.fromCalendar && location.state?.patientId) {
      const selectedPatientId = location.state.patientId;
      
      if (patients.length > 0) {
        const targetPatient = patients.find(p => p.id === selectedPatientId);
        if (targetPatient) {
          handlePatientClick(targetPatient.id);
        }
      }
    }
  }, [location.state, patients, handlePatientClick]);

  const currentGroup = labGroups.find(group => group.id === selectedGroupId);

  useEffect(() => {
    if (location.state) {
      const { selectedPatientId, viewMode: incomingViewMode } = location.state as any;
      
      if (selectedPatientId && incomingViewMode) {
        setViewMode(incomingViewMode);
        
        if (patients.length > 0) {
          const targetPatient = patients.find(p => p.id === selectedPatientId);
          if (targetPatient) {
            handlePatientClick(targetPatient.id);
          }
        }
      }
    }
  }, [location.state, patients, handlePatientClick]);

  const loadPatientNotes = () => {
    if (selectedPatient?.id) {
      const notes = notesService.getNotesByPatient(selectedPatient.id.toString());
      setPatientNotes(notes);
    }
  };

    const memoizedPatient = useMemo(() => {
        if (!selectedPatient) return null;
        return createPatientInstance(selectedPatient);
    }, [selectedPatient]);

  const handleNoteAdded = () => {
    loadPatientNotes();
  };

  const handleAddNoteClick = () => {
    setShowNotePopup(true);
  };

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

      <div className="flex flex-1 overflow-hidden">
              <div
                  className="
                            group/sidebar
                            relative
                            bg-white border-r border-gray-200 flex flex-col
                            transition-all duration-300 ease-in-out
                            w-28 hover:w-96
                          "
              >
                  <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>

                  <div className="p-4 border-b border-gray-200 flex-shrink-0 overflow-hidden">
                      <h2
                        className="
                        text-lg font-semibold text-gray-900
                        opacity-100 group-hover/sidebar:opacity-100
                        transition-opacity duration-300
                      "
                      >
                          Patiënten
                      </h2>
                  </div>

                  <div className="flex-1 p-2 overflow-hidden group-hover/sidebar:overflow-y-auto">
                      {patients.length === 0 ? (
                          <div className="text-gray-500 text-center mt-4 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                              Geen patiënten gevonden
                          </div>
                      ) : (
                          <div className="space-y-2">
                              {patients.map((patient) => (
                                  <button
                                      key={patient.id}
                                      onClick={() => handlePatientClick(patient.id)}
                                      className={`
                                                w-full flex items-center rounded-xl
                                                transition-all duration-200 overflow-hidden
                                                ${selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}
                                                px-3 py-2
                                              `}
                                  >
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                          {patient.name.charAt(0).toUpperCase()}
                                      </div>

                                      <div className="ml-3 flex flex-col text-left opacity-0 group-hover/sidebar:opacity-100 overflow-hidden whitespace-nowrap transition-opacity duration-300">
                                          <div className="font-medium text-gray-900 truncate">{patient.name}</div>
                                          <div className="text-sm text-gray-600 truncate">{patient.patientId || 'Geen ID'}</div>
                                          <div className="text-xs text-gray-500 mt-1 truncate">Klik om gegevens te bekijken</div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

              </div>


        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPatient ? (
            <>
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewMode('patient-data')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-md transition-all duration-200
                            ${viewMode === 'patient-data'
                                                                ? 'bg-blue-500 text-white shadow-lg'
                                                                : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700'}
                            `}
                        >

                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 0112 15a9 9 0 016.879 2.804M12 12a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                            Gegevens
                        </button>

                        <button
                            onClick={() => setViewMode('appointments')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-md transition-all duration-200
                            ${viewMode === 'appointments'
                                                                ? 'bg-blue-500 text-white shadow-lg'
                                                                : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700'}
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 19h14v-8H5v8z" />
                            </svg>
                            Afspraken
                        </button>

                        <button
                            onClick={() => setShowPatientNotesModal(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 font-semibold"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Notities ({patientNotes.length} opgeslagen)
                        </button>
                    </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {viewMode === 'patient-data' ? (
                  <div className="flex h-full">
                    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
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

                    <div className="flex-1 p-4 overflow-y-auto">
                      {selectedGroupId === null ? (
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
                  <div className="h-full overflow-y-auto">
                    {viewMode === 'appointments' && selectedPatient && memoizedPatient && (
                        <MeasurementsCalendar
                            patient={memoizedPatient}
                            onViewMeasurements={() => setViewMode('patient-data')}
                        />
                    )}
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
          {selectedPatient && (
              <PatientNotesModal
                  isOpen={showPatientNotesModal}
                  onClose={() => setShowPatientNotesModal(false)}
                  patientId={selectedPatient.id.toString()}
                  patientName={selectedPatient.attributes.name}
                  onNotesUpdated={loadPatientNotes}
              />
          )}
    </div>
  );
};

export default PatientPage;
