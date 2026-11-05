import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiFilter,
  FiGrid,
  FiLayers,
  FiSearch,
} from "react-icons/fi";
import { downloadReportWorkbook } from "../utils/reportsWorkbook";
import "../styles/ReportsPage.css";

function categoryLabel(type) {
  switch (type) {
    case "kotpad_handloom": return "Fabric Batches";
    case "sambalpuri_bandha": return "Textile Batches";
    case "bee": return "Honey Batches";
    case "shrimp": return "Harvest Batches";
    default: return "Trace Items / Batches";
  }
}

function reportStatus(record, verifications) {
  const inspectionStatus = String(record.variety || "")
    .split(" | ")
    .map((part) => part.trim())
    .find((part) => part.startsWith("Inspection Status:"))
    ?.slice("Inspection Status:".length)
    .trim();
  if (inspectionStatus) return inspectionStatus;

  const inspection = verifications
    .filter((item) => Number(item.cropId) === Number(record.id))
    .sort((a, b) => String(b.inspectionDate || "").localeCompare(String(a.inspectionDate || "")))[0];
  if (inspection) return inspection.approved ? "Verified" : "Rejected";
  return "Pending inspection";
}

function normalizeUnit(value) {
  const unit = String(value || "unit").trim().toLowerCase();
  if (["kg", "kgs", "kilogram", "kilograms"].includes(unit)) return "kg";
  if (["piece", "pieces", "pc", "pcs"].includes(unit)) return "piece";
  if (["litre", "litres", "liter", "liters"].includes(unit)) return "litre";
  if (["ton", "tons", "tonne", "tonnes"].includes(unit)) return "ton";
  return unit;
}

function unitLabel(unit, quantity) {
  if (unit === "kg") return "kg";
  if (unit === "piece") return quantity === 1 ? "piece" : "pieces";
  if (unit === "litre") return quantity === 1 ? "litre" : "litres";
  if (unit === "ton") return quantity === 1 ? "ton" : "tons";
  return quantity === 1 ? unit : `${unit}s`;
}

function formatQuantities(records, field) {
  const totals = new Map();
  records.forEach((record) => {
    const unit = normalizeUnit(record.unit);
    totals.set(unit, (totals.get(unit) || 0) + (Number(record[field]) || 0));
  });
  if (!totals.size) return "—";
  return Array.from(totals, ([unit, total]) => `${total.toLocaleString()} ${unitLabel(unit, total)}`).join(" · ");
}

