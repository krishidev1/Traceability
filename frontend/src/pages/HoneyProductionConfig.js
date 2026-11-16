const BEE_OPTIONS = ["Honey Bee", "Apis Cerana", "Apis Mellifera", "Stingless Bee", "Other"];
export const PRODUCER_TYPES = ["Individual", "FPO", "SHG", "Cooperative", "Organisation"];
export const HEALTH_STATUSES = ["Excellent", "Good", "Average", "Needs Attention"];
export const QUEEN_ORIGINS = ["Self-Raised / Split", "Certified Breeder", "Wild Swarm"];
export const QUEEN_STATUSES = ["Queen-Right (Active)", "Queenless", "Newly Split"];
export const HIVE_STATUSES = ["Active", "In-Treatment (Harvest Locked)", "Empty"];
export const GI_STATUSES = ["Not Applicable", "Pending Approval", "Approved"];
export const EXTRACTION_METHODS = ["Raw & Unheated", "Cold Filtered", "Moisture-Reduced"];
export const MIGRATION_OPTIONS = ["Stationary", "Migratory"];

export const BEE_PRODUCTION_CONFIG = {
  value: "bee",
  label: "Honey Production",
  badge: "Apiculture",
  badgeClass: "bee",
  themeClass: "production-theme-bee",
  nameLabel: "Apiary / Farm Name",
  namePlaceholder: "e.g. Hill Apiary Cluster",
  locationLabel: "Village / District / State",
  locationPlaceholder: "e.g. Koraput, Odisha",
  mode: "bee",
  crop: "Honey Batch",
  crops: "Honey Batches",
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
    producerName: "",
    producerId: "",
    associatedOrganisation: "",
    villageDistrictState: "",
    contactNumber: "",
    registrationLicenseDetails: "",
    numberOfApiaries: "",
    totalHives: "",
    producerType: "",
    apiaryDetails: [],
    apiaryIdName: "",
    apiaryMigrationType: "",
    currentGpsLocation: "",
    beeSpecies: "",
    totalHiveBoxes: "",
    activeStrongColonies: "",
    weakQuarantinedColonies: "",
    healthStatus: "",
    lastInspectionTreatmentDate: "",
    floralNectarSource: "",
    floweringForagingSeason: "",
    compositeHiveId: "",
    queenStatus: "",
    operationalHiveStatus: "",
    queenOriginSource: "",
    breederNameBatchId: "",
    queenIntroductionDate: "",
    queenMarkingId: "",
    harvestCollectionId: "",
    harvestDate: "",
    sourceApiaryHives: "",
    harvestLocationGps: "",
    rawMoistureContent: "",
    quantityHarvested: "",
    processingLotId: "",
    linkedHarvestIds: "",
    processingDate: "",
    processingUnitNameId: "",
    extractionFiltrationMethod: "",
    qualityTestingStatus: "",
    laboratoryReport: "",
    honeyBatchId: "",
    linkedProcessingLotId: "",
    packagingDate: "",
    netWeightPackSize: "",
    bestBeforeDate: "",
    fssaiLicenseNumber: "",
    giStatus: "",
    giProductName: "",
    giRegistrationNumber: "",
    registeredRegion: "",
    authorisedUser: "",
    certifiedUserName: "",
    qrCodeGeneration: "",
  };
}

export function buildBeeDetails(form) {
  return Object.fromEntries(Object.entries(form)
    .filter(([, value]) => value !== "" && value !== undefined && (!Array.isArray(value) || value.length > 0))
    .map(([key, value]) => [key, key === "apiaryDetails" ? encodeURIComponent(JSON.stringify(value)) : value]));
}
