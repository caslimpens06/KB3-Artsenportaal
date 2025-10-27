const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'bfb52bb71af40caab8fd332a857f9ec19455ba436c918b93e7673f9f760a3306e1179a572bd26e4e3758f4ba0231f59acbefba796695fda0da675e04a0aaf241c206faad399f4c6bbe947b6a97eb5601de4654e21bc509e798393ae24ec0ab5e2587d9fc3694c515e2cab02c69dc929cf15374b5dc78c49386aafa9c4f13780d';

async function checkSystem() {
  console.log('🔍 Patient Creation System Status Check');
  console.log('━'.repeat(50));
  
  let allGood = true;
  
  // 1. Check Node.js version
  console.log(`📦 Node.js version: ${process.version}`);
  
  // 2. Check file system
  console.log('\n📁 File System Check:');
  const templateDir = path.join(__dirname, '../../PatientData/patientxD');
  const scripts = [
    'create-randomized-patient.js',
    'create-multiple-patients.js'
  ];
  
  if (fs.existsSync(templateDir)) {
    console.log('✅ Template data directory exists');
    
    // Check template files
    const templateFiles = ['Patient.csv', 'CMAS.csv', 'Measurement.csv', 'LabResult.csv', 'LabResultGroup.csv'];
    templateFiles.forEach(file => {
      const filePath = path.join(templateDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ Template file: ${file}`);
      } else {
        console.log(`❌ Missing template file: ${file}`);
        allGood = false;
      }
    });
  } else {
    console.log('❌ Template data directory missing');
    allGood = false;
  }
  
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
      allGood = false;
    }
  });
  
  // 3. Check dependencies
  console.log('\n📦 Dependencies Check:');
  const requiredDeps = ['axios', 'csv-writer', 'uuid'];
  const packagePath = path.join(__dirname, '../package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        console.log(`✅ Dependency: ${dep} (${packageJson.dependencies[dep]})`);
      } else {
        console.log(`❌ Missing dependency: ${dep}`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log('❌ Could not read package.json');
    allGood = false;
  }
  
  // 4. Check Strapi connection
  console.log('\n🔌 Strapi Connection Check:');
  try {
    const response = await axios.get(`${STRAPI_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Strapi connection successful');
    console.log(`📊 Found ${response.data.data?.length || 0} patients in database`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n👥 Current patients:');
      response.data.data.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (ID: ${patient.patientId || 'N/A'})`);
      });
    }
  } catch (error) {
    console.log('❌ Could not connect to Strapi');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure Strapi is running: npm run develop');
    allGood = false;
  }
  
  // 5. Final status
  console.log('\n🎯 System Status:');
  if (allGood) {
    console.log('✅ ALL SYSTEMS GO! Ready to create patients.');
    console.log('\n🚀 Quick start:');
    console.log('   • Single patient: node create-randomized-patient.js');
    console.log('   • Multiple patients: node create-multiple-patients.js 3');
  } else {
    console.log('❌ Some issues found. Please fix them before proceeding.');
    console.log('\n🛠️  Common fixes:');
    console.log('   • Start Strapi: cd ../.. && npm run develop');
    console.log('   • Install dependencies: npm install');
    console.log('   • Check template data in PatientData/patientxD/');
  }
  
  return allGood;
}

// Run if called directly
if (require.main === module) {
  checkSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 System check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkSystem }; 