import "../styles/BeeProduction.css";

const BEE_OPTIONS = ["Honey Bee", "Apis Cerana", "Apis Mellifera", "Stingless Bee", "Other"];

export const BEE_PRODUCTION_CONFIG = {
  value: "bee",
  label: "Bee Farming / Apiculture",
  badge: "Apiculture",
  badgeClass: "bee",
  themeClass: "production-theme-bee",
  nameLabel: "Apiary Name",
  namePlaceholder: "e.g. Hill Apiary Cluster",
  locationLabel: "Apiary Location",
  locationPlaceholder: "e.g. Koraput, Odisha",
  mode: "bee",
  crop: "Apiary",
  crops: "Apiaries",
  variety: "Bee Species",
  varietyPlaceholder: "e.g. Apis Cerana, Apis Mellifera",
  startDateLabel: "Apiary Start Date *",
  expectedDateLabel: "Expected Honey Harvest Date",
  startVerb: "Started",
  itemTypeLabel: "Bee Species",
  options: BEE_OPTIONS,
  monitoring: [
    "Hive Inspection",
    "Disease Check",
    "Feeding Records",
    "Temperature Monitoring",
    "Humidity Monitoring",
    "FSSAI License",
    "Organic Certification",
    "Lab Reports",
    "Purity Verification",
    "Other",
  ],
};

export function createBeeInitialFields() {
  return {
    numberOfHives: "",
    queenBeeAge: "",
    floralSource: "",
  };
}

export function buildBeeDetails(form) {
  return {
    "Number of Hives": form.numberOfHives,
    "Queen Bee Age": form.queenBeeAge,
    "Floral Source": form.floralSource,
  };
}

export default function BeeProductionFields({ form, setForm }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="bee-production-fields production-fields">
      <div className="field-wrap">
        <label className="field-label">Number of Hives</label>
        <input
          className="input"
          type="number"
          placeholder="e.g. 25"
          value={form.numberOfHives}
          onChange={(event) => update("numberOfHives", event.target.value)}
        />
      </div>
      <div className="field-wrap">
        <label className="field-label">Queen Bee Age</label>
        <input
          className="input"
          placeholder="e.g. 8 months"
          value={form.queenBeeAge}
          onChange={(event) => update("queenBeeAge", event.target.value)}
        />
      </div>
      <div className="field-wrap">
        <label className="field-label">Floral Source</label>
        <input
          className="input"
          placeholder="e.g. mustard, forest flora"
          value={form.floralSource}
          onChange={(event) => update("floralSource", event.target.value)}
        />
      </div>
    </div>
  );
}
