const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
// You should replace this with your actual API token if needed
const API_TOKEN = 'fc29bdfcb6257c99fe7c3c32d26e22a2cc8e6aaf835bd5dc7f49beec2c2b4c6d7f1ae63f8ac3271b5dbdc9dff75c08cdd3fdcffb099a01e73a2e0e35f8f46be19dc73bf9fc1ae34fe7e31ce8f1caad4bd30dc2daf348e1a8d5e7c6bdd0ea5acb2cbf4a9a5cfee56d4c62fb0b2c8066811b0af8c52b2c51c9aa02f7d25e10c3';

// Base path for the CSV files
const CSV_BASE_PATH = path.resolve(__dirname, '../../PatientData/patientxD');

// Utility function to read CSV files
async function readCSV(filename, options = {}) {
  const filePath = path.join(CSV_BASE_PATH, filename);
  console.log(`Reading CSV file: ${filePath}`);
  
  // Check if file exists first
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file ${filePath} does not exist!`);
    throw new Error(`CSV file ${filePath} does not exist!`);
  }
  
  // For Patient.csv file, handle it specially as it seems to have issues
  if (filename === 'Patient.csv') {
    return new Promise((resolve, reject) => {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        // Skip header row
        const dataRows = lines.slice(1);
        
        const results = dataRows.map(line => {
          const columns = line.split(',');
          return {
            PatientID: columns[0]?.trim(),
            Name: columns[1]?.trim()
          };
        });
        
        console.log(`Successfully read ${results.length} records from ${filename}`);
        resolve(results);
      } catch (error) {
        console.error(`Error reading or parsing Patient.csv:`, error);
        reject(error);
      }
    });
  }
  
  // For other CSV files, use the original method
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .on('error', (error) => {
        console.error(`Error reading file ${filePath}:`, error);
        reject(error);
      })
      .pipe(csv({
        separator: options.delimiter || ',',
        skipLines: 0,
        headers: true,
        trim: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Successfully read ${results.length} records from ${filename}`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error(`Error parsing CSV file ${filename}:`, error);
        reject(error);
      });
  });
}

// Utility function for Strapi API calls
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`Making API call: ${method} ${endpoint}`);
    if (data) {
      console.log(`With data:`, data);
    }

    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token is provided
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    
    const response = await axios({
      method,
      url: `${STRAPI_URL}/api/${endpoint}`,
      headers,
      data: data ? { data } : undefined
    });
    return response.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Authentication error: Check your API token');
    }
    throw error;
  }
}

// Step 1: Import Patients
async function importPatients() {
  console.log('Importing patients...');
  
  try {
    console.log('Checking if Patient X already exists...');
    const existingPatients = await strapiAPI(`patients?filters[name][$eq]=Patient%20X`);
    
    if (existingPatients.data && existingPatients.data.length > 0) {
      console.log('Patient X already exists, skipping creation...');
      return [{
        id: existingPatients.data[0].id,
        name: 'Patient X',
        patientId: '55e2d179-d738-47d1-b88c-606833ce4d31' // Store this for reference
      }];
    }
    
    console.log('Creating Patient X...');
    const patientData = {
      name: 'Patient X',
      publishedAt: new Date()
    };
    
    const response = await strapiAPI('patients', 'POST', patientData);
    
    if (response.data && response.data.id) {
      console.log(`Created Patient X with Strapi ID ${response.data.id}`);
      return [{
        id: response.data.id,
        name: 'Patient X',
        patientId: '55e2d179-d738-47d1-b88c-606833ce4d31' // Store this for reference
      }];
    } else {
      console.error('Error creating Patient X: Invalid response format');
      console.log('Response:', JSON.stringify(response));
      throw new Error('Failed to create Patient X');
    }
  } catch (err) {
    console.error('Error in importPatients function:', err);
    throw err;
  }
}

