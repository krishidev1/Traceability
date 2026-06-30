const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Import middleware
const errorMiddleware = require('./middleware/errorMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

// Apply error handling middleware early
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Routes
// Auth routes (no auth required)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/auth', require('./routes/authRoutes'));

// Protected routes (add auth middleware if needed)
app.use('/api/crops', require('./modules/crop/routes/cropRoutes'));
app.use('/api/harvest', require('./modules/harvest/routes/harvestRoutes'));
app.use('/api/plantation', require('./modules/plantation/routes/plantationRoutes'));
app.use('/api/trace', require('./modules/trace/routes/traceRoutes'));
app.use('/api/media', require('./modules/media/routes/mediaRoutes'));
app.use('/api/packing', require('./modules/packing/routes/packingRoutes'));
app.use('/api/monitoring', require('./modules/monitoring/routes/monitoringRecordRoutes'));
app.use('/api/verification', require('./modules/verification/routes/verificationRoutes'));
app.use('/api/userRole', require('./modules/userRole/routes/userRoleRoutes'));
app.use('/api/patch', require('./modules/patch/routes/patchRoutes'));
app.use('/api/farm', require('./modules/farm/routes/farmRoutes'));
app.use('/api/sambalpuri', require('./modules/sambalpuriBandha/routes/sambalpuriBandhaProductRoutes'));
app.use('/api/supplierTrace', require('./modules/supplierTrace/routes/supplierTraceRoutes'));
app.use('/api/processImage', require('./modules/processImage/routes/processImageRoutes'));
app.use('/api/traceability', require('./modules/trace/routes/index'));

// Serve static assets from frontend/dist in production
const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendBuildPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Fallback all non-API requests to index.html for React Router SPA
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.json({ message: 'TraceNew Backend Server', status: 'running' });
    }
  });
});

module.exports = app;
