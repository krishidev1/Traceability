import { useEffect } from "react";
import { getStoredAuth } from "../api/traceabilityApi";
import "../styles/KotpadHandloomProduction.css";

const KOTPAD_OPTIONS = ["Saree", "Stole", "Fabric Roll", "Shawl", "Dupatta", "Dress Material", "Home Textile", "Other"];
const ORGANIZATION_OPTIONS = ["Individual", "SHG", "Cooperative", "Other"];
const YES_NO_OPTIONS = ["Yes", "No"];
const DESIGN_PATTERN_OPTIONS = ["Tribal Motif", "Temple Border", "Diamond Pattern", "Stripe Border", "Plain Weave", "Custom"];
const COLOR_OPTIONS = ["Maroon + Black", "Maroon + Brown", "Black + Brown", "Natural Brown", "Custom"];
const PACKAGING_OPTIONS = ["Eco Packaging", "Cloth Wrap", "Paper Packaging", "Standard"];
const INSPECTION_OPTIONS = ["Pending", "Passed", "Failed"];
const QUALITY_OPTIONS = ["A", "B", "C", "Premium"];
const MARKETPLACE_OPTIONS = ["Public", "Private"];

const fixedKotpadValues = {
  productName: "Kotpad Handloom Fabric",
  giApplicationNumber: "10",
  category: "Handloom / Textile",
  giState: "Odisha",
  district: "Koraput",
  regionCluster: "Kotpad Village",
  giRegistrationDate: "June 2, 2005",
  communityName: "Mirgan Community",
  fabricType: "Cotton",
  naturalDyeUsed: "Aal Tree Bark",
  loomType: "Pit Loom",
  weavingTechnique: "Traditional Handloom",
  naturalDyeUsage: "Yes",
};

const defaultDyeDescription = "Traditional process description";
const defaultCulturalStory = "Kotpad handloom fabric carries the natural-dye weaving heritage of Koraput and the Mirgan community.";

function padded(value, length) {
  return String(value).padStart(length, "0").slice(-length);
}

function generateBatchNumber(now = Date.now()) {
  return `KT/BATCH/${new Date(now).getFullYear()}/${padded(now, 3)}`;
}

function generateWeaverId(now = Date.now()) {
  return `KT/WVR/${padded(now, 5)}`;
}

function generateQrCode(now = Date.now()) {
  return `KT-QR-${now.toString(36).toUpperCase()}`;
}

function getAuthenticatedWeaverDetails() {
  const user = getStoredAuth()?.user || {};
  return {
    weaverName: user.name || user.full_name || "",
    contactNumber: user.phone || user.mobileNumber || user.mobile_number || user.mobile || user.mob || "",
  };
}

export const KOTPAD_PRODUCTION_CONFIG = {
  value: "kotpad_handloom",
  label: "Kotpad Handloom Fabric",
  badge: "Kotpad GI Fabric",
  badgeClass: "kotpad",
  themeClass: "production-theme-kotpad",
  nameLabel: "Kotpad Product Name",
  namePlaceholder: "e.g. Kotpad natural dyed shawl",
  locationLabel: "Cluster / Weaver Location",
  locationPlaceholder: "e.g. Kotpad, Koraput, Odisha",
  mode: "kotpad_handloom",
  crop: "Fabric Batch",
  crops: "Kotpad Fabric",
  variety: "Design / Fabric Details",
  varietyPlaceholder: "e.g. tribal motif, maroon-black cotton",
  startDateLabel: "Production Date *",
  expectedDateLabel: "Expected Completion Date",
  startVerb: "Produced",
  itemTypeLabel: "Product Type",
  options: KOTPAD_OPTIONS,
  monitoring: [
    "GI Certificate Upload",
    "Aadhaar / ID Proof",
    "Eco-Friendly Certification",
    "Batch Number",
    "QR Verification Code",
    "Weaver ID",
    "Geo-Fenced Production Area",
    "Authenticity Certificate",
    "Inspection Status",
    "Quality Grade",
    "Product Images",
    "Marketplace Visibility",
    "Natural Dye Usage",
    "Traditional Knowledge Preservation",
    "Cultural Story",
    "Government Recognition",
    "QR Scan History",
    "Other",
  ],
};

