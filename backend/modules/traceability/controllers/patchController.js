const model = require('../models/patchModel');

exports.create = async (req, res) => {
  try {
    if (!req.body?.patch_id) {
      return res.status(400).json({ error: 'patch_id is required' });
    }
    const result = await model.createPatch({ ...(req.body || {}), user_id: req.user.user_id });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      patch_id: req.query.patch_id,
    };
    const result = await model.listPatches(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getPatchById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Patch not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Patch not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByPatchId = async (req, res) => {
  try {
    const patch_id = req.params.patch_id;
    const result = await model.getPatchByPatchId(patch_id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Patch not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Patch not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPatchById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Patch not found' });
    }

    const result = await model.updatePatch(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Patch not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPatchById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Patch not found' });
    }

    const result = await model.deletePatch(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Patch not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