function ReportTable({ headers, rows, emptyMessage }) {
  return (
    <div className="table-wrap">
      <table className="data-table reports-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows : <tr><td className="table-empty" colSpan={headers.length}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage({
  navigate,
  userRole,
  plantations,
  crops,
  harvests,
  verification,
  loading,
  backendError,
  productionTypes,
  getProductionTypeConfig,
  normalizeProductionType,
  getCompactCropSummary,
}) {
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [productionType, setProductionType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const dashboardRoute = userRole === "supplier" ? "/supplier" : "/grower";
  const plantationById = useMemo(
    () => new Map(plantations.map((plantation) => [Number(plantation.id), plantation])),
    [plantations],
  );
  const search = query.trim().toLowerCase();
  const startDate = useMemo(() => {
    if (dateRange === "all") return "";
    const start = new Date();
    if (dateRange === "year") start.setMonth(0, 1);
    else start.setDate(start.getDate() - Number(dateRange));
    return start.toISOString().slice(0, 10);
  }, [dateRange]);
  const dateMatches = (date) => !startDate || (Boolean(date) && String(date).slice(0, 10) >= startDate);
  const queryMatches = (...values) => !search || values.some((value) => String(value || "").toLowerCase().includes(search));
  const statusMatches = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (statusFilter === "active") return normalized.includes("active");
    if (statusFilter === "pending") return normalized.includes("pending");
    if (statusFilter === "verified") return normalized.includes("verified") || normalized.includes("approved");
    if (statusFilter === "rejected") return normalized.includes("reject");
    return true;
  };
  const basePlantations = plantations.filter((plantation) => (
    (productionType === "all" || normalizeProductionType(plantation.type) === productionType)
    && (statusFilter !== "active" || statusMatches(plantation.status))
  ));
  const baseIds = new Set(basePlantations.map((plantation) => Number(plantation.id)));
  const relatedMatches = new Set([
    ...crops
      .filter((crop) => baseIds.has(Number(crop.plantationId)) && dateMatches(crop.sowingDate))
      .filter((crop) => queryMatches(crop.name, crop.variety, crop.id))
      .map((crop) => Number(crop.plantationId)),
    ...harvests
      .filter((harvest) => baseIds.has(Number(harvest.plantationId)) && dateMatches(harvest.harvestDate))
      .filter((harvest) => queryMatches(harvest.harvestDate, harvest.unit, harvest.id))
      .map((harvest) => Number(harvest.plantationId)),
  ]);
  const filteredPlantations = basePlantations.filter((plantation) => (
    (dateMatches(plantation.createdAt) && queryMatches(plantation.name, plantation.location, plantation.type, plantation.id))
    || relatedMatches.has(Number(plantation.id))
  ));
  const visibleIds = new Set(filteredPlantations.map((plantation) => Number(plantation.id)));
  const filteredCrops = crops.filter((crop) => {
    const parent = plantationById.get(Number(crop.plantationId));
    return parent && visibleIds.has(Number(crop.plantationId))
      && dateMatches(crop.sowingDate)
      && (statusFilter === "active" || statusMatches(reportStatus(crop, verification)))
      && queryMatches(crop.name, crop.variety, crop.id, parent.name, parent.location);
  });
  const filteredHarvests = harvests.filter((harvest) => {
    const parent = plantationById.get(Number(harvest.plantationId));
    const status = Number(harvest.rejected) > 0 ? "Rejected" : Number(harvest.accepted) > 0 ? "Accepted" : "Pending";
    return parent && visibleIds.has(Number(harvest.plantationId))
      && dateMatches(harvest.harvestDate)
      && (statusFilter === "active" || statusMatches(status))
      && queryMatches(harvest.harvestDate, harvest.unit, harvest.id, parent.name, parent.location);
  });
  const filteredVerifications = verification.filter((item) => {
    const parent = plantationById.get(Number(item.plantationId));
    const status = item.approved ? "Verified" : "Rejected";
    return parent && visibleIds.has(Number(item.plantationId))
      && dateMatches(item.inspectionDate)
      && (statusFilter === "active" || statusMatches(status))
      && queryMatches(item.inspectionDate, item.health, item.id, parent.name, parent.location);
  });
  const activeCount = filteredPlantations.filter((plantation) => String(plantation.status || "").toLowerCase() === "active").length;
  const pendingCount = filteredCrops.filter((crop) => reportStatus(crop, verification).toLowerCase().includes("pending")).length;
  const verifiedCount = filteredCrops.filter((crop) => /verified|approved/i.test(reportStatus(crop, verification))).length;
  const rejectedCount = filteredCrops.filter((crop) => /reject/i.test(reportStatus(crop, verification))).length;
  const performance = new Map();
  filteredHarvests.forEach((harvest) => {
    const unit = normalizeUnit(harvest.unit);
    const current = performance.get(unit) || { total: 0, accepted: 0, rejected: 0 };
    current.total += Number(harvest.total) || 0;
    current.accepted += Number(harvest.accepted) || 0;
    current.rejected += Number(harvest.rejected) || 0;
    performance.set(unit, current);
  });
  const selectedCategory = productionType === "all"
    ? "Trace Items / Batches"
    : categoryLabel(productionType);
  const emptyMessage = "No records match the selected filters.";

  const exportWorkbook = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const sheetRows = [
        {
          name: "Summary",
          headers: ["Report", "Value"],
          records: [
            { Report: "Date range", Value: dateRange === "all" ? "All time" : dateRange === "year" ? "This year" : `Last ${dateRange} days` },
            { Report: "Production type", Value: productionType === "all" ? "All production types" : categoryLabel(productionType) },
            { Report: "Status filter", Value: statusFilter },
            { Report: "Production units", Value: filteredPlantations.length },
            { Report: "Trace items / batches", Value: filteredCrops.length },
            { Report: "Accepted quantities", Value: formatQuantities(filteredHarvests, "accepted") },
            { Report: "Rejected quantities", Value: formatQuantities(filteredHarvests, "rejected") },
            { Report: "Generated", Value: new Date().toLocaleString() },
          ],
        },
        {
          name: "Production Units",
          headers: ["Production Unit ID", "Production Unit Name", "Category", "Production Type", "Location", "Status", "Created Date"],
          records: filteredPlantations.map((item) => ({
            "Production Unit ID": item.id,
            "Production Unit Name": item.name,
            Category: getProductionTypeConfig(item.type).label,
            "Production Type": item.type,
            Location: item.location,
            Status: item.status,
            "Created Date": item.createdAt,
          })),
        },
        {
          name: "Trace Items",
          headers: ["Trace Item ID", "Production Unit ID", "Production Unit", "Category", "Product / Batch Name", "Batch / Product Details", "Sowing / Registration Date", "Expected Harvest", "Inspection Status"],
          records: filteredCrops.map((item) => ({
            "Trace Item ID": item.id,
            "Production Unit ID": item.plantationId,
            "Production Unit": plantationById.get(Number(item.plantationId))?.name,
            Category: categoryLabel(plantationById.get(Number(item.plantationId))?.type),
            "Product / Batch Name": item.name,
            "Batch / Product Details": item.variety,
            "Sowing / Registration Date": item.sowingDate,
            "Expected Harvest": item.expectedHarvest,
            "Inspection Status": reportStatus(item, verification),
          })),
        },
        {
          name: "Harvest Records",
          headers: ["Harvest Record ID", "Production Unit ID", "Production Unit", "Trace Item ID", "Harvest Date", "Total Quantity", "Accepted Quantity", "Rejected Quantity", "Unit"],
          records: filteredHarvests.map((item) => ({
            "Harvest Record ID": item.id,
            "Production Unit ID": item.plantationId,
            "Production Unit": plantationById.get(Number(item.plantationId))?.name,
            "Trace Item ID": item.cropId,
            "Harvest Date": item.harvestDate,
            "Total Quantity": item.total,
            "Accepted Quantity": item.accepted,
            "Rejected Quantity": item.rejected,
            Unit: item.unit,
          })),
        },
        {
          name: "Verifications",
          headers: ["Verification ID", "Production Unit ID", "Production Unit", "Trace Item ID", "Inspection Date", "Inspection Result", "Approved for Harvest", "Status"],
          records: filteredVerifications.map((item) => ({
            "Verification ID": item.id,
            "Production Unit ID": item.plantationId,
            "Production Unit": plantationById.get(Number(item.plantationId))?.name,
            "Trace Item ID": item.cropId,
            "Inspection Date": item.inspectionDate,
            "Inspection Result": item.health,
            "Approved for Harvest": item.approved ? "Yes" : "No",
            Status: item.approved ? "Verified" : "Rejected",
          })),
        },
      ];
      downloadReportWorkbook(
        sheetRows,
        `traceconnect-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error("Unable to export Reports workbook", error);
      setExportError("The Excel report could not be generated. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const viewDetails = (plantationId) => navigate(`/plantation/${plantationId}`);
  const viewButton = (plantationId) => (
    <button type="button" className="reports-view-button" onClick={() => viewDetails(plantationId)}>
      <FiEye /> View
    </button>
  );

  if (loading && !plantations.length && !crops.length && !harvests.length) {
    return <div className="reports-loading" role="status">Loading report data…</div>;
  }

  return (
    <div className="page-container reports-page analytics-dashboard">
      {backendError && <div className="reports-error" role="alert"><FiAlertTriangle /> {backendError}</div>}
      {loading && <div className="reports-sync" role="status">Syncing latest records…</div>}
      {exportError && <div className="reports-error" role="alert"><FiAlertTriangle /> {exportError}</div>}
      <button className="btn-back-minimal" onClick={() => navigate(dashboardRoute)}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <header className="reports-heading">
        <div>
          <span className="reports-eyebrow">Production insights</span>
          <h1>Reports &amp; Analytics</h1>
          <p className="page-subtitle">Monitor production units, traceable products, accepted output and harvest records.</p>
        </div>
        <button className="btn btn-primary reports-export" type="button" onClick={exportWorkbook} disabled={exporting}>
          <FiDownload /> {exporting ? "Preparing Workbook…" : "Export Excel Report"}
        </button>
      </header>

      <section className="reports-filters" aria-label="Report filters">
        <label className="reports-search">
          <FiSearch aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units, batches, QR details or locations" />
        </label>
        <label className="reports-filter-control">
          <FiCalendar aria-hidden="true" />
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Date range">
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="year">This year</option>
          </select>
        </label>
        <label className="reports-filter-control">
          <FiFilter aria-hidden="true" />
          <select value={productionType} onChange={(event) => setProductionType(event.target.value)} aria-label="Production type">
            <option value="all">All production types</option>
            {productionTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label className="reports-filter-control">
          <FiCheckCircle aria-hidden="true" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending inspection</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <span className="reports-live"><span /> Live data</span>
      </section>

      <section className="reports-kpi-grid" aria-label="Production summary">
        <article className="reports-kpi-card"><span className="reports-kpi-icon units"><FiGrid /></span><strong>{filteredPlantations.length.toLocaleString()}</strong><span>Production Units</span></article>
        <article className="reports-kpi-card"><span className="reports-kpi-icon batches"><FiLayers /></span><strong>{filteredCrops.length.toLocaleString()}</strong><span>{selectedCategory}</span></article>
        <article className="reports-kpi-card"><span className="reports-kpi-icon accepted"><FiCheckCircle /></span><strong className="reports-kpi-quantity">{formatQuantities(filteredHarvests, "accepted")}</strong><span>Accepted Quantity</span></article>
        <article className="reports-kpi-card"><span className="reports-kpi-icon rejected"><FiAlertTriangle /></span><strong className="reports-kpi-quantity">{formatQuantities(filteredHarvests, "rejected")}</strong><span>Rejected Quantity</span></article>
      </section>

      <section className="reports-performance report-panel">
        <div className="reports-section-heading"><div><h2>Harvest Performance</h2><p>Quantities stay grouped by their measurement unit.</p></div></div>
        {performance.size ? (
          <div className="reports-performance-list">
            {Array.from(performance, ([unit, values]) => {
              const acceptedPercent = values.total > 0 ? Math.min(100, values.accepted / values.total * 100) : 0;
              const rejectedPercent = values.total > 0 ? Math.min(100 - acceptedPercent, values.rejected / values.total * 100) : 0;
              return (
                <div className="reports-performance-item" key={unit}>
                  <div className="reports-performance-label"><strong>{unitLabel(unit, values.total)}</strong><span>{values.accepted.toLocaleString()} accepted / {values.total.toLocaleString()} total</span></div>
                  <div className="reports-progress-track" role="progressbar" aria-label={`${unit} accepted`} aria-valuenow={Math.round(acceptedPercent)} aria-valuemin={0} aria-valuemax={100}>
                    <span className="reports-progress-accepted" style={{ width: `${acceptedPercent}%` }} /><span className="reports-progress-rejected" style={{ width: `${rejectedPercent}%` }} />
                  </div>
                  <div className="reports-performance-legend"><span><i className="accepted-dot" /> Accepted {Math.round(acceptedPercent)}%</span><span><i className="rejected-dot" /> Rejected {Math.round(rejectedPercent)}%</span></div>
                </div>
              );
            })}
          </div>
        ) : <p className="reports-empty">{emptyMessage}</p>}
      </section>

      <section className="reports-overview-grid">
        <article className="reports-overview-card report-panel"><span className="reports-overview-icon units"><FiGrid /></span><h2>Production Unit Overview</h2><strong>{filteredPlantations.length} {filteredPlantations.length === 1 ? "Record" : "Records"}</strong><p>Registered production units, locations and current status.</p><span className="reports-status-pill active">{activeCount} Active</span></article>
        <article className="reports-overview-card report-panel"><span className="reports-overview-icon batches"><FiLayers /></span><h2>{selectedCategory}</h2><strong>{filteredCrops.length} {filteredCrops.length === 1 ? "Batch" : "Batches"}</strong><p>Batch records with inspection and verification status.</p><div className="reports-verification-counts"><span className="pending">{pendingCount} Pending</span><span className="verified">{verifiedCount} Verified</span><span className="rejected">{rejectedCount} Rejected</span></div></article>
      </section>

      <section className="reports-recent report-panel">
        <div className="reports-section-heading"><div><h2>Recent Harvest Records</h2><p>Latest results from the selected records.</p></div><button type="button" className="reports-text-button" onClick={() => document.getElementById("reports-harvests")?.scrollIntoView({ behavior: "smooth" })}>View all harvest records <FiArrowRight /></button></div>
        {filteredHarvests.length ? (
          <div className="reports-recent-list">
            {[...filteredHarvests].sort((a, b) => String(b.harvestDate || "").localeCompare(String(a.harvestDate || ""))).slice(0, 5).map((harvest) => (
              <button type="button" className="reports-recent-row" key={harvest.id} onClick={() => viewDetails(harvest.plantationId)}>
                <span><strong>{harvest.harvestDate || "Date not recorded"}</strong><small>{plantationById.get(Number(harvest.plantationId))?.name || "Production unit"}</small></span>
                <span className={`reports-quantity-pill ${Number(harvest.rejected) > 0 ? "pending" : "active"}`}>{Number(harvest.accepted) || 0} / {Number(harvest.total) || 0} {harvest.unit}</span>
              </button>
            ))}
          </div>
        ) : <p className="reports-empty">{emptyMessage}</p>}
      </section>

      <section className="reports-records-section report-panel">
        <div className="reports-section-heading"><div><h2>Production Unit Records</h2><p>{filteredPlantations.length} matching production unit records.</p></div></div>
        <ReportTable
          headers={["Production Unit", "Category", "Location", "Status", "Created", "Action"]}
          emptyMessage={emptyMessage}
          rows={filteredPlantations.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{getProductionTypeConfig(item.type).label}</td><td>{item.location || "—"}</td><td><span className={`reports-table-status ${String(item.status).toLowerCase()}`}>{item.status}</span></td><td>{item.createdAt || "—"}</td><td>{viewButton(item.id)}</td></tr>)}
        />
      </section>

      <section className="reports-records-section report-panel">
        <div className="reports-section-heading"><div><h2>{selectedCategory}</h2><p>{filteredCrops.length} matching trace item records.</p></div></div>
        <ReportTable
          headers={["Product / Batch", "Production Unit", "Batch Details", "Inspection", "Date", "Action"]}
          emptyMessage={emptyMessage}
          rows={filteredCrops.map((item) => {
            const parent = plantationById.get(Number(item.plantationId));
            const summary = getCompactCropSummary(parent?.type, item.variety);
            const status = reportStatus(item, verification);
            return <tr key={item.id}><td><strong>{item.name || `Batch ${item.id}`}</strong></td><td>{parent?.name || "—"}</td><td><div className="report-variety-cell"><span>{summary.primary || item.variety || "—"}</span>{summary.tags.map((tag) => <span className="record-summary-chip" key={tag.label}>{tag.label.replace(" Verification", "")}: {tag.value}</span>)}</div></td><td><span className={`reports-table-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></td><td>{item.sowingDate || "—"}</td><td>{viewButton(item.plantationId)}</td></tr>;
          })}
        />
      </section>

      <section className="reports-records-section report-panel" id="reports-harvests">
        <div className="reports-section-heading"><div><h2>Harvest Records</h2><p>{filteredHarvests.length} matching harvest records.</p></div></div>
        <ReportTable
          headers={["Date", "Production Unit", "Total", "Accepted", "Rejected", "Action"]}
          emptyMessage={emptyMessage}
          rows={filteredHarvests.map((item) => <tr key={item.id}><td>{item.harvestDate || "—"}</td><td>{plantationById.get(Number(item.plantationId))?.name || "—"}</td><td>{Number(item.total).toLocaleString()} {item.unit}</td><td className="reports-accepted-value">{Number(item.accepted).toLocaleString()} {item.unit}</td><td className="reports-rejected-value">{Number(item.rejected).toLocaleString()} {item.unit}</td><td>{viewButton(item.plantationId)}</td></tr>)}
        />
      </section>
    </div>
  );
}
