const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

// Base path for the CSV files
const CSV_BASE_PATH = path.resolve(__dirname, '../../PatientData/patientxD');
const OUTPUT_PATH = path.resolve(__dirname, '../../PatientData/strapi-import');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Read a CSV file
function readCSV(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({
        separator: options.delimiter || ',',
        skipLines: 0,
        headers: true,
        trim: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Successfully read ${results.length} records from ${path.basename(filePath)}`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file ${filePath}:`, error);
        reject(error);
      });
  });
}

// Write data to a CSV file
function writeCSV(data, fileName) {
  if (!data || data.length === 0) {
    console.log(`No data to write for ${fileName}`);
    return;
  }

  const csvData = parse(data);
  const outputPath = path.join(OUTPUT_PATH, fileName);
  fs.writeFileSync(outputPath, csvData);
  console.log(`Wrote ${data.length} records to ${outputPath}`);
}

// Prepare Patient data
async function preparePatientData() {
  try {
    const patientData = [
      {
        name: 'Patient X',
        publishedAt: new Date().toISOString(),
      }
    ];
    
    writeCSV(patientData, 'patients.csv');
  } catch (error) {
    console.error('Error preparing patient data:', error);
  }
}

// Prepare CMAS data
async function prepareCMASData() {
  try {
    const filePath = path.join(CSV_BASE_PATH, 'CMAS.csv');
    const cmasData = await readCSV(filePath);
    
    // Transform the data for Strapi import
    const transformedData = cmasData.map(item => {
      const scoreDate = new Date(item.Date);
      const category = item.Category === '>10' ? 'Score >10,' : 'Score 4-9';
      
      return {
        date: scoreDate.toISOString().split('T')[0],
        score: parseInt(item.Score, 10),
        category,
        patient: 'Patient X', // Reference by name
        publishedAt: new Date().toISOString()
      };
    });
    
    writeCSV(transformedData, 'cmas_scores.csv');
  } catch (error) {
    console.error('Error preparing CMAS data:', error);
  }
}

// Prepare Lab Result Group data
async function prepareLabResultGroupData() {
  try {
    const filePath = path.join(CSV_BASE_PATH, 'LabResultGroup.csv');
    const groupData = await readCSV(filePath);
    
    // Transform the data for Strapi import
    const transformedData = groupData.map(item => {
      return {
        groupName: item.GroupName,
        originalId: item.LabResultGroupID, // Keep track of the original ID
        publishedAt: new Date().toISOString()
      };
    });
    
    writeCSV(transformedData, 'lab_result_groups.csv');
    
    // Return a mapping of original IDs to names for reference
    return transformedData.reduce((map, item) => {
      map[item.originalId] = item.groupName;
      return map;
    }, {});
  } catch (error) {
    console.error('Error preparing lab result group data:', error);
    return {};
  }
}

// Prepare Lab Result data
async function prepareLabResultData(groupIdToName) {
  try {
    const filePath = path.join(CSV_BASE_PATH, 'LabResult.csv');
    const resultData = await readCSV(filePath);
    
    // Transform the data for Strapi import
    const transformedData = resultData.map(item => {
      return {
        resultName: item.ResultName,
        unit: item.Unit || '',
        originalId: item.LabResultID, // Keep track of the original ID
        patient: 'Patient X', // Reference by name
        lab_result_group: groupIdToName[item.LabResultGroupID] || '', // Reference by name
        publishedAt: new Date().toISOString()
      };
    });
    
    writeCSV(transformedData, 'lab_results.csv');
    
    // Return a mapping of original IDs to names for reference
    return transformedData.reduce((map, item) => {
      map[item.originalId] = item.resultName;
      return map;
    }, {});
  } catch (error) {
    console.error('Error preparing lab result data:', error);
    return {};
  }
}

// Helper function to format date
function formatDate(dateStr) {
  try {
    // Handle different date formats (dd-mm-yyyyHH:MM or dd-mm-yyyy)
    const parts = dateStr.split(/[-\s:]/);
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
      
      const date = new Date(year, month, day, hour, minute);
      return date.toISOString();
    }
    
    return new Date().toISOString();
  } catch (error) {
    console.error(`Error parsing date ${dateStr}:`, error);
    return new Date().toISOString();
  }
}

// Prepare Measurement data
async function prepareMeasurementData(labResultIdToName) {
  try {
    const filePath = path.join(CSV_BASE_PATH, 'Measurement.csv');
    const measurementData = await readCSV(filePath);
    
    // Filter out invalid or non-numeric values
    const validMeasurements = measurementData.filter(item => {
      const value = item.Value;
      if (!value) return false;
      
      return value !== '<Memo>' && 
             value !== 'neg' && 
             value !== 'Geen' && 
             value !== 'Serum' && 
             !value.includes && !value.includes('/');
    });
    
    // Transform the data for Strapi import
    const transformedData = validMeasurements.map(item => {
      const dateTime = formatDate(item.DateTime || '');
      const value = item.Value ? item.Value.replace('<', '').trim() : '';
      
      return {
        value,
        dateTime,
        lab_result: (item.LabResultID && labResultIdToName[item.LabResultID]) || '', // Reference by name
        publishedAt: new Date().toISOString()
      };
    });
    
    writeCSV(transformedData, 'measurements.csv');
  } catch (error) {
    console.error('Error preparing measurement data:', error);
  }
}

// Main function to run all preparations
async function prepareAllData() {
  try {
    console.log('Starting data preparation for Strapi CSV import...');
    
    // Step 1: Prepare Patient data
    await preparePatientData();
    
    // Step 2: Prepare Lab Result Group data
    const groupIdToName = await prepareLabResultGroupData();
    
    // Step 3: Prepare Lab Result data
    const labResultIdToName = await prepareLabResultData(groupIdToName);
    
    // Step 4: Prepare Measurement data
    await prepareMeasurementData(labResultIdToName);
    
    // Step 5: Prepare CMAS data
    await prepareCMASData();
    
    console.log('Data preparation completed successfully!');
    console.log(`CSV files have been written to: ${OUTPUT_PATH}`);
    console.log('You can now import these files using the Strapi admin UI.');
  } catch (error) {
    console.error('Data preparation failed:', error);
  }
}

// Execute the preparation
prepareAllData(); 