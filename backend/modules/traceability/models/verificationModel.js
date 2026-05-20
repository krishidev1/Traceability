const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../services/sqlBuilder');

exports.createVerification = async (data) => {
  const query = `
    INSERT INTO verifications (
      plantation_id,
      user_id,
      crop_id,
      inspection_date,
      crop_health,
      approved_for_harvest
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE))
    RETURNING *;
  `;

  return db.query(query, [
    data.plantation_id,
    data.user_id,
    data.crop_id ?? null,
    data.inspection_date,
    data.crop_health,
    data.approved_for_harvest ?? null,
  ]);
};

exports.listVerifications = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      crop_id: filters.crop_id,
      approved_for_harvest: filters.approved_for_harvest,
      inspection_date: filters.inspection_date,
    },
    1
  );

  const query = `
    SELECT *
    FROM verifications
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getVerificationById = async (id) => {
  return db.query('SELECT * FROM verifications WHERE id = $1;', [id]);
};

exports.updateVerification = async (id, data) => {
  const built = buildUpdate({
    table: 'verifications',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: [
      'plantation_id',
      'crop_id',
      'inspection_date',
      'crop_health',
      'approved_for_harvest',
    ],
  });

  if (!built) return db.query('SELECT * FROM verifications WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteVerification = async (id) => {
  return db.query('DELETE FROM verifications WHERE id = $1 RETURNING *;', [id]);
};

