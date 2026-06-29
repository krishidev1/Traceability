const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/traceController');

router.get('/:patch_id', ctrl.getTrace);

module.exports = router;