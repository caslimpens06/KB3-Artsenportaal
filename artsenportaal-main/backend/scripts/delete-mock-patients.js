const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

// Utility function for Strapi API calls
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
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
    throw error;
  }
}

// Delete directory recursively
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`🗂️  Deleted directory: ${dirPath}`);
  }
}

// Delete a patient and all associated data
async function deletePatient(patientName) {
  console.log(`🗑️  Deleting patient: ${patientName}`);
  
  try {
    // Find the patient
    const patientsResponse = await strapiAPI('patients');
    const patient = patientsResponse.data.find(p => p.name === patientName);
    
    if (!patient) {
      console.log(`❌ Patient "${patientName}" not found in database`);
      return false;
    }
    
    console.log(`👤 Found patient: ${patient.name} (ID: ${patient.id})`);
    
    // Delete CMAS scores
    console.log('🔍 Finding CMAS scores...');
    const cmasResponse = await strapiAPI(`cmas-scores?filters[patient][id][$eq]=${patient.id}&pagination[pageSize]=200`);
    if (cmasResponse.data && cmasResponse.data.length > 0) {
      console.log(`📊 Deleting ${cmasResponse.data.length} CMAS scores...`);
      for (const cmas of cmasResponse.data) {
        await strapiAPI(`cmas-scores/${cmas.documentId}`, 'DELETE');
      }
      console.log(`✅ Deleted ${cmasResponse.data.length} CMAS scores`);
    }
    
    // Delete measurements first (they reference lab results)
    console.log('🔍 Finding measurements...');
    const labResultsResponse = await strapiAPI(`lab-results?filters[patient][id][$eq]=${patient.id}&populate[measurements]=*&pagination[pageSize]=200`);
    let totalMeasurements = 0;
    
    if (labResultsResponse.data && labResultsResponse.data.length > 0) {
      for (const labResult of labResultsResponse.data) {
        if (labResult.measurements && labResult.measurements.length > 0) {
          console.log(`📏 Deleting ${labResult.measurements.length} measurements for ${labResult.resultName}...`);
          for (const measurement of labResult.measurements) {
            await strapiAPI(`measurements/${measurement.documentId}`, 'DELETE');
            totalMeasurements++;
          }
        }
      }
      console.log(`✅ Deleted ${totalMeasurements} measurements`);
    }
    
    // Delete lab results
    if (labResultsResponse.data && labResultsResponse.data.length > 0) {
      console.log(`🧪 Deleting ${labResultsResponse.data.length} lab results...`);
      for (const labResult of labResultsResponse.data) {
        await strapiAPI(`lab-results/${labResult.documentId}`, 'DELETE');
      }
      console.log(`✅ Deleted ${labResultsResponse.data.length} lab results`);
    }
    
    // Finally, delete the patient
    await strapiAPI(`patients/${patient.documentId}`, 'DELETE');
    console.log(`✅ Deleted patient: ${patient.name}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error deleting patient ${patientName}:`, error.message);
    return false;
  }
}

// Delete mock patient CSV files
function deleteMockPatientFiles(patientName) {
  const mockDirName = `mock-${patientName.toLowerCase().replace(/\s+/g, '-')}`;
  const mockDir = path.join(__dirname, `../../PatientData/${mockDirName}`);
  
  if (fs.existsSync(mockDir)) {
    deleteDirectory(mockDir);
    return true;
  } else {
    console.log(`📁 Directory ${mockDir} does not exist`);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🗑️  Mock Patient Deletion Tool');
    console.log('=' .repeat(50));
    console.log('Usage: node delete-mock-patients.js [patient1] [patient2] ...');
    console.log('       node delete-mock-patients.js --all-mock');
    console.log('');
    console.log('Examples:');
    console.log('  node delete-mock-patients.js "Dr. Sarah Johnson"');
    console.log('  node delete-mock-patients.js "Dr. Sarah Johnson" "Prof. Emily Wilson"');
    console.log('  node delete-mock-patients.js --all-mock');
    console.log('');
    console.log('Available mock patients:');
    
    // List mock patient directories
    const patientDataDir = path.join(__dirname, '../../PatientData');
    if (fs.existsSync(patientDataDir)) {
      const dirs = fs.readdirSync(patientDataDir)
        .filter(name => name.startsWith('mock-') && fs.statSync(path.join(patientDataDir, name)).isDirectory())
        .map(name => name.replace('mock-', '').replace(/-/g, ' '));
      
      if (dirs.length > 0) {
        dirs.forEach(dir => console.log(`  - ${dir}`));
      } else {
        console.log('  (No mock patients found)');
      }
    }
    
    process.exit(1);
  }
  
  console.log('🗑️  Mock Patient Deletion Tool');
  console.log('=' .repeat(50));
  
  if (args[0] === '--all-mock') {
    // Delete all mock patients
    console.log('🧹 Deleting ALL mock patients...');
    
    // Find all mock patient directories
    const patientDataDir = path.join(__dirname, '../../PatientData');
    const mockDirs = fs.readdirSync(patientDataDir)
      .filter(name => name.startsWith('mock-') && fs.statSync(path.join(patientDataDir, name)).isDirectory());
    
    // Extract patient names from directory names
    const mockPatientNames = mockDirs.map(dir => 
      dir.replace('mock-', '').split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );
    
    console.log(`Found ${mockPatientNames.length} mock patients to delete:`);
    mockPatientNames.forEach(name => console.log(`  - ${name}`));
    console.log('');
    
    let deletedCount = 0;
    for (const patientName of mockPatientNames) {
      console.log(`\n🗑️  Processing: ${patientName}`);
      const deleted = await deletePatient(patientName);
      deleteMockPatientFiles(patientName);
      if (deleted) deletedCount++;
    }
    
    console.log('');
    console.log('🎉 Cleanup completed!');
    console.log(`✅ Deleted ${deletedCount}/${mockPatientNames.length} patients from database`);
    console.log(`🗂️  Deleted ${mockDirs.length} mock patient directories`);
    
  } else {
    // Delete specific patients
    const patientNames = args;
    console.log(`Deleting ${patientNames.length} patient(s):`);
    patientNames.forEach(name => console.log(`  - ${name}`));
    console.log('');
    
    let deletedCount = 0;
    for (const patientName of patientNames) {
      console.log(`\n🗑️  Processing: ${patientName}`);
      const deleted = await deletePatient(patientName);
      deleteMockPatientFiles(patientName);
      if (deleted) deletedCount++;
    }
    
    console.log('');
    console.log('🎉 Deletion completed!');
    console.log(`✅ Deleted ${deletedCount}/${patientNames.length} patients from database`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { deletePatient, deleteMockPatientFiles }; 