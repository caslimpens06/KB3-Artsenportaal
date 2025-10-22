const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Enhanced randomization function with better debugging
function randomizeValue(value, percentage = 20) {
  const originalValue = value;
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    console.log(`⚠️  Non-numeric value skipped: "${value}"`);
    return value; // Return original if not a number
  }
  
  // Generate a random variation between -percentage and +percentage
  const variation = (Math.random() - 0.5) * 2 * (percentage / 100);
  const newValue = num * (1 + variation);
  
  // Keep same decimal places as original
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  const result = decimalPlaces > 0 ? newValue.toFixed(decimalPlaces) : Math.round(newValue).toString();
  
  console.log(`🎲 Randomized: ${originalValue} -> ${result} (${(variation * 100).toFixed(1)}% change)`);
  return result;
}

// Enhanced date randomization with better debugging
function randomizeDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return dateString;
  }
  
  const originalDate = dateString;
  
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
      console.log(`⚠️  Invalid date skipped: "${dateString}"`);
      return dateString; // Return original if invalid
    }
    
    // Shift by ±6 months (random)
    const monthsShift = (Math.random() - 0.5) * 12; // ±6 months
    date.setMonth(date.getMonth() + monthsShift);
    
    // Format back to original format
    let result;
    if (dateString.includes(':')) {
      // Include time
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      result = `${day}-${month}-${year}${hours}:${minutes}`;
    } else {
      // Date only
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      result = `${day}-${month}-${year}`;
    }
    
    console.log(`📅 Date shifted: ${originalDate} -> ${result} (${monthsShift.toFixed(1)} months)`);
    return result;
    
  } catch (error) {
    console.log(`⚠️  Error processing date "${dateString}":`, error.message);
    return dateString;
  }
}

// Read CSV file with better error handling
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (data) => {
        // Clean up data - remove any undefined or malformed entries
        const cleanData = {};
        Object.keys(data).forEach(key => {
          if (key && key.trim() !== '') {
            cleanData[key.trim()] = data[key] || '';
          }
        });
        results.push(cleanData);
      })
      .on('error', (error) => {
        console.warn(`⚠️  Error reading CSV line: ${error.message}`);
        errors.push(error);
      })
      .on('end', () => {
        console.log(`✅ Read ${results.length} records from ${path.basename(filePath)}`);
        if (errors.length > 0) {
          console.log(`⚠️  ${errors.length} lines had errors and were skipped`);
        }
        resolve(results);
      });
  });
}

// Write CSV file
async function writeCSV(filePath, data, headers) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
  console.log(`✅ Wrote ${data.length} records to ${path.basename(filePath)}`);
}

