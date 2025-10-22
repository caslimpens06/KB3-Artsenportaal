# Patient Management Commands

## Creating New Patients

### Quick Patient Creation

```bash
cd backend
node scripts/create-and-import-patient.js "Patient Name"
```

### Interactive Patient Creation

```bash
cd backend
node scripts/create-and-import-patient.js
```

## Deleting Patients

### Delete Single Patient

```bash
cd backend
node scripts/delete-mock-patients.js "Patient Name"
```

### Delete Multiple Patients

```bash
cd backend
node scripts/delete-mock-patients.js "Patient 1" "Patient 2" "Patient 3"
```

## Viewing Current Patients

### List All Patients

```bash
cd backend
node -e "
const axios = require('axios');
axios.get('http://localhost:1337/api/patients')
  .then(r => r.data.data.forEach((p, i) => console.log(\`\${i+1}. \${p.name} (ID: \${p.patientId})\`)))
  .catch(e => console.error('Error:', e.message));
"
```

## Notes

- Replace "Patient Name" with the actual name you want to use
- Patient names with spaces should be enclosed in quotes
- Make sure Strapi is running on port 1337 before running any commands
- New patients will appear in the frontend after refreshing the page
