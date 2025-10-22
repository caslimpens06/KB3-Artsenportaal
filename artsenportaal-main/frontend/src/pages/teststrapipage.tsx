import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CmasScoreChart from '../components/CmasScoreChart';
import MultiLabResultChart from '../components/MultiLabResultChart';

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

interface Patient {
  id: number;
  attributes: {
    name: string;
    patientId: string;
    cmas_scores: CmasScore[];
  };
}

const TestStrapiPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labGroups, setLabGroups] = useState<LabResultGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedResults, setSelectedResults] = useState<LabResult[]>([]);
  
  // Persistent state for easy comparison across patients
  const [persistentGroupName, setPersistentGroupName] = useState<string | null>(null);
  const [persistentResultNames, setPersistentResultNames] = useState<string[]>([]);

  // Fetch patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:1337/api/patients', {
          params: {
            populate: {
              cmas_scores: {
                sort: ['date:asc']
              }
            }
          }
        });
        
        console.log('API Response:', response.data);

        if (!response.data?.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid API response format: missing or invalid data property');
        }

        const validPatients = response.data.data.map((patient: { 
          id: number; 
          name: string; 
          patientId: string; 
          cmas_scores: CmasScore[] 
        }) => ({
          id: patient.id,
          attributes: {
            name: patient.name,
            patientId: patient.patientId,
            cmas_scores: patient.cmas_scores || []
          }
        })).filter((patient: Patient) => patient.attributes.name && patient.attributes.patientId);

        if (validPatients.length === 0) {
          throw new Error('No valid patients found in the database. Please check if patients are published in Strapi.');
        }

        setPatients(validPatients);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        const errorMessage = err.response?.status === 400 
          ? 'Bad request when fetching patients. Please check if Strapi is running and the API endpoint is correct.'
          : err.message || 'Failed to fetch patient data';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch lab groups when a patient is selected
  useEffect(() => {
    const fetchLabGroups = async () => {
      if (!selectedPatient?.id) return;

      try {
        const patientId = selectedPatient?.id;
        console.log('Selected patient ID:', patientId);
        
        if (!patientId) {
          console.error('No patient ID found');
          return;
        }

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

        // If no results found for this patient, fall back to all results (for older patients)
        if (!response.data?.data || response.data.data.length === 0) {
          console.log('No patient-specific lab results found, fetching all results...');
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

        console.log('Lab results response:', JSON.stringify(response.data, null, 2));

        if (response.data?.data) {
          // Group the lab results by their lab_result_group
          const resultsByGroup = new Map();
          
          response.data.data.forEach((result: any) => {
            const group = result.lab_result_group;
            if (!group) return; // Skip results without a group
            
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
          console.log('Grouped lab results:', groups);

          // Only keep groups that have lab results with measurements
          const filteredGroups = groups.filter((group: { 
            lab_results: Array<{
              measurements: any[]
            }>
          }) => 
            group.lab_results && 
            group.lab_results.length > 0 && 
            group.lab_results.some((result: { measurements: any[] }) => 
              result.measurements && result.measurements.length > 0
            )
          );

          console.log('Final filtered groups:', filteredGroups);
          setLabGroups(filteredGroups);
          
          // Restore previous selection if available
          if (persistentGroupName && filteredGroups.length > 0) {
            const matchingGroup = filteredGroups.find(group => group.groupName === persistentGroupName);
            if (matchingGroup) {
              setSelectedGroupId(matchingGroup.id);
              
              // Try to restore selected measurements
              if (persistentResultNames.length > 0) {
                const matchingResults = matchingGroup.lab_results.filter((result: LabResult) => 
                  persistentResultNames.includes(result.resultName) && 
                  result.measurements && 
                  result.measurements.length > 0
                );
                if (matchingResults.length > 0) {
                  setSelectedResults(matchingResults);
                  console.log(`🔄 Restored ${matchingResults.length} measurements for comparison across patients`);
                }
              }
            }
          } else if (selectedGroupId === null && !persistentGroupName) {
            // Only auto-select first group if we're not in CMAS mode and have no persistent state
            if (filteredGroups.length > 0) {
              setSelectedGroupId(filteredGroups[0].id);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching lab groups:', err);
        console.error('Error details:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Full error response:', err.response);
        
        // Add user-friendly error state
        setError(`Failed to fetch lab groups: ${err.response?.data?.error?.message || err.message}`);
      }
    };

    fetchLabGroups();
  }, [selectedPatient?.id]);

  // Function to clear persistent selection and switch to CMAS
  const switchToCMAS = () => {
    console.log('Switching to CMAS view');
    setSelectedGroupId(null);
    setSelectedResults([]);
    setPersistentGroupName(null);
    setPersistentResultNames([]);
  };

  // Clear selected results when group changes (but not patient)
  useEffect(() => {
    if (selectedGroupId !== null) {
      setSelectedResults([]);
    }
  }, [selectedGroupId]);

  // Improved toggle function for lab results
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

  // Get current group
  const currentGroup = labGroups.find(group => group.id === selectedGroupId);

  useEffect(() => {
    if (persistentGroupName && persistentResultNames.length > 0) {
      const group = labGroups.find(g => g.groupName === persistentGroupName);
      if (group) {
        setSelectedGroupId(group.id);
        
        const resultsToSelect = group.lab_results.filter(r => 
          persistentResultNames.includes(r.resultName)
        );
        setSelectedResults(resultsToSelect);
      }
    }
  }, [persistentGroupName, persistentResultNames, selectedGroupId, labGroups]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return (
    <div className="p-4">
      <div className="text-red-500 mb-4">{error}</div>
      <div className="text-gray-600">
        Please make sure:
        <ul className="list-disc ml-6 mt-2">
          <li>Strapi server is running on port 1337</li>
          <li>There are patients in your database</li>
          <li>Patients are published in Strapi</li>
          <li>Each patient has a name and patientId</li>
          <li>You have proper permissions set up in Strapi</li>
        </ul>
      </div>
    </div>
  );
  if (patients.length === 0) return <div className="p-4">No patients found in the database.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Patient Data Visualization</h1>
        
        {/* Patient Selection */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">Select a Patient</h2>
            <button
              onClick={() => {
                // Refresh patients list
                const fetchPatients = async () => {
                  try {
                    const response = await axios.get('http://localhost:1337/api/patients', {
                      params: {
                        populate: {
                          cmas_scores: {
                            sort: ['date:asc']
                          }
                        }
                      }
                    });
                    console.log('Refreshed patients:', response.data);
                    
                    const validPatients = response.data.data.map((patient: { 
                      id: number; 
                      name: string; 
                      patientId: string; 
                      cmas_scores: CmasScore[] 
                    }) => ({
                      id: patient.id,
                      attributes: {
                        name: patient.name,
                        patientId: patient.patientId,
                        cmas_scores: patient.cmas_scores || []
                      }
                    })).filter((patient: Patient) => patient.attributes.name && patient.attributes.patientId);
                    
                    setPatients(validPatients);
                  } catch (error) {
                    console.error('Error refreshing patients:', error);
                  }
                };
                fetchPatients();
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                  // Don't reset selectedGroupId and selectedResults here
                  // This allows cross-patient comparison to work
                  // setSelectedGroupId(null);
                  // setSelectedResults([]);
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedPatient?.id === patient.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {patient.attributes.name}
              </button>
            ))}
          </div>
          
          {selectedPatient && (
            <div className="mt-2 text-sm text-gray-600">
              Patient ID: {selectedPatient.attributes.patientId}
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Sidebar - Categories */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* CMAS Section */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                CMAS Scores
              </h3>
              <div className="text-xs text-gray-500 mb-2">
                {selectedPatient.attributes.cmas_scores?.length || 0} measurements
              </div>
              <button
                onClick={() => {
                  switchToCMAS();
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedGroupId === null
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                View CMAS Timeline
              </button>
            </div>

            {/* Lab Results Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Lab Results
                </h3>
                
                {/* Data Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-2">
                      <p className="text-xs text-blue-700">
                        Imported from CSV files: {labGroups.length} categories with {labGroups.reduce((total, group) => total + group.lab_results.length, 0)} measurements
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category List */}
                <div className="space-y-1">
                  {labGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setSelectedResults([]);
                        // Update persistent state
                        setPersistentGroupName(group.groupName);
                        setPersistentResultNames([]);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedGroupId === group.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{group.groupName}</div>
                      <div className="text-xs text-gray-500">
                        {group.lab_results.filter(r => r.measurements && r.measurements.length > 0).length} measurements
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Panel - Measurements */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedGroupId === null ? 'CMAS Scores' : currentGroup?.groupName || 'Select Category'}
              </h3>
              {selectedGroupId !== null && currentGroup && (
                <p className="text-sm text-gray-600 mt-1">
                  Click measurements to add/remove from graph
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedGroupId === null ? (
                // CMAS Info Panel
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">CMAS Score Data</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Total measurements: {selectedPatient.attributes.cmas_scores?.length || 0}</div>
                      {selectedPatient.attributes.cmas_scores && selectedPatient.attributes.cmas_scores.length > 0 && (
                        <>
                          <div>Date range: {new Date(selectedPatient.attributes.cmas_scores[0].date).toLocaleDateString()} - {new Date(selectedPatient.attributes.cmas_scores[selectedPatient.attributes.cmas_scores.length - 1].date).toLocaleDateString()}</div>
                          <div>Categories: {Array.from(new Set(selectedPatient.attributes.cmas_scores.map(s => s.category))).join(', ')}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : currentGroup ? (
                // Lab Results List
                <div className="space-y-2">
                  {currentGroup.lab_results
                    .filter(result => result.measurements && result.measurements.length > 0)
                    .map((result) => {
                      const isSelected = selectedResults.some(r => r.id === result.id);
                      return (
                        <button
                          key={result.id}
                          onClick={() => toggleLabResult(result)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{result.resultName}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {result.unit && `Unit: ${result.unit} • `}
                            {result.measurements.length} measurements
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Range: {new Date(result.measurements[0]?.dateTime).toLocaleDateString()} - {new Date(result.measurements[result.measurements.length - 1]?.dateTime).toLocaleDateString()}
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <p>Select a category from the left to view measurements</p>
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selectedResults.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedResults.length} measurement{selectedResults.length !== 1 ? 's' : ''} selected
                </div>
                <button
                  onClick={() => setSelectedResults([])}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Graph */}
          <div className="flex-1 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedGroupId === null ? 'CMAS Score Timeline' : 'Selected Measurements Over Time'}
              </h3>
            </div>

            <div className="flex-1 p-4">
              {selectedGroupId === null ? (
                // CMAS Chart
                selectedPatient.attributes.cmas_scores && selectedPatient.attributes.cmas_scores.length > 0 ? (
                  <div className="h-full">
                    <CmasScoreChart data={selectedPatient.attributes.cmas_scores} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg">No CMAS data available</p>
                      <p className="text-sm mt-2">This patient has no CMAS scores recorded</p>
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">Select measurements to view chart</p>
                    <p className="text-sm mt-2">Choose one or more measurements from the middle panel to see their trends over time</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Patient Selected State */}
      {!selectedPatient && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg">Select a patient to view their data</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStrapiPage;
