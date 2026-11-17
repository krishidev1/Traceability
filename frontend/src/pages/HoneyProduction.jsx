import "../styles/HoneyProduction.css";
import { useEffect } from "react";
import {
  EXTRACTION_METHODS,
  GI_STATUSES,
  HEALTH_STATUSES,
  HIVE_STATUSES,
  MIGRATION_OPTIONS,
  PRODUCER_TYPES,
  QUEEN_ORIGINS,
  QUEEN_STATUSES,
} from "./HoneyProductionConfig";

const FIELD_EXAMPLES = {
  producerName: "Lakshmi Devi",
  producerId: "APE/HO/042",
  associatedOrganisation: "Koraput Tribal Honey FPO",
  villageDistrictState: "Semiliguda, Koraput, Odisha",
  contactNumber: "+91 98765 43210",
  registrationLicenseDetails: "NBB/AP/2026/0142",
  numberOfApiaries: "3",
  totalHives: "120",
  apiaryIdName: "API-01 | Mahua Orchard",
  currentGpsLocation: "18.8123, 82.7106",
  totalHiveBoxes: "40",
  activeStrongColonies: "35",
  weakQuarantinedColonies: "5",
  lastInspectionTreatmentDate: "2026-11-10",
  floralNectarSource: "Neem, Mahua, and Eucalyptus",
  floweringForagingSeason: "March-June",
  compositeHiveId: "API-01-H01",
  breederNameBatchId: "GreenBee Apiaries | BB-026",
  queenIntroductionDate: "2026-08-15",
  queenMarkingId: "Yellow tag Q-014",
  harvestCollectionId: "HVT-2026-001",
  harvestDate: "2026-11-12",
  sourceApiaryHives: "API-01, Hives 01-12",
  harvestLocationGps: "18.8123, 82.7106",
  rawMoistureContent: "18.5",
  quantityHarvested: "125",
  processingLotId: "PROC-2026-001",
  linkedHarvestIds: "HVT-2026-001, HVT-2026-002",
  processingDate: "2026-11-13",
  processingUnitNameId: "Koraput Honey Unit | KHP-01",
  qualityTestingStatus: "Pending lab results",
  laboratoryReport: "honey-moisture-test-report.pdf",
  honeyBatchId: "HNY-KOR-2026-001",
  linkedProcessingLotId: "PROC-2026-001",
  packagingDate: "2026-11-14",
  netWeightPackSize: "500 g",
  bestBeforeDate: "2028-11-14",
  fssaiLicenseNumber: "12345678901234",
  qrCodeGeneration: "HNY-KOR-2026-001",
  giProductName: "Koraput Wild Forest Honey",
  giRegistrationNumber: "GI/AP/2026/001",
  registeredRegion: "Koraput, Odisha",
  authorisedUser: "AU-KOR-024",
  certifiedUserName: "Koraput Tribal Honey FPO",
};

function Field({ label, name, form, update, type = "text", placeholder = "", readOnly = false, hideReadOnlyExamples = false }) {
  const sample = hideReadOnlyExamples && readOnly
    ? ""
    : placeholder || FIELD_EXAMPLES[name] || (name.toLowerCase().includes("date") ? "2026-11-16" : type === "number" ? "25" : `Sample ${label}`);
  const exampleHint = sample && type === "date" ? `Example: ${sample}` : sample && type === "file" ? `Example file: ${sample}` : "";
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <input
        className="input"
        type={type}
        placeholder={type === "date" || type === "file" || !sample ? undefined : `e.g. ${sample}`}
        readOnly={readOnly}
        {...(type === "file" ? {} : { value: form[name] || "" })}
        onChange={(e) => update(name, type === "file" ? e.target.files?.[0]?.name || "" : e.target.value)}
      />
      {exampleHint && <small className="production-field-example">{exampleHint}</small>}
    </div>
  );
}

