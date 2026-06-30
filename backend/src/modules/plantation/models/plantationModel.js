const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

const PRODUCTION_TYPES = new Set([
  'shrimp',
  'bee',
  'kotpad_handloom',
  'sambalpuri_bandha',
]);
const DEFAULT_PRODUCTION_TYPE = 'shrimp';

function normalizeProductionType(value) {
  const type = String(value || DEFAULT_PRODUCTION_TYPE).trim();
  return PRODUCTION_TYPES.has(type) ? type : DEFAULT_PRODUCTION_TYPE;
}

function normalizePolygon(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

exports.createPlantation = async (data) => {
  const name = data.name ?? data.farm_name;
  const location_description =
    data.location_description ??
    data.location ??
    data.cluster_location ??
    data.weaver_location ??
    data.farm_location ??
    null;
  const area_hectares = data.area_hectares ?? data.land_size ?? null;
  const polygon = data.polygon_coordinates === undefined ? null : normalizePolygon(data.polygon_coordinates);
  const production_type = normalizeProductionType(data.production_type ?? data.type);

  const insert = (includeProductionType = true) => {
    const query = includeProductionType ? `
    INSERT INTO plantations (
      farm_id,
      user_id,
      name,
      location_description,
      polygon_coordinates,
      area_hectares,
      production_type,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'active'))
    RETURNING *;
  ` : `
    INSERT INTO plantations (
      farm_id,
      user_id,
      name,
      location_description,
      polygon_coordinates,
      area_hectares,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'))
    RETURNING *;
  `;

    const values = [
      data.farm_id,
      data.user_id,
      name,
      location_description,
      polygon,
      area_hectares,
    ];

    if (includeProductionType) values.push(production_type);
    values.push(data.status ?? null);

    return db.query(query, values);
  };

  try {
    return await insert(true);
  } catch (err) {
    if (err?.code === '42703' && String(err.message || '').includes('production_type')) {
      const fallbackResult = await insert(false);
      fallbackResult.rows = fallbackResult.rows.map((row) => ({
        ...row,
        production_type,
      }));
      return fallbackResult;
    }
    throw err;
  }
};

exports.listPlantations = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      farm_id: filters.farm_id,
      status: filters.status,
    },
    1
  );

  const withProductionType = `
    SELECT p.*, COALESCE(p.location_description, f.farm_location) AS location_description,
      COALESCE(p.production_type, f.crop_type) AS production_type, f.crop_type, f.farm_location
    FROM (
      SELECT *
      FROM plantations
      ${where}
    ) p
    LEFT JOIN farms f ON f.farm_id = p.farm_id
    ORDER BY p.created_at DESC;
  `;

  const withoutProductionType = `
    SELECT p.*, COALESCE(p.location_description, f.farm_location) AS location_description,
      f.crop_type AS production_type, f.crop_type, f.farm_location
    FROM (
      SELECT *
      FROM plantations
      ${where}
    ) p
    LEFT JOIN farms f ON f.farm_id = p.farm_id
    ORDER BY p.created_at DESC;
  `;

  try {
    return await db.query(withProductionType, values);
  } catch (err) {
    if (err?.code === '42703' && String(err.message || '').includes('production_type')) {
      return db.query(withoutProductionType, values);
    }
    throw err;
  }
};

exports.getPlantationById = async (id) => {
  return db.query('SELECT * FROM plantations WHERE id = $1;', [id]);
};

exports.updatePlantation = async (id, data) => {
  const hasPolygon = Object.prototype.hasOwnProperty.call(data || {}, 'polygon_coordinates');
  const hasProductionType =
    Object.prototype.hasOwnProperty.call(data || {}, 'production_type') ||
    Object.prototype.hasOwnProperty.call(data || {}, 'type');
  const normalizedData = {
    ...data,
    production_type: hasProductionType
      ? normalizeProductionType(data.production_type ?? data.type)
      : undefined,
  };
  const built = buildUpdate({
    table: 'plantations',
    idColumn: 'id',
    idValue: id,
    data: {
      ...normalizedData,
      polygon_coordinates: hasPolygon
        ? normalizedData.polygon_coordinates === null
          ? null
          : normalizePolygon(normalizedData.polygon_coordinates)
        : undefined,
    },
    allowedFields: [
      'farm_id',
      'name',
      'location_description',
      'polygon_coordinates',
      'area_hectares',
      'production_type',
      'status',
    ],
    setUpdatedAt: true,
  });

  if (!built) return db.query('SELECT * FROM plantations WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deletePlantation = async (id) => {
  return db.query('DELETE FROM plantations WHERE id = $1 RETURNING *;', [id]);
};
