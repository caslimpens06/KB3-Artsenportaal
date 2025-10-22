const fs = require('fs');
const csv = require('csv-parse');
const axios = require('axios');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '6c8abb0e0cffb4386a49a6f5a60201de9706633d9dfa305d2300bc920c8132e29ee7d676b4ee78911c9b29ccdcf634184f5476744a0576634bb81dcd7f4bdf0cc7a6d983099fcba8a5ee8132f944d6e2b7d581bb72401a83cf838038d7b6294b642b410329b50d554189dfa0ec0825056f4bcb742244d9f5cbcc18d3dec6468a';

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Read Patient data
    const patientData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/Patient.csv')
        .pipe(csv.parse({ delimiter: ',', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.Name && data.Name.trim()) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${patientData.length} patients to import`);

    // Create Patient records
    const createdPatients = [];
    for (const patient of patientData) {
      try {
        const response = await axios.post(`${STRAPI_URL}/api/patients`, {
          data: {
            name: patient.Name,
            publishedAt: new Date()
          }
        }, {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`Created patient: ${patient.Name}`);
        createdPatients.push(response.data.data);
      } catch (err) {
        console.error(`Error creating patient ${patient.Name}:`, err.response?.data || err.message);
      }
    }

    // Read Lab Result data
    const labResultData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/LabResult.csv')
        .pipe(csv.parse({ delimiter: ';', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.ResultName && data.ResultName.trim()) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${labResultData.length} lab results to import`);

    // Create Lab Result records for each patient
    for (const labResult of labResultData) {
      try {
        // Skip empty rows or rows without a result name
        if (!labResult.ResultName) continue;

        // Create a lab result for the first patient (for testing)
        if (createdPatients.length > 0) {
          const response = await axios.post(`${STRAPI_URL}/api/lab-results`, {
            data: {
              resultName: labResult.ResultName,
              unit: labResult.Unit || '',
              value: '0', // Default value since we don't have actual values in the CSV
              patient: createdPatients[0].id,
              publishedAt: new Date()
            }
          }, {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`Created lab result: ${labResult.ResultName}`);
        }
      } catch (err) {
        console.error(`Error creating lab result ${labResult.ResultName}:`, err.response?.data || err.message);
      }
    }

    // Read Measurement data
    const measurementData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/Measurement.csv')
        .pipe(csv.parse({ delimiter: ';', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.DateTime && data.Value) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${measurementData.length} measurements to import`);

    // Create Measurement records for the first patient (for testing)
    for (const measurement of measurementData) {
      try {
        if (!measurement.Value) continue;

        if (createdPatients.length > 0) {
          const response = await axios.post(`${STRAPI_URL}/api/measurements`, {
            data: {
              type: 'General Measurement',
              value: measurement.Value,
              dateTime: measurement.DateTime,
              patient: createdPatients[0].id,
              publishedAt: new Date()
            }
          }, {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`Created measurement: ${measurement.Value}`);
        }
      } catch (err) {
        console.error(`Error creating measurement:`, err.response?.data || err.message);
      }
    }

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error.response?.data || error.message);
  }
}

// Add required dependencies to package.json
const packageJson = require('../package.json');
if (!packageJson.dependencies['csv-parse']) {
  packageJson.dependencies['csv-parse'] = '^4.16.3';
}
if (!packageJson.dependencies.axios) {
  packageJson.dependencies.axios = '^1.6.2';
}
fs.writeFileSync(
  path.join(__dirname, '../package.json'),
  JSON.stringify(packageJson, null, 2)
);

importData(); 