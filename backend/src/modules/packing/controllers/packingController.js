const model = require('../models/packingModel');

exports.create = async (req, res) => {
  try {
    if (
      req.body?.plantation_id === undefined ||
      !req.body?.packing_date ||
      req.body?.number_of_packages === undefined ||
      req.body?.net_weight === undefined
    ) {
      return res.status(400).json({
        error: 'plantation_id, packing_date, number_of_packages, and net_weight are required',
      });
    }
    const result = await model.createPacking({ ...(req.body || {}), user_id: req.user.user_id });
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
      harvest_id: req.query.harvest_id ? Number(req.query.harvest_id) : undefined,
      warehouse_name: req.query.warehouse_name,
      city: req.query.city,
      state: req.query.state,
      country: req.query.country,
    };
    const result = await model.listPackings(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getPackingById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Packing not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Packing not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPackingById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Packing not found' });
    }

    const result = await model.updatePacking(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Packing not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPackingById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Packing not found' });
    }

    const result = await model.deletePacking(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Packing not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
