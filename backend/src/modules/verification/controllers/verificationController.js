const model = require('../models/verificationModel');

exports.create = async (req, res) => {
  try {
    if (
      req.body?.plantation_id === undefined ||
      !req.body?.inspection_date ||
      !req.body?.crop_health
    ) {
      return res.status(400).json({
        error: 'plantation_id, inspection_date, and crop_health are required',
      });
    }

    const result = await model.createVerification({ ...(req.body || {}), user_id: req.user.user_id });
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
      crop_id: req.query.crop_id ? Number(req.query.crop_id) : undefined,
      approved_for_harvest:
        req.query.approved_for_harvest === undefined
          ? undefined
          : String(req.query.approved_for_harvest).toLowerCase() === 'true',
      inspection_date: req.query.inspection_date,
    };

    const result = await model.listVerifications(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getVerificationById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Verification not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Verification not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getVerificationById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const result = await model.updateVerification(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Verification not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getVerificationById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const result = await model.deleteVerification(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Verification not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
