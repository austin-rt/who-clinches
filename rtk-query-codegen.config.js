/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: './openapi.yaml',
  apiFile: './app/store/baseApi.ts',
  apiImport: 'apiSlice',
  outputFile: './app/store/api.ts',
  exportName: 'api',
  hooks: true,
  tag: true,
};

module.exports = config;

