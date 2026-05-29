import "../styles/ShrimpProduction.css";

const SHRIMP_OPTIONS = ["Vannamei Shrimp", "Tiger Prawn", "Scampi", "Giant Freshwater Prawn", "Other"];
const SHRIMP_MONITORING = ["Water Quality", "Feed Monitoring", "Salinity Check", "Oxygen Level", "Disease Detection", "Aeration", "Other"];
const WATER_TYPE_OPTIONS = ["Fresh Water", "Brackish Water", "Marine Water", "Other"];

export const SHRIMP_PRODUCTION_CONFIG = {
  value: "shrimp",
  label: "Shrimp / Prawn Aquaculture",
  badge: "Aquaculture",
  badgeClass: "shrimp",
  themeClass: "production-theme-shrimp",
  nameLabel: "Pond / Farm Name",
  namePlaceholder: "e.g. Coastal Prawn Farm",
  locationLabel: "Farm Location",
  locationPlaceholder: "e.g. Chilika, Odisha",
  mode: "shrimp",
  crop: "Pond",
  crops: "Ponds",
  variety: "Hatchery / Seed Batch",
  varietyPlaceholder: "e.g. SIS Hatchery Batch-22",
  startDateLabel: "Stocking Date *",
  expectedDateLabel: "Expected Harvest Date",
  startVerb: "Stocked",
  itemTypeLabel: "Species Cultured",
  options: SHRIMP_OPTIONS,
  monitoring: SHRIMP_MONITORING,
};

export function createShrimpInitialFields() {                      
  return {
    pondSize: "",
    waterType: "",
    hatcherySource: "",
  };
}

export function buildShrimpDetails(form) {
  return {
    "Pond Size": form.pondSize,
    "Water Type": form.waterType,
    "Hatchery Source": form.hatcherySource,
  };
}

export default function ShrimpProductionFields({ form, setForm }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="shrimp-production-fields production-fields">
      <div className="field-wrap">
        <label className="field-label">Pond Size</label>
        <input
          className="input"
          placeholder="e.g. 1.5 acre, 6000 sq ft"
          value={form.pondSize}
          onChange={(event) => update("pondSize", event.target.value)}
        />
      </div>
      <div className="field-wrap">
        <label className="field-label">Water Type</label>
        <select className="input" value={form.waterType} onChange={(event) => update("waterType", event.target.value)}>
          <option value="">Select water type...</option>
          {WATER_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>
      <div className="field-wrap">
        <label className="field-label">Hatchery Source</label>
        <input
          className="input"
          placeholder="e.g. certified hatchery name"
          value={form.hatcherySource}
          onChange={(event) => update("hatcherySource", event.target.value)}
        />
      </div>
    </div>
  );
}
