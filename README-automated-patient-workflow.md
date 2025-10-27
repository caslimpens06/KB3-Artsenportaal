# 🏥 Automated Patient Creation Workflow

Complete automated system for creating patients with randomized data and importing them into Strapi. This workflow handles everything from data generation to frontend display.

## 🎯 Complete Workflow

The system now provides **full automation** for the entire patient lifecycle:

1. **Create new patient** with randomized data based on Patient X template
2. **Generate CSV files** with randomized lab results, CMAS scores, and measurements
3. **Import automatically into Strapi** with proper relationships
4. **Display immediately in frontend** with clickable patient buttons
5. **Show detailed data and graphs** when patient is selected

## 🚀 Quick Start

### Prerequisites

- Strapi backend running on `http://localhost:1337`
- Frontend running on `http://localhost:3000`
- All dependencies installed (they should already be in place)

### Single Patient Creation (Recommended)

Navigate to the backend scripts directory and run:

```bash
cd backend/scripts
node create-and-import-patient.js
```

**Or create with a specific name:**

```bash
node create-and-import-patient.js "John Doe"
```

### Batch Patient Creation (For Testing)

Create multiple patients at once:

```bash
# Create 3 patients (default)
node create-multiple-patients-auto.js

# Create 5 patients
node create-multiple-patients-auto.js 5

# Create maximum (10 patients)
node create-multiple-patients-auto.js 10
```

## 📊 What Gets Created

### Patient Data Structure

- **Patient record** with unique UUID and name
- **Lab Result definitions** (copied from Patient X template)
- **Randomized measurements** with ±20% variation
- **Randomized CMAS scores** with ±15% variation
- **Randomized dates** with ±6 months variation

### Strapi Import

- **Patient** entity with proper relationships
- **Lab Results** linked to patient
- **Measurements** linked to lab results
- **CMAS Scores** with proper date formatting

### Frontend Display

- **Patient appears in patients list** (refresh page to see)
- **Clickable patient buttons** to view details
- **Full data visualization** including graphs and tables
- **CMAS score tracking** over time

## 🎲 Randomization Details

### Lab Measurements

- **Numeric values**: ±20% random variation
- **Special values preserved**: "neg", "Geen", "<Memo>", "Serum", "Pos"
- **Comparison operators**: "<" and ">" prefixes maintained
- **Units preserved**: Original units kept intact

### CMAS Scores

- **Score values**: ±15% variation to maintain clinical relevance
- **Categories preserved**: ">10" and "4-9" categories maintained
- **Dates randomized**: ±30 days from original dates

### Date Handling

- **Multiple formats supported**: DD-MM-YYYY, DD-MM-YYYYHH:MM
- **Time preservation**: Original time formatting maintained
- **ISO conversion**: Automatic conversion for Strapi compatibility

## 🔧 Technical Details

### File Structure

```
PatientData/
├── patientxD/                    # Source template
│   ├── Patient.csv
│   ├── LabResult.csv
│   ├── CMAS.csv
│   └── Measurement.csv
└── patient-{name}/               # Generated patient data
    ├── Patient.csv               # New patient with UUID
    ├── LabResult.csv            # New lab results with UUIDs
    ├── CMAS.csv                 # Randomized CMAS scores
    └── Measurement.csv          # Randomized measurements
```

### Strapi Entities Created

- **Patient**: Main patient record
- **Lab Results**: Individual lab test definitions
- **Measurements**: Time-series measurement data
- **CMAS Scores**: Clinical assessment scores over time

### Error Handling

- **Duplicate prevention**: Checks for existing patients
- **Validation**: Ensures data integrity before import
- **Graceful failures**: Continues with partial success
- **Detailed logging**: Clear success/error reporting

## 🎮 Usage Examples

### Creating a Single Patient

```bash
# Interactive mode (prompts for name)
node create-and-import-patient.js

# Direct command with name
node create-and-import-patient.js "Alice Cooper"
```

### Testing with Multiple Patients

```bash
# Quick test with 3 patients
node create-multiple-patients-auto.js

# Stress test with 5 patients
node create-multiple-patients-auto.js 5
```

### Viewing Results

1. **Open frontend**: http://localhost:3000/patients
2. **Refresh page** to see new patients
3. **Click patient name** to view detailed data
4. **Check CMAS graphs** and lab result tables

## 🐛 Troubleshooting

### Common Issues

**Patient not appearing in frontend:**

- Refresh the patients page
- Check browser console for errors
- Verify Strapi is running on port 1337

**Import failures:**

- Check Strapi admin panel for entity structure
- Verify API token is valid
- Ensure all required fields are defined in Strapi

**Data not randomizing:**

- Check source data in `PatientData/patientxD/`
- Verify numeric values are properly formatted
- Check console output for randomization statistics

### Debugging Commands

```bash
# Check if patients exist in Strapi
curl "http://localhost:1337/api/patients" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify CMAS scores
curl "http://localhost:1337/api/cmas-scores" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check measurements
curl "http://localhost:1337/api/measurements" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 Success Metrics

After running the workflow, you should see:

✅ **Console Output:**

- Patient creation confirmation
- Import statistics (lab results, measurements, CMAS scores)
- Success summary with Strapi IDs

✅ **Strapi Admin:**

- New patient in patients collection
- Related lab results and measurements
- CMAS scores with proper dates

✅ **Frontend:**

- Patient appears in list with refresh
- Clickable patient button works
- Detailed view shows graphs and data
- CMAS scores display correctly over time

## 🔄 Continuous Usage

This workflow is designed for **repeated use**:

- Run anytime to create new patients
- Each patient gets unique UUIDs
- No conflicts with existing data
- Cumulative patient database growth
- Perfect for testing and demonstrations

---

**🎉 Enjoy your fully automated patient creation system!**

The workflow now handles everything automatically - just run the script and watch as new patients appear in your frontend with full data visualization capabilities.
