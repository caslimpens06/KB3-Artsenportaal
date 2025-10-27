const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

// Utility function for Strapi API calls
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`Making API call: ${method} ${endpoint}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    };
    
    const response = await axios({
      method,
      url: `${STRAPI_URL}/api/${endpoint}`,
      headers,
      data: data ? { data } : undefined
    });
    console.log(`API call successful: ${method} ${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Create test data
async function createTestData() {
  try {
    console.log('Creating test data...');
    
    // Create a patient``
    const patientResponse = await strapiAPI('patients', 'POST', {
      name: 'Patient X',
      patientId: '55e2d179-d738-47d1-b88c-606833ce4d31',
      publishedAt: new Date()
    });
    
    const patientId = patientResponse.data.id;
    console.log(`Created patient with ID ${patientId}`);
    
    // Create a lab result group
    const groupResponse = await strapiAPI('lab-result-groups', 'POST', {
      groupName: 'Blood Chemistry',
      groupId: 'f159db9c-75b6-4d17-804b-62c45e7914f6',
      publishedAt: new Date()
    });
    
    const groupId = groupResponse.data.id;
    console.log(`Created lab result group with ID ${groupId}`);
    
    // Create a lab result
    const labResultResponse = await strapiAPI('lab-results', 'POST', {
      resultName: 'Hemoglobin',
      value: '',
      unit: 'mmol/L',
      labResultId: 'b2448551-663c-435a-8811-8dc8e2149757',
      patient: patientId,
      lab_result_group: groupId,
      publishedAt: new Date()
    });
    
    const labResultId = labResultResponse.data.id;
    console.log(`Created lab result with ID ${labResultId}`);
    
    // Create measurements
    const measurementData = [
      { dateTime: '2023-01-01T10:00:00Z', value: '7.1' },
      { dateTime: '2023-02-01T10:00:00Z', value: '7.3' },
      { dateTime: '2023-03-01T10:00:00Z', value: '6.9' },
      { dateTime: '2023-04-01T10:00:00Z', value: '7.0' }
    ];
    
    for (const data of measurementData) {
      await strapiAPI('measurements', 'POST', {
        type: 'measurement',
        value: data.value,
        dateTime: data.dateTime,
        lab_result: labResultId,
        publishedAt: new Date()
      });
    }
    
    console.log(`Created ${measurementData.length} measurements`);
    
    // Create CMAS scores
    const cmasData = [
      { scoreDate: '2023-01-15T10:00:00Z', score: 48, scoreCategory: '>10' },
      { scoreDate: '2023-02-15T10:00:00Z', score: 46, scoreCategory: '>10' },
      { scoreDate: '2023-03-15T10:00:00Z', score: 42, scoreCategory: '>10' },
      { scoreDate: '2023-04-15T10:00:00Z', score: 45, scoreCategory: '>10' },
      { scoreDate: '2023-05-15T10:00:00Z', score: 8, scoreCategory: '4-9' },
      { scoreDate: '2023-06-15T10:00:00Z', score: 9, scoreCategory: '4-9' }
    ];
    
    for (const data of cmasData) {
      await strapiAPI('cmas-scores', 'POST', {
        scoreDate: data.scoreDate,
        score: data.score,
        scoreCategory: data.scoreCategory,
        patient: patientId,
        publishedAt: new Date()
      });
    }
    
    console.log(`Created ${cmasData.length} CMAS scores`);
    
    console.log('Test data creation completed successfully!');
  } catch (error) {
    console.error('Test data creation failed:', error);
    throw error;
  }
}

// Execute the test data creation
createTestData()
  .then(() => {
    console.log('===== TEST DATA CREATION COMPLETE =====');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test data creation failed with error:', error);
    process.exit(1);
  }); 