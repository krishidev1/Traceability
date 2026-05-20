const model = require('../models/monitoringRecordModel');

exports.create = async (req, res) => {
  try {
    if (
      req.body?.plantation_id === undefined ||
      !req.body?.date ||
      !req.body?.input_type
    ) {
      return res
        .status(400)
        .json({ error: 'plantation_id, date, and input_type are required' });
    }

    const result = await model.createMonitoringRecord({ ...(req.body || {}), user_id: req.user.user_id });
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
      input_type: req.query.input_type,
      date: req.query.date,
    };

    const result = await model.listMonitoringRecords(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getMonitoringRecordById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Monitoring record not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Monitoring record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getMonitoringRecordById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Monitoring record not found' });
    }

    const result = await model.updateMonitoringRecord(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Monitoring record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getMonitoringRecordById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Monitoring record not found' });
    }

    const result = await model.deleteMonitoringRecord(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Monitoring record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
