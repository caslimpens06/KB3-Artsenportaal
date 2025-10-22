const path = require('path');
const Strapi = require('@strapi/strapi');

const strapiDirectory = path.resolve(__dirname, '..');

console.log('Starting Strapi cleanup...');
console.log('Strapi directory:', strapiDirectory);

const strapi = new Strapi({
  appDir: strapiDirectory,
  autoReload: false,
  serveAdminPanel: false,
});

strapi.start().then(async () => {
  try {
    console.log('Strapi started successfully');
    const cleanup = require('./cleanup-database');
    await cleanup({ strapi });
    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('Failed to start Strapi:', error);
  process.exit(1);
}); 