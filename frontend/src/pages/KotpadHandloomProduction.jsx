import { useEffect, useState } from "react";
import { getStoredAuth } from "../api/traceabilityApi";
import "../styles/KotpadHandloomProduction.css";

const KOTPAD_OPTIONS = ["Saree", "Stole", "Fabric Roll", "Shawl", "Dupatta", "Dress Material", "Home Textile", "Other"];
const ORGANIZATION_OPTIONS = ["Individual", "SHG", "Cooperative", "Other"];
const YES_NO_OPTIONS = ["Yes", "No"];
const DESIGN_PATTERN_OPTIONS = ["Tribal Motif", "Temple Border", "Diamond Pattern", "Stripe Border", "Plain Weave", "Custom"];
const COLOR_OPTIONS = ["Maroon + Black", "Maroon + Brown", "Black + Brown", "Natural Brown", "Custom"];
const PACKAGING_OPTIONS = ["Eco Packaging", "Cloth Wrap", "Paper Packaging", "Standard"];
const MARKETPLACE_OPTIONS = ["Public", "Private"];

const fixedKotpadValues = {
  productName: "Kotpad Handloom Fabric",
  giApplicationNumber: "10",
  category: "Handloom / Textile",
  giState: "Odisha",
  district: "Koraput",
  regionCluster: "Kotpad Village",
  giRegistrationDate: "June 2, 2005",
  fabricType: "Cotton",
  loomType: "Pit Loom",
  weavingTechnique: "Traditional Handloom",
};

function generateBatchNumber(now = Date.now()) {
  return `KT/BATCH/${new Date(now).getFullYear()}/${now.toString(36).toUpperCase()}`;
}

function generateWeaverId(now = Date.now()) {
  return `KT/WVR/${now.toString(36).toUpperCase()}`;
}

function generateQrCode(now = Date.now()) {
  return `KT-QR-${now.toString(36).toUpperCase()}`;
}

function getAuthenticatedWeaverDetails() {
  const user = getStoredAuth()?.user || {};
  return {
    weaverName: user.name || user.full_name || "",
    contactNumber: user.phone || user.mobileNumber || user.mobile_number || user.mobile || user.mob || "",
    weaverId: user.weaver_id || (user.id ? `KT/WVR/${user.id}` : ""),
  };
}

export const KOTPAD_PRODUCTION_CONFIG = {
  value: "kotpad_handloom",
  label: "Kotpad Handloom Fabric",
  badge: "Kotpad Handloom",
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
  varietyPlaceholder: "e.g. Traditional Kotpad cotton saree with maroon-and-black colour combination",
  startDateLabel: "Production Date *",
  expectedDateLabel: "Expected Completion Date",
  startVerb: "Produced",
  itemTypeLabel: "Product Type",
  options: KOTPAD_OPTIONS,
  monitoring: [
    "GI Certificate Upload",
    "Eco-Friendly Certification",
    "Batch Number",
    "QR Verification Code",
    "Weaver ID",
    "Authenticity Certificate",
    "Inspection Status",
    "Quality Grade",
    "Product Images",
    "Marketplace Visibility",
  ],
};

export function createKotpadInitialFields() {
  const now = Date.now();
  const authenticatedWeaver = getAuthenticatedWeaverDetails();
  return {
    ...fixedKotpadValues,
    weaverName: authenticatedWeaver.weaverName,
    communityName: "",
    organizationType: "",
    organizationName: "",
    contactNumber: authenticatedWeaver.contactNumber,
    address: "",
    yarnSource: "",
    naturalDyeUsed: "Aal bark",
    dyePreparationMethod: "",
    waterSource: "",
    chemicalFreeStatus: "",
    ecoFriendlyCertification: "",
    timeTakenPerFabric: "",
    designPattern: "",
    colorCombination: "",
    designFabricDetails: "",
    batchNumber: generateBatchNumber(now),
    qrVerificationCode: generateQrCode(now),
    weaverId: authenticatedWeaver.weaverId || generateWeaverId(now),
    productionUnitId: "Auto-linked to production unit",
    authenticityCertificate: "",
    giRegistrationEvidence: "",
    inspectionStatus: "Pending",
    verificationLevel: "Artisan-declared",
    qualityGrade: "",
    sellingPrice: "",
    wholesalePrice: "",
    availableStock: "",
    minimumOrderQuantity: "",
    exportAvailability: "",
    packagingType: "",
    shippingTime: "",
    marketplaceVisibility: "",
  };
}