// Step 2: Import Lab Result Groups
async function importLabResultGroups() {
  console.log('Importing lab result groups...');
  const groups = await readCSV('LabResultGroup.csv');
  const createdGroups = {};

  for (const group of groups) {
    if (group.GroupName && group.GroupName.trim()) {
      try {
        // Check if group already exists by name
        const existingGroups = await strapiAPI(`lab-result-groups?filters[groupName][$eq]=${encodeURIComponent(group.GroupName)}`);
        
        if (existingGroups.data && existingGroups.data.length > 0) {
          console.log(`Lab result group ${group.GroupName} already exists, skipping...`);
          createdGroups[group.LabResultGroupID] = existingGroups.data[0].id;
          continue;
        }
        
        const response = await strapiAPI('lab-result-groups', 'POST', {
          groupName: group.GroupName,
          publishedAt: new Date()
        });
        
        createdGroups[group.LabResultGroupID] = response.data.id;
        console.log(`Created lab result group: ${group.GroupName} with ID ${response.data.id}`);
      } catch (err) {
        console.error(`Error creating lab result group ${group.GroupName}:`, err.message);
      }
    }
  }
  
  return createdGroups;
}

// Step 3: Import Lab Results
async function importLabResults(patientMap, groupsMap) {
  console.log('Importing lab results...');
  const results = await readCSV('LabResult.csv');
  const labResultsMap = {};
  
  for (const result of results) {
    if (result.ResultName && result.LabResultGroupID) {
      try {
        // Find the patient by PatientID
        const patient = patientMap.find(p => p.patientId === result.PatientID);
        
        if (!patient) {
          console.warn(`Cannot find patient with ID ${result.PatientID} for lab result ${result.ResultName}, skipping`);
          continue;
        }
        
        // Find the lab group
        const groupId = groupsMap[result.LabResultGroupID];
        
        if (!groupId) {
          console.warn(`Cannot find lab group with ID ${result.LabResultGroupID} for lab result ${result.ResultName}, skipping`);
          continue;
        }
        
        // Check if lab result already exists
        const existingLabResults = await strapiAPI(`lab-results?filters[resultName][$eq]=${encodeURIComponent(result.ResultName)}&filters[patient][id][$eq]=${patient.id}`);
        
        if (existingLabResults.data && existingLabResults.data.length > 0) {
          console.log(`Lab result ${result.ResultName} for patient ${patient.name} already exists, skipping...`);
          labResultsMap[result.LabResultID] = existingLabResults.data[0].id;
          continue;
        }
        
        // Create lab result
        const response = await strapiAPI('lab-results', 'POST', {
          resultName: result.ResultName,
          unit: result.Unit || '',
          patient: patient.id,
          lab_result_group: groupId,
          publishedAt: new Date()
        });
        
        labResultsMap[result.LabResultID] = response.data.id;
        console.log(`Created lab result: ${result.ResultName} with ID ${response.data.id}`);
      } catch (err) {
        console.error(`Error creating lab result ${result.ResultName}:`, err.message);
      }
    }
  }
  
  return labResultsMap;
}

// Helper function to parse Dutch date format
function parseDateTime(dateTimeStr) {
  try {
    // Handle different date formats
    // Format: dd-mm-yyyyHH:MM or dd-mm-yyyy
    const parts = dateTimeStr.split(/[-\s:]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
      
      // Handle year with potential time attached
      let year, hour = 0, minute = 0;
      if (parts[2].includes('HH')) {
        const yearTimeParts = parts[2].split('HH');
        year = parseInt(yearTimeParts[0], 10);
        if (parts.length > 3) {
          hour = parseInt(parts[3], 10);
          minute = parts.length > 4 ? parseInt(parts[4], 10) : 0;
        }
      } else {
        year = parseInt(parts[2], 10);
        if (parts.length > 3) {
          hour = parseInt(parts[3], 10);
          minute = parts.length > 4 ? parseInt(parts[4], 10) : 0;
        }
      }
      
      return new Date(year, month, day, hour, minute);
    }
    
    // If all else fails, return the original string for manual review
    console.warn(`Could not parse date: ${dateTimeStr}`);
    return new Date();
  } catch (error) {
    console.error(`Error parsing date ${dateTimeStr}:`, error);
    return new Date(); // Return current date as fallback
  }
}

