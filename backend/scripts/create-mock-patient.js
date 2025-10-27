const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

async function createMockPatient(patientName) {
  console.log(`🎭 Creating Mock Patient: ${patientName}`);
  console.log('🎲 Using enhanced randomization for realistic data variation');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Generate mock patient data with improved randomization
    console.log('📊 Step 1: Generating mock patient data with proper randomization...');
    const generateCommand = `node generate-mock-patient-improved.js "${patientName}"`;
    const { stdout: generateOutput, stderr: generateError } = await execPromise(generateCommand);
    
    if (generateError) {
      console.error('❌ Error during data generation:', generateError);
    }
    
    // Extract stats from output for summary
    const outputLines = generateOutput.split('\n');
    let randomizedValues = 'Unknown';
    let randomizedDates = 'Unknown';
    
    for (const line of outputLines) {
      if (line.includes('Values randomized:')) {
        randomizedValues = line.split('Values randomized: ')[1];
      }
      if (line.includes('Dates randomized:')) {
        randomizedDates = line.split('Dates randomized: ')[1];
      }
    }
    
    // Step 2: Import the generated data to Strapi
    console.log('📤 Step 2: Importing data to Strapi...');
    const mockDir = `PatientData/mock-${patientName.toLowerCase().replace(/\s+/g, '-')}`;
    const importCommand = `node import-patientxd-data.js "${mockDir}"`;
    const { stdout: importOutput, stderr: importError } = await execPromise(importCommand);
    
    if (importError) {
      console.error('⚠️  Some import warnings occurred:', importError);
    }
    
    // Extract success info from import output
    let importedCMAS = 'Unknown';
    let importedMeasurements = 'Unknown';
    
    const importLines = importOutput.split('\n');
    for (const line of importLines) {
      if (line.includes('Created') && line.includes('CMAS scores')) {
        const match = line.match(/Created (\d+) CMAS scores/);
        if (match) importedCMAS = match[1];
      }
      if (line.includes('Created') && line.includes('measurements')) {
        const match = line.match(/Created (\d+) new measurements/);
        if (match) importedMeasurements = match[1];
      }
    }
    
    console.log('');
    console.log('🎉 SUCCESS! Mock patient created and imported to Strapi');
    console.log('=' .repeat(60));
    console.log(`👤 Patient Name: ${patientName}`);
    console.log('');
    console.log('📊 Randomization Results:');
    console.log(`   🎲 Values: ${randomizedValues}`);
    console.log(`   📅 Dates: ${randomizedDates}`);
    console.log('');
    console.log('💾 Import Results:');
    console.log(`   📊 CMAS Scores: ${importedCMAS} imported`);
    console.log(`   📏 Measurements: ${importedMeasurements} imported`);
    console.log('');
    console.log('🌐 Next steps:');
    console.log('   1. Refresh your frontend page (F5)');
    console.log('   2. Click the "Refresh" button next to patient selection');
    console.log('   3. Select the new patient to view their randomized data');
    console.log('   4. Compare measurements across different patients');
    console.log('');
    console.log('🔧 Management commands:');
    console.log(`   Delete this patient: node delete-mock-patients.js "${patientName}"`);
    console.log('   Delete all mock patients: node delete-mock-patients.js --all-mock');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating mock patient:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎭 Enhanced Mock Patient Creator');
    console.log('=' .repeat(50));
    console.log('❌ Please provide a patient name');
    console.log('Usage: node create-mock-patient.js "Patient Name"');
    console.log('');
    console.log('✨ Features:');
    console.log('   • Proper data randomization (±15% for CMAS, ±20% for lab values)');
    console.log('   • Date shifting (±6 months) for realistic timelines');
    console.log('   • Automatic Strapi import');
    console.log('   • Comprehensive statistics');
    console.log('');
    console.log('Examples:');
    console.log('  node create-mock-patient.js "Dr. John Smith"');
    console.log('  node create-mock-patient.js "Maria Rodriguez"');
    console.log('  node create-mock-patient.js "Prof. Alice Chen"');
    console.log('');
    console.log('🗑️  Management:');
    console.log('  node delete-mock-patients.js "Dr. John Smith"  # Delete specific patient');
    console.log('  node delete-mock-patients.js --all-mock       # Delete all mock patients');
    process.exit(1);
  }
  
  const patientName = args[0];
  
  // Check if Strapi is running first
  try {
    await execPromise('curl -s http://localhost:1337/api/patients > /dev/null');
  } catch (error) {
    console.log('❌ Strapi server is not running on port 1337');
    console.log('💡 Please start Strapi first:');
    console.log('   cd backend && npm run develop');
    process.exit(1);
  }
  
  await createMockPatient(patientName);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { createMockPatient }; 