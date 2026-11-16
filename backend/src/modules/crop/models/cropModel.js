const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

const DETAIL_TABLES = {
  bee: 'honey_production_details',
  shrimp: 'shrimp_production_details',
  fish: 'fish_production_details',
  kotpad_handloom: 'kotpad_handloom_details',
  kancheepuram_silk: 'kancheepuram_silk_details',
  sambalpuri_bandha: 'sambalpuri_bandha_details',
  vermicompost: 'vermicompost_production_details',
  pesticides: 'pesticide_production_details',
  mobile_refurbishable: 'mobile_refurbishable_details',
};

function parseDetails(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return { value }; }
}

async function saveProductionDetails({ crop, productionType, details }) {
  const table = DETAIL_TABLES[productionType];
  if (!table) return;
  await db.query(
    `INSERT INTO ${table} (crop_id, plantation_id, user_id, details)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (crop_id) DO UPDATE SET details = EXCLUDED.details, updated_at = CURRENT_TIMESTAMP;`,
    [crop.id, crop.plantation_id, crop.user_id, JSON.stringify(details)],
  );
}

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
  const result = await db.query(query, [
    data.plantation_id,
    data.user_id,
    data.crop_name,
    data.crop_variety ?? null,
    data.sowing_date ?? null,
    data.expected_harvest_date ?? null,
  ]);
  const crop = result.rows[0];
  const plantation = await db.query('SELECT production_type FROM plantations WHERE id = $1;', [data.plantation_id]);
  const productionType = data.production_type || plantation.rows[0]?.production_type;
  const giUser = await db.query('SELECT is_gi_user, gi_registry_name, gi_registry_application_number FROM users WHERE user_id = $1;', [crop.user_id]);
  if (giUser.rows[0]?.is_gi_user && productionType === 'kancheepuram_silk') {
    await db.query(
      `UPDATE crops SET is_gi_product = TRUE, gi_product_name = $2, gi_registry_reference = $3 WHERE id = $1;`,
      [crop.id, giUser.rows[0].gi_registry_name || 'Kancheepuram Silk', giUser.rows[0].gi_registry_application_number ? `GI Application No. ${giUser.rows[0].gi_registry_application_number}` : null],
    );
    crop.is_gi_product = true;
    crop.gi_product_name = giUser.rows[0].gi_registry_name || 'Kancheepuram Silk';
  }
  await saveProductionDetails({ crop, productionType, details: parseDetails(data.crop_variety) });
  return result;
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
  const result = await db.query(built.query, built.values);
  const crop = result.rows[0];
  const plantation = await db.query('SELECT production_type FROM plantations WHERE id = $1;', [crop.plantation_id]);
  await saveProductionDetails({ crop, productionType: data.production_type || plantation.rows[0]?.production_type, details: parseDetails(crop.crop_variety) });
  return result;
};

exports.deleteCrop = async (id) => {
  return db.query('DELETE FROM crops WHERE id = $1 RETURNING *;', [id]);
};
