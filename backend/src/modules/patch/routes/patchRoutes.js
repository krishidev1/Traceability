const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/patchController');

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/by-patch-id/:patch_id', ctrl.getByPatchId);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
