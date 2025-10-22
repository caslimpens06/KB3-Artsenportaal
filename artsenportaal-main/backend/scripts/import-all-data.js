const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'd25089b833f7e1281a71976a6f0b0aaa5d6193ab198376bed33fb1f8a257e53ee092e53221c7123c181ce96d1ddf3b803d649f4981f09fb8478d0befc8d8fc069fba6bb899fd82c2c5e62d25cf907c40d4a3b32d3b08c6fb76a7cddbe817cae2d41741a4fc78295e5e3e9a078c303d7db465493abe4cd0afdf32a84d1ef17ba7'; // Replace with your actual token

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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    };
    
    const response = await axios({
      method,
      url: `${STRAPI_URL}/api/${endpoint}`,
      headers,
      data: data ? { data } : undefined
    });
    return response.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response?.data || error.message);
    console.error('Full error details:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Authentication error: Check your API token');
    }
    throw error;
  }
}

// Step 1: Import Patients
async function importPatients() {
  console.log('Importing patients...');
  const patients = await readCSV('Patient.csv');
  const createdPatients = [];
  
  for (const patient of patients) {
    if (patient.Name && patient.Name.trim()) {
      try {
        console.log(`Attempting to create patient: ${patient.Name}`);
        
        // Create the patient data object
        const patientData = {
          name: patient.Name,
          patientId: patient.PatientID || null,
          publishedAt: new Date()
        };
        
        // Check if patient already exists
        const existingPatients = await strapiAPI(`patients?filters[patientId][$eq]=${patient.PatientID}`);
        
        if (existingPatients.data && existingPatients.data.length > 0) {
          console.log(`Patient ${patient.Name} with ID ${patient.PatientID} already exists, skipping...`);
          createdPatients.push({
            id: existingPatients.data[0].id,
            name: patient.Name,
            patientId: patient.PatientID
          });
          continue;
        }
        
        // Send the request to create patient
        const response = await strapiAPI('patients', 'POST', patientData);
        
        // Handle different response formats
        let newPatientId = null;
        if (response.data && response.data.id) {
          newPatientId = response.data.id;
        } else if (response.id) {
          newPatientId = response.id;
        }
        
        if (newPatientId) {
          console.log(`Created patient: ${patient.Name} with ID ${newPatientId}`);
          createdPatients.push({
            id: newPatientId,
            name: patient.Name,
            patientId: patient.PatientID
          });
        } else {
          console.error('Could not determine ID from response:', response);
        }
      } catch (err) {
        console.error(`Error creating patient ${patient.Name}:`, err.message);
      }
    } else {
      console.warn('Skipping patient with no name:', patient);
    }
  }
  
  console.log(`Successfully created/found ${createdPatients.length} patients out of ${patients.length}`);
  return createdPatients;
}

// Step 2: Import Lab Result Groups
async function importLabResultGroups() {
  console.log('Importing lab result groups...');
  const groups = await readCSV('LabResultGroup.csv');
  const createdGroups = {};

  for (const group of groups) {
    if (group.GroupName && group.GroupName.trim()) {
      try {
        // Check if group already exists
        const existingGroups = await strapiAPI(`lab-result-groups?filters[groupId][$eq]=${group.LabResultGroupID}`);
        
        if (existingGroups.data && existingGroups.data.length > 0) {
          console.log(`Lab result group ${group.GroupName} with ID ${group.LabResultGroupID} already exists, skipping...`);
          createdGroups[group.LabResultGroupID] = existingGroups.data[0].id;
          continue;
        }
        
        const response = await strapiAPI('lab-result-groups', 'POST', {
          groupName: group.GroupName,
          groupId: group.LabResultGroupID || null,
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
        const existingLabResults = await strapiAPI(`lab-results?filters[labResultId][$eq]=${result.LabResultID}`);
        
        if (existingLabResults.data && existingLabResults.data.length > 0) {
          console.log(`Lab result ${result.ResultName} with ID ${result.LabResultID} already exists, skipping...`);
          labResultsMap[result.LabResultID] = existingLabResults.data[0].id;
          continue;
        }
        
        // Create lab result
        const response = await strapiAPI('lab-results', 'POST', {
          resultName: result.ResultName,
          value: result.Value || '',
          unit: result.Unit || '',
          labResultId: result.LabResultID || null,
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
          type: 'measurement',
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
        
        // Check if CMAS score already exists
        const existingScores = await strapiAPI(
          `cmas-scores?filters[patient][id][$eq]=${patient.id}&filters[scoreDate][$eq]=${scoreDate.toISOString()}`
        );
        
        if (existingScores.data && existingScores.data.length > 0) {
          console.log(`CMAS score for patient ${patient.name} on ${scoreDate.toISOString()} already exists, skipping...`);
          count++;
          continue;
        }
        
        // Create CMAS score
        const response = await strapiAPI('cmas-scores', 'POST', {
          scoreDate: scoreDate.toISOString(),
          score: scoreValue,
          scoreCategory: cmas.Category || (scoreValue > 10 ? '>10' : '4-9'),
          patient: patient.id,
          publishedAt: new Date()
        });
        
        count++;
        console.log(`Created CMAS score: ${scoreValue} on ${scoreDate.toISOString()} for patient ${patient.name}`);
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
    
    // Step 1: Import Patients (parent entity)
    const patients = await importPatients();
    if (patients.length === 0) {
      throw new Error('No patients were imported, cannot continue');
    }
    
    // Step 2: Import Lab Result Groups (parent entity)
    const groupsMap = await importLabResultGroups();
    if (Object.keys(groupsMap).length === 0) {
      throw new Error('No lab result groups were imported, cannot continue');
    }
    
    // Step 3: Import Lab Results (depends on Patients and Lab Result Groups)
    const labResultsMap = await importLabResults(patients, groupsMap);
    if (Object.keys(labResultsMap).length === 0) {
      throw new Error('No lab results were imported, cannot continue');
    }
    
    // Step 4: Import Measurements (depends on Lab Results)
    await importMeasurements(labResultsMap);
    
    // Step 5: Import CMAS Scores (depends on Patients)
    await importCMASScores(patients);
    
    console.log('Data import completed successfully!');
    
    return {
      patients,
      groupsMap,
      labResultsMap
    };
  } catch (error) {
    console.error('Import process failed:');
    console.error(error);
    console.error(error.stack);
    throw error;
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

// At the top of the file after requires, add these lines to check the environment
console.log('Starting import with:');
console.log(`STRAPI_URL: ${STRAPI_URL}`);
console.log(`API_TOKEN: ${API_TOKEN.substring(0, 10)}...`);
console.log(`CSV_BASE_PATH: ${CSV_BASE_PATH}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Files in CSV directory:`, fs.readdirSync(CSV_BASE_PATH).join(', ')); 