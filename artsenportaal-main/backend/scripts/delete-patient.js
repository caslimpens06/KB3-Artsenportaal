const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

// Strapi API helper
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
    console.error(`API Error: ${error.response?.data?.error?.message || error.message}`);
    throw error;
  }
}

// Delete directory
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`🗂️  Deleted directory: ${dirPath}`);
  }
}

// Delete a patient and all their data
async function deletePatient(patientName) {
  console.log(`🗑️  Deleting patient: ${patientName}`);
  
  try {
    // Find the patient
    const patientsResponse = await strapiAPI('patients');
    const patient = patientsResponse.data.find(p => p.name === patientName);
    
    if (!patient) {
      console.log(`❌ Patient "${patientName}" not found`);
      return false;
    }
    
    console.log(`👤 Found patient: ${patient.name} (ID: ${patient.id})`);
    
    // Delete CMAS scores
    console.log('🔍 Deleting CMAS scores...');
    const cmasResponse = await strapiAPI(`cmas-scores?filters[patient][id][$eq]=${patient.id}&pagination[pageSize]=200`);
    if (cmasResponse.data && cmasResponse.data.length > 0) {
      for (const cmas of cmasResponse.data) {
        await strapiAPI(`cmas-scores/${cmas.documentId}`, 'DELETE');
      }
      console.log(`✅ Deleted ${cmasResponse.data.length} CMAS scores`);
    }
    
    // Delete measurements first, then lab results
    console.log('🔍 Deleting measurements and lab results...');
    const labResultsResponse = await strapiAPI(`lab-results?filters[patient][id][$eq]=${patient.id}&populate[measurements]=*&pagination[pageSize]=200`);
    let totalMeasurements = 0;
    
    if (labResultsResponse.data && labResultsResponse.data.length > 0) {
      for (const labResult of labResultsResponse.data) {
        if (labResult.measurements && labResult.measurements.length > 0) {
          for (const measurement of labResult.measurements) {
            await strapiAPI(`measurements/${measurement.documentId}`, 'DELETE');
            totalMeasurements++;
          }
        }
        // Delete the lab result itself
        await strapiAPI(`lab-results/${labResult.documentId}`, 'DELETE');
      }
      console.log(`✅ Deleted ${totalMeasurements} measurements and ${labResultsResponse.data.length} lab results`);
    }
    
    // Finally, delete the patient
    await strapiAPI(`patients/${patient.documentId}`, 'DELETE');
    console.log(`✅ Deleted patient: ${patient.name}`);
    
    // Delete the mock directory if it exists
    const mockDirName = `mock-${patientName.toLowerCase().replace(/\s+/g, '-')}`;
    const mockDir = path.join(__dirname, `../../PatientData/${mockDirName}`);
    deleteDirectory(mockDir);
    
    console.log('🎉 SUCCESS! Patient and all data deleted');
    console.log('💡 Refresh your frontend to see the changes');
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error deleting patient ${patientName}:`, error.message);
    return false;
  }
}

// Delete all mock patients (keeps Patient X)
async function deleteAllMockPatients() {
  console.log('🧹 Deleting ALL mock patients (keeping Patient X)...');
  
  try {
    const patientsResponse = await strapiAPI('patients');
    const mockPatients = patientsResponse.data.filter(p => p.name !== 'Patient X');
    
    console.log(`Found ${mockPatients.length} mock patients to delete:`);
    mockPatients.forEach(p => console.log(`  - ${p.name}`));
    
    let deletedCount = 0;
    for (const patient of mockPatients) {
      const deleted = await deletePatient(patient.name);
      if (deleted) deletedCount++;
    }
    
    console.log(`\n🎉 Deleted ${deletedCount}/${mockPatients.length} mock patients`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please provide a patient name or use --all');
    console.log('Usage:');
    console.log('  node delete-patient.js "Dr. John Smith"');
    console.log('  node delete-patient.js --all');
    process.exit(1);
  }
  
  if (args[0] === '--all') {
    await deleteAllMockPatients();
  } else {
    const patientName = args[0];
    await deletePatient(patientName);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });
} 