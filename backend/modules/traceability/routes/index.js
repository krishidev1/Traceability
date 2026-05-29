const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/authMiddleware');

// Ensure request bodies are parsed for this module even if the parent app
// registers body parsers after mounting `/api/traceability`.
// NOTE: camera uploads send large base64 data URLs; increase limits accordingly.
router.use(express.json({ limit: '25mb' }));
router.use(express.urlencoded({ extended: true, limit: '25mb' }));

router.use('/trace', require('./traceRoutes'));

// Everything below requires TRACECONNECT login (Bearer token).
router.use(authMiddleware);

router.use('/media', require('./mediaRoutes'));
router.use('/farms', require('./farmRoutes'));
router.use('/plantations', require('./plantationRoutes'));
router.use('/crops', require('./cropRoutes'));
router.use('/monitoring-records', require('./monitoringRecordRoutes'));
router.use('/verifications', require('./verificationRoutes'));
router.use('/harvests', require('./harvestRoutes'));
router.use('/packings', require('./packingRoutes'));
router.use('/patches', require('./patchRoutes'));
router.use('/process-images', require('./processImageRoutes'));
router.use('/sambalpuri-bandha-products', require('./sambalpuriBandhaProductRoutes'));
router.use('/supplier-traces', require('./supplierTraceRoutes'));
router.use('/user-roles', require('./userRoleRoutes'));

module.exports = router;
