const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/mediaController");

router.post("/upload", ctrl.uploadTraceabilityImage);

module.exports = router;