// Step 4: Import Measurements
async function importMeasurements(labResultsMap) {
  console.log('Importing measurements...');
  const measurements = await readCSV('Measurement.csv');
  let count = 0;
  
  for (const measurement of measurements) {
    if (measurement.DateTime && measurement.Value) {
      try {
        // Find the lab result 
        const labResultId = labResultsMap[measurement.LabResultID];
        
        if (!labResultId) {
          console.warn(`Cannot find lab result with ID ${measurement.LabResultID} for measurement, skipping`);
          continue;
        }
        
        // Skip non-numeric values or special notations
        if (measurement.Value === '<Memo>' || 
            measurement.Value === 'neg' || 
            measurement.Value === 'Geen' || 
            measurement.Value === 'Serum' || 
            measurement.Value.includes('/')) {
          console.log(`Skipping non-numeric measurement: ${measurement.Value}`);
          continue;
        }
        
        // Parse the date correctly
        const dateTime = parseDateTime(measurement.DateTime);
        
        if (!dateTime || isNaN(dateTime)) {
          console.warn(`Invalid date: ${measurement.DateTime}, skipping`);
          continue;
        }
        
        // Clean up the value (remove any '<' prefix and handle decimal points)
        const cleanValue = measurement.Value.replace('<', '').trim();
        
        // Check if measurement already exists
        const existingMeasurements = await strapiAPI(
          `measurements?filters[lab_result][id][$eq]=${labResultId}&filters[dateTime][$eq]=${dateTime.toISOString()}`
        );
        
        if (existingMeasurements.data && existingMeasurements.data.length > 0) {
          console.log(`Measurement for lab result ${labResultId} on ${dateTime.toISOString()} already exists, skipping...`);
          count++;
          continue;
        }
        
        // Create measurement
        await strapiAPI('measurements', 'POST', {
          value: cleanValue,
          dateTime: dateTime.toISOString(),
          lab_result: labResultId,
          publishedAt: new Date()
        });
        
        count++;
        if (count % 50 === 0) {
          console.log(`Imported ${count} measurements so far...`);
        }
      } catch (err) {
        console.error(`Error creating measurement: ${err.message}`);
      }
    }
  }
  
  console.log(`Successfully imported ${count} measurements`);
  return count;
}

// Step 5: Import CMAS Scores
async function importCMASScores(patientMap) {
  console.log('Importing CMAS scores...');
  const cmasScores = await readCSV('CMAS.csv');
  let count = 0;
  
  for (const cmas of cmasScores) {
    if (cmas.PatientID && cmas.Date && cmas.Score) {
      try {
        // Find the patient by PatientID
        const patient = patientMap.find(p => p.patientId === cmas.PatientID);
        
        if (!patient) {
          console.warn(`Cannot find patient with ID ${cmas.PatientID} for CMAS score, skipping`);
          continue;
        }
        
        // Parse the date (in YYYY-MM-DD format)
        const scoreDate = new Date(cmas.Date);
        
        if (isNaN(scoreDate.getTime())) {
          console.warn(`Invalid date: ${cmas.Date}, skipping`);
          continue;
        }
        
        // Convert score to number
        const scoreValue = parseFloat(cmas.Score);
        
        if (isNaN(scoreValue)) {
          console.warn(`Invalid score value: ${cmas.Score}, skipping`);
          continue;
        }
        
        // Map category to the enum values in the schema
        let categoryValue;
        if (cmas.Category === '>10') {
          categoryValue = 'Score >10,';
        } else if (cmas.Category === '4-9') {
          categoryValue = 'Score 4-9';
        } else {
          categoryValue = scoreValue > 10 ? 'Score >10,' : 'Score 4-9';
        }
        
        // Check if CMAS score already exists
        const existingScores = await strapiAPI(
          `cmas-scores?filters[patient][id][$eq]=${patient.id}&filters[date][$eq]=${scoreDate.toISOString().split('T')[0]}`
        );
        
        if (existingScores.data && existingScores.data.length > 0) {
          console.log(`CMAS score for patient ${patient.name} on ${scoreDate.toISOString().split('T')[0]} already exists, skipping...`);
          count++;
          continue;
        }
        
        // Create CMAS score
        const response = await strapiAPI('cmas-scores', 'POST', {
          date: scoreDate.toISOString().split('T')[0],
          score: scoreValue,
          category: categoryValue,
          patient: patient.id,
          publishedAt: new Date()
        });
        
        count++;
        console.log(`Created CMAS score: ${scoreValue} on ${scoreDate.toISOString().split('T')[0]} for patient ${patient.name}`);
      } catch (err) {
        console.error(`Error creating CMAS score:`, err.message);
      }
    }
  }
  
  console.log(`Successfully imported ${count} CMAS scores`);
  return count;
}

