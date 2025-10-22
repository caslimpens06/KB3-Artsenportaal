const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const STRAPI_URL = 'http://localhost:1337';

// Helper function to randomize a numerical value by ±percentage
function randomizeValue(value, percentage = 20) {
  const num = parseFloat(value);
  if (isNaN(num)) return value; // Return original if not a number
  
  const variation = (Math.random() - 0.5) * 2 * (percentage / 100);
  const newValue = num * (1 + variation);
  
  // Keep same decimal places as original
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  return decimalPlaces > 0 ? newValue.toFixed(decimalPlaces) : Math.round(newValue).toString();
}

// Helper function to randomize dates (shift by ±6 months)
function randomizeDate(dateString) {
  try {
    let date;
    
    // Handle different date formats
    if (dateString.includes('-') && dateString.length <= 10) {
      // Format: DD-MM-YYYY or similar
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Assume DD-MM-YYYY format
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else if (dateString.includes('-') && dateString.length > 10) {
      // Format: DD-MM-YYYYHH:MM
      const [datePart, timePart] = dateString.split(/(?=\d{2}:\d{2}$)/);
      const parts = datePart.split('-');
      if (parts.length >= 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${timePart || '00:00'}`);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    // Shift by ±6 months (random)
    const monthsShift = (Math.random() - 0.5) * 12; // ±6 months
    date.setMonth(date.getMonth() + monthsShift);
    
    // Format back to original format
    if (dateString.includes(':')) {
      // Include time
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year}${hours}:${minutes}`;
    } else {
      // Date only
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    console.log(`Error processing date ${dateString}:`, error.message);
    return dateString;
  }
}

// Read CSV file
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Write CSV file
async function writeCSV(filePath, data, headers) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
}

// Generate mock patient data
async function generateMockPatient(patientName) {
  console.log(`🎭 Generating mock patient: ${patientName}`);
  
  const sourceDir = path.join(__dirname, '../../PatientData/patientxD');
  const outputDir = path.join(__dirname, `../../PatientData/mock-${patientName.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate new UUIDs for this patient
  const originalPatientId = '55e2d179-d738-47d1-b88c-606833ce4d31';
  const newPatientId = uuidv4();
  const labResultIdMapping = new Map();
  const measurementIdMapping = new Map();
  
  console.log(`📋 Original Patient ID: ${originalPatientId}`);
  console.log(`🆕 New Patient ID: ${newPatientId}`);
  
  // 1. Process Patient.csv
  console.log('📝 Processing Patient.csv...');
  const patientData = [{
    PatientID: newPatientId,
    Name: patientName
  }];
  await writeCSV(path.join(outputDir, 'Patient.csv'), patientData, ['PatientID', 'Name']);
  
  // 2. Process LabResultGroup.csv (copy as-is, groups are shared)
  console.log('📝 Processing LabResultGroup.csv...');
  const labResultGroups = await readCSV(path.join(sourceDir, 'LabResultGroup.csv'));
  await writeCSV(path.join(outputDir, 'LabResultGroup.csv'), labResultGroups, ['LabResultGroupID', 'GroupName']);
  
  // 3. Process LabResult.csv (generate new IDs, assign to new patient)
  console.log('📝 Processing LabResult.csv...');
  const originalLabResults = await readCSV(path.join(sourceDir, 'LabResult.csv'));
  const newLabResults = originalLabResults.map(result => {
    const newLabResultId = uuidv4();
    labResultIdMapping.set(result.LabResultID, newLabResultId);
    
    return {
      LabResultID: newLabResultId,
      LabResultGroupID: result.LabResultGroupID, // Keep same group
      PatientID: newPatientId, // Assign to new patient
      ResultName: result.ResultName,
      Unit: result.Unit
    };
  });
  await writeCSV(path.join(outputDir, 'LabResult.csv'), newLabResults, ['LabResultID', 'LabResultGroupID', 'PatientID', 'ResultName', 'Unit']);
  
  // 4. Process CMAS.csv (randomize scores and dates)
  console.log('📝 Processing CMAS.csv...');
  const originalCMAS = await readCSV(path.join(sourceDir, 'CMAS.csv'));
  const newCMAS = originalCMAS.map(cmas => ({
    PatientID: newPatientId,
    Date: randomizeDate(cmas.Date),
    Score: randomizeValue(cmas.Score, 15), // ±15% for CMAS scores
    Category: cmas.Category
  }));
  await writeCSV(path.join(outputDir, 'CMAS.csv'), newCMAS, ['PatientID', 'Date', 'Score', 'Category']);
  
  // 5. Process Measurement.csv (randomize values and dates, map lab result IDs)
  console.log('📝 Processing Measurement.csv...');
  const originalMeasurements = await readCSV(path.join(sourceDir, 'Measurement.csv'));
  const newMeasurements = originalMeasurements.map(measurement => {
    const newMeasurementId = uuidv4();
    measurementIdMapping.set(measurement.MeasurementID, newMeasurementId);
    
    const newLabResultId = labResultIdMapping.get(measurement.LabResultID);
    if (!newLabResultId) {
      console.warn(`⚠️  No mapping found for LabResultID: ${measurement.LabResultID}`);
    }
    
    let newValue = measurement.Value;
    
    // Don't randomize non-numeric values
    if (measurement.Value && 
        !measurement.Value.includes('neg') && 
        !measurement.Value.includes('Geen') && 
        !measurement.Value.includes('<Memo>') &&
        !measurement.Value.includes('Serum') &&
        !measurement.Value.includes('JDM') &&
        !measurement.Value.includes('Pos') &&
        !measurement.Value.includes('Grenswaardig') &&
        !measurement.Value.includes('Naso') &&
        !isNaN(parseFloat(measurement.Value.replace('<', '').replace('>', '')))) {
      
      // Handle values with < or > prefixes
      if (measurement.Value.startsWith('<') || measurement.Value.startsWith('>')) {
        const prefix = measurement.Value.charAt(0);
        const numValue = measurement.Value.substring(1);
        newValue = prefix + randomizeValue(numValue, 20);
      } else {
        newValue = randomizeValue(measurement.Value, 20);
      }
    }
    
    return {
      MeasurementID: newMeasurementId,
      LabResultID: newLabResultId || measurement.LabResultID,
      DateTime: randomizeDate(measurement.DateTime),
      Value: newValue
    };
  });
  await writeCSV(path.join(outputDir, 'Measurement.csv'), newMeasurements, ['MeasurementID', 'LabResultID', 'DateTime', 'Value']);
  
  console.log(`✅ Mock patient data generated in: ${outputDir}`);
  
  // Import to Strapi
  console.log('🚀 Importing to Strapi...');
  try {
    await importToStrapi(outputDir, patientName);
    console.log('✅ Successfully imported to Strapi!');
  } catch (error) {
    console.error('❌ Error importing to Strapi:', error.message);
    throw error;
  }
  
  return {
    patientId: newPatientId,
    patientName,
    outputDir,
    stats: {
      cmasScores: newCMAS.length,
      labResults: newLabResults.length,
      measurements: newMeasurements.length
    }
  };
}

// Import generated data to Strapi
async function importToStrapi(dataDir, patientName) {
  console.log(`📤 Importing ${patientName} to Strapi...`);
  
  // Import Patient
  const patientData = await readCSV(path.join(dataDir, 'Patient.csv'));
  const patient = patientData[0];
  
  const patientResponse = await axios.post(`${STRAPI_URL}/api/patients`, {
    name: patient.Name,
    patientId: patient.PatientID
  });
  const strapiPatientId = patientResponse.data.id;
  console.log(`✅ Patient created with Strapi ID: ${strapiPatientId}`);
  
  // Import CMAS Scores
  const cmasData = await readCSV(path.join(dataDir, 'CMAS.csv'));
  console.log(`📊 Importing ${cmasData.length} CMAS scores...`);
  
  for (const cmas of cmasData) {
    try {
      await axios.post(`${STRAPI_URL}/api/cmas-scores`, {
        date: cmas.Date,
        score: parseFloat(cmas.Score),
        category: cmas.Category,
        patient: strapiPatientId
      });
    } catch (error) {
      console.warn(`⚠️  Error importing CMAS score:`, error.response?.data || error.message);
    }
  }
  
  // Import Lab Result Groups (if they don't exist)
  const labResultGroups = await readCSV(path.join(dataDir, 'LabResultGroup.csv'));
  const groupIdMapping = new Map();
  
  console.log(`🧪 Processing ${labResultGroups.length} lab result groups...`);
  for (const group of labResultGroups) {
    try {
      // Check if group already exists
      const existingGroups = await axios.get(`${STRAPI_URL}/api/lab-result-groups?filters[groupId][$eq]=${group.LabResultGroupID}`);
      
      if (existingGroups.data.data.length > 0) {
        groupIdMapping.set(group.LabResultGroupID, existingGroups.data.data[0].id);
        console.log(`♻️  Using existing group: ${group.GroupName}`);
      } else {
        const groupResponse = await axios.post(`${STRAPI_URL}/api/lab-result-groups`, {
          groupName: group.GroupName,
          groupId: group.LabResultGroupID
        });
        groupIdMapping.set(group.LabResultGroupID, groupResponse.data.id);
        console.log(`✅ Created new group: ${group.GroupName}`);
      }
    } catch (error) {
      console.warn(`⚠️  Error processing group ${group.GroupName}:`, error.response?.data || error.message);
    }
  }
  
  // Import Lab Results
  const labResults = await readCSV(path.join(dataDir, 'LabResult.csv'));
  const labResultIdMapping = new Map();
  
  console.log(`🔬 Importing ${labResults.length} lab results...`);
  for (const result of labResults) {
    try {
      const strapiGroupId = groupIdMapping.get(result.LabResultGroupID);
      if (!strapiGroupId) {
        console.warn(`⚠️  No Strapi group ID found for: ${result.LabResultGroupID}`);
        continue;
      }
      
      const labResultResponse = await axios.post(`${STRAPI_URL}/api/lab-results`, {
        resultName: result.ResultName,
        labResultId: result.LabResultID,
        value: '',
        unit: result.Unit || '',
        patient: strapiPatientId,
        lab_result_group: strapiGroupId
      });
      
      labResultIdMapping.set(result.LabResultID, labResultResponse.data.id);
    } catch (error) {
      console.warn(`⚠️  Error importing lab result ${result.ResultName}:`, error.response?.data || error.message);
    }
  }
  
  // Import Measurements
  const measurements = await readCSV(path.join(dataDir, 'Measurement.csv'));
  console.log(`📏 Importing ${measurements.length} measurements...`);
  
  let importedCount = 0;
  for (const measurement of measurements) {
    try {
      const strapiLabResultId = labResultIdMapping.get(measurement.LabResultID);
      if (!strapiLabResultId) {
        console.warn(`⚠️  No Strapi lab result ID found for: ${measurement.LabResultID}`);
        continue;
      }
      
      await axios.post(`${STRAPI_URL}/api/measurements`, {
        measurementId: measurement.MeasurementID,
        dateTime: measurement.DateTime,
        value: measurement.Value,
        lab_result: strapiLabResultId
      });
      
      importedCount++;
      if (importedCount % 50 === 0) {
        console.log(`📏 Imported ${importedCount}/${measurements.length} measurements...`);
      }
    } catch (error) {
      console.warn(`⚠️  Error importing measurement:`, error.response?.data || error.message);
    }
  }
  
  console.log(`🎉 Import completed for ${patientName}!`);
  console.log(`📊 Final stats:`);
  console.log(`   - CMAS Scores: ${cmasData.length}`);
  console.log(`   - Lab Results: ${Object.keys(labResultIdMapping).length}`);
  console.log(`   - Measurements: ${importedCount}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please provide a patient name');
    console.log('Usage: node generate-mock-patient.js "Patient Name"');
    console.log('Example: node generate-mock-patient.js "John Doe"');
    process.exit(1);
  }
  
  const patientName = args[0];
  
  console.log('🎭 Mock Patient Generator');
  console.log('=' .repeat(50));
  console.log(`Patient Name: ${patientName}`);
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log('=' .repeat(50));
  
  try {
    // Check if Strapi is running
    await axios.get(`${STRAPI_URL}/api/patients`);
    console.log('✅ Strapi connection verified');
    
    const result = await generateMockPatient(patientName);
    
    console.log('');
    console.log('🎉 SUCCESS! Mock patient generated and imported');
    console.log('=' .repeat(50));
    console.log(`Patient: ${result.patientName}`);
    console.log(`Patient ID: ${result.patientId}`);
    console.log(`Data Directory: ${result.outputDir}`);
    console.log(`CMAS Scores: ${result.stats.cmasScores}`);
    console.log(`Lab Results: ${result.stats.labResults}`);
    console.log(`Measurements: ${result.stats.measurements}`);
    console.log('');
    console.log('🌐 You can now view this patient in your application!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure Strapi is running on port 1337');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateMockPatient }; 