function pickDefined(data, allowedFields) {
  const out = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined) {
      out[field] = data[field];
    }
  }
  return out;
}

function buildWhere(filters, startIndex = 1) {
  const clauses = [];
  const values = [];
  let idx = startIndex;

  for (const [column, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    clauses.push(`${column} = $${idx++}`);
    values.push(value);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
    nextIndex: idx,
  };
}

function buildUpdate({ table, idColumn = 'id', idValue, data, allowedFields, setUpdatedAt = false }) {
  const fields = pickDefined(data, allowedFields);
  const keys = Object.keys(fields);

  if (!keys.length && !setUpdatedAt) {
    return null;
  }

  const sets = [];
  const values = [];

  let idx = 1;
  for (const key of keys) {
    sets.push(`${key} = $${idx++}`);
    values.push(fields[key]);
  }

  if (setUpdatedAt) {
    sets.push(`updated_at = CURRENT_TIMESTAMP`);
  }

  values.push(idValue);
  const query = `
    UPDATE ${table}
    SET ${sets.join(', ')}
    WHERE ${idColumn} = $${idx}
    RETURNING *;
  `;

  return { query, values };
}

module.exports = {
  pickDefined,
  buildWhere,
  buildUpdate,
};