export function createKotpadInitialFields() {
  const now = Date.now();
  const authenticatedWeaver = getAuthenticatedWeaverDetails();
  return {
    ...fixedKotpadValues,
    giCertificateUpload: "Upload in Verification stage",
    weaverName: authenticatedWeaver.weaverName,
    organizationType: "",
    idProofUpload: "Upload required",
    contactNumber: authenticatedWeaver.contactNumber,
    emailId: "",
    address: "",
    weavingExperience: "",
    familyMembersInvolved: "",
    gpsLocation: "Captured from map or pin selection",
    yarnSource: "",
    dyePreparationMethod: defaultDyeDescription,
    waterSource: "",
    chemicalFreeStatus: "",
    ecoFriendlyCertification: "Upload required",
    timeTakenPerFabric: "",
    dailyProductionCapacity: "",
    designPattern: "",
    colorCombination: "",
    handmadeVerification: "Pending admin verification",
    batchNumber: generateBatchNumber(now),
    qrVerificationCode: generateQrCode(now),
    weaverId: generateWeaverId(now),
    geoFencedProductionArea: "Auto-match with Kotpad boundary",
    authenticityCertificate: "Admin upload required",
    blockchainTraceId: "Auto if blockchain is integrated",
    inspectionStatus: "Pending",
    qualityGrade: "",
    productImages: "Upload after saving this fabric batch",
    sellingPrice: "",
    wholesalePrice: "",
    availableStock: "",
    minimumOrderQuantity: "",
    exportAvailability: "",
    packagingType: "",
    shippingTime: "",
    marketplaceVisibility: "Public",
    tribalWomenInvolved: "",
    carbonFriendlyProduction: "",
    waterRecyclingUsed: "",
    traditionalKnowledgePreservation: "",
    culturalStory: defaultCulturalStory,
    governmentRecognition: "",
    qrScanHistory: "Auto-tracked after QR scans",
  };
}

export function buildKotpadDetails(form) {
  return {
    "Product Name": form.productName,
    "GI Application Number": form.giApplicationNumber,
    Category: form.category,
    State: form.giState,
    District: form.district,
    "Region / Cluster": form.regionCluster,
    "GI Registration Date": form.giRegistrationDate,
    "GI Certificate Upload": form.giCertificateUpload,
    "Weaver Name": form.weaverName,
    "Community Name": form.communityName,
    "Organization Type": form.organizationType,
    "Aadhaar / ID Proof": form.idProofUpload,
    "Contact Number": form.contactNumber,
    "Email ID": form.emailId,
    Address: form.address,
    "Experience in Weaving": form.weavingExperience,
    "Number of Family Members Involved": form.familyMembersInvolved,
    "GPS Location": form.gpsLocation,
    "Fabric Type": form.fabricType,
    "Yarn Source": form.yarnSource,
    "Natural Dye Used": form.naturalDyeUsed,
    "Dye Preparation Method": form.dyePreparationMethod,
    "Water Source": form.waterSource,
    "Chemical-Free Status": form.chemicalFreeStatus,
    "Eco-Friendly Certification": form.ecoFriendlyCertification,
    "Loom Type": form.loomType,
    "Weaving Technique": form.weavingTechnique,
    "Time Taken Per Fabric": form.timeTakenPerFabric,
    "Daily Production Capacity": form.dailyProductionCapacity,
    "Design Pattern": form.designPattern,
    "Color Combination": form.colorCombination,
    "Handmade Verification": form.handmadeVerification,
    "Batch Number": form.batchNumber,
    "QR Verification Code": form.qrVerificationCode,
    "Weaver ID": form.weaverId,
    "Geo-Fenced Production Area": form.geoFencedProductionArea,
    "Authenticity Certificate": form.authenticityCertificate,
    "Blockchain Trace ID": form.blockchainTraceId,
    "Inspection Status": form.inspectionStatus,
    "Quality Grade": form.qualityGrade,
    "Product Images": form.productImages,
    "Selling Price": form.sellingPrice,
    "Wholesale Price": form.wholesalePrice,
    "Available Stock": form.availableStock,
    "Minimum Order Quantity": form.minimumOrderQuantity,
    "Export Availability": form.exportAvailability,
    "Packaging Type": form.packagingType,
    "Shipping Time": form.shippingTime,
    "Marketplace Visibility": form.marketplaceVisibility,
    "Natural Dye Usage": form.naturalDyeUsage,
    "Tribal Women Involved": form.tribalWomenInvolved,
    "Carbon-Friendly Production": form.carbonFriendlyProduction,
    "Water Recycling Used": form.waterRecyclingUsed,
    "Traditional Knowledge Preservation": form.traditionalKnowledgePreservation,
    "Cultural Story": form.culturalStory,
    "Government Recognition": form.governmentRecognition,
    "QR Scan History": form.qrScanHistory,
  };
}

