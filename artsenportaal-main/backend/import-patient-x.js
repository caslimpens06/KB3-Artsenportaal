const axios = require('axios');
const fs = require('fs');
const path = require('path');

const strapiURL = 'http://localhost:1337';

async function createPatientX() {
  try {
    console.log('Creating Patient X...');
    const patientResponse = await axios.post(`${strapiURL}/api/patients`, {
      data: {
        name: 'Patient X',
        publishedAt: new Date()
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (patientResponse.data && patientResponse.data.data) {
      console.log(`Patient X created with ID: ${patientResponse.data.data.id}`);
      return patientResponse.data.data;
    } else {
      throw new Error('Failed to create patient');
    }
  } catch (error) {
    console.error('Error creating Patient X:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    throw error;
  }
}

async function importCMASScores(patientId) {
  console.log(`Importing CMAS scores for Patient X (ID: ${patientId})...`);
  try {
    // Use absolute path for the CMAS.csv file
    const filePath = path.resolve(__dirname, '../PatientData/CMAS.csv');
    console.log('Reading CMAS data from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`CMAS file not found at: ${filePath}`);
      return;
    }
    
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File content first 100 chars:', fileContent.substring(0, 100));
    
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // First line contains dates
    const headers = lines[0].split(';');
    const dates = headers.filter((date, index) => index > 0 && date.trim() !== '');
    
    // Find score lines
    const highScoreLine = lines.find(line => line.includes('CMAS Score > 10'));
    const lowScoreLine = lines.find(line => line.includes('CMAS Score 4-9'));
    
    if (!highScoreLine && !lowScoreLine) {
      console.error('Could not find CMAS score lines in the CSV file');
      return;
    }
    
    const highScores = highScoreLine ? highScoreLine.split(';') : [];
    const lowScores = lowScoreLine ? lowScoreLine.split(';') : [];
    
    // Keep track of imported scores
    const importedScores = [];
    
    // Import scores for each date
    for (let i = 1; i < headers.length; i++) {
      const date = headers[i];
      if (!date || date.trim() === '') continue;
      
      try {
        // Parse the date from DD-MM-YYYY format
        const [day, month, year] = date.split('-');
        const scoreDate = new Date(`${year}-${month}-${day}`);
        
        // Check for high score first
        let scoreValue = null;
        let scoreType = null;
        
        if (highScores[i] && highScores[i].trim() !== '' && !isNaN(parseInt(highScores[i]))) {
          scoreValue = parseInt(highScores[i]);
          scoreType = 'high';
        } 
        // Then check for low score if high score is not available
        else if (lowScores[i] && lowScores[i].trim() !== '' && !isNaN(parseInt(lowScores[i]))) {
          scoreValue = parseInt(lowScores[i]);
          scoreType = 'low';
        }
        
        if (scoreValue !== null && !isNaN(scoreDate)) {
          console.log(`Creating ${scoreType} CMAS score: ${scoreValue} on ${scoreDate.toISOString()} (${date})`);
          
          try {
            const response = await axios.post(`${strapiURL}/api/cmas-scores`, {
              data: {
                scoreDate: scoreDate.toISOString(),
                score: scoreValue,
                patient: patientId,
                publishedAt: new Date()
              }
            }, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            importedScores.push({
              id: response.data.data.id,
              date: scoreDate.toISOString(),
              originalDate: date,
              score: scoreValue,
              type: scoreType
            });
          } catch (postError) {
            console.error(`Error posting CMAS score: ${postError.message}`);
            if (postError.response) {
              console.error('API response:', postError.response.data);
            }
          }
        }
      } catch (err) {
        console.error(`Error creating CMAS score for date ${date}:`, err.message);
      }
    }
    
    console.log(`CMAS scores import completed! ${importedScores.length} scores imported.`);
    console.log(`- High scores (>10): ${importedScores.filter(s => s.type === 'high').length}`);
    console.log(`- Low scores (4-9): ${importedScores.filter(s => s.type === 'low').length}`);
    
    return importedScores;
  } catch (error) {
    console.error('Error importing CMAS scores:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const patient = await createPatientX();
    const scores = await importCMASScores(patient.id);
    console.log(`Successfully imported ${scores.length} CMAS scores for Patient X (ID: ${patient.id})`);
  } catch (error) {
    console.error('Failed to import data:', error.message);
  }
}

main(); 