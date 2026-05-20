const service = require('../services/traceService');

exports.getTrace = async (req, res) => {
  try {
    const data = await service.getTrace(req.params.patch_id, { expand: req.query.expand });
    if (!data) return res.status(404).json({ error: 'Patch not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
