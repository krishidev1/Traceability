import { useEffect, useState } from "react";
import {
  FiClock,
  FiCompass,
  FiLayers,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { traceabilityApi } from "../api/traceabilityApi";
import "../styles/SupplierDashboard.css";

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return parsed.toLocaleString("en-IN");
};

const SupplierDashboard = () => {
  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: "",
    traces: [],
    operatingAreas: [],
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadSupplierDashboard = async () => {
      try {
        const data = await traceabilityApi.listSupplierFarmTraces();
        if (!isMounted) return;

        setDashboardState({
          loading: false,
          error: "",
          traces: Array.isArray(data?.traces) ? data.traces : [],
          operatingAreas: Array.isArray(data?.operatingAreas)
            ? data.operatingAreas
            : [],
        });
      } catch (error) {
        if (!isMounted) return;

        setDashboardState({
          loading: false,
          error:
            error.message ||
            "Unable to load supplier dashboard data right now.",
          traces: [],
          operatingAreas: [],
        });
      }
    };

    loadSupplierDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const traces = dashboardState.traces;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTraces = traces.filter((trace) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "available"
          ? !trace.assignedPatchId
          : Boolean(trace.assignedPatchId);

    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      trace.plantationName,
      trace.farmName,
      trace.growerName,
      trace.cropName,
      trace.cropVariety,
      trace.originLocation,
      trace.matchedArea,
      trace.packingCity,
      trace.packingState,
      trace.warehouseName,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const availableCount = traces.filter((trace) => !trace.assignedPatchId).length;
  const batchedCount = traces.length - availableCount;
  const uniqueGrowers = new Set(
    traces.map((trace) => trace.growerUserId).filter(Boolean),
  ).size;
  const totalWeight = traces.reduce(
    (sum, trace) => sum + (Number(trace.netWeight) || 0),
    0,
  );
  const areaLabels = dashboardState.operatingAreas
    .map((area) =>
      [area.village, area.district, area.state, area.pincode]
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean);

  return (
    <div className="supplier-dashboard-page">
      <section className="supplier-dashboard-hero">
        <div className="supplier-dashboard-copy">
          <div className="supplier-dashboard-kicker">Supplier Dashboard</div>
          <h1>All Farm Traces In Your Operating Areas</h1>
          <p>
            Monitor farmer-side farm traces mapped to your sourcing locations,
            review harvest and packing readiness, and manage your sourcing view
            from one dashboard.
          </p>
          <div className="supplier-dashboard-actions">
            <div className="supplier-dashboard-note">
              Live data is matched against supplier registration locations and
              farmer farm records.
            </div>
          </div>
        </div>

        <div className="supplier-hero-panel">
          <div className="supplier-hero-card">
            <span className="supplier-hero-label">Tracked Regions</span>
            <strong>{areaLabels.length || 0}</strong>
            <p>Locations from your supplier registration profile.</p>
          </div>
          <div className="supplier-hero-card">
            <span className="supplier-hero-label">Farm Traces</span>
            <strong>{formatNumber(traces.length)}</strong>
            <p>Farmer-origin traces visible to your supplier account.</p>
          </div>
        </div>
      </section>

      <section className="supplier-stat-grid">
        <article className="supplier-stat-card">
          <span className="supplier-stat-icon accent-green">
            <FiPackage />
          </span>
          <div>
            <h3>{formatNumber(availableCount)}</h3>
            <p>Available packings</p>
          </div>
        </article>

        <article className="supplier-stat-card">
          <span className="supplier-stat-icon accent-blue">
            <FiUsers />
          </span>
          <div>
            <h3>{formatNumber(uniqueGrowers)}</h3>
            <p>Growers connected</p>
          </div>
        </article>

        <article className="supplier-stat-card">
          <span className="supplier-stat-icon accent-amber">
            <FiTruck />
          </span>
          <div>
            <h3>{formatNumber(totalWeight)} kg</h3>
            <p>Total packed quantity</p>
          </div>
        </article>

        <article className="supplier-stat-card">
          <span className="supplier-stat-icon accent-slate">
            <FiLayers />
          </span>
          <div>
            <h3>{formatNumber(batchedCount)}</h3>
            <p>Already batched</p>
          </div>
        </article>
      </section>

      <section className="supplier-toolbar">
        <div className="supplier-search">
          <FiSearch />
          <input
            type="search"
            placeholder="Search by grower, crop, farm, warehouse, or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          className="supplier-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All traces</option>
          <option value="available">Available only</option>
          <option value="batched">Already batched</option>
        </select>
      </section>

      {areaLabels.length > 0 && (
        <section className="supplier-region-strip">
          {areaLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="supplier-region-pill">
              <FiCompass />
              {label}
            </span>
          ))}
        </section>
      )}

      {dashboardState.loading ? (
        <section className="supplier-feedback-card">
          <h3>Loading supplier dashboard...</h3>
          <p>We are collecting all farm traces linked to your sourcing areas.</p>
        </section>
      ) : dashboardState.error ? (
        <section className="supplier-feedback-card error">
          <h3>Supplier dashboard unavailable</h3>
          <p>{dashboardState.error}</p>
        </section>
      ) : filteredTraces.length === 0 ? (
        <section className="supplier-feedback-card">
          <h3>No farm traces found yet</h3>
          <p>
            Once farmer farms and packings match your supplier operating areas,
            they will appear here automatically.
          </p>
        </section>
      ) : (
        <section className="supplier-trace-grid-dashboard">
          {filteredTraces.map((trace) => {
            const isAvailable = !trace.assignedPatchId;

            return (
              <article key={trace.packingId} className="supplier-trace-card-dashboard">
                <div className="supplier-trace-header">
                  <div>
                    <div className="supplier-trace-kicker">
                      <FiShoppingBag />
                      {trace.cropName || "Crop"} trace
                    </div>
                    <h3>{trace.plantationName || trace.farmName || "Farm Trace"}</h3>
                    <p>{trace.growerName || "Grower"}</p>
                  </div>

                  <span
                    className={`supplier-trace-status-badge ${isAvailable ? "available" : "batched"}`}
                  >
                    {isAvailable ? "Available" : "Batched"}
                  </span>
                </div>

                <div className="supplier-trace-metadata">
                  <div className="supplier-meta-item">
                    <span>Farm</span>
                    <strong>{trace.farmName || "Not available"}</strong>
                  </div>
                  <div className="supplier-meta-item">
                    <span>Crop Variety</span>
                    <strong>{trace.cropVariety || "Standard"}</strong>
                  </div>
                  <div className="supplier-meta-item">
                    <span>Packages</span>
                    <strong>{formatNumber(trace.numPackages)}</strong>
                  </div>
                  <div className="supplier-meta-item">
                    <span>Net Weight</span>
                    <strong>{formatNumber(trace.netWeight)} kg</strong>
                  </div>
                </div>

                <div className="supplier-trace-location">
                  <div className="supplier-location-row">
                    <FiMapPin />
                    <span>{trace.originLocation || "Location not available"}</span>
                  </div>
                  {trace.matchedArea && (
                    <div className="supplier-match-pill">
                      Matched area: {trace.matchedArea}
                    </div>
                  )}
                </div>

                <div className="supplier-trace-timeline-dashboard">
                  <div className="supplier-timeline-item">
                    <FiClock />
                    <div>
                      <span>Harvest Date</span>
                      <strong>{formatDate(trace.harvestDate)}</strong>
                    </div>
                  </div>
                  <div className="supplier-timeline-item">
                    <FiPackage />
                    <div>
                      <span>Packing Date</span>
                      <strong>{formatDate(trace.packingDate)}</strong>
                    </div>
                  </div>
                </div>

                <div className="supplier-trace-footer-dashboard">
                  <div className="supplier-footer-chip">
                    Warehouse: {trace.warehouseName || "Not assigned"}
                  </div>
                  <div className="supplier-footer-chip">
                    Status: {isAvailable ? "Ready for sourcing" : "Already linked"}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default SupplierDashboard;