export function buildKotpadDetails(form) {
  return {
    "Product Type": form.productType,
    "Product Name": form.productName,
    "GI Application Number": form.giApplicationNumber,
    Category: form.category,
    State: form.giState,
    District: form.district,
    "Region / Cluster": form.regionCluster,
    "GI Registration Date": form.giRegistrationDate,
    "Weaver Name": form.weaverName,
    "Community Name": form.communityName,
    "Weaver ID": form.weaverId,
    "Organization Type": form.organizationType,
    "Organization Name": form.organizationName,
    "Contact Number": form.contactNumber,
    Address: form.address,
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
    "Design Pattern": form.designPattern,
    "Color Combination": form.colorCombination,
    "Design / Fabric Details": form.designFabricDetails,
    "Batch Number": form.batchNumber,
    "QR Verification Code": form.qrVerificationCode,
    "Production Unit ID": form.productionUnitId,
    "Authenticity Certificate": form.authenticityCertificate,
    "GI Registration Evidence": form.giRegistrationEvidence,
    "Inspection Status": form.inspectionStatus,
    "Verification Level": form.verificationLevel,
    "Quality Grade": form.qualityGrade,
    "Selling Price": form.sellingPrice,
    "Wholesale Price": form.wholesalePrice,
    "Available Stock": form.availableStock,
    "Minimum Order Quantity": form.minimumOrderQuantity,
    "Export Availability": form.exportAvailability,
    "Packaging Type": form.packagingType,
    "Shipping Time": form.shippingTime,
    "Marketplace Visibility": form.marketplaceVisibility,
    "Production Date": form.productionDate,
    "Expected Completion Date": form.expectedCompletionDate,
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

export default function KotpadHandloomProductionFields({
  form,
  setForm,
  activeSection,
  productName,
  location,
  productionUnitId,
}) {
  useEffect(() => {
    const authenticatedWeaver = getAuthenticatedWeaverDetails();
    if (!authenticatedWeaver.weaverName && !authenticatedWeaver.contactNumber && !authenticatedWeaver.weaverId) return;

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

      if (authenticatedWeaver.weaverId && current.weaverId !== authenticatedWeaver.weaverId) {
        next.weaverId = authenticatedWeaver.weaverId;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [setForm]);

  return (
    <div className="kotpad-production-fields production-fields">
      {activeSection === 0 && (
        <>
          <div className="form-section-label kotpad-section-label">Production Unit Registration</div>
          <FixedInput label="Production Category" value={KOTPAD_PRODUCTION_CONFIG.label} />
          <FixedInput label="Product Name" value={productName} />
          <FixedInput label="Cluster / Weaver Location" value={location} />
          <FixedInput label="Production Unit ID" value={productionUnitId} />
        </>
      )}

      {activeSection === 1 && (
        <>
          <div className="form-section-label kotpad-section-label">Producer / Weaver Details</div>
          <TextInput label="Weaver Name *" field="weaverName" form={form} setForm={setForm} />
          <FixedInput label="Weaver ID" value={form.weaverId} />
          <SelectInput label="Organization Type *" field="organizationType" form={form} setForm={setForm} options={ORGANIZATION_OPTIONS} />
           {form.organizationType === "Other" && (
             <TextInput label="Organization Name *" field="organizationName" form={form} setForm={setForm} placeholder="Enter the organization name" />
           )}
          <TextInput label="Contact Number *" field="contactNumber" form={form} setForm={setForm} />
          <TextArea label="Address *" field="address" form={form} setForm={setForm} placeholder="Enter the weaver's address" />
          <TextInput label="Community Name" field="communityName" form={form} setForm={setForm} />
        </>
      )}

      {activeSection === 2 && (
        <>
          <div className="form-section-label kotpad-section-label">Raw Material Details</div>
          <TextInput label="Fabric Type *" field="fabricType" form={form} setForm={setForm} />
          <TextInput label="Yarn Source *" field="yarnSource" form={form} setForm={setForm} placeholder="e.g. Local yarn supplier, Kotpad" />
          <TextInput label="Natural Dye Used *" field="naturalDyeUsed" form={form} setForm={setForm} />
          <TextArea label="Dye Preparation Method" field="dyePreparationMethod" form={form} setForm={setForm} />
          <TextInput label="Water Source" field="waterSource" form={form} setForm={setForm} />
          <SelectInput label="Chemical-Free Status" field="chemicalFreeStatus" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
          <TextInput label="Eco-Friendly Certification (If available)" field="ecoFriendlyCertification" form={form} setForm={setForm} placeholder="Enter a certification reference or link" />
        </>
      )}

      {activeSection === 3 && (
        <>
          <div className="form-section-label kotpad-section-label">Weaving & Production Details</div>
          <SelectInput label="Product Type *" field="name" form={form} setForm={setForm} options={KOTPAD_OPTIONS} />
          {form.name === "Other" && <TextInput label="Custom Product Type *" field="customName" form={form} setForm={setForm} />}
          <TextInput label="Loom Type *" field="loomType" form={form} setForm={setForm} />
          <TextInput label="Weaving Technique *" field="weavingTechnique" form={form} setForm={setForm} />
          <SelectInput label="Design Pattern *" field="designPattern" form={form} setForm={setForm} options={DESIGN_PATTERN_OPTIONS} />
          <SelectInput label="Colour Combination *" field="colorCombination" form={form} setForm={setForm} options={COLOR_OPTIONS} />
          <TextArea label="Design / Fabric Details" field="designFabricDetails" form={form} setForm={setForm} />
          <TextInput label="Production Start Date *" field="sowingDate" form={form} setForm={setForm} type="date" />
          <TextInput label="Production Completion Date *" field="expectedHarvest" form={form} setForm={setForm} type="date" />
          <TextInput label="Time Taken Per Fabric" field="timeTakenPerFabric" form={form} setForm={setForm} placeholder="e.g. 7 days" />
        </>
      )}

      {activeSection === 4 && (
        <>
          <div className="form-section-label kotpad-section-label">Batch Identity & Verification</div>
          <FixedInput label="Batch Number" value={form.batchNumber} />
          <FixedInput label="QR Verification Code" value={form.qrVerificationCode} />
          <FixedInput label="Production Unit ID" value={productionUnitId} />
          <FixedInput label="Weaver ID" value={form.weaverId} />
          <FixedInput label="Inspection Status" value={form.inspectionStatus} />
          <FixedInput label="Verification Level" value={form.verificationLevel} />
          {form.qualityGrade && <FixedInput label="Quality Grade (Inspector)" value={form.qualityGrade} />}
          {form.authenticityCertificate && <FixedInput label="Authenticity Certificate" value={form.authenticityCertificate} />}
          {form.giRegistrationEvidence && <FixedInput label="GI Certificate / Registration Evidence" value={form.giRegistrationEvidence} />}
        </>
      )}

      {activeSection === 5 && (
        <>
          <div className="form-section-label kotpad-section-label">Product & Marketplace Details</div>
          <TextInput label="Selling Price" field="sellingPrice" form={form} setForm={setForm} type="number" />
          <TextInput label="Wholesale Price" field="wholesalePrice" form={form} setForm={setForm} type="number" />
          <TextInput label="Available Stock *" field="availableStock" form={form} setForm={setForm} type="number" />
          <TextInput label="Minimum Order Quantity" field="minimumOrderQuantity" form={form} setForm={setForm} type="number" />
          <SelectInput label="Export Availability" field="exportAvailability" form={form} setForm={setForm} options={YES_NO_OPTIONS} />
          <SelectInput label="Packaging Type" field="packagingType" form={form} setForm={setForm} options={PACKAGING_OPTIONS} />
          <TextInput label="Shipping Time" field="shippingTime" form={form} setForm={setForm} />
          <SelectInput label="Marketplace Visibility *" field="marketplaceVisibility" form={form} setForm={setForm} options={MARKETPLACE_OPTIONS} />
        </>
      )}
    </div>
  );
}
