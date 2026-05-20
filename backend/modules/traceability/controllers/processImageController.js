const model = require('../models/processImageModel');

exports.create = async (req, res) => {
  try {
    if (
      req.body?.plantation_id === undefined ||
      !req.body?.stage ||
      !req.body?.process_name ||
      !req.body?.image_url
    ) {
      return res.status(400).json({
        error: 'plantation_id, stage, process_name, and image_url are required',
      });
    }

    const result = await model.createProcessImage({ ...(req.body || {}), user_id: req.user.user_id });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      plantation_id: req.query.plantation_id ? Number(req.query.plantation_id) : undefined,
      stage: req.query.stage,
      process_name: req.query.process_name,
    };

    const result = await model.listProcessImages(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getProcessImageById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Process image not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Process image not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getProcessImageById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Process image not found' });
    }

    const result = await model.updateProcessImage(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Process image not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getProcessImageById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Process image not found' });
    }

    const result = await model.deleteProcessImage(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Process image not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
