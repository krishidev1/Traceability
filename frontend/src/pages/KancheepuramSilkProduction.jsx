import { useEffect } from "react";
import { getStoredAuth } from "../api/traceabilityApi";

const OPTIONS = {
  productCategory: ["Bridal Kancheepuram Silk", "Traditional Festival Silk", "Contemporary Light Weight", "Traditional Half-Saree"],
  silkType: ["Mulberry Silk (Filament)", "Tussar Silk", "Eri Silk", "Muga Silk"], silkOriginState: ["Karnataka", "Tamil Nadu", "Andhra Pradesh"], purityGrade: ["Class 5A (Premium)", "Class 4A", "Class 3A", "Class 2A"],
  zariType: ["Pure Gold-Silver Metallic Zari", "Tested Zari (Imitation)", "Half-Fine Zari", "Polyester Metallic Zari"], labPurityStatus: ["NOT_TESTED", "PENDING_LAB_RESULTS", "VERIFIED_PURE_CONFORMANT", "FAILED_COMPOSITION"],
  reelingMethod: ["Charka", "Cottam", "Automatic Machine"], twistingMethod: ["Hand Twisted", "Machine Twisted"], yarnQualityStatus: ["EXCELLENT_UNIFORMITY", "STANDARD_GRADE", "MINOR_HAIRINESS_ACCEPTABLE", "REJECTED_HIGH_BREAKAGE"],
  dyeType: ["Synthetic Acid Dye (Azo-Free)", "Natural Organic Dye", "Vegetable Infused Base"], dyeingMethodology: ["Open Vat Skein Dyeing", "Pressurized Jet Dyeing", "Cabinet Hank Dyeing"], colorFastnessStatus: ["Grade 5 (Excellent)", "Grade 4-5 (Very Good)", "Grade 4 (Good)", "Grade 3 (Fair/Susceptible)"],
  designClassification: ["Traditional Temple Grid", "Contemporary Geometric", "Floral Srujana", "Royal Court Reproduction"], bodyPattern: ["Muttu Butta", "Veldhari", "Checks", "Plain"], borderPattern: ["Thandavalam", "Temple", "Mango", "Double Border"],
  artisanAffiliation: ["Cooperative Society Loom", "Independent Master Weaver", "Private Enterprise Guild", "Khadi Board Affiliate"], structuralTechnique: ["Traditional Adai Technique", "Jacquard Harness Method", "Multi-Shuttle Dobby", "Free-Hand Pit Loom"],
  borderPalluMethod: ["Korvai (Separate Warp Weaving)", "Attached Weft Method", "Integrated Continuous Weave"], interlockingMethod: ["KORVAI_3_SHUTTLE (Traditional)", "KORVAI_2_SHUTTLE", "PETNI_WEFT_INTERLOCK", "SINGLE_SHUTTLE_IMITATION"], contrastConfiguration: ["TRUE (Separate Contrast Border & Pallu)", "FALSE (Uniform Single Color/Solid Blend)"],
  warpArchitecture: ["Separate Border and Pallu Warps", "Continuous Unified Warp", "Segmented Tied-and-Dyed Warp"], joiningMethod: ["Petni Joining Method (Traditional)", "Interlinked Knotting", "Seamless Interlace", "Overlap Weft Fusing"], jointInspectionStatus: ["PASSED_VISUAL_AND_TENSION_TEST", "MINOR_FRYING_RE-WORKED", "FAILED_STRUCTURAL_INTEGRITY"],
  qualityGrade: ["Premium Export Grade", "Standard Domestic Grade", "Seconds B-Grade", "Rejected"], qaResult: ["APPROVED", "REJECT"], giIdentity: ["AUTHENTIC_GI_VERIFIED", "NOT_APPLICABLE", "PENDING_GEOGRAPHIC_AUDIT"], authorizedProducerStatus: ["LOCATION_CONFIRMED_INSIDE_BOUNDARIES", "OUTSIDE_BOUNDARIES_DENIED"],
  packagingType: ["Premium Wooden Keepsake Box", "Eco Silk Muslin Pouch", "Standard Paper Box"], transportMode: ["Air Freight", "Dedicated Road Logistics", "Maritime Transport"], stockStatus: ["IN_TRANSIT", "IN_STOCK", "RESERVED", "SOLD_OUT"], dppStatus: ["DRAFT_HIDDEN", "LIVE_ON_BLOCKCHAIN_AND_WEB"],
};

