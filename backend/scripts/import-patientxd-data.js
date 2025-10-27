const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const path = require('path');

console.log('Starting import script...');

const STRAPI_URL = 'http://localhost:1337';
// You'll need to replace this with your actual API token from Strapi admin panel
const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

// Base path for the CSV files - now configurable
let CSV_BASE_PATH;

// Check if a custom path is provided as command line argument
const customPath = process.argv[2];
if (customPath) {
  // If relative path, resolve it relative to the script directory
  CSV_BASE_PATH = path.isAbsolute(customPath) 
    ? customPath 
    : path.resolve(__dirname, '../../', customPath);
} else {
  // Default to original patientxD directory
  CSV_BASE_PATH = path.resolve(__dirname, '../../PatientData/patientxD');
}

console.log('CSV base path:', CSV_BASE_PATH);

// Utility function to read CSV files
async function readCSV(filename, options = {}) {
  const filePath = path.join(CSV_BASE_PATH, filename);
  console.log(`Reading CSV file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file ${filePath} does not exist!`);
    throw new Error(`CSV file ${filePath} does not exist!`);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
  const headers = lines[0].split(',');
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted values and commas within quotes
    const row = lines[i];
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.replace(/^"|"$/g, '').trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.replace(/^"|"$/g, '').trim());

    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      if (Object.values(record).some(value => value && value.trim())) {
        results.push(record);
      }
    }
  }
  
  console.log(`Successfully read ${results.length} records from ${filename}`);
  return results;
}

