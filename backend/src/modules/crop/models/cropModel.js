const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

exports.createCrop = async (data) => {
  const query = `
    INSERT INTO crops (
      plantation_id,
      user_id,
      crop_name,
      crop_variety,
      sowing_date,
      expected_harvest_date
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  return db.query(query, [
    data.plantation_id,
    data.user_id,
    data.crop_name,
    data.crop_variety ?? null,
    data.sowing_date ?? null,
    data.expected_harvest_date ?? null,
  ]);
};

exports.listCrops = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      crop_name: filters.crop_name,
    },
    1
  );

  const query = `
    SELECT *
    FROM crops
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getCropById = async (id) => {
  return db.query('SELECT * FROM crops WHERE id = $1;', [id]);
};

exports.updateCrop = async (id, data) => {
  const built = buildUpdate({
    table: 'crops',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: [
      'plantation_id',
      'crop_name',
      'crop_variety',
      'sowing_date',
      'expected_harvest_date',
    ],
  });

  if (!built) return db.query('SELECT * FROM crops WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteCrop = async (id) => {
  return db.query('DELETE FROM crops WHERE id = $1 RETURNING *;', [id]);
};
