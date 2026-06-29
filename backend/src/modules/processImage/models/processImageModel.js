const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

exports.createProcessImage = async (data) => {
  const query = `
    INSERT INTO process_images (
      user_id,
      plantation_id,
      stage,
      process_name,
      image_url
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  return db.query(query, [
    data.user_id,
    data.plantation_id,
    data.stage,
    data.process_name,
    data.image_url,
  ]);
};

exports.listProcessImages = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      stage: filters.stage,
      process_name: filters.process_name,
    },
    1
  );

  const query = `
    SELECT *
    FROM process_images
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getProcessImageById = async (id) => {
  return db.query('SELECT * FROM process_images WHERE id = $1;', [id]);
};

exports.updateProcessImage = async (id, data) => {
  const built = buildUpdate({
    table: 'process_images',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: ['plantation_id', 'stage', 'process_name', 'image_url'],
  });

  if (!built) return db.query('SELECT * FROM process_images WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteProcessImage = async (id) => {
  return db.query('DELETE FROM process_images WHERE id = $1 RETURNING *;', [id]);
};

