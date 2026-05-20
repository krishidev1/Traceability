const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/auth', require('./routes/authRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Mount traceability routes if present
try {
  const traceability = require('./modules/traceability/routes');
  app.use('/api/traceability', traceability);
} catch (e) {
  console.warn('Traceability routes not found or failed to load:', e.message);
}

app.get('/', (req, res) => {
  res.send('TRACECONNECT backend server is running');
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
