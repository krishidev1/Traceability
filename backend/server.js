const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the Express app from src/app.js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ TraceNew Backend Server running on http://localhost:${PORT}`);
  console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
  console.log(`✓ Health Check: http://localhost:${PORT}/api/health`);
});
