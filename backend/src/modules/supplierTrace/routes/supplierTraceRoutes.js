const express = require("express");

const router = express.Router();
const controller = require("../controllers/supplierTraceController");

router.get("/grower/:growerId", controller.lookupGrower);
router.get("/", controller.list);

module.exports = router;
