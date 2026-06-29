const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../../../services/sqlBuilder');

const PRODUCT_FIELDS = [
  'registered_name',
  'gi_certificate_date',
  'gi_application_number',
  'gi_category',
  'registration_holder',
  'head_office_location',
  'associated_regions',
  'product_type',
  'bandha_pattern_type',
  'fabric_material',
  'color_combination',
  'border_design',
  'motif_style',
  'product_description',
  'weaver_name',
  'weaver_id',
  'cooperative_name',
  'aadhaar_number',
  'mobile_number',
  'district',
  'gps_coordinates',
  'gi_region_match',
  'loom_type',
  'handloom_verification',
  'natural_dye_used',
  'texture_authenticity_score',
  'motif_match_score',
  'inspection_status',
  'authenticity_score',
  'qr_verification_code',
  'batch_number',
  'aadhaar_card_status',
  'weaver_registration_certificate_status',
  'cooperative_membership_proof_status',
  'product_images_status',
  'loom_images_status',
  'gi_authorization_certificate_status',
  'production_location_proof_status',
  'inspection_report_status',
];

function pickInsertFields(data) {
  return PRODUCT_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(data, field) &&
    data[field] !== undefined &&
    data[field] !== '',
  );
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

exports.createProductWithCrop = async (data) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const plantationResult = await client.query(
      'SELECT id FROM plantations WHERE id = $1 AND user_id = $2;',
      [data.plantation_id, data.user_id],
    );
    if (!plantationResult.rows[0]) {
      throw notFound('Plantation not found');
    }

    const cropResult = await client.query(
      `
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
      `,
      [
        data.plantation_id,
        data.user_id,
        data.crop_name,
        data.crop_variety ?? null,
        data.sowing_date ?? null,
        data.expected_harvest_date ?? null,
      ],
    );

    const crop = cropResult.rows[0];
    const insertFields = pickInsertFields(data);
    const columns = ['user_id', 'plantation_id', 'crop_id', ...insertFields];
    const values = [
      data.user_id,
      data.plantation_id,
      crop.id,
      ...insertFields.map((field) => data[field]),
    ];
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const productResult = await client.query(
      `
      INSERT INTO sambalpuri_bandha_products (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *;
      `,
      values,
    );

    await client.query('COMMIT');
    return {
      crop,
      sambalpuriProduct: productResult.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.listProducts = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      plantation_id: filters.plantation_id,
      crop_id: filters.crop_id,
    },
    1,
  );

  const query = `
    SELECT *
    FROM sambalpuri_bandha_products
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getProductById = async (id) => {
  return db.query('SELECT * FROM sambalpuri_bandha_products WHERE id = $1;', [id]);
};

exports.updateProduct = async (id, data) => {
  const built = buildUpdate({
    table: 'sambalpuri_bandha_products',
    idColumn: 'id',
    idValue: id,
    data,
    allowedFields: PRODUCT_FIELDS,
    setUpdatedAt: true,
  });

  if (!built) return db.query('SELECT * FROM sambalpuri_bandha_products WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deleteProduct = async (id) => {
  return db.query('DELETE FROM sambalpuri_bandha_products WHERE id = $1 RETURNING *;', [id]);
};