// Generate mock patient data with improved randomization
async function generateMockPatient(patientName) {
  console.log(`🎭 Generating mock patient: ${patientName}`);
  console.log('🎲 Enhanced randomization with debugging enabled');
  
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
  
  // Statistics for randomization
  let randomizedValues = 0;
  let randomizedDates = 0;
  let totalValues = 0;
  let totalDates = 0;
  
  try {
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
    const newLabResults = originalLabResults
      .filter(result => result.LabResultID && result.LabResultID.trim() !== '') // Filter out malformed entries
      .map(result => {
        const newLabResultId = uuidv4();
        labResultIdMapping.set(result.LabResultID, newLabResultId);
        
        return {
          LabResultID: newLabResultId,
          LabResultGroupID: result.LabResultGroupID || '', // Keep same group
          PatientID: newPatientId, // Assign to new patient
          ResultName: result.ResultName || '',
          Unit: result.Unit || ''
        };
      });
    await writeCSV(path.join(outputDir, 'LabResult.csv'), newLabResults, ['LabResultID', 'LabResultGroupID', 'PatientID', 'ResultName', 'Unit']);
    
    // 4. Process CMAS.csv (randomize scores and dates)
    console.log('📝 Processing CMAS.csv...');
    console.log('🎲 Randomizing CMAS scores and dates...');
    const originalCMAS = await readCSV(path.join(sourceDir, 'CMAS.csv'));
    const newCMAS = originalCMAS
      .filter(cmas => cmas.PatientID && cmas.Date && cmas.Score) // Filter valid entries
      .map((cmas, index) => {
        console.log(`\n📊 Processing CMAS score ${index + 1}/${originalCMAS.length}:`);
        totalValues++;
        totalDates++;
        
        const randomizedScore = randomizeValue(cmas.Score, 15); // ±15% for CMAS scores
        const randomizedDate = randomizeDate(cmas.Date);
        
        if (randomizedScore !== cmas.Score) randomizedValues++;
        if (randomizedDate !== cmas.Date) randomizedDates++;
        
        return {
          PatientID: newPatientId,
          Date: randomizedDate,
          Score: randomizedScore,
          Category: cmas.Category || ''
        };
      });
    await writeCSV(path.join(outputDir, 'CMAS.csv'), newCMAS, ['PatientID', 'Date', 'Score', 'Category']);
    
    // 5. Process Measurement.csv (randomize values and dates, map lab result IDs)
    console.log('📝 Processing Measurement.csv...');
    console.log('🎲 Randomizing measurement values and dates...');
    const originalMeasurements = await readCSV(path.join(sourceDir, 'Measurement.csv'));
    const newMeasurements = originalMeasurements
      .filter(measurement => measurement.MeasurementID && measurement.LabResultID) // Filter valid entries
      .map((measurement, index) => {
        const newMeasurementId = uuidv4();
        measurementIdMapping.set(measurement.MeasurementID, newMeasurementId);
        
        const newLabResultId = labResultIdMapping.get(measurement.LabResultID);
        if (!newLabResultId) {
          console.log(`⚠️  Skipping measurement with unmapped LabResultID: ${measurement.LabResultID}`);
          return null;
        }
        
        console.log(`\n📏 Processing measurement ${index + 1}/${originalMeasurements.length}:`);
        console.log(`    Lab Result: ${measurement.LabResultID}`);
        console.log(`    Original Value: "${measurement.Value}"`);
        
        let newValue = measurement.Value || '';
        totalValues++;
        totalDates++;
        
        // Check if we should randomize this value
        const shouldRandomize = newValue && 
            !newValue.includes('neg') && 
            !newValue.includes('Geen') && 
            !newValue.includes('<Memo>') &&
            !newValue.includes('Serum') &&
            !newValue.includes('JDM') &&
            !newValue.includes('Pos') &&
            !newValue.includes('Grenswaardig') &&
            !newValue.includes('Naso') &&
            newValue.trim() !== '';
        
        if (shouldRandomize) {
          // Check if it's a number (possibly with < or > prefix)
          const numCheck = newValue.replace(/^[<>]/, '');
          if (!isNaN(parseFloat(numCheck))) {
            const originalValue = newValue;
            // Handle values with < or > prefixes
            if (newValue.startsWith('<') || newValue.startsWith('>')) {
              const prefix = newValue.charAt(0);
              const numValue = newValue.substring(1);
              newValue = prefix + randomizeValue(numValue, 20);
            } else {
              newValue = randomizeValue(newValue, 20);
            }
            if (newValue !== originalValue) randomizedValues++;
          } else {
            console.log(`    ⚠️  Skipped (not numeric): "${newValue}"`);
          }
        } else {
          console.log(`    ⚠️  Skipped (non-randomizable): "${newValue}"`);
        }
        
        const randomizedDateTime = randomizeDate(measurement.DateTime);
        if (randomizedDateTime !== measurement.DateTime) randomizedDates++;
        
        return {
          MeasurementID: newMeasurementId,
          LabResultID: newLabResultId,
          DateTime: randomizedDateTime,
          Value: newValue
        };
      })
      .filter(measurement => measurement !== null); // Remove null entries
    
    await writeCSV(path.join(outputDir, 'Measurement.csv'), newMeasurements, ['MeasurementID', 'LabResultID', 'DateTime', 'Value']);
    
    console.log('');
    console.log('🎉 SUCCESS! Mock patient data generated with proper randomization');
    console.log('=' .repeat(60));
    console.log(`Patient: ${patientName}`);
    console.log(`Patient ID: ${newPatientId}`);
    console.log(`Data Directory: ${outputDir}`);
    console.log('');
    console.log('📊 Randomization Statistics:');
    console.log(`   Values randomized: ${randomizedValues}/${totalValues} (${((randomizedValues/totalValues)*100).toFixed(1)}%)`);
    console.log(`   Dates randomized: ${randomizedDates}/${totalDates} (${((randomizedDates/totalDates)*100).toFixed(1)}%)`);
    console.log('');
    console.log('📁 Generated Files:');
    console.log(`   CMAS Scores: ${newCMAS.length}`);
    console.log(`   Lab Results: ${newLabResults.length}`);
    console.log(`   Measurements: ${newMeasurements.length}`);
    
    return {
      patientId: newPatientId,
      patientName,
      outputDir,
      stats: {
        cmasScores: newCMAS.length,
        labResults: newLabResults.length,
        measurements: newMeasurements.length,
        randomizedValues,
        randomizedDates,
        totalValues,
        totalDates
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating mock patient:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please provide a patient name');
    console.log('Usage: node generate-mock-patient-improved.js "Patient Name"');
    console.log('Example: node generate-mock-patient-improved.js "Dr. John Smith"');
    process.exit(1);
  }
  
  const patientName = args[0];
  
  console.log('🎭 Enhanced Mock Patient Data Generator');
  console.log('=' .repeat(50));
  console.log(`Patient Name: ${patientName}`);
  console.log('🎲 Features: Proper randomization with debugging');
  console.log('=' .repeat(50));
  
  try {
    const result = await generateMockPatient(patientName);
    
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Import to Strapi:');
    console.log(`      node ../import-patientxd-data.js "${result.outputDir.replace(/\\/g, '/')}"`);
    console.log('   2. Or use the all-in-one script:');
    console.log(`      node ../create-mock-patient.js "${patientName}"`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateMockPatient }; 