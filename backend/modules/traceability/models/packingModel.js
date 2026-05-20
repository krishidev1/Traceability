const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../services/sqlBuilder');

exports.createPacking = async (data) => {
  const query = `
    INSERT INTO packings (
      plantation_id,
      user_id,
      harvest_id,
      packing_date,
      number_of_packages,
      net_weight,
      packing_size,
      warehouse_name,
      street,
      city,
      state,
      pincode,
      country
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  return db.query(query, [
    data.plantation_id,
    data.user_id,
    data.harvest_id,
    data.packing_date,
    data.number_of_packages,
    data.net_weight,
    data.packing_size ?? null,
    data.warehouse_name ?? null,
    data.street ?? null,
    data.city ?? null,
    data.state ?? null,
    data.pincode ?? null,
    data.country ?? null,
  ]);
};

exports.listPackings = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      harvest_id: filters.harvest_id,
      warehouse_name: filters.warehouse_name,
      city: filters.city,
      state: filters.state,
      country: filters.country,
    },
    1
  );

  const query = `
    SELECT *
    FROM packings
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getPackingById = async (id) => {
  return db.query('SELECT * FROM packings WHERE id = $1;', [id]);
};

exports.updatePacking = async (id, data) => {
  const built = buildUpdate({
    table: 'packings',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: [
      'plantation_id',
      'harvest_id',
      'packing_date',
      'number_of_packages',
      'net_weight',
      'packing_size',
      'warehouse_name',
      'street',
      'city',
      'state',
      'pincode',
      'country',
    ],
  });

  if (!built) return db.query('SELECT * FROM packings WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deletePacking = async (id) => {
  return db.query('DELETE FROM packings WHERE id = $1 RETURNING *;', [id]);
};
