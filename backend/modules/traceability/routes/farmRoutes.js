const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/farmController');

router.get('/', ctrl.list);

module.exports = router;
