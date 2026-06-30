const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

exports.createHarvest = async (data) => {
  const query = `
    INSERT INTO harvests (
      plantation_id,
      user_id,
      crop_id,
      harvest_date,
      total_quantity,
      accepted_quantity,
      rejected_quantity,
      unit
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), COALESCE($7, 0), COALESCE($8, 'kg'))
    RETURNING *;
  `;
  return db.query(query, [
    data.plantation_id,
    data.user_id,
    data.crop_id,
    data.harvest_date,
    data.total_quantity,
    data.accepted_quantity ?? null,
    data.rejected_quantity ?? null,
    data.unit ?? null,
  ]);
};

exports.listHarvests = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      crop_id: filters.crop_id,
    },
    1
  );

  const query = `
    SELECT *
    FROM harvests
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getHarvestById = async (id) => {
  return db.query('SELECT * FROM harvests WHERE id = $1;', [id]);
};

exports.updateHarvest = async (id, data) => {
  const built = buildUpdate({
    table: 'harvests',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: [
      'plantation_id',
      'crop_id',
      'harvest_date',
      'total_quantity',
      'accepted_quantity',
      'rejected_quantity',
      'unit',
    ],
  });

  if (!built) return db.query('SELECT * FROM harvests WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteHarvest = async (id) => {
  return db.query('DELETE FROM harvests WHERE id = $1 RETURNING *;', [id]);
};
