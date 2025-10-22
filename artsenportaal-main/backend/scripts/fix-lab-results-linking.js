const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

async function fixLabResultsLinking() {
  try {
    console.log('Starting lab results linking fix...');
    
    // Get the patient
    const patientsResponse = await axios.get(`${STRAPI_URL}/api/patients`);
    const patient = patientsResponse.data.data[0];
    console.log('Found patient:', patient.name, 'with ID:', patient.id);
    
    // Get all lab results that don't have a patient assigned
    const labResultsResponse = await axios.get(`${STRAPI_URL}/api/lab-results?filters[patient][$null]=true&pagination[pageSize]=200`);
    const unlinkedResults = labResultsResponse.data.data;
    console.log('Found', unlinkedResults.length, 'unlinked lab results');
    
    // Update each lab result to link to the patient
    let linkedCount = 0;
    for (const result of unlinkedResults) {
      try {
        console.log(`Linking lab result: ${result.resultName} (ID: ${result.id})`);
        await axios.put(`${STRAPI_URL}/api/lab-results/${result.id}`, {
          data: {
            patient: patient.id
          }
        });
        linkedCount++;
      } catch (error) {
        console.error(`Error linking lab result ${result.resultName}:`, error.response?.data || error.message);
      }
    }
    
    console.log(`Successfully linked ${linkedCount} lab results to patient`);
    
    // Also check and fix measurements that might not be linked to lab results
    const measurementsResponse = await axios.get(`${STRAPI_URL}/api/measurements?filters[lab_result][$null]=true&pagination[pageSize]=200`);
    const unlinkedMeasurements = measurementsResponse.data.data;
    console.log('Found', unlinkedMeasurements.length, 'unlinked measurements');
    
    if (unlinkedMeasurements.length > 0) {
      console.log('Note: You may need to run the import script again to properly link measurements to lab results');
    }
    
  } catch (error) {
    console.error('Error in fixing lab results linking:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
  }
}

fixLabResultsLinking(); 