function SelectField({ label, name, options, form, update }) {
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <select className="input" value={form[name] || ""} onChange={(e) => update(name, e.target.value)}>
        <option value="">Select... (e.g. {options[0]})</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function BeeProductionFields({ form, setForm, activeSection = 0, profileName = "", profilePhone = "", profileRegistration = "", apiaryFarmName = "", producerLocation = "", productionId = "", isHoneyProduction = false }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value })); const common = { form, update, hideReadOnlyExamples: isHoneyProduction };
  useEffect(() => {
    setForm((current) => ({
      ...current,
      producerName: current.producerName || profileName,
      producerId: current.producerId || productionId || `APE/HO/${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
      apiaryFarmName: current.apiaryFarmName || apiaryFarmName,
      villageDistrictState: current.villageDistrictState || producerLocation,
      contactNumber: current.contactNumber || profilePhone,
      registrationLicenseDetails: current.registrationLicenseDetails || profileRegistration,
    }));
  }, [apiaryFarmName, productionId, profileName, profilePhone, profileRegistration, producerLocation, setForm]);
  const sections = [
    <><Field label="Beekeeper / Producer Name" name="producerName" {...common} readOnly /><Field label="Beekeeper / Producer ID" name="producerId" {...common} readOnly /><Field label="Associated FPO / Organisation" name="associatedOrganisation" {...common} /><Field label="Village / Block / District / State" name="villageDistrictState" {...common} readOnly /><Field label="Contact Number" name="contactNumber" {...common} type="tel" readOnly /><Field label="NBB / Apiary Registration Details" name="registrationLicenseDetails" {...common} /><Field label="Total Apiaries" name="numberOfApiaries" {...common} type="number" /><Field label="Total Hive Boxes Across Apiaries" name="totalHives" {...common} type="number" /><SelectField label="Producer Type" name="producerType" options={PRODUCER_TYPES} {...common} /></>,
    <></>,
    <><Field label="Harvest / Collection ID" name="harvestCollectionId" {...common} /><Field label="Harvest Date" name="harvestDate" {...common} type="date" /><Field label="Source Apiary & Hives" name="sourceApiaryHives" {...common} /><Field label="Harvest Location (GPS)" name="harvestLocationGps" {...common} /><Field label="Raw Moisture Content (%)" name="rawMoistureContent" {...common} type="number" /><Field label="Quantity Harvested (kg)" name="quantityHarvested" {...common} type="number" /></>,
    <><Field label="Processing Lot ID" name="processingLotId" {...common} /><Field label="Linked Harvest ID(s)" name="linkedHarvestIds" {...common} /><Field label="Processing Date" name="processingDate" {...common} type="date" /><Field label="Processing Unit Name & ID" name="processingUnitNameId" {...common} /><SelectField label="Extraction & Filtration Method" name="extractionFiltrationMethod" options={EXTRACTION_METHODS} {...common} /><Field label="Quality Testing Status" name="qualityTestingStatus" {...common} /><Field label="Lab Certificate (PDF)" name="laboratoryReport" {...common} type="file" /></>,
    <><Field label="Honey Batch ID" name="honeyBatchId" {...common} /><Field label="Linked Processing Lot ID" name="linkedProcessingLotId" {...common} /><Field label="Packaging Date" name="packagingDate" {...common} type="date" /><Field label="Net Weight per Pack Size (g / kg / ml / litres / tonnes)" name="netWeightPackSize" {...common} /><Field label="Best Before Date" name="bestBeforeDate" {...common} type="date" /><Field label="FSSAI License Number" name="fssaiLicenseNumber" {...common} /><Field label="Dynamic Batch QR Code" name="qrCodeGeneration" {...common} /></>,
  ];
  const apiaryCount = activeSection === 1
    ? Math.min(Math.max(Number(form.numberOfApiaries) || 1, 1), 20)
    : Math.min(Math.max(Number(form.numberOfApiaries) || 0, 0), 20);
  const updateApiary = (index, field, value) => setForm((current) => {
    const apiaryDetails = Array.from({ length: apiaryCount }, (_, i) => ({ ...(current.apiaryDetails?.[i] || {}) }));
    apiaryDetails[index][field] = value;
    return { ...current, apiaryDetails };
  });
  const apiaryFields = (apiary, index) => <div className="honey-apiary-repeat-card" key={index}><h3>Apiary {index + 1}</h3><div className="form-grid"><Field label="Apiary ID & Name" name="apiaryIdName" form={apiary} update={(f, v) => updateApiary(index, f, v)} /><SelectField label="Apiary Migration Type" name="apiaryMigrationType" options={MIGRATION_OPTIONS} form={apiary} update={(f, v) => updateApiary(index, f, v)} /><Field label="Current GPS Pin & Location" name="currentGpsLocation" form={apiary} update={(f, v) => updateApiary(index, f, v)} /><SelectField label="Bee Species" name="beeSpecies" options={["Apis mellifera", "Apis cerana indica", "Apis dorsata", "Tetragonula (Stingless)"]} form={apiary} update={(f, v) => updateApiary(index, f, v)} /><Field label="Hive Boxes at This Apiary" name="totalHiveBoxes" form={apiary} update={(f, v) => updateApiary(index, f, v)} type="number" /><Field label="Active / Strong Colonies" name="activeStrongColonies" form={apiary} update={(f, v) => updateApiary(index, f, v)} type="number" /><Field label="Weak / Quarantined Colonies" name="weakQuarantinedColonies" form={apiary} update={(f, v) => updateApiary(index, f, v)} type="number" /><SelectField label="Overall Apiary Health Status" name="healthStatus" options={HEALTH_STATUSES} form={apiary} update={(f, v) => updateApiary(index, f, v)} /><Field label="Last Inspection & Treatment Date" name="lastInspectionTreatmentDate" form={apiary} update={(f, v) => updateApiary(index, f, v)} type="date" /><Field label="Dominant Floral / Nectar Source" name="floralNectarSource" form={apiary} update={(f, v) => updateApiary(index, f, v)} /><Field label="Flowering / Foraging Season" name="floweringForagingSeason" form={apiary} update={(f, v) => updateApiary(index, f, v)} /><Field label="Composite Hive ID" name="compositeHiveId" form={apiary} update={(f, v) => updateApiary(index, f, v)} /><SelectField label="Queen Status" name="queenStatus" options={QUEEN_STATUSES} form={apiary} update={(f, v) => updateApiary(index, f, v)} /><SelectField label="Operational Hive Status" name="operationalHiveStatus" options={HIVE_STATUSES} form={apiary} update={(f, v) => updateApiary(index, f, v)} /><SelectField label="Queen Origin / Source" name="queenOriginSource" options={QUEEN_ORIGINS} form={apiary} update={(f, v) => updateApiary(index, f, v)} />{apiary.queenOriginSource === "Certified Breeder" && <Field label="Breeder Name / Batch ID" name="breederNameBatchId" form={apiary} update={(f, v) => updateApiary(index, f, v)} />}<Field label="Queen Introduction Date" name="queenIntroductionDate" form={apiary} update={(f, v) => updateApiary(index, f, v)} type="date" /><Field label="Queen Marking / ID" name="queenMarkingId" form={apiary} update={(f, v) => updateApiary(index, f, v)} /></div></div>;
  return <div className="bee-production-fields production-fields"><div className="bee-section-panel" role="tabpanel">{activeSection < 5 ? <><div className="form-grid">{sections[activeSection]}</div>{activeSection === 1 && apiaryCount === 0 && <p className="muted">Enter Total Apiaries in Beekeeper / Producer Details to add individual apiary records.</p>}{activeSection === 1 && apiaryCount > 0 && <div className="honey-apiary-repeat-list">{Array.from({ length: apiaryCount }, (_, index) => apiaryFields(form.apiaryDetails?.[index] || {}, index))}</div>}</> : <><p className="muted">GI details are saved with the Honey Batch entered in Batch &amp; Packaging Details.</p><p className="muted">Honey Batch ID: <strong>{form.honeyBatchId || "Not entered yet"}</strong></p><div className="form-grid"><SelectField label="GI Status" name="giStatus" options={GI_STATUSES} {...common} /><Field label="GI Product Name" name="giProductName" {...common} /><Field label="GI Registration / Application No." name="giRegistrationNumber" {...common} /><Field label="Registered GI Region" name="registeredRegion" {...common} /><Field label="Authorised User (AU) No." name="authorisedUser" {...common} /><Field label="Certified User / FPO Name" name="certifiedUserName" {...common} /></div></>}</div></div>;
}
