const { createAndImportPatient } = require('./create-and-import-patient');

// Predefined patient names for testing
const testPatients = [
  'Emma Thompson',
  'James Wilson', 
  'Sarah Johnson',
  'Michael Brown',
  'Lisa Davis',
  'David Miller',
  'Anna Garcia',
  'Robert Martinez',
  'Jennifer Taylor',
  'Christopher Lee'
];

async function createMultiplePatients(count = 3) {
  console.log('🏥 AUTOMATED BATCH PATIENT CREATION');
  console.log('=' .repeat(50));
  console.log(`📊 Creating ${count} patients with full automation`);
  console.log('');
  
  const selectedPatients = testPatients.slice(0, count);
  const results = [];
  
  for (let i = 0; i < selectedPatients.length; i++) {
    const patientName = selectedPatients[i];
    console.log(`\n🎭 Creating patient ${i + 1}/${selectedPatients.length}: ${patientName}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await createAndImportPatient(patientName);
      results.push({ 
        name: patientName, 
        status: 'success',
        strapiId: result.id,
        labResults: result.labResults,
        measurements: result.measurements,
        cmasScores: result.cmasScores
      });
      
      console.log(`✅ ${patientName} created successfully!`);
      
      // Small delay between patients to avoid overwhelming the API
      if (i < selectedPatients.length - 1) {
        console.log('⏳ Waiting 2 seconds before next patient...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to create ${patientName}:`, error.message);
      results.push({ 
        name: patientName, 
        status: 'failed', 
        error: error.message 
      });
    }
  }
  
  // Final summary
  console.log('\n🎉 BATCH CREATION COMPLETE');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successfully created: ${successful.length} patients`);
  if (successful.length > 0) {
    console.log('\n📊 Success Details:');
    successful.forEach(p => {
      console.log(`   • ${p.name}`);
      console.log(`     - Strapi ID: ${p.strapiId}`);
      console.log(`     - Lab Results: ${p.labResults}`);
      console.log(`     - Measurements: ${p.measurements}`);
      console.log(`     - CMAS Scores: ${p.cmasScores}`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed to create: ${failed.length} patients`);
    failed.forEach(p => console.log(`   • ${p.name}: ${p.error}`));
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Refresh your frontend at http://localhost:3000/patients');
  console.log('   2. You should see all new patients listed');
  console.log('   3. Click on any patient to view their data and graphs');
  console.log('   4. Verify CMAS scores and lab results are properly displayed');
  
  return results;
}

// Main execution
async function main() {
  const count = parseInt(process.argv[2]) || 3;
  
  if (count > testPatients.length) {
    console.log(`❌ Maximum ${testPatients.length} patients available`);
    return;
  }
  
  try {
    await createMultiplePatients(count);
  } catch (error) {
    console.error('❌ Batch creation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createMultiplePatients }; 