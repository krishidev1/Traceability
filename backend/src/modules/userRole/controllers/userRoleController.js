const model = require('../models/userRoleModel');

exports.create = async (req, res) => {
  try {
    if (!req.body?.role) {
      return res.status(400).json({ error: 'role is required' });
    }

    const result = await model.createUserRole({ ...(req.body || {}), user_id: req.user.user_id });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      role: req.query.role,
    };

    const result = await model.listUserRoles(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getUserRoleById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User role not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'User role not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.updateUserRole(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User role not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'User role not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.deleteUserRole(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User role not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'User role not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
