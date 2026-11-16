import { useEffect } from "react";

const OPTIONS = {
  cosmeticGrade: ["Grade A", "Grade B", "Grade C", "Fair"],
  bodyCondition: ["Excellent", "Good (Minor Scratches)", "Fair", "Damaged"],
  waterDamage: ["Not Detected", "Liquid Indicator Triggered"],
  warranty: ["3 Months", "6 Months", "12 Months", "24 Months"],
};

const sections = [
  ["Product Identification", [
    ["Passport ID", "passportId"], ["Product Category", "productCategory"], ["Brand Name", "brandName"], ["Model Name", "modelName"], ["Model Number", "modelNumber"], ["IMEI Number", "imeiNumber"], ["Serial Number", "serialNumber"], ["Manufacturing Date", "manufacturingDate", "date"], ["Device Registration Date", "deviceRegistrationDate", "date"],
  ]],
  ["Technical Specifications", [
    ["Operating System & Version", "operatingSystemVersion"], ["Processor Info", "processorInfo"], ["RAM Capacity", "ramCapacity"], ["Internal Storage", "internalStorage"], ["Display Specifications", "displaySpecifications"], ["Charging Connector Type", "chargingConnectorType"],
  ]],
  ["Physical Condition & Cosmetics", [
    ["Overall Cosmetic Grade", "cosmeticGrade", "select"], ["Screen & Body Condition", "bodyCondition", "select"], ["Water Damage Status", "waterDamageStatus", "select"],
  ]],
  ["Battery Health & Verification", [
    ["Battery Health (%)", "batteryHealth"], ["Battery Capacity (mAh)", "batteryCapacity"], ["Battery Cycle Count", "batteryCycleCount"], ["Battery Replacement Status", "batteryReplacementStatus"], ["Battery Safety Test", "batterySafetyTest"],
  ]],
  ["Component & Repair History Matrix", [
    ["Repaired / Replaced Parts", "repairedReplacedParts"], ["Refurbishment Center & ID", "refurbishmentCenterId"], ["Technician Identifier", "technicianIdentifier"], ["Refurbishment Date", "refurbishmentDate", "date"],
  ]],
  ["Software, Security & QA Checks", [
    ["Security Patch Level", "securityPatchLevel"], ["Data Erasure Status", "dataErasureStatus"], ["Bootloader Root Status", "bootloaderRootStatus"], ["Hardware Diagnostic Pass", "hardwareDiagnosticPass"], ["Final Quality Score", "finalQualityScore"],
  ]],
  ["Environmental, Commercial & Warranty Specs", [
    ["Device Lifecycle Status", "deviceLifecycleStatus"], ["Component Reused Count", "componentReusedCount"], ["E-Waste Diverted Amount", "ewasteDivertedAmount"], ["Refurbishment Cost Value", "refurbishmentCostValue"], ["Resale Price", "resalePrice"], ["Warranty Period Length", "warrantyPeriodLength", "select"], ["Warranty Start Date", "warrantyStartDate", "date"], ["Warranty End Date", "warrantyEndDate", "date"],
  ]],
  ["Compliance Certificates & Blockchain Registry Architecture", [
    ["EU Registry QSeal Status", "euRegistryQsealStatus"], ["CE Declaration of Conformity (DoC)", "ceDeclarationUrl"],
  ]],
];

