const model = require('../models/sambalpuriBandhaProductModel');

function isIntegerLike(value) {
  return Number.isInteger(Number(value));
}

exports.create = async (req, res) => {
  try {
    if (req.body?.plantation_id === undefined || !req.body?.crop_name) {
      return res.status(400).json({ error: 'plantation_id and crop_name are required' });
    }

    const plantationId = Number(req.body.plantation_id);
    if (!Number.isInteger(plantationId)) {
      return res.status(400).json({ error: 'Invalid plantation_id' });
    }

    const result = await model.createProductWithCrop({
      ...(req.body || {}),
      plantation_id: plantationId,
      user_id: req.user.user_id,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      plantation_id: req.query.plantation_id ? Number(req.query.plantation_id) : undefined,
      crop_id: req.query.crop_id ? Number(req.query.crop_id) : undefined,
    };

    const result = await model.listProducts(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getProductById(id);
    const row = result.rows[0];
    if (!row || row.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Sambalpuri Bandha product not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getProductById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Sambalpuri Bandha product not found' });
    }

    if (req.body?.plantation_id !== undefined && !isIntegerLike(req.body.plantation_id)) {
      return res.status(400).json({ error: 'Invalid plantation_id' });
    }
    if (req.body?.crop_id !== undefined && !isIntegerLike(req.body.crop_id)) {
      return res.status(400).json({ error: 'Invalid crop_id' });
    }

    const result = await model.updateProduct(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Sambalpuri Bandha product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getProductById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Sambalpuri Bandha product not found' });
    }

    const result = await model.deleteProduct(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Sambalpuri Bandha product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
