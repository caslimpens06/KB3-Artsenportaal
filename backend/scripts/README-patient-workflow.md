# Patient Workflow Setup Guide

This guide ensures that the mock patient creation workflow works flawlessly from backend generation to frontend display.

## 🔧 Prerequisites

1. **Strapi Server Running**

   ```bash
   cd backend
   npm run develop
   ```

   - Should be accessible at http://localhost:1337
   - Admin panel at http://localhost:1337/admin

2. **Frontend Server Running**
   ```bash
   cd frontend
   npm start
   ```
   - Should be accessible at http://localhost:3000

## 🔍 Validation & Testing

### Step 1: Validate the Workflow

Run this to ensure everything is properly connected:

```bash
cd backend/scripts
node validate-patient-workflow.js
```

This test will:

- ✅ Check Strapi connectivity
- ✅ Verify API endpoints work
- ✅ Test patient creation/deletion
- ✅ Validate frontend compatibility
- ✅ Confirm data structure mapping

### Step 2: Test Basic Patient Creation

```bash
node test-patient-creation.js
```

This will show you current patients and test the API.

## 🎭 Creating Mock Patients

### Method 1: Quick Creation (Recommended)

```bash
cd backend/scripts
node create-mock-patient.js "Dr. John Smith"
```

This single command:

1. 🎲 Generates randomized medical data
2. 📤 Imports to Strapi automatically
3. ✅ Makes it visible in frontend immediately

### Method 2: Step-by-Step

```bash
# 1. Generate data only
node generate-mock-patient-improved.js "Dr. Jane Doe"

# 2. Import to Strapi
node import-patientxd-data.js "PatientData/mock-dr-jane-doe"
```

## 🖥️ Frontend Integration

### Automatic Refresh

The frontend should automatically show new patients when:

1. You refresh the page (F5)
2. You click the "Refresh" button next to patient selection

### Manual Verification

1. Open your browser to http://localhost:3000/teststrapi
2. Look for the patient selection buttons at the top
3. New patients should appear as clickable buttons
4. Click on a patient to see their data

## 🗑️ Managing Mock Patients

### Delete Specific Patient

```bash
node delete-mock-patients.js "Dr. John Smith"
```

### Delete All Mock Patients

```bash
node delete-mock-patients.js --all-mock
```

### List Current Patients

```bash
node test-patient-creation.js
```

## 🐛 Troubleshooting

### Problem: "No patients showing in frontend"

**Check 1: Strapi Running?**

```bash
curl http://localhost:1337/api/patients
```

Should return JSON with patient data.

**Check 2: Patients Published?**

- Go to http://localhost:1337/admin
- Navigate to Content-Type Builder → Patient
- Check if patients have `publishedAt` set

**Check 3: API Permissions**

- In Strapi admin: Settings → Users & Permissions Plugin → Roles → Public
- Ensure `patient` has `find` and `findOne` permissions checked

**Check 4: Frontend API Call**
Open browser console on frontend page and check for errors.

### Problem: "Strapi not accessible"

**Solution:**

```bash
cd backend
npm install
npm run develop
```

Wait for "Server started" message.

### Problem: "Patient creation fails"

**Check API Token:**
The API token in the scripts might be expired. Get a new one:

1. Go to Strapi admin → Settings → API Tokens
2. Create new token with full access
3. Update the token in all script files

### Problem: "Data not randomized"

**Verify Script:**

```bash
node generate-mock-patient-improved.js "Test Patient"
```

Should show randomization statistics like:

```
📊 Randomization Statistics:
   Values randomized: 45/53 (84.9%)
   Dates randomized: 40/53 (75.5%)
```

## 📊 Data Structure

### Patient Object (Frontend)

```javascript
{
  id: number,
  attributes: {
    name: string,
    patientId: string,
    cmas_scores: CmasScore[]
  }
}
```

### Patient Object (Strapi API)

```javascript
{
  id: number,
  name: string,
  patientId: string,
  publishedAt: string,
  cmas_scores: CmasScore[]
}
```

The frontend automatically maps Strapi format to its expected structure.

## 🚀 Quick Start Checklist

1. ✅ Start Strapi: `cd backend && npm run develop`
2. ✅ Start Frontend: `cd frontend && npm start`
3. ✅ Validate: `cd backend/scripts && node validate-patient-workflow.js`
4. ✅ Create Patient: `node create-mock-patient.js "Dr. Your Name"`
5. ✅ Check Frontend: Refresh http://localhost:3000/teststrapi
6. ✅ Select Patient: Click on the new patient button

## 🎯 Expected Results

After following this guide:

- ✅ Mock patients appear in Strapi admin panel
- ✅ Mock patients appear in frontend patient list
- ✅ Clicking a patient shows their CMAS scores and lab results
- ✅ Data is properly randomized across patients
- ✅ Comparison across patients works seamlessly

## 📞 Support

If issues persist:

1. Run `node validate-patient-workflow.js` for detailed diagnostics
2. Check all console outputs for specific error messages
3. Verify all prerequisites are met
4. Ensure all servers are running on correct ports
