'use strict';

const cleanupDatabase = async ({ strapi }) => {
  try {
    console.log('Starting database cleanup...');

    // Get all content types
    const contentTypes = [
      'api::cmas-score.cmas-score',
      'api::lab-result.lab-result',
      'api::lab-result-group.lab-result-group',
      'api::measurement.measurement',
      'api::patient.patient'
    ];

    for (const contentType of contentTypes) {
      console.log(`\nCleaning up ${contentType}...`);
      
      // Get all entries including drafts
      const entries = await strapi.entityService.findMany(contentType, {
        publicationState: 'preview',
      });

      console.log(`Found ${entries.length} total entries`);

      // Get published entries
      const publishedEntries = entries.filter(entry => entry.publishedAt);
      console.log(`${publishedEntries.length} published entries`);

      // Get draft entries
      const draftEntries = entries.filter(entry => !entry.publishedAt);
      console.log(`${draftEntries.length} draft entries`);

      // Delete draft entries
      for (const draft of draftEntries) {
        await strapi.entityService.delete(contentType, draft.id);
        console.log(`Deleted draft entry with ID: ${draft.id}`);
      }

      // Check for duplicates in published entries
      const seen = new Map();
      const duplicates = [];

      for (const entry of publishedEntries) {
        const key = getUniqueKey(contentType, entry);
        
        if (seen.has(key)) {
          duplicates.push(entry);
        } else {
          seen.set(key, entry);
        }
      }

      console.log(`Found ${duplicates.length} duplicate entries`);

      // Delete duplicate entries
      for (const duplicate of duplicates) {
        await strapi.entityService.delete(contentType, duplicate.id);
        console.log(`Deleted duplicate entry with ID: ${duplicate.id}`);
      }
    }

    console.log('\nDatabase cleanup completed successfully!');
  } catch (error) {
    console.error('An error occurred during cleanup:', error);
  }
};

// Helper function to generate a unique key for each content type
const getUniqueKey = (contentType, entry) => {
  switch (contentType) {
    case 'api::cmas-score.cmas-score':
      return `${entry.patient?.id}-${entry.date}-${entry.score}-${entry.category}`;
    case 'api::lab-result.lab-result':
      return `${entry.name}-${entry.unit}-${entry.referenceRange}`;
    case 'api::lab-result-group.lab-result-group':
      return entry.groupName;
    case 'api::measurement.measurement':
      return `${entry.labResult?.id}-${entry.dateTime}-${entry.value}`;
    case 'api::patient.patient':
      return entry.patientId;
    default:
      return entry.id;
  }
};

module.exports = cleanupDatabase; 