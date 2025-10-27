const { createRandomizedPatient } = require('./create-randomized-patient');

// Predefined patient names for quick testing
const patientNames = [
  'Emma Thompson',
  'James Wilson', 
  'Sarah Johnson',
  'Michael Brown',
  'Lisa Davis',
  'David Miller',
  'Anna Garcia',
  'Robert Martinez'
];

async function createMultiplePatients(count = 3) {
  console.log('🏥 Creating Multiple Test Patients');
  console.log('━'.repeat(50));
  console.log(`📊 Will create ${count} patients for testing`);
  console.log('');
  
  const selectedPatients = patientNames.slice(0, count);
  const results = [];
  
  for (let i = 0; i < selectedPatients.length; i++) {
    const patientName = selectedPatients[i];
    console.log(`\n🎭 Creating patient ${i + 1}/${selectedPatients.length}: ${patientName}`);
    console.log('─'.repeat(30));
    
    try {
      await createRandomizedPatient(patientName);
      results.push({ name: patientName, status: 'success' });
      console.log(`✅ ${patientName} created successfully`);
      
      // Small delay between patients to avoid overwhelming the API
      if (i < selectedPatients.length - 1) {
        console.log('⏳ Waiting 2 seconds before next patient...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to create ${patientName}:`, error.message);
      results.push({ name: patientName, status: 'failed', error: error.message });
    }
  }
  
  // Summary
  console.log('\n🎉 BATCH CREATION COMPLETE');
  console.log('━'.repeat(50));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successfully created: ${successful.length} patients`);
  if (successful.length > 0) {
    successful.forEach(p => console.log(`   • ${p.name}`));
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed to create: ${failed.length} patients`);
    failed.forEach(p => console.log(`   • ${p.name}: ${p.error}`));
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh your frontend to see all new patients');
  console.log('   2. Test patient selection with multiple options');
  console.log('   3. Compare data between different patients');
  console.log('   4. Test multi-patient views and analysis');
  
  return results;
}

// Command line argument parsing
const args = process.argv.slice(2);
const count = args[0] ? parseInt(args[0]) : 3;

if (isNaN(count) || count < 1 || count > patientNames.length) {
  console.log(`❌ Invalid count. Please provide a number between 1 and ${patientNames.length}`);
  console.log(`Usage: node create-multiple-patients.js [count]`);
  console.log(`Available patient names: ${patientNames.join(', ')}`);
  process.exit(1);
}

// Run if called directly
if (require.main === module) {
  createMultiplePatients(count)
    .then(results => {
      console.log('\n✨ All done! Check your frontend for the new patients.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Batch creation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createMultiplePatients, patientNames }; 