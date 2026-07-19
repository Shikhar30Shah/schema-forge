const app = require('./app');
require('dotenv').config();

const { connectDatabase } = require('./services/mongodb');
const port = process.env.PORT || 4000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`SchemaForge backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
  });
