const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');

const strapiURL = 'http://localhost:1337';

// Get API token from command line or default to empty string
const apiToken = process.argv[2] || '';
if (!apiToken) {
  console.log('⚠️  Warning: No API token provided. To provide a token, run: node import-cmas-data.js YOUR_API_TOKEN');
  console.log('You may need to generate a token in Strapi admin panel: Settings > API Tokens > Create new API token');
}

// Helper function to make API calls to Strapi
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
    const url = `${strapiURL}/api/${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add authorization header if token is provided
    if (apiToken) {
      config.headers['Authorization'] = `Bearer ${apiToken}`;
    }

    let response;
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, { data }, config);
    } else if (method === 'PUT') {
      response = await axios.put(url, { data }, config);
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Function to read CSV file and return the data
function readCSV(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(csv(options))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Parse CMAS CSV data manually as it has a special format
function parseCustomCSV(filePath, delimiter = ';') {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, filePath), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(delimiter);
      
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const values = lines[i].split(delimiter);
        obj[''] = values[0]; // The first column has no header
        
        for (let j = 1; j < headers.length; j++) {
          obj[headers[j]] = values[j];
        }
        
        result.push(obj);
      }
      
      resolve(result);
    });
  });
}

async function getPatientX() {
  try {
    // Get Patient X (ID 11) or create if it doesn't exist
    try {
      const response = await axios.get(`${strapiURL}/api/patients/11`, {
        headers: apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {}
      });
      
      console.log('Found Patient X:', response.data.data.id);
      return response.data.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // If patient doesn't exist, create it
        console.log('Patient X not found, creating a new patient...');
        const newPatient = await axios.post(`${strapiURL}/api/patients`, {
          data: {
            name: 'Patient X',
            publishedAt: new Date()
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
          }
        });
        
        return newPatient.data.data;
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error getting Patient X:', error.message);
    return null;
  }
}

async function importCMASScores(patientId) {
  console.log('Importing CMAS scores for Patient X...');
  try {
    // Use absolute path for the CMAS.csv file
    const filePath = path.resolve(__dirname, '../../PatientData/CMAS.csv');
    console.log('Reading CMAS data from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`CMAS file not found at: ${filePath}`);
      return;
    }

    // First, delete existing CMAS scores for this patient to avoid duplicates
    try {
      console.log(`Clearing existing CMAS scores for patient ${patientId}...`);
      const existingScores = await axios.get(`${strapiURL}/api/cmas-scores?filters[patient][id][$eq]=${patientId}`, {
        headers: apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {}
      });
      
      if (existingScores.data.data && existingScores.data.data.length > 0) {
        for (const score of existingScores.data.data) {
          console.log(`Deleting CMAS score ${score.id}...`);
          await axios.delete(`${strapiURL}/api/cmas-scores/${score.id}`, {
            headers: apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {}
          });
        }
        console.log(`Deleted ${existingScores.data.data.length} existing CMAS scores`);
      }
    } catch (err) {
      console.log('Error clearing existing CMAS scores:', err.message);
    }
    
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File content first 100 chars:', fileContent.substring(0, 100));
    
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // First line contains dates
    const headers = lines[0].split(';');
    const dates = headers.filter(date => date.trim() !== '');
    
    // Find score lines
    const highScoreLine = lines.find(line => line.includes('CMAS Score > 10'));
    const lowScoreLine = lines.find(line => line.includes('CMAS Score 4-9'));
    
    if (!highScoreLine && !lowScoreLine) {
      console.error('Could not find CMAS score lines in the CSV file');
      return;
    }
    
    const highScores = highScoreLine ? highScoreLine.split(';') : [];
    const lowScores = lowScoreLine ? lowScoreLine.split(';') : [];
    
    // Keep track of imported scores
    const importedScores = [];
    
    // Import scores for each date
    for (let i = 1; i < headers.length; i++) {
      const date = headers[i];
      if (!date || date.trim() === '') continue;
      
      try {
        // Parse the date from DD-MM-YYYY format
        const [day, month, year] = date.split('-');
        const scoreDate = new Date(`${year}-${month}-${day}`);
        
        // Check for high score first
        let scoreValue = null;
        let scoreType = null;
        
        if (highScores[i] && highScores[i].trim() !== '' && !isNaN(parseInt(highScores[i]))) {
          scoreValue = parseInt(highScores[i]);
          scoreType = 'high';
        } 
        // Then check for low score if high score is not available
        else if (lowScores[i] && lowScores[i].trim() !== '' && !isNaN(parseInt(lowScores[i]))) {
          scoreValue = parseInt(lowScores[i]);
          scoreType = 'low';
        }
        
        if (scoreValue !== null && !isNaN(scoreDate)) {
          console.log(`Creating ${scoreType} CMAS score: ${scoreValue} on ${scoreDate.toISOString()} (${date})`);
          
          try {
            const response = await axios.post(`${strapiURL}/api/cmas-scores`, {
              data: {
                scoreDate: scoreDate.toISOString(),
                score: scoreValue,
                patient: patientId,
                publishedAt: new Date()
              }
            }, {
              headers: {
                'Content-Type': 'application/json',
                ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
              }
            });
            
            importedScores.push({
              id: response.data.data.id,
              date: scoreDate.toISOString(),
              originalDate: date,
              score: scoreValue,
              type: scoreType
            });
          } catch (postError) {
            console.error(`Error posting CMAS score: ${postError.message}`);
            if (postError.response) {
              console.error('API response:', postError.response.data);
            }
          }
        }
      } catch (err) {
        console.error(`Error creating CMAS score for date ${date}:`, err.message);
      }
    }
    
    console.log(`CMAS scores import completed! ${importedScores.length} scores imported.`);
    console.log('Summary of imported scores:');
    console.log(`- High scores (>10): ${importedScores.filter(s => s.type === 'high').length}`);
    console.log(`- Low scores (4-9): ${importedScores.filter(s => s.type === 'low').length}`);
  } catch (error) {
    console.error('Error importing CMAS scores:', error.message);
  }
}

async function main() {
  try {
    // Get Patient X
    const patient = await getPatientX();
    if (!patient) {
      console.error('Could not find or create Patient X');
      return;
    }
    
    console.log(`Using Patient X with ID: ${patient.id}`);
    
    // Import CMAS scores for Patient X
    await importCMASScores(patient.id);
    
    console.log('CMAS data import completed successfully!');
  } catch (error) {
    console.error('Error during data import:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

main(); 