const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFilesFromGeneratedContent(modelsData, routesData, validatorsData, entityNames) {
  const baseModelsDir = path.join(__dirname, '..', 'models');
  const baseRoutesDir = path.join(__dirname, '..', 'routes');
  const baseValidatorsDir = path.join(__dirname, '..', 'validators');

  const generatedModels = [];
  const generatedRoutes = [];
  const generatedValidators = [];

  // Generate models
  modelsData.forEach((modelCode, index) => {
    const modelName = entityNames[index];
    const modelFilePath = path.join(baseModelsDir, `${modelName}.js`);
    ensureDirectoryExists(modelFilePath);
    fs.writeFileSync(modelFilePath, modelCode, 'utf8');
    generatedModels.push(modelFilePath);
  });

  // Generate validators
  validatorsData.forEach((validatorCode, index) => {
    const modelName = entityNames[index];
    const validatorFilePath = path.join(baseValidatorsDir, `${modelName}Validator.js`);
    ensureDirectoryExists(validatorFilePath);
    fs.writeFileSync(validatorFilePath, validatorCode, 'utf8');
    generatedValidators.push(validatorFilePath);
  });

  // Generate routes
  routesData.forEach((routeCode, index) => {
    const modelName = entityNames[index];
    const routeFilePath = path.join(baseRoutesDir, `${modelName}.js`);
    ensureDirectoryExists(routeFilePath);
    fs.writeFileSync(routeFilePath, routeCode, 'utf8');
    generatedRoutes.push(routeFilePath);
  });

  return {
    models: generatedModels,
    routes: generatedRoutes,
    validators: generatedValidators
  };
}

module.exports = { writeFilesFromGeneratedContent };