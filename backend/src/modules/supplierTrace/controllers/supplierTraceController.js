const db = require("../../../config/db");

let cachedUserNameColumn = null;
let cachedSupplierTableExists = null;
let cachedFarmerProfileTableExists = null;

async function resolveUserNameColumn() {
  if (cachedUserNameColumn !== null) return cachedUserNameColumn;

  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN ('full_name', 'username', 'name')
    ORDER BY CASE
      WHEN column_name = 'full_name' THEN 0
      WHEN column_name = 'username' THEN 1
      ELSE 2
    END
    LIMIT 1
  `);

  cachedUserNameColumn = result.rows[0]?.column_name || "";
  return cachedUserNameColumn;
}

async function supplierProfileTableExists() {
  if (cachedSupplierTableExists !== null) return cachedSupplierTableExists;

  const result = await db.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'supplier_profiles'
    ) AS exists
  `);

  cachedSupplierTableExists = Boolean(result.rows[0]?.exists);
  return cachedSupplierTableExists;
}

async function farmerProfileTableExists() {
  if (cachedFarmerProfileTableExists !== null) return cachedFarmerProfileTableExists;

  const result = await db.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'farmer_profiles'
    ) AS exists
  `);

  cachedFarmerProfileTableExists = Boolean(result.rows[0]?.exists);
  return cachedFarmerProfileTableExists;
}

async function getSupplierOperatingAreas(userId) {
  if (!(await supplierProfileTableExists())) return [];

  const result = await db.query(
    `
    SELECT
      supplier_id,
      supplier_type,
      village,
      district,
      state,
      pincode,
      crops_handled,
      sourcing_type,
      avg_daily_volume,
      has_transport,
      transport_type,
      storage_facility,
      storage_type
    FROM supplier_profiles
    WHERE user_id = $1
    ORDER BY supplier_id ASC
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    supplierId: Number(row.supplier_id),
    supplierType: row.supplier_type || "",
    village: row.village || "",
    district: row.district || "",
    state: row.state || "",
    pincode: row.pincode || "",
    cropsHandled: Array.isArray(row.crops_handled) ? row.crops_handled : [],
    sourcingType: row.sourcing_type || "",
    avgDailyVolume: row.avg_daily_volume || "",
    hasTransport: Boolean(row.has_transport),
    transportType: row.transport_type || "",
    storageFacility: Boolean(row.storage_facility),
    storageType: row.storage_type || "",
  }));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAreaLabel(area) {
  return [
    area?.village,
    area?.district,
    area?.state,
    area?.pincode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getMatchedAreaLabel(trace, operatingAreas) {
  if (!Array.isArray(operatingAreas) || operatingAreas.length === 0) return "";

  const exactFields = new Set([
    normalize(trace.packingPincode),
  ]);

  const fuzzyFields = [
    trace.packingCity,
    trace.packingState,
    trace.originLocation,
    trace.plantationLocation,
    trace.farmName,
  ]
    .map(normalize)
    .filter(Boolean);

  for (const area of operatingAreas) {
    const pincode = normalize(area?.pincode);
    if (pincode && exactFields.has(pincode)) {
      return buildAreaLabel(area);
    }

    const searchTerms = [area?.village, area?.district, area?.state]
      .map(normalize)
      .filter(Boolean);

    if (
      searchTerms.length > 0 &&
      searchTerms.every((term) =>
        fuzzyFields.some((fieldValue) => fieldValue.includes(term)),
      )
    ) {
      return buildAreaLabel(area);
    }

    if (
      searchTerms.length > 0 &&
      searchTerms.some((term) =>
        fuzzyFields.some((fieldValue) => fieldValue.includes(term)),
      )
    ) {
      return buildAreaLabel(area);
    }
  }

  return "";
}

function parsePatchItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildWorkflowStatus(row) {
  const stages = [
    {
      key: "crop",
      label: "Crop",
      complete:
        Number(row.crop_count || 0) > 0 ||
        (row.crop_id !== null && row.crop_id !== undefined),
    },
    {
      key: "monitoring",
      label: "Monitoring",
      complete: Number(row.monitoring_count || 0) > 0,
    },
    {
      key: "verification",
      label: "Verification",
      complete: Number(row.verification_count || 0) > 0,
    },
    {
      key: "harvest",
      label: "Harvest",
      complete:
        Number(row.harvest_count || 0) > 0 ||
        (row.harvest_id !== null && row.harvest_id !== undefined),
    },
    {
      key: "packing",
      label: "Packing",
      complete:
        Number(row.packing_count || 0) > 0 ||
        (row.packing_id !== null && row.packing_id !== undefined),
    },
  ];
  const completedStages = stages.filter((stage) => stage.complete).length;
  const pendingStage = stages.find((stage) => !stage.complete)?.label || "";

  return {
    stages,
    completedStages,
    totalStages: stages.length,
    progressPercent: Math.round((completedStages / stages.length) * 100),
    complete: completedStages === stages.length,
    pendingStage,
  };
}

function mapTraceRow(row) {
  const originLocation =
    row.registered_farm_location ||
    row.farm_location ||
    row.location_description ||
    [row.city, row.state, row.pincode].filter(Boolean).join(", ");

  const workflow = buildWorkflowStatus(row);

  return {
    packingId: Number(row.packing_id),
    plantationId: Number(row.plantation_id),
    farmId: row.farm_id === null || row.farm_id === undefined ? null : Number(row.farm_id),
    growerUserId: Number(row.grower_user_id),
    plantationName: row.plantation_name || "Farm Trace",
    plantationLocation: row.location_description || "",
    plantationStatus: row.plantation_status || "Active",
    areaHectares: row.area_hectares === null ? null : Number(row.area_hectares),
    farmName: row.farm_name || row.plantation_name || "Farm",
    originLocation,
    growerName: row.grower_name || "Grower",
    cropId: row.crop_id === null || row.crop_id === undefined ? null : Number(row.crop_id),
    cropName: row.crop_name || row.registered_crop_type || "Crop",
    cropVariety: row.crop_variety || "",
    sowingDate: row.sowing_date,
    expectedHarvestDate: row.expected_harvest_date,
    harvestId: row.harvest_id === null || row.harvest_id === undefined ? null : Number(row.harvest_id),
    harvestDate: row.harvest_date,
    acceptedQuantity:
      row.accepted_quantity === null ? null : Number(row.accepted_quantity),
    rejectedQuantity:
      row.rejected_quantity === null ? null : Number(row.rejected_quantity),
    totalQuantity: row.total_quantity === null ? null : Number(row.total_quantity),
    harvestUnit: row.harvest_unit || "kg",
    packingDate: row.packing_date,
    packingSize: row.packing_size || "",
    numPackages:
      row.number_of_packages === null ? 0 : Number(row.number_of_packages),
    netWeight: row.net_weight === null ? 0 : Number(row.net_weight),
    warehouseName: row.warehouse_name || "Warehouse",
    packingCity: row.city || "",
    packingState: row.state || "",
    packingPincode: row.pincode || "",
    packingCountry: row.country || "",
    assignedPatchId: row.assigned_patch_id || "",
    workflow,
    workflowComplete: workflow.complete,
    pendingStage: workflow.pendingStage,
  };
}

function mapPlantationRow(row) {
  const workflow = buildWorkflowStatus(row);

  return {
    plantationId: Number(row.plantation_id),
    plantationName: row.plantation_name || "Plantation",
    location: row.location_description || row.farm_location || "",
    status: row.plantation_status || "Active",
    areaHectares: row.area_hectares === null ? null : Number(row.area_hectares),
    createdAt: row.plantation_created_at,
    farmId: row.farm_id === null || row.farm_id === undefined ? null : Number(row.farm_id),
    farmName: row.farm_name || "",
    farmLocation: row.farm_location || "",
    workflow,
    workflowComplete: workflow.complete,
    pendingStage: workflow.pendingStage,
  };
}

function mapBatchRow(row) {
  const items = parsePatchItems(row.items);
  const packingIds = items
    .map((item) => item?.packing_id ?? item?.packingId)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  return {
    patchDbId: Number(row.id),
    patchId: row.patch_id,
    supplierUserId: Number(row.supplier_user_id),
    description: row.description || "",
    totalWeight: row.total_weight === null ? 0 : Number(row.total_weight),
    unit: row.unit || "kg",
    createdAt: row.created_at,
    packingIds,
    matchedPackingCount: row.matched_packing_count === null ? 0 : Number(row.matched_packing_count),
  };
}

exports.list = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ error: "Only supplier accounts can access supplier traces." });
    }

    const userNameColumn = await resolveUserNameColumn();
    const growerNameExpr = userNameColumn
      ? `COALESCE(u.${userNameColumn}, 'Grower')`
      : "'Grower'";
    const operatingAreas = await getSupplierOperatingAreas(req.user.user_id);
    const hasFarmerProfiles = await farmerProfileTableExists();
    const farmerProfileFields = hasFarmerProfiles
      ? `
        fp.farm_location AS registered_farm_location,
        fp.land_size AS registered_land_size,
        fp.crop_type AS registered_crop_type,
      `
      : `
        NULL::text AS registered_farm_location,
        NULL::numeric AS registered_land_size,
        NULL::text AS registered_crop_type,
      `;
    const farmerProfileJoin = hasFarmerProfiles
      ? "LEFT JOIN farmer_profiles fp ON fp.user_id = pk.user_id"
      : "";

    const result = await db.query(`
      SELECT
        pk.id AS packing_id,
        pk.packing_date,
        pk.number_of_packages,
        pk.net_weight,
        pk.packing_size,
        pk.warehouse_name,
        pk.city,
        pk.state,
        pk.pincode,
        pk.country,
        pk.created_at AS packing_created_at,
        pl.id AS plantation_id,
        pl.name AS plantation_name,
        pl.location_description,
        pl.status AS plantation_status,
        pl.area_hectares,
        pl.created_at AS plantation_created_at,
        f.farm_id,
        f.farm_name,
        f.farm_location,
        u.user_id AS grower_user_id,
        ${growerNameExpr} AS grower_name,
        ${farmerProfileFields}
        h.id AS harvest_id,
        h.harvest_date,
        h.accepted_quantity,
        h.rejected_quantity,
        h.total_quantity,
        h.unit AS harvest_unit,
        c.id AS crop_id,
        c.crop_name,
        c.crop_variety,
        c.sowing_date,
        c.expected_harvest_date,
        stage_counts.crop_count,
        stage_counts.monitoring_count,
        stage_counts.verification_count,
        stage_counts.harvest_count,
        stage_counts.packing_count,
        assigned_patch.patch_id AS assigned_patch_id
      FROM packings pk
      INNER JOIN plantations pl ON pl.id = pk.plantation_id
      INNER JOIN users u ON u.user_id = pk.user_id
      LEFT JOIN farms f ON f.farm_id = pl.farm_id
      ${farmerProfileJoin}
      LEFT JOIN harvests h ON h.id = pk.harvest_id
      LEFT JOIN crops c ON c.id = h.crop_id
      LEFT JOIN LATERAL (
        SELECT
          (SELECT COUNT(*) FROM crops c2 WHERE c2.plantation_id = pl.id) AS crop_count,
          (SELECT COUNT(*) FROM monitoring_records m2 WHERE m2.plantation_id = pl.id) AS monitoring_count,
          (SELECT COUNT(*) FROM verifications v2 WHERE v2.plantation_id = pl.id) AS verification_count,
          (SELECT COUNT(*) FROM harvests h2 WHERE h2.plantation_id = pl.id) AS harvest_count,
          (SELECT COUNT(*) FROM packings pk2 WHERE pk2.plantation_id = pl.id) AS packing_count
      ) stage_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT p.patch_id
        FROM patches p
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.items, '[]'::jsonb)) item
        WHERE NULLIF(item->>'packing_id', '') IS NOT NULL
          AND (item->>'packing_id') ~ '^[0-9]+$'
          AND (item->>'packing_id')::integer = pk.id
        ORDER BY p.created_at DESC
        LIMIT 1
      ) assigned_patch ON TRUE
      WHERE LOWER(COALESCE(u.role, '')) = 'farmer'
      ORDER BY pk.created_at DESC NULLS LAST, pk.id DESC
    `);

    let traces = result.rows.map(mapTraceRow);

    if (operatingAreas.length > 0) {
      traces = traces
        .map((trace) => {
          const matchedArea = getMatchedAreaLabel(trace, operatingAreas);
          return matchedArea ? { ...trace, matchedArea } : null;
        })
        .filter(Boolean);
    }

    return res.json({
      operatingAreas,
      traces,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.lookupGrower = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ error: "Only supplier accounts can access grower lookup." });
    }

    const growerId = Number(req.params.growerId);
    if (!Number.isInteger(growerId) || growerId <= 0) {
      return res.status(400).json({ error: "Valid grower ID is required." });
    }

    const userNameColumn = await resolveUserNameColumn();
    const growerNameExpr = userNameColumn
      ? `COALESCE(u.${userNameColumn}, 'Grower')`
      : "'Grower'";

    const growerResult = await db.query(
      `
      SELECT
        u.user_id AS grower_user_id,
        ${growerNameExpr} AS grower_name,
        COALESCE(u.account_type, u.role, 'grower') AS account_type
      FROM users u
      WHERE u.user_id = $1
      LIMIT 1
      `,
      [growerId],
    );

    const grower = growerResult.rows[0];
    if (!grower) {
      return res.status(404).json({ error: "Grower not found." });
    }

    const hasFarmerProfiles = await farmerProfileTableExists();
    const farmerProfileFields = hasFarmerProfiles
      ? `
        fp.farm_location AS registered_farm_location,
        fp.land_size AS registered_land_size,
        fp.crop_type AS registered_crop_type,
      `
      : `
        NULL::text AS registered_farm_location,
        NULL::numeric AS registered_land_size,
        NULL::text AS registered_crop_type,
      `;
    const farmerProfileJoin = hasFarmerProfiles
      ? "LEFT JOIN farmer_profiles fp ON fp.user_id = pk.user_id"
      : "";

    const plantationsResult = await db.query(
      `
      SELECT
        pl.id AS plantation_id,
        pl.name AS plantation_name,
        pl.location_description,
        pl.status AS plantation_status,
        pl.area_hectares,
        pl.created_at AS plantation_created_at,
        f.farm_id,
        f.farm_name,
        f.farm_location,
        stage_counts.crop_count,
        stage_counts.monitoring_count,
        stage_counts.verification_count,
        stage_counts.harvest_count,
        stage_counts.packing_count
      FROM plantations pl
      LEFT JOIN farms f ON f.farm_id = pl.farm_id
      LEFT JOIN LATERAL (
        SELECT
          (SELECT COUNT(*) FROM crops c2 WHERE c2.plantation_id = pl.id) AS crop_count,
          (SELECT COUNT(*) FROM monitoring_records m2 WHERE m2.plantation_id = pl.id) AS monitoring_count,
          (SELECT COUNT(*) FROM verifications v2 WHERE v2.plantation_id = pl.id) AS verification_count,
          (SELECT COUNT(*) FROM harvests h2 WHERE h2.plantation_id = pl.id) AS harvest_count,
          (SELECT COUNT(*) FROM packings pk2 WHERE pk2.plantation_id = pl.id) AS packing_count
      ) stage_counts ON TRUE
      WHERE pl.user_id = $1
      ORDER BY pl.created_at DESC NULLS LAST, pl.id DESC
      `,
      [growerId],
    );

    const tracesResult = await db.query(
      `
      SELECT
        pk.id AS packing_id,
        pk.packing_date,
        pk.number_of_packages,
        pk.net_weight,
        pk.packing_size,
        pk.warehouse_name,
        pk.city,
        pk.state,
        pk.pincode,
        pk.country,
        pk.created_at AS packing_created_at,
        pl.id AS plantation_id,
        pl.name AS plantation_name,
        pl.location_description,
        pl.status AS plantation_status,
        pl.area_hectares,
        pl.created_at AS plantation_created_at,
        f.farm_id,
        f.farm_name,
        f.farm_location,
        u.user_id AS grower_user_id,
        ${growerNameExpr} AS grower_name,
        ${farmerProfileFields}
        h.id AS harvest_id,
        h.harvest_date,
        h.accepted_quantity,
        h.rejected_quantity,
        h.total_quantity,
        h.unit AS harvest_unit,
        c.id AS crop_id,
        c.crop_name,
        c.crop_variety,
        c.sowing_date,
        c.expected_harvest_date,
        stage_counts.crop_count,
        stage_counts.monitoring_count,
        stage_counts.verification_count,
        stage_counts.harvest_count,
        stage_counts.packing_count,
        assigned_patch.patch_id AS assigned_patch_id
      FROM packings pk
      INNER JOIN plantations pl ON pl.id = pk.plantation_id
      INNER JOIN users u ON u.user_id = pk.user_id
      LEFT JOIN farms f ON f.farm_id = pl.farm_id
      ${farmerProfileJoin}
      LEFT JOIN harvests h ON h.id = pk.harvest_id
      LEFT JOIN crops c ON c.id = h.crop_id
      LEFT JOIN LATERAL (
        SELECT
          (SELECT COUNT(*) FROM crops c2 WHERE c2.plantation_id = pl.id) AS crop_count,
          (SELECT COUNT(*) FROM monitoring_records m2 WHERE m2.plantation_id = pl.id) AS monitoring_count,
          (SELECT COUNT(*) FROM verifications v2 WHERE v2.plantation_id = pl.id) AS verification_count,
          (SELECT COUNT(*) FROM harvests h2 WHERE h2.plantation_id = pl.id) AS harvest_count,
          (SELECT COUNT(*) FROM packings pk2 WHERE pk2.plantation_id = pl.id) AS packing_count
      ) stage_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT p.patch_id
        FROM patches p
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.items, '[]'::jsonb)) item
        WHERE NULLIF(item->>'packing_id', '') IS NOT NULL
          AND (item->>'packing_id') ~ '^[0-9]+$'
          AND (item->>'packing_id')::integer = pk.id
        ORDER BY p.created_at DESC
        LIMIT 1
      ) assigned_patch ON TRUE
      WHERE pk.user_id = $1
      ORDER BY pk.created_at DESC NULLS LAST, pk.id DESC
      `,
      [growerId],
    );

    const batchesResult = await db.query(
      `
      SELECT
        p.id,
        p.patch_id,
        p.description,
        p.total_weight,
        p.unit,
        p.items,
        p.created_at,
        p.user_id AS supplier_user_id,
        COUNT(DISTINCT pk.id) AS matched_packing_count
      FROM patches p
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.items, '[]'::jsonb)) item
      INNER JOIN packings pk
        ON (item->>'packing_id') ~ '^[0-9]+$'
        AND (item->>'packing_id')::integer = pk.id
      WHERE pk.user_id = $1
      GROUP BY p.id, p.patch_id, p.description, p.total_weight, p.unit, p.items, p.created_at, p.user_id
      ORDER BY p.created_at DESC NULLS LAST, p.id DESC
      `,
      [growerId],
    );

    return res.json({
      grower: {
        growerUserId: Number(grower.grower_user_id),
        growerName: grower.grower_name || "Grower",
        accountType: grower.account_type || "grower",
      },
      plantations: plantationsResult.rows.map(mapPlantationRow),
      traces: tracesResult.rows.map(mapTraceRow),
      batches: batchesResult.rows.map(mapBatchRow),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
