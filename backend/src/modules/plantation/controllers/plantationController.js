const model = require('../models/plantationModel');
const db = require('../../../config/db');

function normalizeJsonb(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

async function getUserFarm(farmId, userId) {
  const result = await db.query(
    'SELECT farm_id, farm_location, polygon_coordinates FROM farms WHERE farm_id = $1 AND user_id = $2;',
    [farmId, userId],
  );
  return result.rows[0] || null;
}

function getSubmittedLocation(payload) {
  return (
    payload.location_description ??
    payload.location ??
    payload.cluster_location ??
    payload.weaver_location ??
    payload.farm_location ??
    null
  );
}

async function updateFarmLocation(farmId, userId, location) {
  const cleanLocation = typeof location === 'string' ? location.trim() : location;
  if (!cleanLocation) return;

  await db.query(
    `
    UPDATE farms
    SET farm_location = $1
    WHERE farm_id = $2
      AND user_id = $3;
    `,
    [cleanLocation, farmId, userId],
  );
}

async function createFarmForPlantation(payload, userId, name) {
  const result = await db.query(
    `
    INSERT INTO farms (
      user_id,
      farm_name,
      farm_location,
      polygon_coordinates,
      land_size,
      crop_type
    )
    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
    RETURNING farm_id, polygon_coordinates;
    `,
    [
      userId,
      name,
      getSubmittedLocation(payload),
      normalizeJsonb(payload.polygon_coordinates),
      payload.area_hectares ?? payload.land_size ?? null,
      payload.crop_type ?? payload.production_type ?? null,
    ],
  );
  return result.rows[0];
}

exports.create = async (req, res) => {
  try {
    const name = req.body?.name ?? req.body?.farm_name;
    if (!name) {
      return res.status(400).json({ error: 'name (or farm_name) is required' });
    }

    const payload = { ...(req.body || {}), user_id: req.user.user_id };
    const hasPolygon = Object.prototype.hasOwnProperty.call(payload, 'polygon_coordinates');
    const rawFarmId = payload.farm_id;
    let farm = null;

    if (rawFarmId !== undefined && rawFarmId !== null && rawFarmId !== '') {
      const farmId = Number(rawFarmId);
      if (!Number.isInteger(farmId)) {
        return res.status(400).json({ error: 'Invalid farm_id' });
      }

      farm = await getUserFarm(farmId, req.user.user_id);
      if (!farm) {
        return res.status(400).json({ error: 'Invalid farm_id for this user' });
      }

      await updateFarmLocation(farmId, req.user.user_id, getSubmittedLocation(payload));
    } else {
      farm = await createFarmForPlantation(payload, req.user.user_id, name);
    }

    payload.farm_id = farm.farm_id;

    if (!hasPolygon && farm.polygon_coordinates !== undefined) {
      payload.polygon_coordinates = farm.polygon_coordinates;
    }

    const result = await model.createPlantation(payload);
    res.json(result.rows[0]);
  } catch (err) {
    if (err?.code === '23503') {
      return res.status(400).json({ error: 'Invalid farm_id or user_id (foreign key constraint)' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      farm_id: req.query.farm_id ? Number(req.query.farm_id) : undefined,
      status: req.query.status,
    };
    const result = await model.listPlantations(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getPlantationById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPlantationById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Plantation not found' });
    }

    const result = await model.updatePlantation(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await model.getPlantationById(id);
    const existingRow = existing.rows[0];
    if (!existingRow || existingRow.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Plantation not found' });
    }

    const result = await model.deletePlantation(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
