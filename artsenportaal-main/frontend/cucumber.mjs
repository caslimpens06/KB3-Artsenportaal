const common = [
    'src/tests/features/**/*.feature', // Specify your feature files
    '--require-module ts-node/register', // Load TypeScript module
    '--require src/tests/stepDefinitions/**/*.ts' // Load step definitions
  ].join(' ');
  
  export default {
    default: common
  }; 