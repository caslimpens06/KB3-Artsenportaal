const axios = require('axios');

async function checkPatients() {
  try {
    const response = await axios.get('http://localhost:1337/api/patients');
    console.log('Patients:');
    if (response.data && response.data.data) {
      response.data.data.forEach(patient => {
        console.log(`ID: ${patient.id}, Name: ${patient.attributes.name}`);
      });
    } else {
      console.log('No patients found');
    }
  } catch (error) {
    console.error('Error fetching patients:', error.message);
  }
}

checkPatients(); 