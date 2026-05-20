const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../services/sqlBuilder');

exports.createPatch = async (data) => {
  const query = `
    INSERT INTO patches (
      user_id,
      patch_id,
      description,
      total_weight,
      unit,
      items
    )
    VALUES ($1, $2, $3, $4, COALESCE($5, 'kg'), $6)
    RETURNING *;
  `;
  return db.query(query, [
    data.user_id,
    data.patch_id,
    data.description ?? null,
    data.total_weight ?? null,
    data.unit ?? null,
    JSON.stringify(data.items ?? []),
  ]);
};

exports.listPatches = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      patch_id: filters.patch_id,
    },
    1
  );

  const query = `
    SELECT *
    FROM patches
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getPatchById = async (id) => {
  return db.query('SELECT * FROM patches WHERE id = $1;', [id]);
};

exports.getPatchByPatchId = async (patch_id) => {
  return db.query('SELECT * FROM patches WHERE patch_id = $1;', [patch_id]);
};

exports.updatePatch = async (id, data) => {
  const built = buildUpdate({
    table: 'patches',
    idColumn: 'id',
    idValue: id,
    data: {
      ...data,
      items: data.items !== undefined ? JSON.stringify(data.items ?? []) : undefined,
    },
    allowedFields: ['patch_id', 'description', 'total_weight', 'unit', 'items'],
  });

  if (!built) return db.query('SELECT * FROM patches WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deletePatch = async (id) => {
  return db.query('DELETE FROM patches WHERE id = $1 RETURNING *;', [id]);
};