const AUTO_FIELDS = new Set(["passportId", "productCategory", "deviceRegistrationDate"]);
const FIELD_EXAMPLES = {
  brandName: "Samsung",
  modelName: "Galaxy A54 5G",
  modelNumber: "SM-A546E",
  imeiNumber: "356938035643809",
  serialNumber: "RZ8W123ABCD",
  manufacturingDate: "2025-03-15",
  operatingSystemVersion: "Android 14 (One UI 6.1)",
  processorInfo: "Exynos 1380, Octa-core",
  ramCapacity: "8 GB",
  internalStorage: "128 GB",
  displaySpecifications: "6.4 in AMOLED, 120 Hz",
  chargingConnectorType: "USB-C",
  batteryHealth: "92",
  batteryCapacity: "5000",
  batteryCycleCount: "180",
  batteryReplacementStatus: "Original battery",
  batterySafetyTest: "Passed - no swelling or overheating",
  repairedReplacedParts: "Display and battery replaced with OEM parts",
  refurbishmentCenterId: "TraceConnect Mobile Lab | BLR-01",
  technicianIdentifier: "TECH-042",
  refurbishmentDate: "2026-11-12",
  securityPatchLevel: "2026-10-01",
  dataErasureStatus: "Factory reset and verified data wipe",
  bootloaderRootStatus: "Bootloader locked; not rooted",
  hardwareDiagnosticPass: "Passed all hardware checks",
  finalQualityScore: "92",
  deviceLifecycleStatus: "Refurbished - ready for resale",
  componentReusedCount: "3",
  ewasteDivertedAmount: "0.18",
  refurbishmentCostValue: "12500",
  resalePrice: "16800",
  warrantyStartDate: "2026-11-15",
  warrantyEndDate: "2027-05-15",
  euRegistryQsealStatus: "Signed",
  ceDeclarationUrl: "https://example.com/certificates/CE-MOB-2026-001.pdf",
};

function createInitial() {
  const result = { passportId: "Auto-generated", productCategory: "Smartphone", deviceRegistrationDate: new Date().toISOString().slice(0, 10) };
  sections.forEach(([, fields]) => fields.forEach(([, key]) => { if (!(key in result)) result[key] = ""; }));
  return result;
}

export function createMobileRefurbishableInitialFields() { return createInitial(); }
export function buildMobileRefurbishableDetails(form) { return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value])); }
export const MOBILE_REFURBISHABLE_SECTIONS = sections.map(([name]) => name);
export const MOBILE_REFURBISHABLE_SECTION_FIELDS = sections;

function Field({ label, keyName, type = "text", form, setForm, readOnly = false, options = [] }) {
  const value = form[keyName] || "";
  const update = (event) => setForm((current) => ({ ...current, [keyName]: event.target.value }));
  const sample = FIELD_EXAMPLES[keyName] || (keyName.toLowerCase().includes("id") ? "MOB-2026-001" : type === "number" ? "95" : `Sample ${label}`);
  return (
    <div className="field-wrap">
      <label className="field-label">{label}{readOnly ? " (Auto)" : ""}</label>
      {type === "select" ? (
        <select className="input" value={value} onChange={update} disabled={readOnly}>
          <option value="">Select... (e.g. {options[0]})</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input
          className="input"
          type={type}
          value={value}
          onChange={update}
          readOnly={readOnly}
          placeholder={type === "date" ? undefined : `e.g. ${sample}`}
        />
      )}
      {type === "date" && !value && <small className="production-field-example">Example: {sample}</small>}
    </div>
  );
}

export default function MobileRefurbishableProductionFields({ form, setForm, activeSection, productName, location, productionUnitId }) {
  const [sectionName, fields] = sections[activeSection] || sections[0];
  useEffect(() => { setForm((current) => ({ ...current, productionUnitId, productName, productionLocation: location })); }, [location, productName, productionUnitId, setForm]);
  const optionMap = { cosmeticGrade: OPTIONS.cosmeticGrade, bodyCondition: OPTIONS.bodyCondition, waterDamageStatus: OPTIONS.waterDamage, warrantyPeriodLength: OPTIONS.warranty };
  return <div className="kotpad-production-fields production-fields"><div className="form-section-label kotpad-section-label">{sectionName}</div><p className="muted">Add Process Evidence after saving this section to attach photos, reports, certificates, or diagnostic records.</p>{fields.map(([label, key, type]) => <Field key={key} label={label} keyName={key} type={type || (optionMap[key] ? "select" : "text")} options={optionMap[key]} readOnly={AUTO_FIELDS.has(key)} form={form} setForm={setForm} />)}</div>;
}
