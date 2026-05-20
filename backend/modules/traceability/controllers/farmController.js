const db = require('../../../config/db');

exports.list = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        farm_id,
        user_id,
        farm_name,
        farm_location,
        latitude,
        longitude,
        polygon_coordinates,
        land_size,
        crop_type,
        created_at,
        boundary
      FROM farms
      WHERE user_id = $1
      ORDER BY created_at DESC NULLS LAST, farm_id DESC;
      `,
      [req.user.user_id],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