function FixedInput({ label, value }) {
  return (
    <div className="field-wrap kotpad-fixed-field">
      <label className="field-label">{label}</label>
      <input
        className="input kotpad-locked-input"
        value={value || ""}
        placeholder={`Auto-filled ${label}`}
        readOnly
        aria-readonly="true"
      />
    </div>
  );
}

function TextInput({ label, field, form, setForm, type = "text", placeholder = "" }) {
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={form[field]}
        onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
      />
    </div>
  );
}

function TextArea({ label, field, form, setForm, placeholder = "" }) {
  return (
    <div className="field-wrap kotpad-wide-field">
      <label className="field-label">{label}</label>
      <textarea
        className="input kotpad-textarea"
        placeholder={placeholder}
        value={form[field]}
        onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
      />
    </div>
  );
}

function SelectInput({ label, field, form, setForm, options }) {
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <select
        className="input"
        value={form[field]}
        onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
      >
        <option value="">Select...</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function KotpadHandloomProductionFields({ form, setForm }) {
  useEffect(() => {
    const authenticatedWeaver = getAuthenticatedWeaverDetails();
    if (!authenticatedWeaver.weaverName && !authenticatedWeaver.contactNumber) return;

    setForm((current) => {
      let changed = false;
      const next = { ...current };

      if (authenticatedWeaver.weaverName && current.weaverName !== authenticatedWeaver.weaverName) {
        next.weaverName = authenticatedWeaver.weaverName;
        changed = true;
      }

      if (authenticatedWeaver.contactNumber && current.contactNumber !== authenticatedWeaver.contactNumber) {
        next.contactNumber = authenticatedWeaver.contactNumber;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [setForm]);

  return (
    <div className="kotpad-production-fields production-fields">
      <div className="form-section-label kotpad-section-label">Basic Product Information</div>
      <FixedInput label="Product Name" value={form.productName} />
      <FixedInput label="GI Application Number" value={form.giApplicationNumber} />
      <FixedInput label="Category" value={form.category} />
      <FixedInput label="State" value={form.giState} />
      <FixedInput label="District" value={form.district} />
      <FixedInput label="Region / Cluster" value={form.regionCluster} />
      <FixedInput label="GI Registration Date" value={form.giRegistrationDate} />
      <FixedInput label="GI Certificate Upload" value={form.giCertificateUpload} />

      <div className="form-section-label kotpad-section-label">Weaver Details</div>
      <FixedInput label="Weaver Name" value={form.weaverName} />
      <FixedInput label="Community Name" value={form.communityName} />
      <SelectInput label="Organization Type" field="organizationType" form={form} setForm={setForm} options={ORGANIZATION_OPTIONS} />
      <FixedInput label="Aadhaar / ID Proof" value={form.idProofUpload} />
      <FixedInput label="Contact Number" value={form.contactNumber} />
      <TextInput label="Email ID" field="emailId" form={form} setForm={setForm} type="email" />
      <TextArea label="Address" field="address" form={form} setForm={setForm} />
      <TextInput label="Experience in Weaving" field="weavingExperience" form={form} setForm={setForm} type="number" placeholder="Years" />
      <TextInput label="Family Members Involved" field="familyMembersInvolved" form={form} setForm={setForm} type="number" />
      <FixedInput label="GPS Location" value={form.gpsLocation} />

      <div className="form-section-label kotpad-section-label">Raw Material Details</div>
      <FixedInput label="Fabric Type" value={form.fabricType} />
      <TextInput label="Yarn Source" field="yarnSource" form={form} setForm={setForm} />
      <FixedInput label="Natural Dye Used" value={form.naturalDyeUsed} />
      <TextArea label="Dye Preparation Method" field="dyePreparationMethod" form={form} setForm={setForm} />
      <TextInput label="Water Source" field="waterSource" form={form} setForm={setForm} />
      <SelectInput label="Chemical-Free Status" field="chemicalFreeStatus" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
      <FixedInput label="Eco-Friendly Certification" value={form.ecoFriendlyCertification} />

      <div className="form-section-label kotpad-section-label">Weaving & Production Info</div>
      <FixedInput label="Loom Type" value={form.loomType} />
      <FixedInput label="Weaving Technique" value={form.weavingTechnique} />
      <TextInput label="Time Taken Per Fabric" field="timeTakenPerFabric" form={form} setForm={setForm} placeholder="Hours or days" />
      <TextInput label="Daily Production Capacity" field="dailyProductionCapacity" form={form} setForm={setForm} type="number" placeholder="Meters or pieces" />
      <SelectInput label="Design Pattern" field="designPattern" form={form} setForm={setForm} options={DESIGN_PATTERN_OPTIONS} />
      <SelectInput label="Color Combination" field="colorCombination" form={form} setForm={setForm} options={COLOR_OPTIONS} />
      <FixedInput label="Handmade Verification" value={form.handmadeVerification} />

      <div className="form-section-label kotpad-section-label">Authenticity & Traceability</div>
      <FixedInput label="Batch Number" value={form.batchNumber} />
      <FixedInput label="QR Verification Code" value={form.qrVerificationCode} />
      <FixedInput label="Weaver ID" value={form.weaverId} />
      <FixedInput label="Geo-Fenced Production Area" value={form.geoFencedProductionArea} />
      <FixedInput label="Authenticity Certificate" value={form.authenticityCertificate} />
      <FixedInput label="Blockchain Trace ID" value={form.blockchainTraceId} />
      <SelectInput label="Inspection Status" field="inspectionStatus" form={form} setForm={setForm} options={INSPECTION_OPTIONS} />
      <SelectInput label="Quality Grade" field="qualityGrade" form={form} setForm={setForm} options={QUALITY_OPTIONS} />
      <div className="form-section-label kotpad-section-label">Marketplace Fields</div>
      <FixedInput label="Product Images" value={form.productImages} />
      <TextInput label="Selling Price" field="sellingPrice" form={form} setForm={setForm} type="number" placeholder="INR" />
      <TextInput label="Wholesale Price" field="wholesalePrice" form={form} setForm={setForm} type="number" placeholder="INR" />
      <TextInput label="Available Stock" field="availableStock" form={form} setForm={setForm} type="number" />
      <TextInput label="Minimum Order Quantity" field="minimumOrderQuantity" form={form} setForm={setForm} type="number" />
      <SelectInput label="Export Availability" field="exportAvailability" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
      <SelectInput label="Packaging Type" field="packagingType" form={form} setForm={setForm} options={PACKAGING_OPTIONS} />
      <TextInput label="Shipping Time" field="shippingTime" form={form} setForm={setForm} placeholder="e.g. 5-7 days" />
      <SelectInput label="Marketplace Visibility" field="marketplaceVisibility" form={form} setForm={setForm} options={MARKETPLACE_OPTIONS} />
      <div className="form-section-label kotpad-section-label">Sustainability & Preservation</div>
      <FixedInput label="Natural Dye Usage" value={form.naturalDyeUsage} />
      <SelectInput label="Tribal Women Involved" field="tribalWomenInvolved" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
      <SelectInput label="Carbon-Friendly Production" field="carbonFriendlyProduction" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
      <SelectInput label="Water Recycling Used" field="waterRecyclingUsed" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
      <TextArea label="Traditional Knowledge Preservation" field="traditionalKnowledgePreservation" form={form} setForm={setForm} />
      <TextArea label="Cultural Story" field="culturalStory" form={form} setForm={setForm} />
      <TextInput label="Government Recognition" field="governmentRecognition" form={form} setForm={setForm} />
      <div className="form-section-label kotpad-section-label">Smart Tracking</div>
      <FixedInput label="QR Scan History" value={form.qrScanHistory} />
    </div>
  );
}
