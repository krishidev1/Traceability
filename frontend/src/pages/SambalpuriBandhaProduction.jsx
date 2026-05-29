import { useEffect } from "react";
import { getStoredAuth } from "../api/traceabilityApi";
import "../styles/SambalpuriBandhaProduction.css";


const PRODUCT_TYPE_OPTIONS = ["Saree", "Fabric", "Dupatta", "Stole", "Dress Material", "Home Textile", "Other"];
const PATTERN_OPTIONS = ["Double Ikat", "Single Ikat", "Bandha", "Traditional Motif", "Custom"];
const FABRIC_OPTIONS = ["Cotton", "Silk", "Cotton Silk", "Tussar", "Other"];
const DYE_OPTIONS = ["Yes", "No"];
const LOOM_OPTIONS = ["Pit Loom", "Frame Loom", "Traditional Handloom", "Other"];
const INSPECTION_OPTIONS = ["Approved", "Pending", "Rejected"];
const DOCUMENT_STATUS_OPTIONS = ["Mandatory", "Uploaded", "Pending", "Not Available"];

const FIXED_VALUES = {
  registeredName: "Sambalpuri Bandha Saree and Fabrics",
  giCertificateDate: "17 July 2012",
  giCertificateDateIso: "2012-07-17",
  giApplicationNumber: "208",
  giCategory: "Handicraft",
  registrationHolder: "Directorate of Textiles & Handloom, Government of Odisha",
  headOfficeLocation: "Satyanagar, Bhubaneswar",
  associatedRegions: "Bargarh, Boudh, Sonepur, Bolangir, Nuapada, Sambalpur",
  district: "Bargarh",
  gpsCoordinates: "21.3333, 83.6167",
  giRegionMatch: "Verified",
  handloomVerification: "Approved",
  textureAuthenticityScore: "91%",
  motifMatchScore: "94%",
  authenticityScore: "93%",
};

function padded(value, length) {
  return String(value).padStart(length, "0").slice(-length);
}

function generateWeaverId(now = Date.now()) {
  return `WB-${new Date(now).getFullYear()}-${padded(now, 3)}`;
}

function generateQrCode(now = Date.now()) {           
  return `QR-SBL-${padded(now, 5)}`;
}

function generateBatchNumber(now = Date.now()) {
  return `SBL${new Date(now).getFullYear()}B${padded(now, 3)}`;
}

