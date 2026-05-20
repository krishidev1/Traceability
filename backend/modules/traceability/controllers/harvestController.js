const model = require('../models/harvestModel');

exports.create = async (req, res) => {
  try {
    if (
      req.body?.plantation_id === undefined ||
      !req.body?.harvest_date ||
      req.body?.total_quantity === undefined
    ) {
      return res
        .status(400)
        .json({ error: 'plantation_id, harvest_date, and total_quantity are required' });
    }
    const result = await model.createHarvest({ ...(req.body || {}), user_id: req.user.user_id });
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
    };
    const result = await model.listHarvests(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getHarvestById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Harvest not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Harvest not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getHarvestById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Harvest not found' });
    }

    const result = await model.updateHarvest(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Harvest not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getHarvestById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Harvest not found' });
    }

    const result = await model.deleteHarvest(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Harvest not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
