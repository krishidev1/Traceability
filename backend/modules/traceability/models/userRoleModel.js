const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../services/sqlBuilder');

exports.createUserRole = async (data) => {
  const query = `
    INSERT INTO user_roles (user_id, role)
    VALUES ($1, $2)
    RETURNING *;
  `;

  return db.query(query, [data.user_id, data.role]);
};

exports.listUserRoles = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      role: filters.role,
    },
    1
  );

  const query = `
    SELECT *
    FROM user_roles
    ${where}
    ORDER BY id DESC;
  `;

  return db.query(query, values);
};

exports.getUserRoleById = async (id) => {
  return db.query('SELECT * FROM user_roles WHERE id = $1;', [id]);
};

exports.updateUserRole = async (id, data) => {
  const built = buildUpdate({
    table: 'user_roles',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: ['user_id', 'role'],
  });

  if (!built) return db.query('SELECT * FROM user_roles WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteUserRole = async (id) => {
  return db.query('DELETE FROM user_roles WHERE id = $1 RETURNING *;', [id]);
};