// Utility function for Strapi API calls
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`Making API call: ${method} ${endpoint}`);
    if (data) {
      console.log('With data:', JSON.stringify(data, null, 2));
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
    
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Step 1: Import Patients
async function importPatients() {
  console.log('Importing patients...');
  const patients = await readCSV('Patient.csv');
  console.log('Patients from CSV:', patients);
  const createdPatients = [];
  
  for (const patient of patients) {
    if (patient.Name && patient.Name.trim()) {
      try {
        // Check if patient already exists by PatientID
        const existingPatients = await strapiAPI(`patients?filters[patientId][$eq]=${encodeURIComponent(patient.PatientID)}`);
        
        if (existingPatients.data && existingPatients.data.length > 0) {
          console.log(`Patient ${patient.Name} with ID ${patient.PatientID} already exists, skipping...`);
          createdPatients.push({
            id: existingPatients.data[0].id,
            name: patient.Name,
            patientId: patient.PatientID
          });
          continue;
        }
        
        // Create the patient
        const response = await strapiAPI('patients', 'POST', {
          name: patient.Name,
          patientId: patient.PatientID,
          publishedAt: new Date().toISOString()
        });
        
        console.log(`Created patient: ${patient.Name} with ID ${patient.PatientID}`);
        createdPatients.push({
          id: response.data.id,
          name: patient.Name,
          patientId: patient.PatientID
        });
      } catch (error) {
        console.error(`Error creating patient ${patient.Name}:`, error.message);
        if (error.response?.data?.error) {
          console.error('API Error Details:', error.response.data.error);
        }
      }
    }
  }
  
  console.log('Created patients:', createdPatients);
  return createdPatients;
}

// Step 2: Import Lab Result Groups
async function importLabResultGroups() {
  console.log('Importing lab result groups...');
  const groups = await readCSV('LabResultGroup.csv');
  console.log('Lab result groups from CSV:', groups);
  const createdGroups = {};
  
  for (const group of groups) {
    if (group.GroupName && group.GroupName.trim()) {
      try {
        // Check if group already exists by ID
        const existingGroups = await strapiAPI(`lab-result-groups?filters[groupId][$eq]=${encodeURIComponent(group.LabResultGroupID)}`);
        
        if (existingGroups.data && existingGroups.data.length > 0) {
          console.log(`Lab result group ${group.GroupName} with ID ${group.LabResultGroupID} already exists, skipping...`);
          createdGroups[group.LabResultGroupID] = existingGroups.data[0].id;
          continue;
        }
        
        // Create the group
        const response = await strapiAPI('lab-result-groups', 'POST', {
          groupName: group.GroupName,
          groupId: group.LabResultGroupID,
          publishedAt: new Date().toISOString()
        });
        
        console.log(`Created lab result group: ${group.GroupName} with ID ${group.LabResultGroupID}`);
        createdGroups[group.LabResultGroupID] = response.data.id;
      } catch (error) {
        console.error(`Error creating lab result group ${group.GroupName}:`, error.message);
        if (error.response?.data?.error) {
          console.error('API Error Details:', error.response.data.error);
        }
      }
    }
  }
  
  console.log('Created lab result groups:', createdGroups);
  return createdGroups;
}

// Step 3: Import Lab Results and their Measurements
async function importLabResults(patients, groupsMap) {
  console.log('Starting lab results import...');
  const labResults = await readCSV('LabResult.csv');
  const measurements = await readCSV('Measurement.csv');
  console.log(`Found ${labResults.length} lab results and ${measurements.length} measurements in CSV files`);
  const createdResults = {};
  let createdLabResults = 0;
  let createdMeasurements = 0;
  
  // First, create all lab results
  for (const result of labResults) {
    if (result.ResultName && result.ResultName.trim()) {
      try {
        // Check if lab result already exists by ID
        const existingResults = await strapiAPI(`lab-results?filters[labResultId][$eq]=${encodeURIComponent(result.LabResultID)}`);
        
        if (existingResults.data && existingResults.data.length > 0) {
          console.log(`Lab result ${result.ResultName} with ID ${result.LabResultID} already exists, using existing ID`);
          createdResults[result.LabResultID] = existingResults.data[0].id;
          continue;
        }
        
        // Create the lab result
        const response = await strapiAPI('lab-results', 'POST', {
          resultName: result.ResultName,
          labResultId: result.LabResultID,
          unit: result.Unit,
          patient: patients.find(p => p.patientId === result.PatientID)?.id,
          lab_result_group: groupsMap[result.LabResultGroupID],
          publishedAt: new Date().toISOString()
        });
        
        console.log(`Created lab result: ${result.ResultName} with ID ${result.LabResultID}`);
        createdResults[result.LabResultID] = response.data.id;
        createdLabResults++;
      } catch (error) {
        console.error(`Error creating lab result ${result.ResultName}:`, error.message);
        if (error.response?.data?.error) {
          console.error('API Error Details:', error.response.data.error);
        }
      }
    }
  }
  
  console.log(`Created ${createdLabResults} new lab results`);
  
  // Import measurements for each lab result
  console.log('Starting measurements import...');
  console.log(`Processing ${measurements.length} measurements from CSV`);
  
  for (const measurement of measurements) {
    try {
      // Skip if no lab result ID or measurement ID
      if (!measurement.LabResultID || !measurement.MeasurementID) {
        console.log('Skipping measurement with missing LabResultID or MeasurementID');
        continue;
      }

      // Check if measurement already exists
      const existingMeasurements = await strapiAPI(`measurements?filters[measurementId][$eq]=${encodeURIComponent(measurement.MeasurementID)}`);
      
      if (existingMeasurements.data && existingMeasurements.data.length > 0) {
        console.log(`Measurement ${measurement.MeasurementID} already exists, skipping...`);
        continue;
      }

      // Parse the date string
      const dateStr = measurement.DateTime.replace(/"/g, '').trim();
      let dateTimeStr;
      
      if (!dateStr) {
        console.error(`Invalid date string for measurement ${measurement.MeasurementID}`);
        continue;
      }

      try {
        // Handle different date formats
        const [datePart, timePart] = dateStr.split(/(?<=\d{4})|(?<=\d{2}:\d{2}(?:\.\d+)?)/);
        const [day, month, year] = datePart.split('-').map(part => part.trim());
        
        if (!timePart) {
          // If no time part, set to midnight
          dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        } else {
          // Clean up time part and handle different formats
          const cleanTimePart = timePart.replace(/\.\d+$/, '').trim();
          const [hours, minutes = '00'] = cleanTimePart.split(':').map(part => part.trim());
          dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;
        }
      } catch (error) {
        console.error(`Error parsing date for measurement ${measurement.MeasurementID}:`, error.message, 'Date string:', dateStr);
        continue;
      }

      // Get the lab result ID from our mapping
      const labResultId = createdResults[measurement.LabResultID];
      if (!labResultId) {
        console.error(`Could not find lab result ID for measurement ${measurement.MeasurementID} (LabResultID: ${measurement.LabResultID})`);
        continue;
      }

      // Clean up the value
      let value = measurement.Value.trim();
      if (value === '<Memo>') {
        value = 'Memo';
      } else if (value.startsWith('<') && !isNaN(value.substring(1))) {
        // Handle values like '<4', '<100' by using the number
        value = value.substring(1);
      } else if (value.includes('/')) {
        // Handle values like '295.30/Pos'
        value = value.split('/')[0].trim();
      }

      // Create the measurement
      const response = await strapiAPI('measurements', 'POST', {
        measurementId: measurement.MeasurementID,
        value: value,
        dateTime: dateTimeStr,
        lab_result: labResultId,
        publishedAt: new Date().toISOString()
      });

      console.log(`Created measurement: ${measurement.MeasurementID} with value ${value}`);
      createdMeasurements++;
    } catch (error) {
      console.error(`Error creating measurement ${measurement.MeasurementID}:`, error.message);
      if (error.response?.data?.error) {
        console.error('API Error Details:', error.response.data.error);
      }
    }
  }
  
  console.log(`Created ${createdMeasurements} new measurements`);
  return { createdLabResults, createdMeasurements };
}

// Step 4: Import CMAS Scores
async function importCMASScores(patients) {
  console.log('Importing CMAS scores...');
  const scores = await readCSV('CMAS.csv');
  console.log('CMAS scores from CSV:', scores);
  const createdScores = [];
  
  for (const score of scores) {
    try {
      // Find the patient
      const patient = patients.find(p => p.patientId === score.PatientID);
      if (!patient) {
        console.error(`Patient ${score.PatientID} not found for CMAS score`);
        continue;
      }

      // Check if score already exists
      const existingScores = await strapiAPI(
        `cmas-scores?filters[patient][id][$eq]=${patient.id}&filters[date][$eq]=${score.Date}`
      );
      
      if (existingScores.data && existingScores.data.length > 0) {
        console.log(`CMAS score for patient ${patient.name} on ${score.Date} already exists, skipping...`);
        continue;
      }
      
      // Create the CMAS score
      const response = await strapiAPI('cmas-scores', 'POST', {
        date: score.Date,
        score: parseFloat(score.Score),
        category: score.Category,
        patient: patient.id,
        publishedAt: new Date().toISOString()
      });
      
      console.log(`Created CMAS score: ${score.Score} for patient ${patient.name} on ${score.Date}`);
      createdScores.push(response.data);
    } catch (error) {
      console.error(`Error creating CMAS score:`, error.message);
      if (error.response?.data?.error) {
        console.error('API Error Details:', error.response.data.error);
      }
    }
  }
  
  console.log(`Created ${createdScores.length} CMAS scores`);
  return createdScores.length;
}

// Main function to orchestrate the import process
async function importAllData() {
  try {
    console.log('Starting data import...');
    
    // Step 1: Import patients
    const patients = await importPatients();
    console.log('Patients imported successfully');
    
    // Step 2: Import lab result groups
    const groupsMap = await importLabResultGroups();
    console.log('Lab result groups imported successfully');
    
    // Step 3: Import lab results and measurements
    await importLabResults(patients, groupsMap);
    console.log('Lab results and measurements imported successfully');
    
    // Step 4: Import CMAS scores
    const cmasCount = await importCMASScores(patients);
    console.log(`Created ${cmasCount} CMAS scores`);
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error in import process:', error);
    throw error;
  }
}

// Call the main import function
importAllData().catch(error => {
  console.error('Error in import process:', error);
  process.exit(1);
});