const sections = [
  ["Product Identity & Registry", [["Product ID & Serial Number","productIdSerialNumber"],["Product Name & Collection","productNameCollection"],["Product Category & Type","productCategory","select"],["Product Description","productDescription","textarea"],["Manufacturing Batch ID","manufacturingBatchId"],["Manufacturing Date","manufacturingDate","date"],["Geographical Origin - Country","originCountry"],["Geographical Origin - State","originState"],["Geographical Origin - District","originDistrict"]]],
  ["Silk Raw Material Sourcing", [["Silk Batch ID","silkBatchId"],["Procurement Date","silkProcurementDate","date"],["Silk Supplier ID","silkSupplierId"],["Silk Supplier Name","silkSupplierName"],["Silk Supplier Tax ID","silkSupplierTaxId"],["Silk Type & Variety","silkType","select"],["Geographical Origin - State","silkOriginState","select"],["Geographical Origin - District","silkOriginDistrict"],["Total Sourced Quantity (kg)","silkSourcedQuantity","number"],["Purity & Grade Certification","purityGrade","select"],["Purity Certificate","purityCertificate"],["Procurement Evidence","procurementEvidence"]]],
  ["Zari Raw Material Sourcing", [["Zari Batch ID","zariBatchId"],["Procurement Date","zariProcurementDate","date"],["Zari Supplier ID","zariSupplierId"],["Zari Supplier Name","zariSupplierName"],["Zari Type & Category","zariType","select"],["Gold Content (%)","goldContent","number"],["Silver Content (%)","silverContent","number"],["Copper Content (%)","copperContent","number"],["Silk Core Content (%)","silkCoreContent","number"],["Total Sourced Quantity (kg)","zariSourcedQuantity","number"],["Laboratory Purity Test Status","labPurityStatus","select"],["Testing Laboratory","testingLaboratory"]]],
  ["Silk Yarn Processing & Prep", [["Processing Batch ID","processingBatchId"],["Processing Date","processingDate","date"],["Processing Facility Name","processingFacilityName"],["Processing Facility Location","processingFacilityLocation"],["Reeling Method","reelingMethod","select"],["Twisting Method","twistingMethod","select"],["Warp Yarn Specifications","warpYarnSpecifications"],["Weft Yarn Specifications","weftYarnSpecifications"],["Processed Output Weight (kg)","processedOutputWeight","number"],["Continuous Thread Length (m)","threadLength","number"],["Yarn Quality Status","yarnQualityStatus","select"],["Processing Logs","processingLogs","textarea"]]],
  ["Yarn Dyeing & Color Profile", [["Dyeing Batch ID","dyeingBatchId"],["Dyeing Date","dyeingDate","date"],["Dyeing Facility ID","dyeingFacilityId"],["Dyeing Facility Name","dyeingFacilityName"],["Dye Type","dyeType","select"],["Dye Brand","dyeBrand"],["Dyeing Methodology","dyeingMethodology","select"],["Dyeing Duration (minutes)","dyeingDuration","number"],["Water Consumption (litres)","waterConsumption","number"],["Dye Vat Temperature (°C)","dyeVatTemperature","number"],["Body Color / RGB / HEX","bodyColorProfile"],["Border Color / RGB / HEX","borderColorProfile"],["Pallu Color / RGB / HEX","palluColorProfile"],["Color Fastness Status","colorFastnessStatus","select"]]],
  ["Design & Structural Architecture", [["Design ID","designId"],["Design Name","designName"],["Design Classification","designClassification","select"],["Body Pattern","bodyPattern","select"],["Border Pattern","borderPattern","select"],["Motif Specifications","motifSpecifications"],["Designer Name","designerName"],["Loom Type","loomType"],["Total Warp Threads","totalWarpThreads","number"],["Ends Per Inch (EPI)","endsPerInch","number"],["Warp Length (m)","warpLength","number"]]],
  ["Artisan & Handloom Weaving", [["Weaving Batch ID","weavingBatchId"],["Weaving Start Date","weavingStartDate","date"],["Weaving Completion Date","weavingCompletionDate","date"],["Weaver ID","weaverId"],["Primary Artisan Name","artisanName"],["Registered Phone Number","artisanPhone"],["Experience (years)","artisanExperienceYears","number"],["Artisan Affiliation","artisanAffiliation","select"],["Active Weaver Count","activeWeaverCount","number"],["Traditional Weaving Technique","structuralTechnique","select"],["Sarees Produced","sareesProduced","number"],["Production Duration (days)","productionDuration","number"],["Artisan Comments","artisanComments","textarea"]]],
  ["Kancheepuram Structural Technique", [["Border & Pallu Methodology","borderPalluMethod","select"],["Body-Border Interlocking","interlockingMethod","select"],["Contrast Configuration","contrastConfiguration","select"],["Warp Architecture","warpArchitecture","select"],["Joining Methodology","joiningMethod","select"],["Joint Inspection Status","jointInspectionStatus","select"]]],
  ["Quality Assurance & GI Certification", [["Inspection ID","inspectionId"],["Inspection Date","inspectionDate","date"],["Finished Length (m)","finishedLength","number"],["Finished Width (cm)","finishedWidth","number"],["Finished Weight (kg)","finishedWeight","number"],["Structural Defect Assessment","structuralDefectAssessment"],["Overall Quality Grade","qualityGrade","select"],["QA Result","qaResult","select"],["Geographical Indication Identity","giIdentity","select"],["GI Registration ID","giRegistrationId"],["Authorized Producer Status","authorizedProducerStatus","select"],["Authorized User Number","authorizedUserNumber"],["Silk Mark Certified Number","silkMarkNumber"],["India Handloom Brand Registration","indiaHandloomBrandRegistration"],["Compliance Evidence Packaging","complianceEvidencePackaging"]]],
  ["Packaging & Digital Product Passport (DPP)", [["DPP Lookup Identifier","dppLookupIdentifier"],["QR Code URL","qrCodeUrl"],["Barcode Data","barcodeData"],["Packaging Type","packagingType","select"],["Packaging Date","packagingDate","date"],["Net Saree Weight (auto-fetched)","netSareeWeight"],["Gross Shipment Weight (kg)","grossShipmentWeight","number"],["Consumer Handling Instructions","consumerHandlingInstructions","textarea"],["Transport Mode","transportMode","select"],["Shipment ID","shipmentId"],["Stock Status","stockStatus","select"],["Retailer ID","retailerId"],["Retailer Address","retailerAddress"],["Invoice Number","invoiceNumber"],["Sale Price (INR)","salePrice","number"],["Date of Sale","dateOfSale","date"],["Customer Metadata","customerMetadata"],["DPP Publication Status","dppStatus","select"],["Scan History / Scan Count","scanHistory"]]],
];

