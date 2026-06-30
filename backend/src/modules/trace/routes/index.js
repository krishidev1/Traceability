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

router.use('/media', require('../../media/routes/mediaRoutes'));
router.use('/farms', require('../../farm/routes/farmRoutes'));
router.use('/plantations', require('../../plantation/routes/plantationRoutes'));
router.use('/crops', require('../../crop/routes/cropRoutes'));
router.use('/monitoring-records', require('../../monitoring/routes/monitoringRecordRoutes'));
router.use('/verifications', require('../../verification/routes/verificationRoutes'));
router.use('/harvests', require('../../harvest/routes/harvestRoutes'));
router.use('/packings', require('../../packing/routes/packingRoutes'));
router.use('/patches', require('../../patch/routes/patchRoutes'));
router.use('/process-images', require('../../processImage/routes/processImageRoutes'));
router.use('/sambalpuri-bandha-products', require('../../sambalpuriBandha/routes/sambalpuriBandhaProductRoutes'));
router.use('/supplier-traces', require('../../supplierTrace/routes/supplierTraceRoutes'));
router.use('/user-roles', require('../../userRole/routes/userRoleRoutes'));

module.exports = router;
