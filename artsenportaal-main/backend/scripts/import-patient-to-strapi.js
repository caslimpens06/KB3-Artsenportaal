const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'fc29bdfcb6257c99fe7c3c32d26e22a2cc8e6aaf835bd5dc7f49beec2c2b4c6d7f1ae63f8ac3271b5dbdc9dff75c08cdd3fdcffb099a01e73a2e0e35f8f46be19dc73bf9fc1ae34fe7e31ce8f1caad4bd30dc2daf348e1a8d5e7c6bdd0ea5acb2cbf4a9a5cfee56d4c62fb0b2c8066811b0af8c52b2c51c9aa02f7d25e10c3';

async function createPatient() {
  try {
    console.log('Attempting to create Patient X...');

    // Check if the patient already exists
    const existingRes = await axios.get(`${STRAPI_URL}/api/patients?filters[name][$eq]=Patient%20X`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingRes.data.data && existingRes.data.data.length > 0) {
      console.log('Patient X already exists:', existingRes.data.data[0]);
      return existingRes.data.data[0];
    }

    // Create the patient
    const response = await axios.post(`${STRAPI_URL}/api/patients`, {
      data: {
        name: 'Patient X',
        publishedAt: new Date().toISOString()
      }
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Created Patient X:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating patient:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the function
createPatient()
  .then(patient => {
    console.log('Success! Patient data:', patient);
  })
  .catch(error => {
    console.error('Failed to create patient:', error);
  }); 