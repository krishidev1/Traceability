const db = require('../../../config/db');

function parseExpand(expand) {
  if (!expand) return new Set();
  const raw = Array.isArray(expand) ? expand.join(',') : String(expand);
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const set = new Set(parts);
  if (set.has('all') || set.has('full')) {
    return new Set([
      'packings',
      'harvests',
      'crops',
      'plantations',
      'monitoring_records',
      'verifications',
      'process_images',
    ]);
  }
  return set;
}

function normalizeItems(items) {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function collectIdsFromItems(items) {
  const packingIds = new Set();
  const harvestIds = new Set();
  const cropIds = new Set();
  const plantationIds = new Set();

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const p = item.packing_id ?? item.packingId;
    const h = item.harvest_id ?? item.harvestId;
    const c = item.crop_id ?? item.cropId;
    const pl = item.plantation_id ?? item.plantationId;

    if (Number.isInteger(Number(p))) packingIds.add(Number(p));
    if (Number.isInteger(Number(h))) harvestIds.add(Number(h));
    if (Number.isInteger(Number(c))) cropIds.add(Number(c));
    if (Number.isInteger(Number(pl))) plantationIds.add(Number(pl));
  }

  return {
    packingIds: Array.from(packingIds),
    harvestIds: Array.from(harvestIds),
    cropIds: Array.from(cropIds),
    plantationIds: Array.from(plantationIds),
  };
}

async function getByIds(table, ids) {
  if (!ids?.length) return [];
  const query = `SELECT * FROM ${table} WHERE id = ANY($1::int[]);`;
  const result = await db.query(query, [ids]);
  return result.rows;
}

exports.getTrace = async (patch_id, { expand } = {}) => {
  const expandSet = parseExpand(expand);

  const patchResult = await db.query('SELECT * FROM patches WHERE patch_id = $1;', [patch_id]);
  const patch = patchResult.rows[0];
  if (!patch) return null;

  const items = normalizeItems(patch.items);
  const idsFromItems = collectIdsFromItems(items);

  const data = {
    patch,
  };

  let packings = [];
  let harvests = [];
  let crops = [];
  let plantations = [];

  const packingIds = new Set(idsFromItems.packingIds);
  const harvestIds = new Set(idsFromItems.harvestIds);
  const cropIds = new Set(idsFromItems.cropIds);
  const plantationIds = new Set(idsFromItems.plantationIds);

  if (expandSet.has('packings')) {
    packings = await getByIds('packings', Array.from(packingIds));
    data.packings = packings;
    for (const p of packings) {
      if (Number.isInteger(Number(p.harvest_id))) harvestIds.add(Number(p.harvest_id));
      if (Number.isInteger(Number(p.plantation_id))) plantationIds.add(Number(p.plantation_id));
    }
  }

  if (expandSet.has('harvests')) {
    harvests = await getByIds('harvests', Array.from(harvestIds));
    data.harvests = harvests;
    for (const h of harvests) {
      if (Number.isInteger(Number(h.crop_id))) cropIds.add(Number(h.crop_id));
      if (Number.isInteger(Number(h.plantation_id))) plantationIds.add(Number(h.plantation_id));
    }
  }

  if (expandSet.has('crops')) {
    crops = await getByIds('crops', Array.from(cropIds));
    data.crops = crops;
    for (const c of crops) {
      if (Number.isInteger(Number(c.plantation_id))) plantationIds.add(Number(c.plantation_id));
    }
  }

  if (expandSet.has('plantations')) {
    plantations = await getByIds('plantations', Array.from(plantationIds));
    data.plantations = plantations;
  }

  if (expandSet.has('monitoring_records')) {
    const plIds = Array.from(plantationIds);
    const cIds = Array.from(cropIds);

    if (plIds.length || cIds.length) {
      const result = await db.query(
        `
          SELECT *
          FROM monitoring_records
          WHERE ($1::int[] IS NOT NULL AND plantation_id = ANY($1::int[]))
             OR ($2::int[] IS NOT NULL AND crop_id = ANY($2::int[]))
          ORDER BY created_at DESC;
        `,
        [plIds.length ? plIds : null, cIds.length ? cIds : null]
      );
      data.monitoring_records = result.rows;
    } else {
      data.monitoring_records = [];
    }
  }

  if (expandSet.has('verifications')) {
    const plIds = Array.from(plantationIds);
    const cIds = Array.from(cropIds);

    if (plIds.length || cIds.length) {
      const result = await db.query(
        `
          SELECT *
          FROM verifications
          WHERE ($1::int[] IS NOT NULL AND plantation_id = ANY($1::int[]))
             OR ($2::int[] IS NOT NULL AND crop_id = ANY($2::int[]))
          ORDER BY created_at DESC;
        `,
        [plIds.length ? plIds : null, cIds.length ? cIds : null]
      );
      data.verifications = result.rows;
    } else {
      data.verifications = [];
    }
  }

  if (expandSet.has('process_images')) {
    const plIds = Array.from(plantationIds);
    if (plIds.length) {
      const result = await db.query(
        `
          SELECT *
          FROM process_images
          WHERE plantation_id = ANY($1::int[])
          ORDER BY created_at DESC;
        `,
        [plIds]
      );
      data.process_images = result.rows;
    } else {
      data.process_images = [];
    }
  }

  return data;
};
