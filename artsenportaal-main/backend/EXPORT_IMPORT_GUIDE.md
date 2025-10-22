# Strapi Export/Import Guide

## Export Information

- **Export file**: `export_20250603_051721.tar.gz`
- **Created**: June 3rd, 2025 at 05:17:21
- **Size**: ~649KB (unencrypted)
- **Content**: Full database export including all schemas, entities, links, and configuration

## Export Contents

The export contains:

- **Schemas**: 22 content types (38 KB)
- **Entities**: 10,693 total records (3.3 MB)
  - CMAS Scores: 1,410 records
  - Lab Result Groups: 52 records
  - Lab Results: 3,724 records
  - Measurements: 5,422 records
  - Patients: 26 records
  - System entities (users, permissions, etc.)
- **Links**: 22,229 relationships (4.5 MB)
- **Configuration**: 31 config items (111.6 KB)

## How to Import on Your Laptop

### Prerequisites

1. Make sure you have Node.js installed (version 18 or higher)
2. Have Strapi CLI available: `npm install -g @strapi/strapi`

### Import Steps

1. **Set up your Strapi project on the laptop:**

   ```bash
   # If you don't have the project yet, clone it:
   git clone [your-repo-url] artsenportaal
   cd artsenportaal/backend

   # Install dependencies
   npm install
   ```

2. **Copy the export file:**

   - Transfer `export_20250603_051721.tar.gz` to your laptop
   - Place it in the `backend/` directory of your project

3. **Import the data:**

   ```bash
   # Navigate to backend directory
   cd backend

   # Import the data (this will overwrite existing data)
   npx strapi import --file export_20250603_051721.tar.gz
   ```

4. **Start Strapi:**
   ```bash
   npm run develop
   ```

### Important Notes

- **Data Overwrite**: The import will completely overwrite your existing database
- **No Encryption**: This export is not encrypted as requested
- **Environment**: Make sure your laptop has the same database configuration (SQLite by default)
- **Admin User**: You may need to create a new admin user after import if not included

### Alternative: Quick Export Command

To create a new export with current timestamp:

```bash
npx strapi export --no-encrypt --file export_$(date +%Y%m%d_%H%M%S)
```

### Troubleshooting

- If import fails, check that Strapi is not running during import
- Ensure the database file has write permissions
- Check that all dependencies are installed with `npm install`

## Export Statistics

- Total transfered items: 32,975
- Total size: 7.9 MB (uncompressed)
- Export successful without errors