const AUTO_FIELDS = new Set(["productIdSerialNumber", "inspectionId", "dppLookupIdentifier", "qrCodeUrl", "barcodeData"]);
const FIELD_EXAMPLES = {
  productNameCollection: "Svarna Mayil Heritage Series",
  productDescription: "Handwoven silk saree with a temple border and peacock pallu.",
  productCategory: "Bridal Kancheepuram Silk",
  manufacturingBatchId: "KP-2026-LOT-001",
  manufacturingDate: "2026-11-16",
  originCountry: "India",
  originState: "Tamil Nadu",
  originDistrict: "Kancheepuram",
  silkBatchId: "SILK-2026-041",
  silkProcurementDate: "2026-10-20",
  silkSupplierId: "SUP-SILK-008",
  silkSupplierName: "Sri Lakshmi Silks",
  silkSupplierTaxId: "29ABCDE1234F1Z5",
  silkOriginDistrict: "Ramanagara",
  silkSourcedQuantity: "12.5",
  purityCertificate: "silk-purity-certificate.pdf",
  procurementEvidence: "silk-purchase-invoice.pdf",
  zariBatchId: "ZARI-2026-017",
  zariProcurementDate: "2026-10-22",
  zariSupplierId: "SUP-ZARI-014",
  zariSupplierName: "Kaveri Zari Works",
  goldContent: "0.5",
  silverContent: "60",
  copperContent: "39.5",
  silkCoreContent: "15",
  zariSourcedQuantity: "2.5",
  testingLaboratory: "Central Silk Technological Research Institute",
  processingBatchId: "YARN-2026-009",
  processingDate: "2026-10-25",
  processingFacilityName: "Sri Venkateswara Reeling Unit",
  processingFacilityLocation: "Kancheepuram, Tamil Nadu",
  warpYarnSpecifications: "18/20 denier, 3-ply",
  weftYarnSpecifications: "16/18 denier, 2-ply",
  processedOutputWeight: "8.5",
  threadLength: "12000",
  processingLogs: "Silk reeled, twisted, and inspected for uniformity.",
  dyeingBatchId: "DYE-2026-012",
  dyeingDate: "2026-10-28",
  dyeingFacilityId: "DYE-UNIT-003",
  dyeingFacilityName: "Kanchi Natural Dye House",
  dyeBrand: "Kiran Azo-Free Silk Dye",
  dyeingDuration: "45",
  waterConsumption: "250",
  dyeVatTemperature: "80",
  bodyColorProfile: "#8B1E3F",
  borderColorProfile: "#D4AF37",
  palluColorProfile: "#1E3A5F",
  designId: "DES-KP-2026-021",
  designName: "Mayil Temple Heritage",
  motifSpecifications: "Peacock motifs with traditional temple checks.",
  designerName: "Meenakshi Raman",
  loomType: "Traditional pit loom",
  totalWarpThreads: "5900",
  endsPerInch: "80",
  warpLength: "6.5",
  weavingBatchId: "WEAVE-2026-031",
  weavingStartDate: "2026-11-01",
  weavingCompletionDate: "2026-11-09",
  weaverId: "WEAVER-KP-014",
  artisanName: "R. Suresh",
  artisanPhone: "+91 98765 43210",
  artisanExperienceYears: "25",
  activeWeaverCount: "2",
  sareesProduced: "10",
  productionDuration: "8",
  artisanComments: "Traditional korvai border woven by hand.",
  inspectionDate: "2026-11-10",
  finishedLength: "6.2",
  finishedWidth: "120",
  finishedWeight: "0.65",
  structuralDefectAssessment: "No defects observed; border and pallu joints passed inspection.",
  giRegistrationId: "GI-KP-2026-001",
  authorizedUserNumber: "AU-KP-024",
  silkMarkNumber: "SM-KP-2026-018",
  indiaHandloomBrandRegistration: "IHB-KP-2026-007",
  complianceEvidencePackaging: "gi-silkmark-lab-certificates.pdf",
  dppLookupIdentifier: "DPP-KP-2026-001",
  qrCodeUrl: "https://traceconnect.in/dpp/KP-2026-001",
  barcodeData: "KP2026001",
  packagingDate: "2026-11-12",
  netSareeWeight: "0.65 kg",
  grossShipmentWeight: "1.2",
  consumerHandlingInstructions: "Dry clean only. Store folded in a breathable cotton cover.",
  shipmentId: "SHIP-KP-2026-004",
  retailerId: "RET-CHN-018",
  retailerAddress: "12 Usman Road, T. Nagar, Chennai",
  invoiceNumber: "INV-KP-2026-105",
  salePrice: "48500",
  dateOfSale: "2026-11-16",
  customerMetadata: "Retail sale, Chennai, Tamil Nadu",
  scanHistory: "12 scans",
};
function code(suffix) { const now = new Date(); const year = now.getFullYear(); const stamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`; const sequence = String(Math.floor(Math.random() * 90000) + 10000); return { productIdSerialNumber: `KP-${year}-MUB-${sequence}`, inspectionId: `INSP-${year}-${stamp}-${sequence.slice(-3)}`, dppLookupIdentifier: `DPP-KP-${year}-${sequence}`, qrCodeUrl: `https://traceconnect.in/dpp/KP-${year}-${sequence}`, barcodeData: `KP${year}${sequence}` }[suffix]; }
function initial() { const result = { productIdSerialNumber: code("productIdSerialNumber"), inspectionId: code("inspectionId"), dppLookupIdentifier: code("dppLookupIdentifier"), qrCodeUrl: code("qrCodeUrl"), barcodeData: code("barcodeData"), originCountry: "India", originState: "Tamil Nadu", originDistrict: "Kancheepuram", giIdentity: "PENDING_GEOGRAPHIC_AUDIT" }; sections.forEach(([, fields]) => fields.forEach(([, key]) => { if (!(key in result)) result[key] = ""; })); return result; }
export function createKancheepuramInitialFields() { return initial(); }
export function buildKancheepuramDetails(form) { return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value])); }
export const KANCHEEPURAM_SECTIONS = sections.map(([name]) => name);
export const KANCHEEPURAM_SECTION_FIELDS = sections;
export const KANCHEEPURAM_PRODUCTION_CONFIG = { value: "kancheepuram_silk", label: "Kancheepuram Silk", badge: "Kancheepuram Silk", badgeClass: "kancheepuram", themeClass: "production-theme-kancheepuram", nameLabel: "Kancheepuram Silk Product Name", namePlaceholder: "e.g. Silk Saree", locationLabel: "Production Location", locationPlaceholder: "Enter production location", mode: "kancheepuram_silk", crop: "Silk Production Batch", crops: "Kancheepuram Silk", variety: "Silk production details", varietyPlaceholder: "Enter batch details", startVerb: "Produced", itemTypeLabel: "Product Type", options: ["Saree", "Silk Yarn", "Zari", "Other"], monitoring: KANCHEEPURAM_SECTIONS };
function Field({ label, keyName, type = "text", options = [], form, setForm, readOnly = false }) {
  const value = form[keyName] || "";
  const update = (event) => setForm((current) => ({ ...current, [keyName]: event.target.value }));
  const sample = FIELD_EXAMPLES[keyName] || (keyName.toLowerCase().includes("id") ? "KP-2026-MUB-001" : type === "number" ? "100" : `Sample ${label}`);
  const exampleHint = type === "date" && !value ? `Example: ${sample}` : "";
  const fieldLabel = <label className="field-label">{label}{readOnly ? " (Auto)" : ""}</label>;
  if (type === "textarea") {
    return (
      <div className="field-wrap">
        {fieldLabel}
        <textarea className="input" value={value} onChange={update} placeholder={`e.g. ${sample}`} />
      </div>
    );
  }
  return (
    <div className="field-wrap">
      {fieldLabel}
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
      {exampleHint && <small className="production-field-example">{exampleHint}</small>}
    </div>
  );
}
export default function KancheepuramSilkProductionFields({ form, setForm, activeSection, productName, location, productionUnitId }) { const [sectionName, fields] = sections[activeSection] || sections[0]; useEffect(() => { const signupUser = getStoredAuth()?.user || {}; setForm((current) => ({ ...current, productionUnitId, productName, productionLocation: location, giRegistrationId: current.giRegistrationId || signupUser.gi_registry_application_number || "", complianceEvidencePackaging: current.complianceEvidencePackaging || signupUser.gi_registry_document_name || "" })); }, [location, productName, productionUnitId, setForm]); return <div className="kotpad-production-fields production-fields"><div className="form-section-label kotpad-section-label">{sectionName}</div><p className="muted">Add Process Evidence after saving this section to attach the required images, reports, certificates, or multimedia proof.</p>{fields.map(([label, key, type]) => <Field key={key} label={label} keyName={key} type={type || (OPTIONS[key] ? "select" : "text")} options={OPTIONS[key]} readOnly={AUTO_FIELDS.has(key)} form={form} setForm={setForm} />)}</div>; }