function getAuthenticatedWeaverDetails() {
  const user = getStoredAuth()?.user || {};
  return {
    weaverName: user.name || user.full_name || "",
    mobileNumber: user.phone || user.mobileNumber || user.mobile_number || user.mobile || user.mob || "",
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const SAMBALPURI_PRODUCTION_CONFIG = {
  value: "sambalpuri_bandha",
  label: "Sambalpuri Bandha",
  badge: "Sambalpuri GI",
  badgeClass: "sambalpuri",
  themeClass: "production-theme-sambalpuri",
  nameLabel: "Sambalpuri Production Name",
  namePlaceholder: "e.g. Bargarh Bandha Saree Batch",
  locationLabel: "Cluster / Weaver Location",
  locationPlaceholder: "e.g. Bargarh, Odisha",
  mode: "sambalpuri_bandha",
  crop: "Sambalpuri Product",
  crops: "Sambalpuri Product",
  variety: "Product Description / Design",
  varietyPlaceholder: "e.g. traditional handwoven Sambalpuri saree",
  startDateLabel: "Production Date *",
  expectedDateLabel: "Expected Completion Date",
  startVerb: "Produced",
  itemTypeLabel: "Product Type",
  options: PRODUCT_TYPE_OPTIONS,
  monitoring: [
    "Aadhaar Card",
    "Weaver Registration Certificate",
    "Cooperative Membership Proof",
    "Product Images",
    "Loom Images",
    "GI Authorization Certificate",
    "Production Location Proof",
    "Inspection Report",
    "Motif Match",
    "Texture Authenticity",
    "Other",
  ],
};

// eslint-disable-next-line react-refresh/only-export-components
export function createSambalpuriInitialFields() {
  const now = Date.now();
  const authenticatedWeaver = getAuthenticatedWeaverDetails();
  return {
    ...FIXED_VALUES,
    bandhaPatternType: "",
    fabricMaterial: "",
    colorCombination: "",
    borderDesign: "",
    motifStyle: "",
    productDescription: "Traditional handwoven Sambalpuri saree",
    weaverName: authenticatedWeaver.weaverName,
    weaverId: generateWeaverId(now),
    cooperativeName: "",
    aadhaarNumber: "",
    mobileNumber: authenticatedWeaver.mobileNumber,
    loomType: "Pit Loom",
    naturalDyeUsed: "Yes",
    inspectionStatus: "Approved",
    qrVerificationCode: generateQrCode(now),
    batchNumber: generateBatchNumber(now),
    aadhaarCardStatus: "Mandatory",
    weaverRegistrationCertificateStatus: "Mandatory",
    cooperativeMembershipProofStatus: "Mandatory",
    productImagesStatus: "Mandatory",
    loomImagesStatus: "Mandatory",
    giAuthorizationCertificateStatus: "Mandatory",
    productionLocationProofStatus: "Mandatory",
    inspectionReportStatus: "Optional",
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildSambalpuriDetails(form) {
  return {
    "Registered Name": form.registeredName,
    "GI Application Number": form.giApplicationNumber,
    "GI Certificate Date": form.giCertificateDate,
    "Product Type": form.name === "Other" ? form.customName : form.name,
    "Bandha Pattern": form.bandhaPatternType,
    "Fabric Material": form.fabricMaterial,
    "Color Combination": form.colorCombination,
    "Border Design": form.borderDesign,
    "Motif Style": form.motifStyle,
    "Weaver Name": form.weaverName,
    "Weaver ID": form.weaverId,
    "Cooperative Name": form.cooperativeName,
    District: form.district,
    "GI Region Match": form.giRegionMatch,
    "Loom Type": form.loomType,
    "Natural Dye Used": form.naturalDyeUsed,
    "Inspection Status": form.inspectionStatus,
    "Authenticity Score": form.authenticityScore,
    "QR Verification Code": form.qrVerificationCode,
    "Batch Number": form.batchNumber,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildSambalpuriProductPayload(form, derived = {}) {
  return {
    registered_name: form.registeredName,
    gi_certificate_date: FIXED_VALUES.giCertificateDateIso,
    gi_application_number: form.giApplicationNumber,
    gi_category: form.giCategory,
    registration_holder: form.registrationHolder,
    head_office_location: form.headOfficeLocation,
    associated_regions: form.associatedRegions,
    product_type: derived.name || form.name,
    bandha_pattern_type: form.bandhaPatternType,
    fabric_material: form.fabricMaterial,
    color_combination: form.colorCombination,
    border_design: form.borderDesign,
    motif_style: form.motifStyle,
    product_description: form.productDescription || derived.variety,
    weaver_name: form.weaverName,
    weaver_id: form.weaverId,
    cooperative_name: form.cooperativeName,
    aadhaar_number: form.aadhaarNumber,
    mobile_number: form.mobileNumber,
    district: form.district,
    gps_coordinates: form.gpsCoordinates,
    gi_region_match: form.giRegionMatch,
    loom_type: form.loomType,
    handloom_verification: form.handloomVerification,
    natural_dye_used: form.naturalDyeUsed,
    texture_authenticity_score: form.textureAuthenticityScore,
    motif_match_score: form.motifMatchScore,
    inspection_status: form.inspectionStatus,
    authenticity_score: form.authenticityScore,
    qr_verification_code: form.qrVerificationCode,
    batch_number: form.batchNumber,
    aadhaar_card_status: form.aadhaarCardStatus,
    weaver_registration_certificate_status: form.weaverRegistrationCertificateStatus,
    cooperative_membership_proof_status: form.cooperativeMembershipProofStatus,
    product_images_status: form.productImagesStatus,
    loom_images_status: form.loomImagesStatus,
    gi_authorization_certificate_status: form.giAuthorizationCertificateStatus,
    production_location_proof_status: form.productionLocationProofStatus,
    inspection_report_status: form.inspectionReportStatus,
  };
}

function FixedInput({ label, value }) {
  return (
    <div className="field-wrap sambalpuri-fixed-field">
      <label className="field-label">{label}</label>
      <input className="input sambalpuri-locked-input" value={value || ""} readOnly aria-readonly="true" />
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
        value={form[field] || ""}
        onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
      />
    </div>
  );
}

function TextArea({ label, field, form, setForm, placeholder = "" }) {
  return (
    <div className="field-wrap sambalpuri-wide-field">
      <label className="field-label">{label}</label>
      <textarea
        className="input sambalpuri-textarea"
        placeholder={placeholder}
        value={form[field] || ""}
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
        value={form[field] || ""}
        onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
      >
        <option value="">Select...</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function SambalpuriBandhaProductionFields({ form, setForm }) {
  useEffect(() => {
    const authenticatedWeaver = getAuthenticatedWeaverDetails();
    if (!authenticatedWeaver.weaverName && !authenticatedWeaver.mobileNumber) return;

    setForm((current) => {
      let changed = false;
      const next = { ...current };

      if (authenticatedWeaver.weaverName && current.weaverName !== authenticatedWeaver.weaverName) {
        next.weaverName = authenticatedWeaver.weaverName;
        changed = true;
      }

      if (authenticatedWeaver.mobileNumber && current.mobileNumber !== authenticatedWeaver.mobileNumber) {
        next.mobileNumber = authenticatedWeaver.mobileNumber;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [setForm]);

  return (
    <div className="sambalpuri-production-fields production-fields">
      <div className="form-section-label sambalpuri-section-label">GI Registration</div>
      <FixedInput label="Registered Name" value={form.registeredName} />
      <FixedInput label="GI Certificate Date" value={form.giCertificateDate} />
      <FixedInput label="GI Application Number" value={form.giApplicationNumber} />
      <FixedInput label="GI Category" value={form.giCategory} />
      <FixedInput label="Registration Holder" value={form.registrationHolder} />
      <FixedInput label="Head Office Location" value={form.headOfficeLocation} />
      <FixedInput label="Associated Regions" value={form.associatedRegions} />

      <div className="form-section-label sambalpuri-section-label">Product Details</div>
      <SelectInput label="Bandha Pattern Type" field="bandhaPatternType" form={form} setForm={setForm} options={PATTERN_OPTIONS} />
      <SelectInput label="Fabric Material" field="fabricMaterial" form={form} setForm={setForm} options={FABRIC_OPTIONS} />
      <TextInput label="Color Combination" field="colorCombination" form={form} setForm={setForm} placeholder="e.g. Red, Black, White" />
      <TextInput label="Border Design" field="borderDesign" form={form} setForm={setForm} placeholder="e.g. Traditional Sambalpuri Border" />
      <TextInput label="Motif Style" field="motifStyle" form={form} setForm={setForm} placeholder="e.g. Shankha, Chakra, Phula" />
      <TextArea label="Product Description" field="productDescription" form={form} setForm={setForm} />

      <div className="form-section-label sambalpuri-section-label">Weaver / Artisan Details</div>
      <FixedInput label="Weaver Name" value={form.weaverName} />
      <FixedInput label="Weaver ID" value={form.weaverId} />
      <TextInput label="Cooperative Name" field="cooperativeName" form={form} setForm={setForm} placeholder="e.g. Bargarh Handloom Cooperative" />
      <TextInput label="Aadhaar Number" field="aadhaarNumber" form={form} setForm={setForm} placeholder="XXXX-XXXX-4589" />
      <FixedInput label="Mobile Number" value={form.mobileNumber} />
      <FixedInput label="District" value={form.district} />
      <FixedInput label="GPS Coordinates" value={form.gpsCoordinates} />

      <div className="form-section-label sambalpuri-section-label">Authenticity & Traceability</div>
      <FixedInput label="GI Region Match" value={form.giRegionMatch} />
      <SelectInput label="Loom Type" field="loomType" form={form} setForm={setForm} options={LOOM_OPTIONS} />
      <FixedInput label="Handloom Verification" value={form.handloomVerification} />
      <SelectInput label="Natural Dye Used" field="naturalDyeUsed" form={form} setForm={setForm} options={DYE_OPTIONS} />
      <FixedInput label="Texture Authenticity Score" value={form.textureAuthenticityScore} />
      <FixedInput label="Motif Match Score" value={form.motifMatchScore} />
      <SelectInput label="Inspection Status" field="inspectionStatus" form={form} setForm={setForm} options={INSPECTION_OPTIONS} />
      <FixedInput label="Authenticity Score" value={form.authenticityScore} />
      <FixedInput label="QR Verification Code" value={form.qrVerificationCode} />
      <FixedInput label="Batch Number" value={form.batchNumber} />

      <div className="form-section-label sambalpuri-section-label">Required Documents</div>
      <SelectInput label="Aadhaar Card" field="aadhaarCardStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Weaver Registration Certificate" field="weaverRegistrationCertificateStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Cooperative Membership Proof" field="cooperativeMembershipProofStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Product Images" field="productImagesStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Loom Images" field="loomImagesStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="GI Authorization Certificate" field="giAuthorizationCertificateStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Production Location Proof" field="productionLocationProofStatus" form={form} setForm={setForm} options={DOCUMENT_STATUS_OPTIONS} />
      <SelectInput label="Inspection Report" field="inspectionReportStatus" form={form} setForm={setForm} options={["Optional", ...DOCUMENT_STATUS_OPTIONS]} />
    </div>
  );
}