// Main function to orchestrate the import process
async function importAllData() {
  try {
    console.log('Starting complete data import process...');
    console.log(`CSV_BASE_PATH: ${CSV_BASE_PATH}`);
    console.log(`Files in CSV directory:`, fs.readdirSync(CSV_BASE_PATH).join(', '));
    
    try {
      console.log('Testing API connection to Strapi...');
      await strapiAPI('patients');
      console.log('Connection to Strapi successful!');
    } catch (err) {
      console.error('Failed to connect to Strapi API:', err.message);
      throw new Error('Failed to connect to Strapi API - make sure Strapi is running!');
    }
    
    // Step 1: Import Patients (parent entity)
    let patients = [];
    try {
      patients = await importPatients();
      console.log(`Successfully processed ${patients.length} patients`);
    } catch (error) {
      console.error('Error importing patients:', error);
      throw new Error('Failed to import patients');
    }
    
    if (patients.length === 0) {
      throw new Error('No patients were imported, cannot continue');
    }
    
    // Step 2: Import Lab Result Groups (parent entity)
    let groupsMap = {};
    try {
      groupsMap = await importLabResultGroups();
      console.log(`Successfully processed ${Object.keys(groupsMap).length} lab result groups`);
    } catch (error) {
      console.error('Error importing lab result groups:', error);
      throw new Error('Failed to import lab result groups');
    }
    
    if (Object.keys(groupsMap).length === 0) {
      throw new Error('No lab result groups were imported, cannot continue');
    }
    
    // Step 3: Import Lab Results (depends on Patients and Lab Result Groups)
    let labResultsMap = {};
    try {
      labResultsMap = await importLabResults(patients, groupsMap);
      console.log(`Successfully processed ${Object.keys(labResultsMap).length} lab results`);
    } catch (error) {
      console.error('Error importing lab results:', error);
      throw new Error('Failed to import lab results');
    }
    
    if (Object.keys(labResultsMap).length === 0) {
      throw new Error('No lab results were imported, cannot continue');
    }
    
    // Step 4: Import Measurements (depends on Lab Results)
    try {
      await importMeasurements(labResultsMap);
    } catch (error) {
      console.error('Error importing measurements:', error);
      throw new Error('Failed to import measurements');
    }
    
    // Step 5: Import CMAS Scores (depends on Patients)
    try {
      await importCMASScores(patients);
    } catch (error) {
      console.error('Error importing CMAS scores:', error);
      throw new Error('Failed to import CMAS scores');
    }
    
    console.log('Data import completed successfully!');
    
    return {
      patients,
      groupsMap,
      labResultsMap
    };
  } catch (error) {
    console.error('Import process failed:');
    console.error(error);
    return {
      patients: [],
      groupsMap: {},
      labResultsMap: {}
    };
  }
}

// Execute the import
importAllData()
  .then(results => {
    console.log('===== IMPORT SUMMARY =====');
    console.log(`Patients: ${results.patients.length}`);
    console.log(`Lab Result Groups: ${Object.keys(results.groupsMap).length}`);
    console.log(`Lab Results: ${Object.keys(results.labResultsMap).length}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed with error:', error);
    process.exit(1);
  }); 