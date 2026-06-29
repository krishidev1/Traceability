const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

exports.createMonitoringRecord = async (data) => {
  const query = `
    INSERT INTO monitoring_records (
      plantation_id,
      user_id,
      crop_id,
      date,
      input_type,
      remarks,
      photo_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  return db.query(query, [
    data.plantation_id,
    data.user_id,
    data.crop_id ?? null,
    data.date,
    data.input_type,
    data.remarks ?? null,
    data.photo_url ?? null,
  ]);
};

exports.listMonitoringRecords = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      crop_id: filters.crop_id,
      input_type: filters.input_type,
      date: filters.date,
    },
    1
  );

  const query = `
    SELECT *
    FROM monitoring_records
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getMonitoringRecordById = async (id) => {
  return db.query('SELECT * FROM monitoring_records WHERE id = $1;', [id]);
};

exports.updateMonitoringRecord = async (id, data) => {
  const built = buildUpdate({
    table: 'monitoring_records',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: ['plantation_id', 'crop_id', 'date', 'input_type', 'remarks', 'photo_url'],
  });

  if (!built) return db.query('SELECT * FROM monitoring_records WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteMonitoringRecord = async (id) => {
  return db.query('DELETE FROM monitoring_records WHERE id = $1 RETURNING *;', [id]);
};

