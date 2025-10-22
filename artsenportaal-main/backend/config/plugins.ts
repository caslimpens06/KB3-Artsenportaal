export default {

  
    "strapi-csv-import-export": {
      config: {
        authorizedExports: [
          "api::patient.patient",
          "api::cmasscore.cmasscore",
          "api::labresult.labresult",
          "api::labresultgroup.labresultgroup",
          "api::measurement.measurement"
        ],
        authorizedImports: [
          "api::patient.patient",
          "api::cmasscore.cmasscore",
          "api::labresult.labresult",
          "api::labresultgroup.labresultgroup",
          "api::measurement.measurement"
        ]
      }
    },
    'strapi-import-export': {
      enabled: true,
      config: {}
    }
  };