import { useState, useEffect, useContext, createContext, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Trash2, X as LucideX, LoaderCircle } from "lucide-react";
import {
  FiLock, FiCheckCircle, FiUser, FiLogOut,
  FiHome, FiBarChart2, FiPackage, FiAlertTriangle,
  FiTrash2, FiEdit2, FiPlus, FiArrowRight, FiArrowLeft, FiMapPin,
  FiCalendar, FiDroplet, FiVideo, FiCamera, FiCheck,
  FiX, FiMail, FiShield, FiStar, FiTrendingUp, FiGrid,
  FiUpload, FiAward, FiExternalLink, FiDownload, FiSun, FiAperture, FiLayers,
  FiClipboard, FiInfo, FiCpu
} from "react-icons/fi";
import "../styles/Others.css";
import Navbar, { PublicNavbar } from "./Navbar";
import { authApi, clearAuth, getStoredAuth, storeAuth, traceabilityApi, setUnauthorizedCallback } from "../api/traceabilityApi";
import { TRACE_CONNECT_LOGO_SRC, delay } from "../utils/traceConnectConstants";
import Home from "../pages/Home";
import { AuthContext, useAuth, useRouter } from "../shared/AuthContext";
import AuthEntryPage from "../pages/AuthPage";
import AdminDashboard from "../pages/AdminDashboard";
import SupplierBatches, { SupplierBatchModal } from "../pages/SupplierBatches";
import SupplierReports from "../pages/SupplierReports";
import Footer from "./Footer";
import ReportsAnalyticsPage from "../pages/ReportsPage";
import KotpadHandloomProductionFields, {
  KOTPAD_PRODUCTION_CONFIG,
  buildKotpadDetails,
  createKotpadInitialFields,
} from "../pages/KotpadHandloomProduction";
import KancheepuramSilkProductionFields, {
  KANCHEEPURAM_PRODUCTION_CONFIG,
  KANCHEEPURAM_SECTIONS,
  KANCHEEPURAM_SECTION_FIELDS,
  createKancheepuramInitialFields,
  buildKancheepuramDetails,
} from "../pages/KancheepuramSilkProduction";
import MobileRefurbishableProductionFields, {
  createMobileRefurbishableInitialFields,
  buildMobileRefurbishableDetails,
  MOBILE_REFURBISHABLE_SECTIONS,
  MOBILE_REFURBISHABLE_SECTION_FIELDS,
} from "../pages/MobileRefurbishableProduction";
import SambalpuriBandhaProductionFields, {
  SAMBALPURI_PRODUCTION_CONFIG,
  buildSambalpuriDetails,
  buildSambalpuriProductPayload,
  createSambalpuriInitialFields,
} from "../pages/SambalpuriBandhaProduction";
import BeeProductionFields from "../pages/HoneyProduction";
import {
  BEE_PRODUCTION_CONFIG,
  buildBeeDetails,
  createBeeInitialFields,
} from "../pages/HoneyProductionConfig";
import ShrimpProductionFields, {
  SHRIMP_PRODUCTION_CONFIG,
  buildShrimpDetails,
  createShrimpInitialFields,
} from "../pages/ShrimpProduction";

const DataContext = createContext(null);
const TODAY = new Date().toISOString().split("T")[0];
const GI_LOGO_SRC = "/gi-logo.svg";
const KOTPAD_GI_CERTIFICATE_PDF_SRC = "/kotpad-gi-certificate.pdf";
const TRACE_CONNECT_VIDEO_LOGO_SRC = "/Traceconnect Logo - Whitebg.svg";
const THANK_YOU_IMAGE_SRC = "/Thank You.svg";
const VIDEO_GENERATOR_BASE_URL = (
  import.meta.env?.VITE_VIDEO_GENERATOR_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "https://maatiaivideogenerator.onrender.com")
).replace(/\/+$/, "");

// A production build must never silently target the browser's localhost.
// This commonly causes failed video renders after deployment because the
// video-generator is running in Docker/EC2, not on the visitor's machine.
if (!import.meta.env.DEV && /localhost|127\.0\.0\.1/.test(VIDEO_GENERATOR_BASE_URL)) {
  throw new Error("Invalid production video-generator URL: configure VITE_VIDEO_GENERATOR_URL with a public HTTPS URL.");
}

export function LoadingIndicator({ label = "Loading..." }) {
  return (
    <span className="loading-inline">
      <LoaderCircle className="loading-spinner" size={24} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function AppBusyBar({ active, label = "Loading..." }) {
  if (!active) return null;
  return (
    <div className="app-busy-bar" role="status" aria-live="polite">
      <div className="app-busy-progress" />
      <span>{label}</span>
    </div>
  );
}

function GlobalVideoProgressBar({ active, progress, progressPercent, onCancel }) {
  if (!active) return null;
  return (
    <div className="global-video-progress-bar" style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
      border: "1px solid rgba(74, 124, 89, 0.15)",
      borderRadius: "16px",
      padding: "18px 22px",
      width: "340px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      fontFamily: "'DM Sans', sans-serif",
      animation: "tcSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
    }}>
      <style>{`
        @keyframes tcSlideIn {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .tc-pulse-icon {
          animation: tcPulse 2s infinite ease-in-out;
        }
        @keyframes tcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600", color: "#3d2b1f", fontSize: "14px" }}>
          <FiVideo className="tc-pulse-icon" style={{ color: "#4a7c59", fontSize: "16px" }} />
          <span>Generating Video...</span>
        </div>
        <span style={{ fontSize: "13px", color: "#4a7c59", fontWeight: "700" }}>{Math.round(progressPercent || 0)}%</span>
      </div>
      <div style={{ width: "100%", height: "6px", background: "#e8e0d0", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${progressPercent || 0}%`, height: "100%", background: "linear-gradient(90deg, #4a7c59, #6aab79)", borderRadius: "3px", transition: "width 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "2px" }}>
        <span style={{ fontSize: "11px", color: "#666", textTransform: "capitalize", fontWeight: "500" }}>{progress || "Processing..."}</span>
        <button 
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            color: "#c0392b",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "4px",
            transition: "background 0.2s",
            outline: "none",
            fontFamily: "inherit"
          }}
          onMouseOver={(e) => e.target.style.background = "rgba(192, 57, 43, 0.08)"}
          onMouseOut={(e) => e.target.style.background = "none"}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PageSkeleton({ rows = 3, cards = 4, title = "Preparing workspace..." }) {
  return (
    <div className="page-container page-skeleton" aria-busy="true" aria-label={title}>
      <div className="skeleton-hero">
        <div className="skeleton-line wide" />
        <div className="skeleton-line" />
        <div className="skeleton-pill-row">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="skeleton-grid">
        {Array.from({ length: cards }).map((_, index) => (
          <div className="skeleton-card" key={`card-${index}`}>
            <div className="skeleton-icon" />
            <div>
              <div className="skeleton-line short" />
              <div className="skeleton-line tiny" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton-panel">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="skeleton-row" key={`row-${index}`} />
        ))}
      </div>
    </div>
  );
}

function DataStatusBanner({ loading, error }) {
  if (!loading && !error) return null;
  return (
    <div className={`data-status-banner ${error ? "error" : ""}`} role="status">
      {loading ? <LoadingIndicator label="Syncing latest records..." /> : <><FiAlertTriangle /> {error}</>}
    </div>
  );
}

function toISODate(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function safeJson(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getTraceabilityErrorMessage(err) {
  const raw = (err?.message || "").toLowerCase();
  const status = err?.status;

  if (status === 413 || raw.includes("entity too large") || raw.includes("payload too large")) {
    return "Image is too large to upload. Please try again (or reduce image size).";
  }

  if (status === 401 || raw.includes("no token") || raw.includes("token")) {
    return "Traceability is running without login. Please retry the action.";
  }

  if (raw.includes("no farm found") || raw.includes("create a farm first")) {
    return "No farm found for your account. Please add a Farm first (Dashboard -> Add Farm), then retry.";
  }

  if (raw.includes("failed to fetch") || raw.includes("networkerror")) {
    return "Cannot reach the backend. Check that the HTTPS API URL is configured and the backend is running.";
  }

  if (raw.includes("not logged in")) {
    return "Traceability is running in demo mode. Please retry the action.";
  }

  return err?.message || "Something went wrong. Please try again.";
}

function stabilizeTraceabilityViewport(update) {
  if (typeof window === "undefined") {
    update();
    return;
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const active = document.activeElement;

  if (active instanceof HTMLElement && typeof active.blur === "function") {
    active.blur();
  }

  update();

  requestAnimationFrame(() => {
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    });
  });
}

function fromDbPlantation(row) {
  return {
    id: Number(row.id),
    farmId: Number(row.farm_id),
    userId: Number(row.user_id),
    name: row.name || "",
    location: row.location_description || "",
    type: normalizeProductionType(row.production_type || row.crop_type || row.type || "shrimp"),
    status: (row.status || "active").toLowerCase() === "active" ? "Active" : String(row.status),
    createdAt: toISODate(row.created_at),
  };
}

function fromDbCrop(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    name: row.crop_name || "",
    variety: row.crop_variety || "",
    sowingDate: toISODate(row.sowing_date),
    expectedHarvest: toISODate(row.expected_harvest_date),
  };
}

function fromDbMonitoring(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    date: toISODate(row.date),
    inputType: row.input_type || "",
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    remarks: row.remarks || "",
    photoUrl: row.photo_url || "",
  };
}

function fromDbVerification(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    inspectionDate: toISODate(row.inspection_date),
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    health: row.crop_health || "",
    approved: Boolean(row.approved_for_harvest),
  };
}

function fromDbHarvest(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    harvestDate: toISODate(row.harvest_date),
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    total: Number(row.total_quantity) || 0,
    accepted: Number(row.accepted_quantity) || 0,
    rejected: Number(row.rejected_quantity) || 0,
    unit: row.unit || "kg",
  };
}

function fromDbPacking(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    harvestId: row.harvest_id === null || row.harvest_id === undefined ? "" : Number(row.harvest_id),
    packingDate: toISODate(row.packing_date),
    packingSize: row.packing_size || "",
    numPackages: Number(row.number_of_packages) || 0,
    netWeight: Number(row.net_weight) || 0,
    warehouse: row.warehouse_name || "",
    street: row.street || "",
    city: row.city || "",
    state: row.state || "",
    pincode: row.pincode || "",
    country: row.country || "",
  };
}

function fromDbProcessImage(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    stage: row.stage || "",
    name: row.process_name || "",
    date: toISODate(row.created_at),
    imageUrl: row.image_url || "",
  };
}

function fromDbPatch(row) {
  const items = safeJson(row.items, []);
  const packingIds = Array.isArray(items)
    ? items
        .map((it) => it?.packing_id ?? it?.packingId)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    : [];

  return {
    id: row.patch_id,
    dbId: Number(row.id),
    supplierId: Number(row.user_id),
    packingIds,
    description: row.description || "",
    totalWeight: Number(row.total_weight) || 0,
    unit: row.unit || "kg",
    createdAt: toISODate(row.created_at),
  };
}

async function requestBackCameraStream() {
  const base = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...base, facingMode: { exact: "environment" } },
      audio: false,
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...base, facingMode: { ideal: "environment" } },
      audio: false,
    });
  }
}

async function applyCameraTuning(track) {
  if (!track?.getCapabilities || !track?.applyConstraints) return;
  const caps = track.getCapabilities();
  const advanced = [];

  if (caps.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
  if (caps.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
  if (caps.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });

  if (!advanced.length) return;
  try {
    await track.applyConstraints({ advanced });
  } catch {
    // ignore
  }
}

function stopMediaStream(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

async function getCurrentLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    }
  } catch {
    // ignore
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

function formatCoords(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-";
}

function formatDateTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekday = lookup.weekday || "";
  const day = lookup.day || "";
  const month = lookup.month || "";
  const year = lookup.year || "";
  const hour = lookup.hour || "";
  const minute = lookup.minute || "";
  const second = lookup.second || "";
  const dayPeriod = lookup.dayPeriod || "";
  return `${weekday}, ${day}/${month}/${year}, ${hour}:${minute}:${second} ${dayPeriod}`;
}

function getUserSignupLocation(user = {}) {
  const parts = [
    user.village_area || user.villageArea,
    user.district,
    user.state || user.stateName,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(parts)).join(", ");
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxHeight, maxLines) {
  const words = String(text || "").split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());

  let clipped = lines;
  if (maxLines && lines.length > maxLines) {
    clipped = lines.slice(0, maxLines);
    let last = clipped[maxLines - 1];
    while (ctx.measureText(last + "...").width > maxWidth && last.length > 0) {
      last = last.slice(0, -1).trim();
    }
    clipped[maxLines - 1] = last ? `${last}...` : "...";
  }

  let cursorY = y;
  for (let i = 0; i < clipped.length; i++) {
    if (maxHeight && cursorY + lineHeight > y + maxHeight) break;
    ctx.fillText(clipped[i], x, cursorY);
    cursorY += lineHeight;
  }
}

function drawMapPlaceholder(ctx, x, y, size, radius) {
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "rgba(15, 22, 30, 0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `${Math.max(10, size * 0.12)}px Poppins, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Map unavailable", x + size / 2, y + size / 2);
  ctx.restore();
}

async function drawGiCertificateStamp(ctx, width, height, productLabel = "GI TAGGED") {
  const padding = Math.round(Math.min(width, height) * 0.035);
  const badgeWidth = Math.min(Math.round(width * 0.34), 380);
  const badgeHeight = Math.max(96, Math.round(badgeWidth * 0.34));
  const x = width - badgeWidth - padding;
  const y = padding;
  const radius = Math.round(badgeHeight * 0.22);

  ctx.save();
  ctx.shadowColor = "rgba(5, 46, 22, 0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, x, y, badgeWidth, badgeHeight, radius);
  const gradient = ctx.createLinearGradient(x, y, x + badgeWidth, y + badgeHeight);
  gradient.addColorStop(0, "#0f8d75");
  gradient.addColorStop(0.62, "#10a35a");
  gradient.addColorStop(1, "#1d7dd8");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, x + 8, y + 8, badgeWidth - 16, badgeHeight - 16, radius - 6);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const sealSize = Math.round(badgeHeight * 0.52);
  const sealX = x + Math.round(badgeHeight * 0.2);
  const sealY = y + Math.round((badgeHeight - sealSize) / 2);
  ctx.beginPath();
  ctx.arc(sealX + sealSize / 2, sealY + sealSize / 2, sealSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fill();
  try {
    const logo = await loadImageElement(GI_LOGO_SRC);
    const logoPadding = Math.round(sealSize * 0.16);
    ctx.drawImage(
      logo,
      sealX + logoPadding,
      sealY + logoPadding,
      sealSize - logoPadding * 2,
      sealSize - logoPadding * 2,
    );
  } catch {
    ctx.fillStyle = "#0f8d75";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(sealSize * 0.34)}px Poppins, sans-serif`;
    ctx.fillText("GI", sealX + sealSize / 2, sealY + sealSize / 2 + 1);
  }

  const textX = sealX + sealSize + Math.round(badgeHeight * 0.18);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(18, Math.round(badgeHeight * 0.22))}px Poppins, sans-serif`;
  ctx.fillText("CERTIFIED GI", textX, y + Math.round(badgeHeight * 0.38));
  ctx.font = `700 ${Math.max(12, Math.round(badgeHeight * 0.13))}px Poppins, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.fillText(productLabel, textX, y + Math.round(badgeHeight * 0.64));
  ctx.restore();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to prepare selected image."));
    img.src = src;
  });
}

async function addGiCertificateStampToImage(dataUrl, label = "KOTPAD HANDLOOM") {
  const image = await loadImageElement(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, outputWidth, outputHeight);
  await drawGiCertificateStamp(ctx, outputWidth, outputHeight, label);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function addUploadedImageMetadata(dataUrl, { processName, date, location, stampGi, giProductLabel }) {
  const image = await loadImageElement(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, 1400 / Math.max(width, height));
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, outputWidth, outputHeight);

  const barHeight = Math.max(74, Math.round(outputHeight * 0.12));
  ctx.fillStyle = "rgba(5, 24, 18, 0.82)";
  ctx.fillRect(0, outputHeight - barHeight, outputWidth, barHeight);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(16, Math.round(outputWidth * 0.018))}px Poppins, sans-serif`;
  ctx.fillText(String(processName || "Process Capture"), 24, outputHeight - barHeight + 24);
  ctx.font = `500 ${Math.max(13, Math.round(outputWidth * 0.014))}px Poppins, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.fillText(`${date || TODAY}  |  ${location || "Location unavailable"}`, 24, outputHeight - 22);
  if (stampGi) await drawGiCertificateStamp(ctx, outputWidth, outputHeight - barHeight, giProductLabel);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function isPdfUrl(url = "") {
  const value = String(url || "").toLowerCase();
  return value.startsWith("data:application/pdf") || value.includes(".pdf");
}

function toVideoGeneratorUrl(path = "") {
  const value = String(path || "").trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${VIDEO_GENERATOR_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

async function waitForVideoGenerator(onProgress) {
  const maxAttempts = 12;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response;
    try {
      response = await fetch(toVideoGeneratorUrl("/health"), { cache: "no-store" });
    } catch {
      // The service may be waking from sleep or temporarily unreachable.
    }
    if (response?.ok) return;
    if (response && response.status < 500) {
      throw new Error(`Video service health check failed (${response.status}).`);
    }

    if (attempt < maxAttempts - 1) {
      onProgress?.({ progress: 1, stage: "Waking video service..." });
      await delay(5000);
    }
  }

  throw new Error("Video service is not responding. It may be starting up or temporarily unavailable. Please try again shortly.");
}

function getOrderedVideoImages(images = [], stages = []) {
  const stageIndex = new Map((stages || []).map((stage, index) => [stage, index]));
  return [...(images || [])]
    .filter((img) => img?.imageUrl && !isPdfUrl(img.imageUrl))
    .sort((a, b) => {
      const stageDelta = (stageIndex.get(a.stage) ?? 999) - (stageIndex.get(b.stage) ?? 999);
      if (stageDelta) return stageDelta;
      const dateDelta = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateDelta) return dateDelta;
      return Number(a.id || 0) - Number(b.id || 0);
    });
}

function pickCertificateImage(images = []) {
  return images.find((img) => /certificate|certification|verified|verification/i.test(`${img.stage || ""} ${img.name || ""}`))
    || images.find((img) => /verification/i.test(img.stage || ""))
    || images[images.length - 1];
}

function buildTraceVideoPayload({ user, images, stages, template = "A", productionName = "TraceConnect" }) {
  const orderedImages = getOrderedVideoImages(images, stages);
  if (!orderedImages.length) {
    throw new Error("Capture at least one stage image before generating the video.");
  }

  const certificateImage = pickCertificateImage(orderedImages);
  const processImages = orderedImages.filter((img) => img !== certificateImage);
  const videoProcessImages = processImages.length ? processImages : orderedImages;
  const firstImageUrl = videoProcessImages[0].imageUrl;
  const lastImageUrl = videoProcessImages[videoProcessImages.length - 1].imageUrl;
  const farmerImageUrl = user?.profile_image || firstImageUrl;
  const certificateImageUrl = pickCertificateImage(orderedImages)?.imageUrl || lastImageUrl;

  return {
    template,
    production_name: productionName,
    logo_url: TRACE_CONNECT_VIDEO_LOGO_SRC,
    intro_logo_url: TRACE_CONNECT_VIDEO_LOGO_SRC,
    farmer_img_url: farmerImageUrl,
    farm_img_url: firstImageUrl,
    process_image_urls: videoProcessImages.map((img) => img.imageUrl),
    certificate_img_url: certificateImage?.imageUrl || certificateImageUrl,
    end_img_url: THANK_YOU_IMAGE_SRC,
  };
}

async function inlineVideoImageSource(source) {
  const value = String(source || "").trim();
  if (!value || value.startsWith("data:")) return value;
  try {
    const fetchUrl = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    const response = await fetch(fetchUrl);
    if (!response.ok) return value;
    const blob = await response.blob();
    if (blob.type.includes("svg") || value.toLowerCase().endsWith(".svg")) {
      const svgUrl = URL.createObjectURL(blob);
      try {
        const svgImage = await loadImageElement(svgUrl);
        const canvas = document.createElement("canvas");
        canvas.width = svgImage.naturalWidth || 1600;
        canvas.height = svgImage.naturalHeight || 900;
        canvas.getContext("2d").drawImage(svgImage, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    }
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || value));
      reader.onerror = () => resolve(value);
      reader.readAsDataURL(blob);
    });
  } catch {
    return value;
  }
}

async function renderTraceVideoFromImages({ user, images, stages, template = "A", productionName, onJobId, onProgress }) {
  const payload = buildTraceVideoPayload({ user, images, stages, template, productionName });
  const sourceKeys = ["logo_url", "intro_logo_url", "farmer_img_url", "farm_img_url", "certificate_img_url", "end_img_url"];
  const inlinedSources = await Promise.all(sourceKeys.map((key) => inlineVideoImageSource(payload[key])));
  sourceKeys.forEach((key, index) => { payload[key] = inlinedSources[index]; });
  payload.process_image_urls = await Promise.all(payload.process_image_urls.map(inlineVideoImageSource));
  onProgress?.({ progress: 1, stage: "starting" });
  await waitForVideoGenerator(onProgress);
  let renderResponse;
  try {
    renderResponse = await fetch(toVideoGeneratorUrl("/render-from-urls"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Video service could not be reached. Confirm that the service is running and its CORS_ORIGINS includes this site's address.");
  }

  const renderData = await renderResponse.json().catch(async () => ({ error: await renderResponse.text().catch(() => "") }));
  if (!renderResponse.ok) {
    throw new Error(renderData?.error || "Video render failed");
  }

  const jobId = renderData?.job_id;
  if (!jobId) throw new Error("Video generator did not return a job id");
  
  onJobId?.(jobId);

  for (let attempt = 0; attempt < 180; attempt += 1) {
    await delay(1500);
    const statusResponse = await fetch(toVideoGeneratorUrl(`/status/${jobId}`));
    const statusData = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) throw new Error(statusData?.error || "Unable to check video status");
    onProgress?.({ progress: statusData.progress || 0, stage: statusData.stage || "processing" });
    if (statusData.status === "done") {
      return statusData.cloudinary_url || toVideoGeneratorUrl(statusData.download_url);
    }
    if (statusData.status === "error") {
      throw new Error(statusData.error || "Video render failed");
    }
    if (statusData.status === "cancelled") {
      throw new Error("Video render was cancelled");
    }
  }

  throw new Error("Video generation is taking longer than expected. Please try again shortly.");
}

function isGiLogoProduction(mode) {
  return mode === "kotpad_handloom" || mode === "kancheepuram_silk" || mode === "sambalpuri_bandha";
}

async function drawGeoOverlay(ctx, width, topY, panelHeight, details) {
  const padding = Math.round(width * 0.04);
  const boxHeight = panelHeight;
  const boxY = topY;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, boxY, width, boxHeight);
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
  gradient.addColorStop(0, "rgba(0,0,0,0.0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, boxY, width, boxHeight);

  const mapSize = Math.max(80, Math.min(Math.round(boxHeight * 0.72), boxHeight - padding * 2));
  const mapRadius = Math.round(mapSize * 0.12);
  const mapX = padding;
  const mapY = boxY + Math.round((boxHeight - mapSize) / 2);

  // Draw leaflet map tiles directly if available in the DOM
  const mapElement = document.getElementById("camera-leaflet-map");
  if (mapElement) {
    ctx.save();
    drawRoundedRect(ctx, mapX, mapY, mapSize, mapSize, mapRadius);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    const tiles = mapElement.querySelectorAll(".leaflet-tile");
    const mapRect = mapElement.getBoundingClientRect();
    const scaleX = mapSize / mapRect.width;
    const scaleY = mapSize / mapRect.height;

    // Fetch and draw tiles using clean CORS-enabled blob requests to prevent taints
    const tileDrawings = Array.from(tiles).map(async (tile) => {
      const tileRect = tile.getBoundingClientRect();
      const dx = tileRect.left - mapRect.left;
      const dy = tileRect.top - mapRect.top;

      try {
        const response = await fetch(tile.src, { mode: "cors" });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(
              img,
              mapX + dx * scaleX,
              mapY + dy * scaleY,
              tileRect.width * scaleX,
              tileRect.height * scaleY
            );
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          img.src = blobUrl;
        });
      } catch {
        // Fallback: draw directly (might taint canvas in legacy/offline scenarios)
        try {
          ctx.drawImage(
            tile,
            mapX + dx * scaleX,
            mapY + dy * scaleY,
            tileRect.width * scaleX,
            tileRect.height * scaleY
          );
        } catch {
          // ignore
        }
      }
    });

    await Promise.all(tileDrawings);

    // Draw markers using CORS blob fetching
    const markers = mapElement.querySelectorAll(".leaflet-marker-icon");
    const markerDrawings = Array.from(markers).map(async (marker) => {
      const markerRect = marker.getBoundingClientRect();
      const dx = markerRect.left - mapRect.left;
      const dy = markerRect.top - mapRect.top;

      try {
        const response = await fetch(marker.src, { mode: "cors" });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(
              img,
              mapX + dx * scaleX,
              mapY + dy * scaleY,
              markerRect.width * scaleX,
              markerRect.height * scaleY
            );
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          img.src = blobUrl;
        });
      } catch {
        try {
          ctx.drawImage(
            marker,
            mapX + dx * scaleX,
            mapY + dy * scaleY,
            markerRect.width * scaleX,
            markerRect.height * scaleY
          );
        } catch {
          // ignore
        }
      }
    });

    await Promise.all(markerDrawings);
    ctx.restore();
  } else {
    drawMapPlaceholder(ctx, mapX, mapY, mapSize, mapRadius);
  }

  const lineX = mapX + mapSize + Math.round(padding * 0.6);
  const lineY = mapY + 8;
  const lineHeight = mapSize - 16;
  ctx.save();
  ctx.strokeStyle = "rgba(178, 255, 70, 0.95)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(178, 255, 70, 0.45)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX, lineY + lineHeight);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const nameFont = 24;
  const textFont = 18;
  const smallFont = 15;

  let cursorY = mapY;
  const textX = lineX + Math.round(padding * 0.7);

  // Stage Name (uppercase, highlighted green/lime)
  if (details.stage) {
    ctx.font = `700 ${nameFont}px Poppins, sans-serif`;
    ctx.fillStyle = "rgba(178, 255, 70, 0.95)";
    ctx.fillText(details.stage.toUpperCase(), textX, cursorY);
    cursorY += nameFont + 6;
  }

  // Process Entry Name
  ctx.font = `600 ${nameFont}px Poppins, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(details.name, textX, cursorY);
  cursorY += nameFont + 6;

  // DateTime
  ctx.font = `500 ${textFont}px Poppins, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText(details.dateTime, textX, cursorY);
  cursorY += textFont + 6;

  // Address
  ctx.font = `500 ${textFont}px Poppins, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  const addressMaxHeight = mapY + mapSize - cursorY - (smallFont + 6);
  wrapText(ctx, details.address, textX, cursorY, width - textX - padding, textFont + 4, Math.max(addressMaxHeight, 30), 2);

  // Lat/Lon
  const coordsLine = `Lat: ${formatCoords(details.lat)}, Long: ${formatCoords(details.lon)}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `500 ${smallFont}px Poppins, sans-serif`;
  ctx.fillText(coordsLine, textX, mapY + mapSize - smallFont - 2);
}

function DataProvider({ children }) {
  const { user, unlockVideo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [backendError, setBackendError] = useState("");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const [plantations, setPlantations] = useState([]);
  const [crops, setCrops] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [verification, setVerification] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [packings, setPackings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [processImages, setProcessImages] = useState([]);

  const run = async (fn, fallbackMessage) => {
    setPendingRequests((count) => count + 1);
    try {
      setBackendError("");
      return await fn();
    } catch (err) {
      const msg = getTraceabilityErrorMessage(err) || fallbackMessage || "Request failed";
      setBackendError(msg);
      throw err;
    } finally {
      setPendingRequests((count) => Math.max(0, count - 1));
    }
  };

  const fetchMyFarms = async () => {
    return traceabilityApi.listFarms();
  };

  useEffect(() => {
    if (!user?.id) {
      setFarms([]);
      setSelectedFarmId(null);
      setPlantations([]);
      setCrops([]);
      setMonitoring([]);
      setVerification([]);
      setHarvests([]);
      setPackings([]);
      setBatches([]);
      setProcessImages([]);
      setBackendError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setBackendError("");

    (async () => {
      const [
        myFarms,
        pl,
        cr,
        mon,
        ver,
        har,
        pk,
        pt,
        imgs,
      ] = await Promise.all([
        fetchMyFarms(),
        traceabilityApi.listPlantations(),
        traceabilityApi.listCrops(),
        traceabilityApi.listMonitoringRecords(),
        traceabilityApi.listVerifications(),
        traceabilityApi.listHarvests(),
        traceabilityApi.listPackings(),
        traceabilityApi.listPatches(),
        traceabilityApi.listProcessImages(),
      ]);

      if (cancelled) return;
      setFarms(myFarms || []);
      const defaultFarmId = myFarms?.[0]?.farm_id;
      setSelectedFarmId((prev) => (prev === null || prev === undefined) ? (Number(defaultFarmId) || null) : prev);
      setPlantations((pl || []).map(fromDbPlantation));
      setCrops((cr || []).map(fromDbCrop));
      setMonitoring((mon || []).map(fromDbMonitoring));
      setVerification((ver || []).map(fromDbVerification));
      setHarvests((har || []).map(fromDbHarvest));
      setPackings((pk || []).map(fromDbPacking));
      setBatches((pt || []).map(fromDbPatch));
      setProcessImages((imgs || []).map(fromDbProcessImage));
    })()
      .catch((err) => {
        if (cancelled) return;
        setBackendError(err?.message || "Failed to load traceability data");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const addPlantation = (p) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const farmIdNum = Number(selectedFarmId);
      const hasSelectedFarm = Number.isInteger(farmIdNum);
      const farm = hasSelectedFarm ? farms.find((f) => Number(f?.farm_id) === farmIdNum) || null : null;
      const payload = {
        name: p.name,
        location_description: p.location,
        production_type: normalizeProductionType(p.type),
        status: "active",
      };

      if (farm) {
        payload.farm_id = farmIdNum;
        payload.polygon_coordinates = farm.polygon_coordinates;
      }

      const created = await traceabilityApi.createPlantation(payload);
      stabilizeTraceabilityViewport(() => {
        setPlantations((prev) => [...prev, fromDbPlantation({ ...created, production_type: created?.production_type || p.type })]);
        if (!farm && created?.farm_id) {
          const createdFarmId = Number(created.farm_id);
          setFarms((prev) => prev.some((item) => Number(item?.farm_id) === createdFarmId)
            ? prev
            : [
                ...prev,
                {
                  farm_id: createdFarmId,
                  user_id: Number(created.user_id),
                  farm_name: p.name,
                  farm_location: p.location,
                  polygon_coordinates: null,
                },
              ]);
          setSelectedFarmId(createdFarmId);
        } else if (farm) {
          setFarms((prev) => prev.map((item) => (
            Number(item?.farm_id) === farmIdNum
              ? { ...item, farm_location: p.location }
              : item
          )));
        }
      });
      return created;
    }, "Failed to create plantation");
  };

  const delPlantation = (pid) => {
    return run(async () => {
      await traceabilityApi.deletePlantation(pid);
      stabilizeTraceabilityViewport(() => {
        setPlantations((prev) => prev.filter((x) => x.id !== pid));
        setCrops((prev) => prev.filter((x) => x.plantationId !== pid));
        setMonitoring((prev) => prev.filter((x) => x.plantationId !== pid));
        setVerification((prev) => prev.filter((x) => x.plantationId !== pid));
        setHarvests((prev) => prev.filter((x) => x.plantationId !== pid));
        setPackings((prev) => prev.filter((x) => x.plantationId !== pid));
        setProcessImages((prev) => prev.filter((x) => x.plantationId !== pid));
      });
      return true;
    }, "Failed to delete plantation");
  };

  const addCrop = (c) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const payload = {
        plantation_id: Number(c.plantationId),
        crop_name: c.name,
        crop_variety: c.variety || null,
        sowing_date: c.sowingDate || null,
        expected_harvest_date: c.expectedHarvest || null,
        production_type: c.productionType || undefined,
      };
      const created = c.productionType === "sambalpuri_bandha"
        ? await traceabilityApi.createSambalpuriBandhaProduct({
            ...payload,
            ...(c.sambalpuri || {}),
          })
        : await traceabilityApi.createCrop(payload);
      const cropRow = created?.crop || created;
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => [...prev, fromDbCrop(cropRow)]);
      });
      return created;
    }, "Failed to create crop");
  };

  const delCrop = (cid) => {
    return run(async () => {
      await traceabilityApi.deleteCrop(cid);
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => prev.filter((x) => x.id !== cid));
      });
      return true;
    }, "Failed to delete crop");
  };

  const updateCrop = (cid, c) => {
    return run(async () => {
      const updated = await traceabilityApi.updateCrop(cid, {
        plantation_id: Number(c.plantationId),
        crop_name: c.name,
        crop_variety: c.variety || null,
        sowing_date: c.sowingDate || null,
        expected_harvest_date: c.expectedHarvest || null,
      });
      const cropRow = updated?.crop || updated;
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => prev.map((item) => item.id === cid ? fromDbCrop(cropRow) : item));
      });
      return updated;
    }, "Failed to update crop");
  };

  const addMonitoring = (m) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createMonitoringRecord({
        plantation_id: Number(m.plantationId),
        crop_id: m.cropId ? Number(m.cropId) : null,
        date: m.date,
        input_type: m.inputType,
        remarks: m.remarks || null,
        photo_url: m.photoUrl || null,
      });
      stabilizeTraceabilityViewport(() => {
        setMonitoring((prev) => [...prev, fromDbMonitoring(created)]);
      });
      return created;
    }, "Failed to create monitoring record");
  };

  const delMonitoring = (mid) => {
    return run(async () => {
      await traceabilityApi.deleteMonitoringRecord(mid);
      stabilizeTraceabilityViewport(() => {
        setMonitoring((prev) => prev.filter((x) => x.id !== mid));
      });
      return true;
    }, "Failed to delete monitoring record");
  };

  const addVerification = (v) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createVerification({
        plantation_id: Number(v.plantationId),
        crop_id: v.cropId ? Number(v.cropId) : null,
        inspection_date: v.inspectionDate,
        crop_health: v.health,
        approved_for_harvest: Boolean(v.approved),
      });
      stabilizeTraceabilityViewport(() => {
        setVerification((prev) => [...prev, fromDbVerification(created)]);
      });
      return created;
    }, "Failed to create verification");
  };

  const delVerification = (vid) => {
    return run(async () => {
      await traceabilityApi.deleteVerification(vid);
      stabilizeTraceabilityViewport(() => {
        setVerification((prev) => prev.filter((x) => x.id !== vid));
      });
      return true;
    }, "Failed to delete verification");
  };

  const addHarvest = (h) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createHarvest({
        plantation_id: Number(h.plantationId),
        crop_id: h.cropId ? Number(h.cropId) : null,
        harvest_date: h.harvestDate,
        total_quantity: Number(h.total) || 0,
        accepted_quantity: Number(h.accepted) || 0,
        rejected_quantity: Number(h.rejected) || 0,
        unit: h.unit || "kg",
      });
      stabilizeTraceabilityViewport(() => {
        setHarvests((prev) => [...prev, fromDbHarvest(created)]);
      });
      return created;
    }, "Failed to create harvest");
  };

  const delHarvest = (hid) => {
    return run(async () => {
      await traceabilityApi.deleteHarvest(hid);
      stabilizeTraceabilityViewport(() => {
        setHarvests((prev) => prev.filter((x) => x.id !== hid));
      });
      return true;
    }, "Failed to delete harvest");
  };

  const addPacking = (pk) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createPacking({
        plantation_id: Number(pk.plantationId),
        harvest_id: pk.harvestId ? Number(pk.harvestId) : null,
        packing_date: pk.packingDate,
        number_of_packages: Number(pk.numPackages) || 0,
        net_weight: Number(pk.netWeight) || 0,
        packing_size: pk.packingSize || null,
        warehouse_name: pk.warehouse || null,
        street: pk.street || null,
        city: pk.city || null,
        state: pk.state || null,
        pincode: pk.pincode || null,
        country: pk.country || null,
      });
      stabilizeTraceabilityViewport(() => {
        setPackings((prev) => [...prev, fromDbPacking(created)]);
      });
      return created;
    }, "Failed to create packing");
  };

  const delPacking = (pkid) => {
    return run(async () => {
      await traceabilityApi.deletePacking(pkid);
      stabilizeTraceabilityViewport(() => {
        setPackings((prev) => prev.filter((x) => x.id !== pkid));
      });
      return true;
    }, "Failed to delete packing");
  };

  const addBatch = (b) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const items = Array.isArray(b.items) && b.items.length > 0
        ? b.items
        : (b.packingIds || []).map((pid) => {
            const packing = packings.find((p) => p.id === pid);
            const harvest = harvests.find((h) => h.id === packing?.harvestId);
            return {
              packing_id: pid,
              harvest_id: packing?.harvestId,
              crop_id: harvest?.cropId,
              plantation_id: packing?.plantationId,
            };
          });

      const created = await traceabilityApi.createPatch({
        patch_id: b.id,
        description: b.description || null,
        total_weight: Number(b.totalWeight) || 0,
        unit: b.unit || "kg",
        items,
      });
      stabilizeTraceabilityViewport(() => {
        setBatches((prev) => [...prev, fromDbPatch(created)]);
      });
      return created;
    }, "Failed to create patch");
  };

  const delBatch = (patchId) => {
    return run(async () => {
      const patch = batches.find((x) => x.id === patchId);
      if (!patch?.dbId) throw new Error("Patch record not found for delete.");
      await traceabilityApi.deletePatchByDbId(patch.dbId);
      stabilizeTraceabilityViewport(() => {
        setBatches((prev) => prev.filter((x) => x.id !== patchId));
      });
      return true;
    }, "Failed to delete patch");
  };

  const addProcessImage = (img) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createProcessImage({
        plantation_id: Number(img.plantationId),
        stage: img.stage,
        process_name: img.name,
        image_url: img.imageUrl,
      });
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => [...prev, fromDbProcessImage(created)]);
      });
      if (unlockVideo) unlockVideo();
      return created;
    }, "Failed to create process image");
  };

  const delProcessImage = (iid) => {
    return run(async () => {
      await traceabilityApi.deleteProcessImage(iid);
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => prev.filter((x) => x.id !== iid));
      });
      if (unlockVideo) unlockVideo();
      return true;
    }, "Failed to delete process image");
  };

  const updateProcessImage = (iid, updates) => {
    return run(async () => {
      const updated = await traceabilityApi.updateProcessImage(iid, {
        plantation_id: updates.plantationId === undefined ? undefined : Number(updates.plantationId),
        stage: updates.stage,
        process_name: updates.name,
        image_url: updates.imageUrl,
      });
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => prev.map((x) => (x.id === iid ? fromDbProcessImage(updated) : x)));
      });
      if (unlockVideo) unlockVideo();
      return updated;
    }, "Failed to update process image");
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        pendingRequests,
        syncing: loading || pendingRequests > 0,
        backendError,
        farms,
        selectedFarmId,
        setSelectedFarmId,
        plantations,
        crops,
        monitoring,
        verification,
        harvests,
        packings,
        batches,
        processImages,
        addPlantation,
        delPlantation,
        addCrop,
        updateCrop,
        delCrop,
        addMonitoring,
        delMonitoring,
        addVerification,
        delVerification,
        addHarvest,
        delHarvest,
        addPacking,
        delPacking,
        addBatch,
        delBatch,
        addProcessImage,
        updateProcessImage,
        delProcessImage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberAuth, setRememberAuth] = useState(true);

  // Global persistent video generation states
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [videoProgressPercent, setVideoProgressPercent] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);

  useEffect(() => {
    const stored = getStoredAuth();
    setUser(stored?.user || null);
    setLoading(false);

    setUnauthorizedCallback(() => {
      setUser(null);
    });

    return () => {
      setUnauthorizedCallback(null);
    };
  }, []);

  const completeAuth = (payload, remember = rememberAuth) => {
    const nextUser = {
      ...(payload.user || {}),
      role: payload.user?.role || "grower",
      rawRole: payload.user?.rawRole || payload.user?.role || "grower",
    };
    storeAuth({ access_token: payload.access_token, user: nextUser, remember });
    setUser(nextUser);
    return nextUser;
  };

  const unlockVideo = () => {
    // Mirror the backend reset locally so the button unlocks immediately
    updateUser({ video_locked: false });
  };

  const updateUser = (updatedUserFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUserFields };
      const token = localStorage.getItem("traceconnect_auth_token") || sessionStorage.getItem("traceconnect_auth_token");
      if (token) {
        const primary = localStorage.getItem("traceconnect_auth_token") ? localStorage : sessionStorage;
        primary.setItem("traceconnect_auth_user", JSON.stringify(next));
      }
      return next;
    });
  };

  const signOut = () => {
    clearAuth();
    setUser(null);
  };

  const cancelVideoGeneration = async () => {
    if (!currentJobId) return;
    try {
      await fetch(toVideoGeneratorUrl(`/cancel/${currentJobId}`), { method: "POST" });
    } catch {
      // Silently catch
    }
    setVideoBusy(false);
    setVideoProgress("");
    setVideoProgressPercent(0);
    setCurrentJobId(null);
  };

  const generateVideo = async (images, stages, template = "A", productionName = "TraceConnect") => {
    if (videoBusy) return;
    setVideoBusy(true);
    setVideoProgress("Starting video generator...");
    setVideoProgressPercent(1);
    try {
      const videoUrl = await renderTraceVideoFromImages({
        user,
        images,
        stages,
        template,
        productionName,
        onJobId: (jobId) => setCurrentJobId(jobId),
        onProgress: ({ progress, stage }) => {
          setVideoProgress(stage || "Processing");
          setVideoProgressPercent(Number(progress) || 0);
        },
      });

      // Save video URL and lock generation for this account
      const updatedUser = await authApi.updateProfile({ video_url: videoUrl, video_locked: true });
      updateUser(updatedUser);

      // Download to device
      try {
        const blob = await fetch(videoUrl).then((r) => r.blob());
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${String(productionName || "TraceConnect").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-traceability-${new Date().toISOString().slice(0, 10)}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (_) {
        // Fallback: open in new tab if blob download fails (e.g. CORS)
        window.open(videoUrl, "_blank", "noopener,noreferrer");
      }

      return videoUrl;
    } finally {
      setVideoBusy(false);
      setVideoProgress("");
      setVideoProgressPercent(0);
      setCurrentJobId(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        setRememberAuth,
        updateUser,
        videoBusy,
        videoProgress,
        videoProgressPercent,
        generateVideo,
        cancelVideoGeneration,
        unlockVideo,
        login: async (payload, remember) => completeAuth(await authApi.login(payload), remember),
        signup: async (payload) => completeAuth(await authApi.signup(payload), true),
        forgotPassword: authApi.forgotPassword,
        resetPassword: authApi.resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useData() {
  return useContext(DataContext);
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  useEffect(() => {
    const handleInvalid = (event) => {
      event.preventDefault();
      const field = event.target;
      const label = field?.closest("label")?.querySelector(".auth-field-label")?.textContent
        || field?.getAttribute("aria-label")
        || field?.getAttribute("placeholder")
        || "this field";
      toast(`Please complete ${String(label).toLowerCase()}`, "error");
    };
    window.addEventListener("invalid", handleInvalid, true);
    return () => window.removeEventListener("invalid", handleInvalid, true);
  }, []);
  return { toasts, toast };
}

function Toasts({ toasts, themeClass = "" }) {
  return (
    <div className={`toast-stack ${themeClass}`}>
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? <FiCheckCircle /> : t.type === "info" ? <FiInfo /> : <FiAlertTriangle />}
          </span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const HEALTH_OPTIONS = ["Excellent", "Good", "Moderate", "Poor", "Disease Detected", "Needs Inspection", "Purity Verified", "Lab Report Pending"];
const UNIT_OPTIONS = ["kg", "ton", "count", "litre", "jar", "box", "pack", "piece"];
const PACKAGING_METHOD_OPTIONS = ["Bag", "Sack", "Box", "Bottle / Jar", "Vacuum Pack", "Cold Chain Pack", "Bulk Crate", "Handmade Pack", "Other"];
const TRANSPORT_METHOD_OPTIONS = ["Road Transport", "Refrigerated Vehicle", "Rail", "Air Cargo", "Sea Freight", "Courier", "Other"];
const COLD_STORAGE_OPTIONS = ["Not Required", "Required", "Available", "Not Available"];
const TRACE_STAGES = ["Ponds", "Apiaries", "Kotpad Fabric", "Sambalpuri Product", "Monitoring", "Verification", "Harvest", "Packing"];
const SHARED_TRACE_STAGES = ["Monitoring", "Verification", "Harvest", "Packing"];
const BEE_SECTION_NAMES = ["Beekeeper / Producer Details", "Apiary & Individual Hive Registry", "Harvest Details", "Processing & Quality Assurance", "Batch & Packaging Details", "GI Recognition & Certification"];
const PRODUCTION_TYPE_CONFIG = {
  kotpad_handloom: KOTPAD_PRODUCTION_CONFIG,
  kancheepuram_silk: KANCHEEPURAM_PRODUCTION_CONFIG,
  sambalpuri_bandha: SAMBALPURI_PRODUCTION_CONFIG,
  bee: BEE_PRODUCTION_CONFIG,
  shrimp: SHRIMP_PRODUCTION_CONFIG,
  fish: { ...SHRIMP_PRODUCTION_CONFIG, value: "fish", label: "Fish Farming", badge: "Aquaculture", nameLabel: "Fish Farm Name", namePlaceholder: "e.g. Freshwater Fish Farm", locationLabel: "Farm Location", locationPlaceholder: "e.g. Chilika, Odisha" },
  vermicompost: { ...BEE_PRODUCTION_CONFIG, value: "vermicompost", label: "Vermicompost Cups", badge: "Organic Manures", nameLabel: "Vermicompost Unit Name", namePlaceholder: "e.g. Green Soil Unit", locationLabel: "Unit Location", locationPlaceholder: "e.g. Bhubaneswar, Odisha" },
  pesticides: { ...BEE_PRODUCTION_CONFIG, value: "pesticides", label: "Pesticides", badge: "Agriculture Inputs", nameLabel: "Input Unit Name", namePlaceholder: "e.g. Bio-inputs Unit", locationLabel: "Unit Location", locationPlaceholder: "e.g. Cuttack, Odisha" },
  mobile_refurbishable: { value: "mobile_refurbishable", label: "Mobile Refurbishable", badge: "Mobile Refurbishable", themeClass: "production-theme-mobile", nameLabel: "Refurbishment Center Name", namePlaceholder: "e.g. TraceConnect Mobile Lab", locationLabel: "Center Location", locationPlaceholder: "Enter refurbishment center location", mode: "mobile_refurbishable", crop: "Mobile Device Passport", crops: "Mobile Device Passport", variety: "Device passport details", varietyPlaceholder: "Enter device passport details", startVerb: "Registered", itemTypeLabel: "Device Type", options: ["Smartphone"] , monitoring: MOBILE_REFURBISHABLE_SECTIONS },
};
const PRODUCTION_TYPE_ICONS = {
  kotpad_handloom: FiSun,
  kancheepuram_silk: FiSun,
  sambalpuri_bandha: FiAperture,
  bee: FiSun,
  shrimp: FiDroplet,
  fish: FiDroplet,
  vermicompost: FiLayers,
  pesticides: FiLayers,
  mobile_refurbishable: FiCpu,
};

function ProductionTypeMark({ type, size = 18 }) {
  const Icon = PRODUCTION_TYPE_ICONS[normalizeProductionType(type)] || FiLayers;
  return (
    <span className={`production-type-mark production-type-mark-${normalizeProductionType(type)}`} aria-hidden="true">
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}

const PRODUCTION_TYPES = Object.values(PRODUCTION_TYPE_CONFIG);
const PRODUCTION_CATEGORY_GROUPS = [
  { label: "Handlooms", options: ["sambalpuri_bandha", "kotpad_handloom", "kancheepuram_silk"] },
  { label: "Aquaculture", options: ["shrimp", "fish"] },
  { label: "Organic Manures", options: ["vermicompost"] },
  { label: "Apiculture", options: ["bee"] },
  { label: "Agriculture Inputs", options: ["pesticides"] },
  { label: "Technology", options: ["mobile_refurbishable"] },
];
const MOBILE_LOCATION_SUGGESTIONS = [
  "Bengaluru, Karnataka", "Chennai, Tamil Nadu", "Hyderabad, Telangana", "Mumbai, Maharashtra",
  "Delhi, Delhi", "Noida, Uttar Pradesh", "Pune, Maharashtra", "Kolkata, West Bengal",
  "Ahmedabad, Gujarat", "Coimbatore, Tamil Nadu", "Bhubaneswar, Odisha", "Visakhapatnam, Andhra Pradesh",
  "Kochi, Kerala", "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Gurugram, Haryana",
];
const PRODUCTION_ID_CODES = {
  kotpad_handloom: ["HND", "KT"],
  kancheepuram_silk: ["HND", "KS"],
  sambalpuri_bandha: ["HND", "SB"],
  shrimp: ["AQC", "SR"],
  fish: ["AQC", "FI"],
  bee: ["APE", "HO"],
  vermicompost: ["OPM", "VER"],
  pesticides: ["AGI", "PE"],
  mobile_refurbishable: ["TEC", "MOB"],
};
function getProductionUnitId(type, sequence) {
  const [category, subtype] = PRODUCTION_ID_CODES[normalizeProductionType(type)] || ["PRD", "GN"];
  return `${category}/${subtype}/${String(sequence).padStart(3, "0")}`;
}
const PRODUCTION_FIELD_COMPONENTS = {
  kotpad_handloom: KotpadHandloomProductionFields,
  kancheepuram_silk: KancheepuramSilkProductionFields,
  sambalpuri_bandha: SambalpuriBandhaProductionFields,
  bee: BeeProductionFields,
  shrimp: ShrimpProductionFields,
  fish: ShrimpProductionFields,
  vermicompost: BeeProductionFields,
  pesticides: BeeProductionFields,
  mobile_refurbishable: MobileRefurbishableProductionFields,
};
const PRODUCTION_INITIAL_FIELDS = {
  kotpad_handloom: createKotpadInitialFields,
  kancheepuram_silk: createKancheepuramInitialFields,
  sambalpuri_bandha: createSambalpuriInitialFields,
  bee: createBeeInitialFields,
  shrimp: createShrimpInitialFields,
  fish: createShrimpInitialFields,
  vermicompost: createBeeInitialFields,
  pesticides: createBeeInitialFields,
  mobile_refurbishable: createMobileRefurbishableInitialFields,
};
const PRODUCTION_DETAIL_BUILDERS = {
  kotpad_handloom: buildKotpadDetails,
  kancheepuram_silk: buildKancheepuramDetails,
  sambalpuri_bandha: buildSambalpuriDetails,
  bee: buildBeeDetails,
  shrimp: buildShrimpDetails,
  fish: buildShrimpDetails,
  vermicompost: buildBeeDetails,
  pesticides: buildBeeDetails,
  mobile_refurbishable: buildMobileRefurbishableDetails,
};
const PRODUCTION_RECORD_BUILDERS = {
  sambalpuri_bandha: buildSambalpuriProductPayload,
};

function uniqueList(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function getTraceStagesForProductionType(type) {
  const config = PRODUCTION_TYPE_CONFIG[normalizeProductionType(type)] || KOTPAD_PRODUCTION_CONFIG;
  return uniqueList([config.crops, ...SHARED_TRACE_STAGES]);
}

function getTraceStagesForPlantations(plantations) {
  const stageNames = plantations.flatMap((plantation) => getTraceStagesForProductionType(plantation.type));
  return uniqueList(stageNames.length ? stageNames : TRACE_STAGES);
}

function normalizeProductionType(value) {
  return PRODUCTION_TYPE_CONFIG[value] ? value : "kotpad_handloom";
}

function getProductionTypeConfig(value) {
  return PRODUCTION_TYPE_CONFIG[normalizeProductionType(value)];
}

function isProductionLocationValid(type, location) {
  const words = String(location || "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (type === "kotpad_handloom") {
    return words.includes("koraput") && words.includes("odisha");
  }
  if (type === "sambalpuri_bandha") {
    const districts = new Set(["bargarh", "boudh", "sonepur", "subarnapur", "bolangir", "balangir", "nuapada", "sambalpur"]);
    return words.includes("odisha") && words.some((word) => districts.has(word));
  }
  return true;
}

function mergeDetails(base, details) {
  const suffix = Object.entries(details)
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join(" | ");
  return [base, suffix].filter((value) => String(value || "").trim()).join(" | ");
}

function parseDetailsText(value = "") {
  const parts = String(value || "")
    .split(" | ")
    .map((part) => part.trim())
    .filter(Boolean);
  const primary = (parts.shift() || "").replace(/^-+\s*/, "");
  const details = new Map();

  parts.forEach((part) => {
    const index = part.indexOf(":");
    if (index <= 0) return;
    const label = part.slice(0, index).trim();
    const detailValue = part.slice(index + 1).trim();
    if (label && detailValue) details.set(label, detailValue);
  });

  return { primary, details };
}

function formatVarietyText(variety) {
  if (!variety) return "Standard";
  const { primary, details } = parseDetailsText(variety);
  const keyLabels = [
    "Product Name",
    "Design Pattern",
    "Bandha Pattern",
    "Weaver Name",
    "Loom Type",
    "Fabric Type",
    "Hatchery Source",
    "Water Type",
    "Floral Source",
    "Queen Bee Age"
  ];
  const selectedDetails = [];
  for (const label of keyLabels) {
    const val = details.get(label);
    if (val) {
      selectedDetails.push(val);
    }
    if (selectedDetails.length >= 2) break;
  }
  if (selectedDetails.length > 0) {
    return [primary, ...selectedDetails].filter(Boolean).join(" | ");
  }
  return primary || "Standard";
}

function getCompactCropSummary(mode, variety) {
  const { primary, details } = parseDetailsText(variety);
  const labelSets = {
    kotpad_handloom: ["Batch Number", "QR Verification Code", "Inspection Status"],
    sambalpuri_bandha: ["Batch Number", "QR Verification Code", "Inspection Status"],
  };
  const labels = labelSets[mode] || [];
  const tags = labels
    .map((label) => ({ label, value: details.get(label) }))
    .filter((item) => item.value)
    .slice(0, 3);

  if (!labels.length) {
    return {
      primary: primary || String(variety || "").trim(),
      tags: [],
    };
  }

  return {
    primary:
      primary ||
      details.get("Design Pattern") ||
      details.get("Bandha Pattern") ||
      details.get("Product Name") ||
      "GI-tagged batch",
    tags,
  };
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const themeClass = user?.role === "grower" ? "theme-grower" : "";

  return createPortal(
    <div className={`tc-root ${themeClass}`}>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
        <div className="confirm-box">
          <button className="modal-close" onClick={onCancel} type="button"><LucideX aria-hidden="true" /></button>
          <div className="confirm-icon"><FiAlertTriangle /></div>
          <h3>Confirm Delete</h3>
          <p className="muted">{message}</p>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message) => new Promise((resolve) => setState({ message, resolve }));
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, dialog };
}



function Header({ route, navigate, toast }) {
  const { user, signOut } = useAuth();
  const { plantations, processImages } = useData();
  const plantationIds = new Set(
    plantations
      .filter((plantation) => Number(plantation.userId) === Number(user?.user_id || user?.id))
      .map((plantation) => Number(plantation.id))
  );
  const hasProcessImages = user?.role === "grower" && processImages.some(
    (image) => plantationIds.has(Number(image.plantationId)) && image.imageUrl && !isPdfUrl(image.imageUrl)
  );
  return (
    <Navbar
      user={user}
      route={route}
      navigate={navigate}
      signOut={signOut}
      logoSrc={TRACE_CONNECT_LOGO_SRC}
      hasProcessImages={hasProcessImages}
      hasTraceCapture={Boolean(user?.video_url)}
      toast={toast}
    />
  );
  /* Legacy implementation retained below for a safe, incremental extraction. */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!user) return null;
  const links = user.role === "admin"
    ? [{ label: "Admin review", path: "/admin", icon: <FiShield /> }]
    : user.role === "grower"
    ? [{ label: "Dashboard", path: "/grower", icon: <FiHome /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }]
    : [{ label: "Dashboard", path: "/supplier", icon: <FiHome /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate("/")}>
        <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" /></span>
        <span className="brand-text">TRACECONNECT</span>
      </button>
      <nav className="header-nav">
        <span className="header-links">
          {links.map((l) => (
            <button key={l.path} className={`nav-pill ${route === l.path ? "active" : ""}`} onClick={() => navigate(l.path)}>
              {l.icon} {l.label}
            </button>
          ))}
        </span>
        <button
          className="verify-nav-button"
          type="button"
          title="Verification tools coming soon"
            aria-label="Verify - coming soon"
        >
          <span className="verify-nav-icon"><FiShield /></span>
          <span>Verify</span>
          <span className="verify-nav-badge">Soon</span>
        </button>
        <div className="profile-menu-wrap" ref={menuRef}>
          <button className={`profile-trigger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((x) => !x)}>
            <span className="profile-avatar">
              {user?.profile_image ? <img src={user.profile_image} alt="Profile" /> : <FiUser />}
            </span>
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <span className="dropdown-avatar">
                  {user?.profile_image ? <img src={user.profile_image} alt="Profile" /> : <FiUser />}
                </span>
                <span className="dropdown-user-copy">
                  <span className="dropdown-name">{user.name}</span>
                  <span className="dropdown-role badge-chip">{user.role}</span>
                </span>
              </div>
              <div className="dropdown-divider" />
              <button className="profile-item" onClick={() => { setMenuOpen(false); navigate("/profile"); }}>
                <FiUser /> Profile
              </button>
              <button className="profile-item danger" onClick={() => { setMenuOpen(false); signOut(); navigate("/"); }}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function PublicHeader({ onLogin, onSignup }) {
  return <PublicNavbar onLogin={onLogin} onSignup={onSignup} logoSrc={TRACE_CONNECT_LOGO_SRC} />;
  /* Legacy implementation retained below for a safe, incremental extraction. */
  return (
    <header className="app-header public-app-header">
      <button className="brand" type="button" onClick={() => { window.location.hash = "/"; }}>
        <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" /></span>
        <span className="brand-text">TRACECONNECT</span>
      </button>
      <nav className="header-nav auth-nav" aria-label="Authentication">
        <button className="nav-pill" type="button" onClick={onLogin}>Login</button>
        <button className="nav-pill active" type="button" onClick={onSignup}>Signup</button>
      </nav>
    </header>
  );
}

function SiteFooter() { const { navigate } = useRouter(); const { user } = useAuth(); return <Footer navigate={navigate} user={user} logoSrc={TRACE_CONNECT_LOGO_SRC} />; }

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrap ${color}`}>{icon}</div>
      <div className="stat-copy">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function GrowerDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { plantations, crops, harvests, packings, addPlantation, delPlantation, selectedFarmId, loading, backendError } = useData();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState({ type: "kotpad_handloom", name: "", location: "" });
  const [creating, setCreating] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const mine = plantations;
  const mineIds = new Set(mine.map((p) => Number(p.id)));
  const mineCrops = crops.filter((crop) => mineIds.has(Number(crop.plantationId)));
  const mineHarvests = harvests.filter((harvest) => mineIds.has(Number(harvest.plantationId)));
  const minePackings = packings.filter((packing) => mineIds.has(Number(packing.plantationId)));
  const harvestCropIds = new Map(mineHarvests.map((harvest) => [Number(harvest.id), Number(harvest.cropId)]));
  const completedCropIds = new Set(
    minePackings
      .map((packing) => harvestCropIds.get(Number(packing.harvestId)))
      .filter((cropId) => cropId && Number.isFinite(cropId)),
  );
  const unlinkedCompletedProducts = minePackings.filter((packing) => {
    const harvestId = Number(packing.harvestId);
    return !harvestCropIds.has(harvestId) || !harvestCropIds.get(harvestId);
  }).length;
  const packageCount = minePackings.reduce((total, packing) => total + (Number(packing.numPackages) || 0), 0);
  const activeUnits = mine.filter((plantation) => String(plantation.status || "Active").toLowerCase() === "active").length;
  const activeProductionUnit = mine.find(
    (plantation) => Number(plantation.farmId) === Number(selectedFarmId),
  )?.name;
  const selectedProduction = getProductionTypeConfig(form.type);
  const isKotpadRegistration = form.type === "kotpad_handloom";
  const producerId = user?.user_id || user?.id || "";
  const nextProductionId = getProductionUnitId(form.type, mine.filter((unit) => normalizeProductionType(unit.type) === normalizeProductionType(form.type)).length + 1);

  const create = async () => {
    if (!form.name || !form.location) {
      toast(`Please fill in ${selectedProduction.nameLabel.toLowerCase()} and ${selectedProduction.locationLabel.toLowerCase()}`, "error");
      return;
    }
    if (!isProductionLocationValid(form.type, form.location)) {
      const locationHint = form.type === "kotpad_handloom"
        ? "Kotpad production locations must be in Koraput, Odisha."
        : "Sambalpuri production locations must be in an associated Odisha district.";
      toast(locationHint, "error");
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      await addPlantation({ ...form, status: "Active" });
      stabilizeTraceabilityViewport(() => {
        setForm({ type: "kotpad_handloom", name: "", location: "" });
        setRegistrationOpen(false);
        setRegistrationStep(1);
        toast("Production unit created successfully!", "success");
      });
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to create production unit", "error");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this production unit and all its associated data?");
    if (!ok) return;
    try {
      await delPlantation(id);
      toast("Production unit deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to delete plantation", "error");
    }
  };

  return (
    <div className="page-container theme-grower production-dashboard-page">
      {dialog}
      <DataStatusBanner loading={loading && mine.length > 0} error={backendError} />
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">TraceConnect Workspace</div>
          <h1>Production Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name || "Producer"}. Manage production units, traceable products,
            and packages across your complete supply chain.
          </p>
          <div className="dashboard-pill-row">
            <span><FiCheckCircle /> {activeUnits} active units</span>
            <span><FiLayers /> {mineCrops.length} traceable products</span>
            <span><FiPackage /> {packageCount} packages</span>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="dashboard-active-farm grower-id-panel">
            <div className="dashboard-active-label">Producer ID</div>
            <div className="dashboard-active-name">
              <FiUser />
              <code>{producerId || "Not available"}</code>
            </div>
            <p>Share this ID with suppliers to connect production records and traceable packages.</p>
          </div>
          {activeProductionUnit && (
            <div className="dashboard-active-farm">
              <div className="dashboard-active-label">Active Production Unit</div>
              <div className="dashboard-active-name">
                <FiMapPin />
                <span>#{selectedFarmId} ({activeProductionUnit})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stats-row">
        <StatCard icon={<FiGrid />} label="Production Units" value={mine.length} color="green" />
        <StatCard icon={<FiStar />} label="Trace Items" value={mineCrops.length} color="amber" />
        <StatCard icon={<FiCheckCircle />} label="Completed Products" value={completedCropIds.size + unlinkedCompletedProducts} color="blue" />
        <StatCard icon={<FiPackage />} label="Packages" value={packageCount} color="purple" />
      </div>

      <div className="grower-workspace-sections">
      {loading && mine.length === 0 ? (
        <PageSkeleton title="Loading dashboard..." rows={1} cards={4} />
      ) : mine.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiGrid /></div>
          <p>No production units yet. Register your first unit to get started.</p>
        </div>
      ) : (
        <section className="production-units-section">
          <div className="production-section-heading">
            <div>
              <span className="dashboard-kicker">Your Operations</span>
              <h2>Your Production Units</h2>
            </div>
            <span className="production-unit-count">{mine.length} Registered</span>
          </div>
          <div className="card-grid plantation-card-grid">
            {mine.map((p) => {
              const unitCrops = mineCrops.filter((crop) => Number(crop.plantationId) === Number(p.id));
              const unitPackings = minePackings.filter((packing) => Number(packing.plantationId) === Number(p.id));
              const locationValid = isProductionLocationValid(p.type, p.location);
              return (
                <div key={p.id} className={`plantation-card production-unit-card production-unit-${normalizeProductionType(p.type)}`}>
                  <div className="plantation-card-top">
                    <span className={`type-badge ${getProductionTypeConfig(p.type).badgeClass}`}>
                      <ProductionTypeMark type={p.type} size={15} />
                      {getProductionTypeConfig(p.type).badge}
                    </span>
                    <span className={`production-status ${String(p.status || "Active").toLowerCase() === "active" ? "is-active" : ""}`}>
                      {p.status || "Active"}
                    </span>
                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); remove(p.id); }} title="Delete"><FiTrash2 /></button>
                  </div>
                  <h3>{p.name}</h3>
                  <p className="plantation-location"><FiMapPin /> {p.location || "Location not added"}</p>
                  {!locationValid && (
                    <p className="production-location-warning" role="status">
                      <FiAlertTriangle /> Location does not match the selected category's registered region.
                    </p>
                  )}
                  <div className="production-unit-metrics">
                    <span><FiLayers /> <strong>{unitCrops.length}</strong> traceable products</span>
                    <span><FiPackage /> <strong>{unitPackings.reduce((total, packing) => total + (Number(packing.numPackages) || 0), 0)}</strong> packages</span>
                  </div>
                  <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>
                    Open Unit <FiArrowRight />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={`production-registration ${registrationOpen ? "is-open" : ""}`}>
        <div className="production-registration-heading">
          <div>
            <span className="dashboard-kicker">Get Started</span>
            <h2>Register New Production Unit</h2>
            <p>Choose your production category and add the unit's basic details.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary production-registration-toggle"
            aria-expanded={registrationOpen}
            onClick={() => {
              if (!registrationOpen) setRegistrationStep(1);
              setRegistrationOpen(!registrationOpen);
            }}
          >
            {registrationOpen ? "Close" : <><FiPlus /> Register Unit</>}
          </button>
        </div>
        {registrationOpen && (
          <div className="production-registration-form">
            <div className="production-registration-step">
              STEP {registrationStep} OF 2 <span>·</span> {registrationStep === 1 ? "PRODUCTION CATEGORY" : "UNIT DETAILS"}
            </div>
            {registrationStep === 1 ? (
              <div className="form-grid plantation-create-grid">
                <div className="field-wrap plantation-type-picker-wrap">
                  <label className="field-label production-type-label"><ProductionTypeMark type={form.type} /> Production Category *</label>
                  <div className="plantation-type-picker production-category-groups" role="radiogroup" aria-label="Production category">
                    {PRODUCTION_CATEGORY_GROUPS.map((group) => (
                      <div className="production-category-group" key={group.label}>
                        <h3>{group.label}</h3>
                        <div className="production-category-options">
                          {group.options.map((value) => {
                            const option = PRODUCTION_TYPE_CONFIG[value];
                            const selected = form.type === option.value;
                            return (
                              <button
                                key={option.value}
                                className={`plantation-type-option ${selected ? "selected" : ""} ${form.type && !selected ? "dimmed" : ""}`}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setForm((current) => current.type === option.value
                                  ? current
                                  : { type: option.value, name: "", location: "" })}
                              >
                                <ProductionTypeMark type={option.value} size={20} />
                                <span>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="production-registration-actions">
                  <button className="btn btn-primary" type="button" onClick={() => setRegistrationStep(2)}>
                    Continue <FiArrowRight />
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-grid plantation-create-grid production-unit-details-form">
                <div className="production-selected-category">
                  <ProductionTypeMark type={form.type} />
                  <span>{selectedProduction.label}</span>
                  <button type="button" className="production-change-category" onClick={() => setRegistrationStep(1)}>Change</button>
                </div>
                <div className="field-wrap">
                  <label className="field-label">Production Unit ID</label>
                  <input className="input" value={nextProductionId} readOnly aria-readonly="true" />
                  <span className="production-location-hint">Generated from the selected production category and type.</span>
                </div>
                <div className="field-wrap">
                   <label className="field-label">{isKotpadRegistration ? "Product Name" : selectedProduction.nameLabel} *</label>
                  <input className="input" placeholder={selectedProduction.namePlaceholder} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
                </div>
                <div className="field-wrap">
                   <label className="field-label">{isKotpadRegistration ? "Cluster / Weaver Location" : selectedProduction.locationLabel} *</label>
                  <input
                    className="input"
                    placeholder={selectedProduction.locationPlaceholder}
                    list={form.type === "mobile_refurbishable" ? "mobile-refurbishable-locations" : undefined}
                    value={form.location}
                    onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                  />
                  {form.type === "mobile_refurbishable" && (
                    <datalist id="mobile-refurbishable-locations">
                      {MOBILE_LOCATION_SUGGESTIONS.map((location) => <option key={location} value={location} />)}
                    </datalist>
                  )}
                  {form.type === "kotpad_handloom" && <span className="production-location-hint">Enter Koraput, Odisha. The unit location is not copied from your profile.</span>}
                  {form.type === "sambalpuri_bandha" && <span className="production-location-hint">Use an associated Odisha district such as Bargarh or Sambalpur.</span>}
                </div>
                <div className="production-registration-actions">
                  <button className="btn btn-outline" type="button" onClick={() => setRegistrationStep(1)}>Back</button>
                  <button className="btn btn-primary" onClick={create} disabled={creating}>
                    {creating ? <LoadingIndicator label="Creating..." /> : <><FiPlus /> Create Production Unit</>}
                  </button>
                </div>
              </div>
            )}
            {registrationStep === 2 && <p className="production-registration-note">After registration, add products and category-specific production details inside the unit.</p>}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

function WorkflowSection({ title, children }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

function useProductionStageDraft(plantationId, stage, initialForm, draftActionRef, toast) {
  const key = `traceconnect:production-draft:${plantationId}:${stage}`;
  const [form, setForm] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (!saved) return initialForm;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...initialForm, ...parsed }
        : initialForm;
    } catch (error) {
      console.error("Unable to load production stage draft", error);
      return initialForm;
    }
  });

  useEffect(() => {
    const saveDraft = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(form));
        toast("Draft saved on this device", "success");
      } catch {
        toast("Unable to save this draft on this device", "error");
      }
    };
    draftActionRef.current = saveDraft;
    return () => {
      if (draftActionRef.current === saveDraft) draftActionRef.current = null;
    };
  }, [draftActionRef, form, key, toast]);

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      toast("The saved draft could not be cleared from this device", "error");
    }
  };

  return [form, setForm, clearDraft];
}

const STAGE_STATUS_ICONS = [FiLayers, FiTrendingUp, FiCheckCircle, FiAward, FiPackage];

function formatStatusKey(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatusValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getStatusFieldRows(record) {
  return Object.entries(record)
    .filter(([key, value]) => key !== "id" && key !== "plantationId" && value !== null && value !== undefined && value !== "")
    .flatMap(([key, value]) => {
      if (typeof value !== "string" || !value.includes(" | ")) return [[key, value]];
      const parts = value.split(" | ").map((part) => part.trim()).filter(Boolean);
      const rows = [];
      parts.forEach((part, index) => {
        const separator = part.indexOf(":");
        if (separator > 0) {
          rows.push([part.slice(0, separator).trim(), part.slice(separator + 1).trim()]);
        } else if (index === 0) {
          rows.push([key, part]);
        } else {
          rows.push([key, part]);
        }
      });
      return rows;
    });
}

function StageStatusModal({ stage, records, onClose }) {
  if (!stage) return null;
  const Icon = STAGE_STATUS_ICONS[stage.index] || FiClipboard;
  const recordList = Array.isArray(records) ? records : [];

  return createPortal(
    <div className="stage-status-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="stage-status-modal" role="dialog" aria-modal="true" aria-labelledby="stage-status-title">
        <button className="stage-status-close" type="button" onClick={onClose} aria-label="Close stage status"><LucideX aria-hidden="true" /></button>
        <div className="stage-status-heading">
          <div className="stage-status-icon"><Icon /></div>
          <div>
            <div className="stage-status-kicker">Stage response status</div>
            <h2 id="stage-status-title">{stage.name}</h2>
            <p>{recordList.length} saved response{recordList.length === 1 ? "" : "s"} for this user</p>
          </div>
        </div>
        {recordList.length === 0 ? (
          <div className="stage-status-empty"><FiInfo /><span>No response has been saved for this stage yet.</span></div>
        ) : (
          <div className="stage-status-records">
            {recordList.map((record, index) => {
              const fields = Object.entries(record).filter(([key, value]) => key !== "id" && key !== "plantationId" && value !== null && value !== undefined && value !== "");
              return (
                <article className="stage-status-record" key={record.id || `${stage.name}-${index}`}>
                  <div className="stage-status-record-head"><span>Response {index + 1}</span><FiCheckCircle /></div>
                  <div className="stage-status-fields">
                    {fields.map(([key, value]) => (
                      <div className="stage-status-field" key={key}>
                        <span>{formatStatusKey(key)}</span>
                        <strong>{formatStatusValue(value)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

function AllStagesStatusModal({ names, records, onClose }) {
  return createPortal(
    <div className="stage-status-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="stage-status-modal all-stages-status-modal" role="dialog" aria-modal="true" aria-labelledby="all-stages-status-title">
        <button className="stage-status-close" type="button" onClick={onClose} aria-label="Close all stages status"><LucideX aria-hidden="true" /></button>
        <div className="stage-status-heading">
          <div className="stage-status-icon"><FiClipboard /></div>
          <div>
            <div className="stage-status-kicker">Complete workflow record</div>
            <h2 id="all-stages-status-title">All stages status</h2>
            <p>Expand a stage to review its saved responses.</p>
          </div>
        </div>
        <div className="all-stages-table-wrap">
          <div className="all-stages-table-head"><span>Stage</span><span>Responses</span><span>Status</span></div>
          {names.map((name, index) => {
            const stageRecords = Array.isArray(records[index]) ? records[index] : [];
            return (
              <details className="all-stages-row" key={name}>
                <summary>
                  <span className="all-stages-name"><span className="all-stages-number">{index + 1}</span>{name}</span>
                  <span>{stageRecords.length}</span>
                  <span className={stageRecords.length ? "stage-table-status complete" : "stage-table-status pending"}>{stageRecords.length ? "Completed" : "Pending"}</span>
                  <span className="all-stages-caret" aria-hidden="true">v</span>
                </summary>
                <div className="all-stages-detail">
                  {stageRecords.length === 0 ? <p>No response saved for this stage.</p> : (
                    <div className="stage-response-table">
                      <div className="stage-response-table-head"><span>Response</span><span>Field</span><span>Saved value</span></div>
                      {stageRecords.flatMap((record, responseIndex) => getStatusFieldRows(record)
                        .map(([key, value], fieldIndex) => (
                          <div className="stage-response-table-row" key={`${responseIndex}-${fieldIndex}-${key}`}>
                            <span>{fieldIndex === 0 ? `Response ${responseIndex + 1}` : ""}</span>
                            <span>{formatStatusKey(key)}</span>
                            <strong>{formatStatusValue(value)}</strong>
                          </div>
                        ))) }
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function PlantationDetail({ plantationId, toast }) {
  const { navigate } = useRouter();
  const { user, videoBusy, videoProgress, generateVideo, videoUnlockedOnce } = useAuth();
  const { plantations, crops, monitoring, verification, harvests, packings, processImages, addCrop, updateCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking, addProcessImage, delProcessImage, loading, backendError } = useData();
  const { confirm, dialog } = useConfirm();
  const [step, setStep] = useState(0);
  const [kotpadSection, setKotpadSection] = useState(0);
  const [kotpadSavedSections, setKotpadSavedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kotpad-sections-${plantationId}`) || "[]"); } catch { return []; }
  });
  const [beeSavedSections, setBeeSavedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`honey-sections-${plantationId}`) || "[]"); } catch { return []; }
  });
  const draftActionRef = useRef(null);
  const [statusStageIndex, setStatusStageIndex] = useState(null);
  const [allStatusOpen, setAllStatusOpen] = useState(false);
  const plantationIdNum = Number(plantationId);
  const plantation = plantations.find((p) => p.id === plantationIdNum);
  const pCrops = crops.filter((c) => c.plantationId === plantationIdNum);
  const pMon = monitoring.filter((m) => m.plantationId === plantationIdNum);
  const pVer = verification.filter((v) => v.plantationId === plantationIdNum);
  const pHar = harvests.filter((h) => h.plantationId === plantationIdNum);
  const pPack = packings.filter((pk) => pk.plantationId === plantationIdNum);
  const pImgs = processImages.filter((img) => img.plantationId === plantationIdNum);
  if (!plantation && loading) return <PageSkeleton title="Loading plantation..." rows={4} cards={3} />;
  if (!plantation) return <div className="page-container"><div className="empty-state">Plantation not found.</div></div>;
  const L = getProductionTypeConfig(plantation.type);
  const productionSequence = plantations
    .filter((unit) => normalizeProductionType(unit.type) === normalizeProductionType(plantation.type))
    .sort((a, b) => Number(a.id) - Number(b.id))
    .findIndex((unit) => Number(unit.id) === plantationIdNum) + 1;
  const productionUnitId = getProductionUnitId(plantation.type, productionSequence || 1);
  const isKotpad = L.mode === "kotpad_handloom" || L.mode === "kancheepuram_silk" || L.mode === "mobile_refurbishable";
  const isKancheepuram = L.mode === "kancheepuram_silk";
  const isBee = L.mode === "bee";
  const isTextile = ["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode);
  const kotpadStatusNames = ["Production Unit Registration", "Producer / Weaver Details", "Raw Material Details", "Weaving & Production Details", "Batch Identity & Verification", "Product & Marketplace Details"];
  const productionSectionNames = isKancheepuram
    ? KANCHEEPURAM_SECTIONS
    : L.mode === "mobile_refurbishable"
      ? MOBILE_REFURBISHABLE_SECTIONS
      : kotpadStatusNames;
  const names = isBee ? BEE_SECTION_NAMES : [L.crops, "Monitoring", "Verification", isTextile ? "Production Completion" : "Harvest", "Packing"];
  const hasGiRegistryDocument = Boolean(user?.has_gi_registry_document || user?.gi_registry_document || user?.gi_registry_document_name);
  const beeSectionComplete = (index) => beeSavedSections.includes(index);
  const unlocked = isBee
    ? names.map((_, index) => index === 0 ? true : index === names.length - 1 ? beeSectionComplete(index - 1) : beeSectionComplete(index - 1))
    : [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const done = isBee
    ? names.map((_, index) => beeSavedSections.includes(index))
    : [pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0, pPack.length > 0];
  const completedStages = done.filter(Boolean).length;
  const totalStages = names.length;
  const allStagesComplete = completedStages === totalStages;
  const progressPercent = Math.round((completedStages / totalStages) * 100);
  const showTraceabilityVideo = isKotpad
    ? step === 0 && pCrops.length > 0
    : (isBee ? step === 0 && pCrops.length > 0 : [pCrops, pMon, pVer, pHar, pPack][step]?.length > 0);
  const stageRecords = isBee ? names.map(() => pCrops) : [pCrops, pMon, pVer, pHar, pPack];
  const sectionFields = isKancheepuram
    ? KANCHEEPURAM_SECTION_FIELDS
    : L.mode === "mobile_refurbishable"
      ? MOBILE_REFURBISHABLE_SECTION_FIELDS
      : null;
  const sectionStatusRecords = sectionFields
    ? sectionFields.map(([, fields]) => pCrops.map((crop) => {
      const details = parseDetailsText(crop.variety).details;
      return Object.fromEntries(fields
        .map(([, key]) => [key, details.get(key)])
        .filter(([, value]) => value !== undefined && value !== null && value !== ""));
    }).filter((record) => Object.keys(record).length > 0))
    : null;
  const statusNames = sectionFields ? sectionFields.map(([name]) => name) : isKotpad ? kotpadStatusNames : names;
  const statusRecords = sectionStatusRecords || (isKotpad
    ? kotpadStatusNames.map((name, index) => (index === 0 || kotpadSavedSections.includes(index) ? pCrops : []))
    : stageRecords);
  const openStep = (i) => {
    if (!unlocked[i]) {
      toast(`Complete ${names[i - 1]} first`, "error");
      return;
    }
    if (isBee && i === names.length - 1 && !hasGiRegistryDocument) {
      toast("No GI document was submitted during signup. You can provide GI details now.", "info");
    }
    setStep(i);
  };

  const generatePlantationVideo = async () => {
    if (videoBusy) return;
    try {
      toast("Preparing saved images for video...", "success");
      const videoStages = isTextile ? [...names.slice(0, 3), "Harvest", names[4]] : names;
      await generateVideo(pImgs, videoStages, "A", L.label);
      toast("Video generated and saved to profile successfully.", "success");
    } catch (error) {
      toast(error?.message || "Video service unavailable right now.", "error");
    }
  };

  return (
    <div className={`page-container production-workspace ${L.themeClass || ""}`}>
      {dialog}
      <StageStatusModal
        stage={statusStageIndex === null ? null : { name: names[statusStageIndex], index: statusStageIndex }}
        records={statusStageIndex === null ? [] : stageRecords[statusStageIndex]}
        onClose={() => setStatusStageIndex(null)}
      />
      {allStatusOpen && <AllStagesStatusModal names={statusNames} records={statusRecords} onClose={() => setAllStatusOpen(false)} />}
      <DataStatusBanner loading={loading} error={backendError} />
      <button className="btn-back-minimal" onClick={() => navigate("/grower")}>
        <FiArrowLeft /> Back to Dashboard
      </button>
      <div className="plantation-overview">
      <div className="plantation-hero">
        <div className="plantation-hero-copy">
            <div className="plantation-kicker"><ProductionTypeMark type={plantation.type} size={16} /> {L.label} - Production Workspace</div>
          <h1>{plantation.name}</h1>
          <div className="plantation-meta">
            <span className="plantation-meta-item"><FiMapPin /> {plantation.location}</span>
            <span className="status-chip active"><FiCheckCircle /> Active</span>
          </div>
        </div>

        <div className="production-product-summary">
          <div className="production-summary-primary">
            <span>Production unit</span>
            <strong>{plantation.name}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{plantation.location || "Not provided"}</strong>
          </div>
          <div>
            <span>{L.crop} records</span>
            <strong>{pCrops.length} registered</strong>
          </div>
          <div>
            <span>{isKotpad ? "Section progress" : "Active stage"}</span>
            <strong>{isKotpad ? `${L.label} sections` : `${String(step + 1).padStart(2, "0")} · ${names[step]}`}</strong>
          </div>
        </div>
      </div>
      </div>

      {!isKotpad && <div className={`stage-progress-card ${allStagesComplete ? "complete" : ""}`}>
        <div className="stage-progress-head">
          <div>
            <div className="stage-progress-kicker">Workflow Progress</div>
            <div className="stage-progress-title">
              {allStagesComplete
                ? "All stages completed"
                : `${completedStages} of ${totalStages} stages completed`}
            </div>
          </div>
          <div className={`stage-progress-badge ${allStagesComplete ? "complete" : ""}`}>
            {allStagesComplete ? <FiCheckCircle /> : <span>{progressPercent}%</span>}
          </div>
        </div>
        <div className="stage-progress-meter">
          <div className="stage-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="stage-progress-caption">
          {allStagesComplete
            ? "Great work. This plantation has completed every stage successfully."
            : `Complete ${names[Math.min(completedStages, totalStages - 1)]} to move forward.`}
        </div>
      </div>}
      {!isKotpad && <div className={`step-bar ${isBee ? "bee-step-bar" : ""}`}>
        {names.map((n, i) => {
          const rejected = i === 2 && pVer.length > 0 && !pVer[pVer.length - 1].approved;
          return (
          <button
            key={n}
            className={`step-btn ${step === i ? "active" : ""} ${done[i] ? "done" : ""} ${rejected ? "rejected" : ""} ${!unlocked[i] ? "locked" : ""}`}
            onClick={() => openStep(i)}
            aria-current={step === i ? "step" : undefined}
            aria-disabled={!unlocked[i]}
          >
            <span className="step-indicator">
              {step === i
                ? <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                : rejected
                  ? <FiX />
                  : done[i]
                    ? <FiCheckCircle />
                    : !unlocked[i]
                      ? <FiLock />
                      : <span className="step-num">{String(i + 1).padStart(2, "0")}</span>}
            </span>
            <span className="step-label">{n}</span>
            <span className="step-state">{step === i ? "Active" : rejected ? "Rejected" : done[i] ? "Completed" : unlocked[i] ? "Ready" : "Locked"}</span>
          </button>
          );
        })}
      </div>}

      {!isKotpad && <div className="stage-active-heading">
        <div>
          <span className="stage-active-index">STAGE {String(step + 1).padStart(2, "0")}</span>
          <h2>{names[step]}</h2>
        </div>
        <span className={`stage-active-status ${step === 2 && pVer.length > 0 && !pVer[pVer.length - 1].approved ? "is-rejected" : done[step] ? "is-complete" : ""}`}>
          {step === 2 && pVer.length > 0 && !pVer[pVer.length - 1].approved
            ? "Rejected"
            : done[step] ? "Completed" : stageRecords[step].length ? "In Progress" : "Not Started"}
        </span>
      </div>}

      <div className="stage-workspace-layout">
      {(step === 0 || isBee) && (
        <CropsStep
          L={L}
          activeSection={kotpadSection}
          setActiveSection={setKotpadSection}
          plantationName={plantation.name}
          plantationLocation={plantation.location}
          plantationUnitId={plantation.id}
          pCrops={pCrops}
          addCrop={addCrop}
          updateCrop={updateCrop}
          delCrop={delCrop}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          draftActionRef={draftActionRef}
           isBee={isBee}
           beeSection={isBee ? step : kotpadSection}
           giEnabled={hasGiRegistryDocument}
           profileName={user?.name || user?.full_name || ""}
           profilePhone={user?.phone || user?.mobileNumber || user?.mobile_number || user?.mobile || user?.mob || ""}
           profileRegistration={user?.gstin || user?.gst_number || user?.registration_number || ""}
           productionId={productionUnitId}
          onSectionSaved={(section) => {
            if (isBee) {
              setBeeSavedSections((current) => {
                const next = Array.from(new Set([...current, section]));
                localStorage.setItem(`honey-sections-${plantationIdNum}`, JSON.stringify(next));
                return next;
              });
            } else {
              setKotpadSavedSections((current) => Array.from(new Set([...current, section])));
            }
          }}
        />
      )}
      {step === 1 && !isBee && (
        <MonitoringStep
          L={L}
          plantationLocation={plantation.location}
          pMon={pMon}
          pCrops={pCrops}
          addMonitoring={addMonitoring}
          delMonitoring={delMonitoring}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          draftActionRef={draftActionRef}
        />
      )}
      {step === 2 && !isBee && (
        <VerificationStep
          plantationLocation={plantation.location}
          pVer={pVer}
          pCrops={pCrops}
          addVerification={addVerification}
          delVerification={delVerification}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
          draftActionRef={draftActionRef}
        />
      )}
      {step === 3 && !isBee && (
        <HarvestStep
          plantationLocation={plantation.location}
          pHar={pHar}
          pCrops={pCrops}
          addHarvest={addHarvest}
          delHarvest={delHarvest}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
          draftActionRef={draftActionRef}
        />
      )}
      {step === 4 && !isBee && (
        <PackingStep
          plantationLocation={plantation.location}
          pPack={pPack}
          pHar={pHar}
          addPacking={addPacking}
          delPacking={delPacking}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
          draftActionRef={draftActionRef}
        />
      )}

      </div>

      <div className="stage-workspace-actions">
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => {
            if (isKotpad && step === 0 && kotpadSection > 0) {
              setKotpadSection((current) => current - 1);
              return;
            }
            setStep((current) => Math.max(0, current - 1));
          }}
          disabled={step === 0 && (!isKotpad || kotpadSection === 0)}
        >
          <FiArrowLeft /> Previous
        </button>
        <button
          className="btn btn-outline stage-save-draft"
          type="button"
          onClick={() => draftActionRef.current?.()}
        >
          Save Draft
        </button>
        {step < (isBee ? names.length - 1 : 4) && (
          <button
            className="btn btn-primary stage-continue"
            type="button"
            onClick={() => {
              if (isKotpad && step === 0 && kotpadSection < productionSectionNames.length - 1) {
                setKotpadSection((current) => current + 1);
                return;
              }
              openStep(step + 1);
            }}
            disabled={isKotpad && step === 0 ? kotpadSection === productionSectionNames.length - 1 && !done[step] : !done[step]}
            title={isKotpad && step === 0
              ? kotpadSection === productionSectionNames.length - 1 && !done[step] ? `Save ${names[step].toLowerCase()} to continue` : `Continue to ${productionSectionNames[kotpadSection + 1] || productionSectionNames[kotpadSection]}`
              : !done[step] ? `Save a ${names[step].toLowerCase()} record to continue` : undefined}
          >
            Continue <FiArrowRight />
          </button>
        )}
      </div>

      {showTraceabilityVideo && (
        <section className="card video-card production-video-card">
          <div className="video-card-left">
            <div className="video-icon"><FiVideo /></div>
            <div className="production-video-copy">
              <span className="production-video-kicker">YOUR JOURNEY, READY TO SHARE</span>
              <h3>Generate Traceability Video</h3>
              <p>Create a video from this unit's saved evidence and view it in Trace Captures.</p>
            </div>
          </div>
          {user?.video_url && user?.video_locked ? (
            <button className="btn btn-outline production-video-done" type="button" onClick={() => navigate("/trace-captures")}>
              <FiCheckCircle /> View Generated Video <FiArrowRight />
            </button>
          ) : (
            <button className="btn btn-primary production-video-generate" onClick={generatePlantationVideo} disabled={videoBusy} type="button">
              {videoBusy ? <LoadingIndicator label={videoProgress || "Generating..."} /> : <><FiVideo /> Generate Video</>}
            </button>
          )}
        </section>
      )}
      <div className="all-stages-status-action">
        <button className="btn btn-outline" type="button" onClick={() => setAllStatusOpen(true)}>
          <FiClipboard /> View all stages status
        </button>
      </div>
    </div>
  );
}

function ProcessEntries({ stage, displayStage = stage, plantationId, location = "", pImgs, addProcessImage, delProcessImage, confirm, toast, enabled = true, variant = "process", giProductLabel = "GI TAGGED" }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processCaptureMode, setProcessCaptureMode] = useState(false);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [pendingName, setPendingName] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const processFileInputRef = useRef(null);
  const list = pImgs.filter((x) => x.stage === stage);
  const isGiCertificate = variant === "gi-certificate";
  const shouldStampGiLogo = isGiCertificate && !processCaptureMode;
  const defaultEntryName = isGiCertificate ? "Kotpad GI Tag Certificate" : "";

  const uploadAndSave = async (imageUrl, entryName, successMessage) => {
    const uploaded = await traceabilityApi.uploadTraceabilityImage({
      data_url: imageUrl,
      plantation_id: plantationId,
      stage,
    });
    const url = uploaded?.url;
    if (!url) throw new Error("Upload failed");
    await addProcessImage({
      plantationId,
      stage,
      name: entryName || defaultEntryName || "Process Capture",
      date: TODAY,
      imageUrl: url,
    });
    toast(successMessage, "success");
  };

  const add = () => {
    if (!isGiCertificate && !name.trim()) {
      toast("Enter a process name", "error");
      return;
    }
    setPendingName(isGiCertificate ? defaultEntryName : name.trim());
    setCameraOpen(true);
  };
  const addProcessCapture = () => {
    if (!name.trim()) {
      toast("Enter a process name", "error");
      return;
    }
    setProcessCaptureMode(true);
    setPendingName(name.trim());
    setCameraOpen(true);
  };
  const uploadCertificate = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isPdf) {
      toast("Please choose an image or PDF file.", "error");
      event.target.value = "";
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (isPdf) {
        await Promise.all([
          addProcessImage({
            plantationId,
            stage,
            name: "Kotpad GI Certificate PDF",
            date: TODAY,
            imageUrl: dataUrl,
          }),
          delay(400),
        ]);
        toast("GI certificate PDF uploaded", "success");
      } else {
        const stampedImage = await addGiCertificateStampToImage(dataUrl);
        await Promise.all([
          uploadAndSave(stampedImage, defaultEntryName, "GI certificate uploaded"),
          delay(400),
        ]);
      }
      stabilizeTraceabilityViewport(() => {
        setName("");
      });
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const uploadProcessImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast("Please choose an image file.", "error");
      event.target.value = "";
      return;
    }
    if (!name.trim()) {
      toast("Enter a process name first", "error");
      event.target.value = "";
      return;
    }

    setIsSaving(true);
    const entryName = name.trim();
    try {
      const dataUrl = await readFileAsDataUrl(file);
      let finalImageUrl = dataUrl;
      finalImageUrl = await addUploadedImageMetadata(dataUrl, {
        processName: entryName,
        date: TODAY,
        location,
        stampGi: shouldStampGiLogo,
        giProductLabel,
      });
      await Promise.all([
        uploadAndSave(
          finalImageUrl,
          entryName,
          shouldStampGiLogo ? "GI-tagged image uploaded" : "Image uploaded"
        ),
        delay(400),
      ]);
      stabilizeTraceabilityViewport(() => {
        setName("");
      });
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this process entry?");
    if (!ok) return;
    try {
      await delProcessImage(id);
      toast("Process entry deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <section className={`card process-card process-evidence-section ${isGiCertificate ? "gi-certificate-card" : ""} ${!enabled ? "process-card-disabled" : ""}`}>
      {previewEntry && (
        <div
          className="process-evidence-preview-backdrop"
          role="presentation"
          onClick={() => setPreviewEntry(null)}
        >
          <div
            className="process-evidence-preview"
            role="dialog"
            aria-modal="true"
            aria-label={`${previewEntry.name} evidence preview`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setPreviewEntry(null)} aria-label="Close preview">
              <LucideX aria-hidden="true" />
            </button>
            <img src={previewEntry.imageUrl} alt={previewEntry.name} />
            <div className="process-evidence-preview-caption">
              <strong>{previewEntry.name}</strong>
              <span>{previewEntry.date || "Date not recorded"} · {displayStage}</span>
            </div>
          </div>
        </div>
      )}
      <GeoCameraModal
        open={cameraOpen}
        name={pendingName}
        title={isGiCertificate && !processCaptureMode ? "Click GI Tag Certificate" : "GPS Camera Capture"}
        subtitle={isGiCertificate && !processCaptureMode ? "Certificate photo will be marked with the GI logo." : shouldStampGiLogo ? "Captured image will include the GI logo." : ""}
        captureLabel={isGiCertificate && !processCaptureMode ? "Click Certificate" : "Capture"}
        useLabel={isGiCertificate && !processCaptureMode ? "Use GI Certificate" : "Use Photo"}
        stampGi={shouldStampGiLogo}
        giProductLabel={giProductLabel}
        stage={stage}
        onClose={() => {
          if (isSaving) return;
          setCameraOpen(false);
          setPendingName("");
          setProcessCaptureMode(false);
        }}
        saving={isSaving}
        onUse={async (imageUrl) => {
          if (isSaving || !imageUrl) return;
          setIsSaving(true);
          try {
            await Promise.all([
              uploadAndSave(
                imageUrl,
                pendingName,
                isGiCertificate && !processCaptureMode ? "GI certificate captured" : shouldStampGiLogo ? "GI-tagged image uploaded" : "Image uploaded",
              ),
              delay(400),
            ]);
            stabilizeTraceabilityViewport(() => {
              setCameraOpen(false);
              setPendingName("");
              setProcessCaptureMode(false);
              setName("");
            });
          } catch (e) {
            toast(getTraceabilityErrorMessage(e), "error");
          } finally {
            setIsSaving(false);
          }
        }}
        toast={toast}
      />
      <div className="process-evidence-heading">
        <div>
          <span className="process-evidence-kicker">{displayStage.toUpperCase()} EVIDENCE</span>
          <h3>Process Evidence</h3>
          <p>Capture a photograph or upload an existing image for this stage.</p>
        </div>
        <span className="process-evidence-count">{list.length} {list.length === 1 ? "record" : "records"}</span>
      </div>
      {!enabled && <p className="process-disabled-message">Complete and save the required {stage.toLowerCase()} details above to add evidence.</p>}
      {isGiCertificate ? (
        <>
          <p className="muted gi-certificate-help">
            Add the Kotpad GI tag certificate here. Uploaded images and clicked photos are marked with the GI logo.
          </p>
          <div className="gi-certificate-pdf-panel">
            <img src={GI_LOGO_SRC} alt="GI tag logo" />
            <div className="gi-certificate-pdf-copy">
              <a href={KOTPAD_GI_CERTIFICATE_PDF_SRC} target="_blank" rel="noreferrer">
                <strong>GI Kotpad Fabric Tag Certificate</strong>
              </a>
              <span><FiInfo /> Reference certificate</span>
            </div>
          </div>
          <div className="form-row gi-certificate-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              onChange={uploadCertificate}
              style={{ display: "none" }}
            />
             <button className="btn btn-outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={!enabled || isSaving}>
              {isSaving ? <LoadingIndicator label="Uploading..." /> : <><FiUpload /> Upload GI Certificate</>}
            </button>
             <button className="btn btn-primary" type="button" onClick={add} disabled={!enabled || isSaving}>
              <FiCamera /> Click GI Certificate
            </button>
          </div>
          <div className="form-row gi-certificate-process-actions">
            <input className="input" placeholder="Enter process name" value={name} onChange={(e) => setName(e.target.value)} disabled={!enabled || isSaving} />
            <button className="btn btn-outline" type="button" onClick={addProcessCapture} disabled={!enabled || isSaving}>
              <FiCamera /> Capture Process
            </button>
            <input ref={processFileInputRef} type="file" accept="image/*" onChange={uploadProcessImage} style={{ display: "none" }} />
            <button className="btn btn-outline" type="button" onClick={() => processFileInputRef.current?.click()} disabled={!enabled || isSaving}>
              {isSaving ? <LoadingIndicator label="Uploading..." /> : <><FiUpload /> Upload Process Image</>}
            </button>
          </div>
        </>
      ) : (
        <div className="process-evidence-add">
          <input className="input" placeholder="Enter process name" value={name} onChange={(e) => setName(e.target.value)} disabled={!enabled || isSaving} />
          <button className="btn btn-outline" type="button" onClick={add} disabled={!enabled || isSaving}>
            <FiCamera /> Capture Image
          </button>
          <input
            ref={processFileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadProcessImage}
            style={{ display: "none" }}
          />
          <button className="btn btn-outline" type="button" onClick={() => processFileInputRef.current?.click()} disabled={!enabled || isSaving}>
            {isSaving ? <LoadingIndicator label="Uploading..." /> : <><FiUpload /> Upload Image</>}
          </button>
        </div>
      )}
      {list.length > 0 && (
        <div className="process-evidence-gallery">
          {list.map((it) => (
            <div key={it.id} className="process-entry-card">
              <div className="process-entry-main">
                {it.imageUrl && (
                  isPdfUrl(it.imageUrl)
                    ? <div className="tc-thumb process-entry-thumb process-entry-doc-thumb"><FiAward /></div>
                    : (
                      <button
                        type="button"
                        className="process-evidence-thumbnail"
                        onClick={() => setPreviewEntry(it)}
                        aria-label={`Preview ${it.name}`}
                      >
                        <img className="tc-thumb process-entry-thumb" src={it.imageUrl} alt="" />
                      </button>
                    )
                )}
                <div className="process-entry-copy">
                  <div className="process-entry-title">{it.name}</div>
                  <div className="process-entry-date">{it.date || "Date not recorded"}</div>
                </div>
              </div>
              <div className="process-entry-actions">
                {it.imageUrl && (
                  <button className="process-entry-link" type="button" onClick={() => isPdfUrl(it.imageUrl) ? window.open(it.imageUrl, "_blank", "noopener,noreferrer") : setPreviewEntry(it)}>
                    View
                  </button>
                )}
                <button className="process-entry-delete" onClick={() => remove(it.id)} type="button">
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {list.length === 0 && (
        <div className="process-evidence-empty">
          <FiCamera />
          <strong>No evidence added yet</strong>
          <span>Captured and uploaded images for this stage will appear here.</span>
        </div>
      )}
    </section>
  );
}

function GeoCameraModal({
  open,
  onClose,
  name,
  onUse,
  toast,
  saving = false,
  title = "GPS Camera Capture",
  subtitle = "",
  captureLabel = "Capture",
  useLabel = "Use Photo",
  stampGi = false,
  giProductLabel = "GI TAGGED",
  stage = "",
}) {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const themeClass = user?.role === "grower" ? "theme-grower" : "";

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: 20.2961, lon: 85.8245 });
  const [geocodedAddress, setGeocodedAddress] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError("");
    setPreviewUrl("");
    setStatus("Requesting camera...");

    (async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }
      const s = await requestBackCameraStream();
      const track = s.getVideoTracks?.()[0];
      if (track) await applyCameraTuning(track);
      if (cancelled) {
        stopMediaStream(s);
        return;
      }
      streamRef.current = s;
      const video = videoRef.current;
      if (video) {
        video.srcObject = s;
        await video.play();
      }
      setStatus("Camera ready");
    })().catch(() => {
      if (cancelled) return;
      setError("Camera permission denied or unavailable.");
      setStatus("Camera blocked");
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const video = videoRef.current;
    return () => {
      const s = streamRef.current;
      streamRef.current = null;
      stopMediaStream(s);
      if (video) {
        try {
          video.srcObject = null;
        } catch {
          // ignore
        }
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const signupLoc = getUserSignupLocation(user);
    setGeocodedAddress(signupLoc || "Odisha, India");

    let isCancelled = false;

    (async () => {
      let resolvedLat = 20.2961;
      let resolvedLon = 85.8245;
      let signupCoordsResolved = false;

      if (signupLoc) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=1&q=${encodeURIComponent(signupLoc)}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          if (data && data.length > 0 && !isCancelled) {
            resolvedLat = parseFloat(data[0].lat);
            resolvedLon = parseFloat(data[0].lon);
            signupCoordsResolved = true;
          }
        } catch {
          // ignore
        }

        if (!signupCoordsResolved) {
          const gps = user?.gps_coordinates || "";
          if (gps.includes(",")) {
            const [latStr, lonStr] = gps.split(",");
            resolvedLat = parseFloat(latStr.trim()) || resolvedLat;
            resolvedLon = parseFloat(lonStr.trim()) || resolvedLon;
            signupCoordsResolved = true;
          } else if (user?.latitude && user?.longitude) {
            resolvedLat = parseFloat(user.latitude) || resolvedLat;
            resolvedLon = parseFloat(user.longitude) || resolvedLon;
            signupCoordsResolved = true;
          }
        }
      }

      if (!signupCoordsResolved && !signupLoc) {
        try {
          const coords = await getCurrentLocation();
          const isSwissMock = Math.abs(coords.latitude - 47.4) < 1.0 && Math.abs(coords.longitude - 8.5) < 1.0;
          if (!isSwissMock) {
            resolvedLat = coords.latitude;
            resolvedLon = coords.longitude;
          }
        } catch {
          // ignore
        }
      }

      if (isCancelled) return;
      setMapCoords({ lat: resolvedLat, lon: resolvedLon });

      // Delay briefly to allow map DOM container to mount
      await delay(150);
      if (isCancelled) return;

      const mapElement = document.getElementById("camera-leaflet-map");
      if (mapElement && window.L) {
        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch {
            // ignore
          }
          mapRef.current = null;
        }

        // Fix standard Leaflet default marker icons issue in bundled applications
        if (window.L.Icon?.Default) {
          delete window.L.Icon.Default.prototype._getIconUrl;
          window.L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          });
        }

        const map = window.L.map("camera-leaflet-map", {
          center: [resolvedLat, resolvedLon],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });
        mapRef.current = map;

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          crossOrigin: true, // Enables canvas capture without tainted origins
        }).addTo(map);

        const marker = window.L.marker([resolvedLat, resolvedLon]).addTo(map);
        markerRef.current = marker;

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
      }
    })();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open, user]);

  const capture = async () => {
    try {
      setBusy(true);
      setError("");
      setStatus("Capturing image...");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error("Camera not ready");
      const s = streamRef.current;
      if (!s) throw new Error("Camera stream unavailable");
      if (video.readyState < 2) throw new Error("Camera not ready yet");

      const outputWidth = 1280;
      const photoHeight = 720;
      const geoHeight = 280;
      const totalHeight = photoHeight + geoHeight;
      canvas.width = outputWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext("2d");

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const srcAspect = srcW / srcH;
      const dstAspect = outputWidth / totalHeight;
      let sx = 0; let sy = 0; let sWidth = srcW; let sHeight = srcH;
      if (srcAspect > dstAspect) {
        sWidth = srcH * dstAspect;
        sx = (srcW - sWidth) / 2;
      } else {
        sHeight = srcW / dstAspect;
        sy = (srcH - sHeight) / 2;
      }
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outputWidth, totalHeight);

      // Keep the map, marker, coordinates, and address tied to the selected signup location.
      let liveLat = mapCoords.lat;
      let liveLon = mapCoords.lon;

      await drawGeoOverlay(ctx, outputWidth, photoHeight, geoHeight, {
        name: name || "Process Capture",
        dateTime: formatDateTime(new Date()),
        address: geocodedAddress || "Address unavailable",
        lat: liveLat,
        lon: liveLon,
        stage: stage,
      });
      if (stampGi) {
        await drawGiCertificateStamp(ctx, outputWidth, canvas.height, giProductLabel);
      }

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
      setStatus("Capture complete");
    } catch (err) {
      setError(err?.message || "Capture failed");
      setStatus("Capture failed");
      toast?.(err?.message || "Capture failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className={`tc-root ${themeClass}`}>
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
        <div className="modal-box camera-modal" style={{ maxWidth: "540px" }}>
          <button className="modal-close" onClick={onClose} type="button" disabled={saving}><LucideX aria-hidden="true" /></button>
          <h3>{title}</h3>
          {subtitle ? <div className="muted camera-subtitle">{subtitle}</div> : null}

          <div className="camera-stage">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="camera-status">
              {saving || busy ? <LoadingIndicator label={saving ? "Saving photo..." : status} /> : status}
            </div>
          </div>
          
          {/* Leaflet map is rendered off-screen so tiles can still be loaded and drawn on the canvas */}
          <div id="camera-leaflet-map" style={{ width: "200px", height: "200px", position: "absolute", left: "-9999px", top: "-9999px" }} />

          {error && <div className="inline-alert error">{error}</div>}
          {previewUrl && (
            <div className="camera-preview">
              <img src={previewUrl} alt="Captured preview" />
            </div>
          )}
          <div className="actions right camera-actions">
            <button className="btn btn-outline" onClick={capture} disabled={busy || saving}>
              {busy ? <LoadingIndicator label="Capturing..." /> : captureLabel}
            </button>
            <button className="btn btn-primary" onClick={() => { void onUse(previewUrl); }} disabled={!previewUrl || busy || saving}>
              {saving ? <LoadingIndicator label="Using photo..." /> : useLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CropsStep({ L, activeSection, setActiveSection, plantationName, plantationLocation, plantationUnitId, pCrops, addCrop, updateCrop, delCrop, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, draftActionRef, onSectionSaved, isBee = false, beeSection = 0, giEnabled = false, profileName = "", profilePhone = "", profileRegistration = "", productionId = "" }) {
  const mode = L.mode || "kotpad_handloom";
  const ProductionFields = PRODUCTION_FIELD_COMPONENTS[mode] || KotpadHandloomProductionFields;
  const createTypeFields = PRODUCTION_INITIAL_FIELDS[mode] || createKotpadInitialFields;
  const buildTypeDetails = PRODUCTION_DETAIL_BUILDERS[mode] || buildKotpadDetails;
  const buildTypeRecord = PRODUCTION_RECORD_BUILDERS[mode];
  const emptyForm = () => ({
    name: "",
    customName: "",
    variety: "",
    sowingDate: TODAY,
    expectedHarvest: "",
    ...createTypeFields(),
  });
  const [f, setF, clearDraft] = useProductionStageDraft(plantationId, "production", emptyForm(), draftActionRef, toast);
  useEffect(() => {
    if (!isBee || !pCrops.length) return;
    const draftKey = `traceconnect:production-draft:${plantationId}:production`;
    if (window.localStorage.getItem(draftKey)) return;
    const savedFields = Object.fromEntries(parseDetailsText(pCrops[0].variety).details);
    if (typeof savedFields.apiaryDetails === "string") {
      try {
        savedFields.apiaryDetails = JSON.parse(decodeURIComponent(savedFields.apiaryDetails));
      } catch (error) {
        console.error("Unable to restore saved apiary details", error);
        delete savedFields.apiaryDetails;
      }
    }
    if (Object.keys(savedFields).length) setF((current) => ({ ...current, ...savedFields }));
  }, [isBee, pCrops, plantationId, setF]);
  const isKotpad = mode === "kotpad_handloom" || mode === "kancheepuram_silk";
  const isKancheepuram = mode === "kancheepuram_silk";
  const isMobileRefurbishable = mode === "mobile_refurbishable";
  const isSectionedProduction = isKotpad || isMobileRefurbishable;
  const kotpadSections = [
    ...(isMobileRefurbishable ? MOBILE_REFURBISHABLE_SECTIONS : isKancheepuram ? KANCHEEPURAM_SECTIONS : [
      "Production Unit Registration",
      "Producer / Weaver Details",
      "Raw Material Details",
      "Weaving & Production Details",
      "Batch Identity & Verification",
      "Product & Marketplace Details",
    ]),
  ];
  const [savedSections, setSavedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kotpad-sections-${plantationId}`) || "[]"); } catch { return []; }
  });
  const saveSection = async () => {
    const selectedProductType = f.name === "Other" ? f.customName : f.name;
    const name = selectedProductType || (isMobileRefurbishable ? "Mobile Device Passport" : isKancheepuram ? "Kancheepuram Silk Batch" : isKotpad ? "Kotpad Fabric Batch" : isBee ? "Honey Production" : "");
    if (isSectionedProduction) {
      const requiredBySection = isKancheepuram ? {} : {
        1: ["weaverName", "weaverId", "organizationType", ...(f.organizationType === "Other" ? ["organizationName"] : []), "contactNumber", "address"],
        2: ["fabricType", "yarnSource", "naturalDyeUsed"],
        3: ["name", ...(f.name === "Other" ? ["customName"] : []), "loomType", "weavingTechnique", "designPattern", "colorCombination", "sowingDate", "expectedHarvest"],
        4: ["batchNumber", "qrVerificationCode", "productionUnitId", "weaverId", "inspectionStatus"],
        5: ["availableStock", "marketplaceVisibility"],
      };
      const missing = (requiredBySection[activeSection] || []).find((field) => !String(
        field === "productionUnitId" ? plantationUnitId : f[field] || ""
      ).trim());
      if (missing) {
        toast(`Complete the required ${missing.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} field`, "error");
        return;
      }
      if (!isKancheepuram && activeSection === 3 && !pImgs.some((image) => image.stage === "Kotpad Production")) {
        toast("Upload a production image before saving this section", "error");
        return;
      }
      if (!isKancheepuram && activeSection === 5 && !pImgs.some((image) => image.stage === "Kotpad Product")) {
        toast("Upload a product image before saving this section", "error");
        return;
      }
    }
    const typeDetails = isSectionedProduction
      ? buildTypeDetails({
          ...f,
          productType: selectedProductType,
          productName: plantationName,
          regionCluster: plantationLocation,
          productionUnitId: plantationUnitId,
          productionDate: f.sowingDate,
          expectedCompletionDate: f.expectedHarvest,
        })
      : buildTypeDetails(f);
    const variety = mergeDetails(f.variety || (isKotpad ? selectedProductType : ""), typeDetails);
    if (isSectionedProduction && f.expectedHarvest && f.sowingDate && f.expectedHarvest < f.sowingDate) {
      toast("Production completion date cannot be before the start date", "error");
      return;
    }
    if (!name || (!isSectionedProduction && !isBee && (!f.variety || !f.sowingDate))) return;
    const payload = {
      plantationId,
      name,
      variety,
      sowingDate: f.sowingDate,
      expectedHarvest: f.expectedHarvest,
      productionType: mode,
      sambalpuri: buildTypeRecord ? buildTypeRecord(f, { name, variety }) : undefined,
    };
    const request = (isSectionedProduction || isBee) && pCrops[0]?.id
      ? updateCrop(pCrops[0].id, payload)
      : addCrop(payload);
    void request
      .then(() => {
        if (isSectionedProduction) {
          const next = Array.from(new Set([...savedSections, activeSection]));
          setSavedSections(next);
          onSectionSaved?.(activeSection);
          localStorage.setItem(`kotpad-sections-${plantationId}`, JSON.stringify(next));
          toast(`${kotpadSections[activeSection]} saved`, "success");
        } else if (isBee) {
          onSectionSaved?.(beeSection);
          toast(`${BEE_SECTION_NAMES[beeSection]} saved`, "success");
        } else {
          stabilizeTraceabilityViewport(() => { clearDraft(); setF(emptyForm()); toast("Saved", "success"); });
        }
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm(`Delete this ${L.crop.toLowerCase()}?`);
    if (!ok) return;
    try {
      await delCrop(id);
      toast(`${L.crop} deleted`, "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title={isKotpad ? `Section ${activeSection + 1} — ${kotpadSections[activeSection]}` : isBee ? BEE_SECTION_NAMES[beeSection] : `Register ${L.crop}`}>
        {isSectionedProduction && !isBee && (
          <div className="kotpad-section-progress" aria-label="Kotpad section progress">
            {kotpadSections.map((section, index) => (
              <button
                key={section}
                type="button"
                className={`kotpad-section-tab ${activeSection === index ? "active" : ""} ${savedSections.includes(index) ? "saved" : ""}`}
                onClick={() => setActiveSection(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{section}</strong>
                <small>{index === 0 ? "Registered" : savedSections.includes(index) ? "Saved" : activeSection === index ? "Active" : "Not saved"}</small>
              </button>
            ))}
          </div>
        )}
        <div className={`form-grid ${mode === "kotpad_handloom" ? "kotpad-form-grid" : ""} ${mode === "sambalpuri_bandha" ? "sambalpuri-form-grid" : ""}`}>
          {!isSectionedProduction && !isBee && <div className="field-wrap">
            <label className="field-label">{L.itemTypeLabel || `${L.crop} Type`} *</label>
            <select className="input" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}>
              <option value="">Select {L.crop}...</option>
              {L.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>}
          {!isSectionedProduction && !isBee && f.name === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Name *</label>
              <input className="input" placeholder={`Enter custom ${L.crop.toLowerCase()} name`} value={f.customName} onChange={(e) => setF((x) => ({ ...x, customName: e.target.value }))} />
            </div>
          )}
          {!isSectionedProduction && !isBee && <div className="field-wrap">
            <label className="field-label">{L.variety} *</label>
            <input className="input" placeholder={L.varietyPlaceholder || "Enter details"} value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
          </div>}
          <ProductionFields
            form={f}
            setForm={setF}
            productName={plantationName}
            location={plantationLocation}
            productionUnitId={plantationUnitId}
            activeSection={isBee ? beeSection : activeSection}
            giEnabled={giEnabled}
            profileName={profileName}
            profilePhone={profilePhone}
            profileRegistration={profileRegistration}
            apiaryFarmName={plantationName}
            producerLocation={plantationLocation}
            productionId={productionId}
          />
          {!isSectionedProduction && !isBee && <div className="field-wrap">
            <label className="field-label">{L.startDateLabel || "Start Date *"}</label>
            <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
          </div>}
          {!isKotpad && !isBee && <div className="field-wrap">
            <label className="field-label">{L.expectedDateLabel || "Expected Date"}</label>
            <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
            {!f.expectedHarvest && <small className="production-field-example">Example: 2026-12-15</small>}
          </div>}
          {(isSectionedProduction ? (activeSection > 0 || isMobileRefurbishable || isKancheepuram) : true) && <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" type="button" onClick={saveSection}><FiPlus /> Save</button>
          </div>}
        </div>
        {pCrops.length > 0 && (
          <div className="record-list mt">
            {pCrops.map((c) => {
              const summary = getCompactCropSummary(mode, c.variety);
              return (
                <div key={c.id} className="record-row compact-record-row">
                  <span className="record-text compact-record-text">
                    <FiStar style={{ color: "#f59e0b" }} />
                    <strong>{c.name}</strong>
                    {summary.primary && <span className="record-summary-main">- {summary.primary}</span>}
                    {summary.tags.map((tag) => (
                      <span className="record-summary-chip" key={tag.label}>
                        {tag.label.replace(" Verification", "")}: {tag.value}
                      </span>
                    ))}
                    <span className="muted">{L.startVerb || "Started"} {c.sowingDate}</span>
                  </span>
                  <button className="icon-btn danger" onClick={() => remove(c.id)}><FiTrash2 /></button>
                </div>
              );
            })}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries
        stage={isSectionedProduction ? `${L.label} ${kotpadSections[activeSection]} Evidence` : isBee ? `${BEE_SECTION_NAMES[beeSection] || "Bee"} Evidence` : L.crops}
        displayStage={isSectionedProduction ? `${kotpadSections[activeSection]} Evidence` : isBee ? `${BEE_SECTION_NAMES[beeSection] || "Bee"} Evidence` : L.crops}
        location={plantationLocation}
        enabled={isSectionedProduction || pCrops.length > 0}
        plantationId={plantationId}
        pImgs={pImgs}
        addProcessImage={addProcessImage}
        delProcessImage={delProcessImage}
        confirm={confirm}
        toast={toast}
        giProductLabel={L.badge || "GI TAGGED"}
      />
    </>
  );
}

function MonitoringStep({ L, plantationLocation, pMon, addMonitoring, delMonitoring, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, draftActionRef }) {
  const initialForm = { date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" };
  const [f, setF, clearDraft] = useProductionStageDraft(plantationId, "monitoring", initialForm, draftActionRef, toast);
  const add = async () => {
    const inputType = f.inputType === "Other" ? f.customType : f.inputType;
    if (!inputType || !f.cropId) return;
    void addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          clearDraft();
          setF({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete this record?");
    if (!ok) return;
    try {
      await delMonitoring(id);
      toast("Monitoring record deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Add Monitoring Record">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Date *</label>
            <input className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Input Type *</label>
            <select className="input" value={f.inputType} onChange={(e) => setF((x) => ({ ...x, inputType: e.target.value }))}>
              <option value="">Select input type...</option>
              {L.monitoring.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.inputType === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Type *</label>
              <input className="input" placeholder="Describe the input type" value={f.customType} onChange={(e) => setF((x) => ({ ...x, customType: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatVarietyText(c.variety)})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Remarks / Notes</label>
            <input className="input" placeholder="e.g. Applied NPK 12-12-17 at 50kg/acre" value={f.remarks} onChange={(e) => setF((x) => ({ ...x, remarks: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add Record</button>
          </div>
        </div>
        {pMon.length > 0 && (
          <div className="record-list mt">
            {pMon.map((m) => (
              <div key={m.id} className="record-row">
                <span className="record-text"><FiDroplet style={{ color: "#2563eb" }} /> <strong>{m.inputType}</strong> - <span className="muted">{m.date}</span>{m.remarks && <> - {m.remarks}</>}</span>
                <button className="icon-btn danger" onClick={() => remove(m.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Monitoring" location={plantationLocation} enabled={pMon.length > 0} plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} giProductLabel={L.badge || "GI TAGGED"} />
    </>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, confirm, plantationId, plantationLocation, pImgs, addProcessImage, delProcessImage, toast, L, draftActionRef }) {
  const initialForm = { inspectionDate: TODAY, cropId: "", health: "Good", approved: true };
  const [f, setF, clearDraft] = useProductionStageDraft(plantationId, "verification", initialForm, draftActionRef, toast);
  const add = () => {
    if (!f.cropId) return;
    void addVerification({ plantationId, ...f })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          clearDraft();
          setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete verification?");
    if (!ok) return;
    try {
      await delVerification(id);
      toast("Verification deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Add Verification">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Inspection Date *</label>
            <input className="input" type="date" value={f.inspectionDate} onChange={(e) => setF((x) => ({ ...x, inspectionDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatVarietyText(c.variety)})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{L.crop} Health / Status *</label>
            <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
              {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode) ? "Production Completion Approval *" : "Harvest Approval *"}</label>
            <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
              <option value="yes">Approved for {["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode) ? "Production Completion" : "Harvest"}</option>
              <option value="no">Not Approved</option>
            </select>
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add</button>
          </div>
        </div>
        {pVer.length > 0 && (
          <div className="record-list mt">
            {pVer.map((v) => (
              <div key={v.id} className="record-row">
                <span className="record-text">
                  <FiCheckCircle style={{ color: v.approved ? "#1f8a43" : "#c0392b" }} />
                  <strong>{v.health}</strong> - {v.approved ? "Approved" : "Not Approved"} - <span className="muted">{v.inspectionDate}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(v.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Verification" location={plantationLocation} enabled={pVer.length > 0} plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} variant={L.mode === "kotpad_handloom" || L.mode === "kancheepuram_silk" ? "gi-certificate" : "process"} giProductLabel={L.badge || "GI TAGGED"} />
    </>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, confirm, plantationId, plantationLocation, pImgs, addProcessImage, delProcessImage, toast, L, draftActionRef }) {
  const isTextile = ["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode);
  const stageLabel = isTextile ? "Production Completion" : "Harvest";
  const initialForm = { harvestDate: TODAY, cropId: "", total: "", unit: isTextile ? "piece" : "kg", rejected: "" };
  const [f, setF, clearDraft] = useProductionStageDraft(plantationId, "completion", initialForm, draftActionRef, toast);
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  const add = () => {
    if (!f.cropId || !f.total) return;
    void addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          clearDraft();
          setF(initialForm);
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm(`Delete ${stageLabel.toLowerCase()} record?`);
    if (!ok) return;
    try {
      await delHarvest(id);
      toast(`${stageLabel} record deleted`, "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title={`Record ${stageLabel}`}>
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">{isTextile ? "Production Completion Date *" : "Harvest Date *"}</label>
            <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatVarietyText(c.variety)})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{isTextile ? "Total Pieces Produced *" : "Total Quantity *"}</label>
            <input className="input" type="number" placeholder={isTextile ? "e.g. 50" : "e.g. 500"} value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Unit *</label>
            <select className="input" value={f.unit} onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}>
              {(isTextile ? ["piece"] : UNIT_OPTIONS).map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{isTextile ? "Rejected Pieces" : "Rejected Quantity"}</label>
            <input className="input" type="number" placeholder={isTextile ? "e.g. 2 (damaged / substandard)" : "e.g. 20 (damaged / substandard)"} value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Accepted (auto-calculated)</label>
            <div className="accepted-box">{accepted} {f.unit} accepted</div>
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record {stageLabel}</button>
          </div>
        </div>
        {pHar.length > 0 && (
          <div className="record-list mt">
            {pHar.map((h) => (
              <div key={h.id} className="record-row">
                <span className="record-text">
                  <FiTrendingUp style={{ color: "#1f8a43" }} />
                  <strong>{h.harvestDate}</strong> - Accepted: <strong style={{ color: "#1f8a43" }}>{h.accepted} {h.unit}</strong>
                  {h.rejected > 0 && <> - Rejected: <strong style={{ color: "#c0392b" }}>{h.rejected} {h.unit}</strong></>}
                </span>
                <button className="icon-btn danger" onClick={() => remove(h.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Harvest" displayStage={stageLabel} location={plantationLocation} enabled={pHar.length > 0} plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} giProductLabel={L.badge || "GI TAGGED"} />
    </>
  );
}

function PackingStep({ pPack, pHar, addPacking, delPacking, confirm, plantationId, plantationLocation, pImgs, addProcessImage, delProcessImage, toast, L, draftActionRef }) {
  const initialForm = {
    packingDate: TODAY,
    harvestId: "",
    packingSize: "",
    numPackages: "",
    netWeight: "",
    warehouse: "",
    batchNumber: "",
    coldStorage: "",
    transportMethod: "",
    packagingMethod: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  };
  const [f, setF, clearDraft] = useProductionStageDraft(plantationId, "packing", initialForm, draftActionRef, toast);
  const add = () => {
    if (!f.harvestId || !f.packingSize || !f.netWeight) return;
    const packingSize = mergeDetails(f.packingSize, {
      "Packaging Method": f.packagingMethod,
      "Batch Number": f.batchNumber,
    });
    const warehouse = mergeDetails(f.warehouse, {
      "Cold Storage": f.coldStorage,
      "Transport Method": f.transportMethod,
    });
    void addPacking({ plantationId, ...f, packingSize, warehouse, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          clearDraft();
          setF(initialForm);
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete packing?");
    if (!ok) return;
    try {
      await delPacking(id);
      toast("Packing deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Record Packing">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Packing Date *</label>
            <input className="input" type="date" value={f.packingDate} onChange={(e) => setF((x) => ({ ...x, packingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">{["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode) ? "Link to Production Completion *" : "Link to Harvest *"}</label>
            <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
              <option value="">Select {["kotpad_handloom", "sambalpuri_bandha"].includes(L.mode) ? "production batch" : "harvest batch"}...</option>
              {pHar.map((h) => <option key={h.id} value={h.id}>{h.harvestDate} - {h.accepted} {h.unit} accepted</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Package Size *</label>
            <input className="input" placeholder="e.g. 50kg bag, 25kg sack" value={f.packingSize} onChange={(e) => setF((x) => ({ ...x, packingSize: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Packaging Method</label>
            <select className="input" value={f.packagingMethod} onChange={(e) => setF((x) => ({ ...x, packagingMethod: e.target.value }))}>
              <option value="">Select packaging method...</option>
              {PACKAGING_METHOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Batch Number</label>
            <input className="input" placeholder="e.g. TC-BATCH-001" value={f.batchNumber} onChange={(e) => setF((x) => ({ ...x, batchNumber: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Number of Packages</label>
            <input className="input" type="number" placeholder="e.g. 10" value={f.numPackages} onChange={(e) => setF((x) => ({ ...x, numPackages: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Net Weight (kg) *</label>
            <input className="input" type="number" placeholder="Total net weight in kg" value={f.netWeight} onChange={(e) => setF((x) => ({ ...x, netWeight: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Warehouse Name</label>
            <input className="input" placeholder="e.g. Green Cold Storage" value={f.warehouse} onChange={(e) => setF((x) => ({ ...x, warehouse: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Cold Storage</label>
            <select className="input" value={f.coldStorage} onChange={(e) => setF((x) => ({ ...x, coldStorage: e.target.value }))}>
              <option value="">Select cold storage status...</option>
              {COLD_STORAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Transport Method</label>
            <select className="input" value={f.transportMethod} onChange={(e) => setF((x) => ({ ...x, transportMethod: e.target.value }))}>
              <option value="">Select transport method...</option>
              {TRANSPORT_METHOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Street Address</label>
            <input className="input" placeholder="e.g. MG Road, Sector 5" value={f.street} onChange={(e) => setF((x) => ({ ...x, street: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">City</label>
            <input className="input" placeholder="e.g. Pune" value={f.city} onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">State</label>
            <input className="input" placeholder="e.g. Maharashtra" value={f.state} onChange={(e) => setF((x) => ({ ...x, state: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Pincode</label>
            <input className="input" placeholder="6-digit PIN" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Country</label>
            <input className="input" placeholder="Country name" value={f.country} onChange={(e) => setF((x) => ({ ...x, country: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Packing</button>
          </div>
        </div>
        {pPack.length > 0 && (
          <div className="record-list mt">
            {pPack.map((pk) => (
              <div key={pk.id} className="record-row">
                <span className="record-text">
                  <FiPackage style={{ color: "#7c3aed" }} />
                  <strong>{pk.packingDate}</strong> - {pk.numPackages} x {pk.packingSize} - <strong>{pk.netWeight} kg</strong> - <span className="muted">{pk.city}, {pk.state}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(pk.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Packing" location={plantationLocation} enabled={pPack.length > 0} plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} giProductLabel={L?.badge || "GI TAGGED"} />
    </>
  );
}

export function SupplierDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { batches, addBatch } = useData();
  const { confirm, dialog } = useConfirm();
  const [selected, setSelected] = useState([]);
  const [desc, setDesc] = useState("");
  const [batchModal, setBatchModal] = useState(null);
  const [batchCreating, setBatchCreating] = useState(false);
  const workbenchRef = useRef(null);
  const [traceIndex, setTraceIndex] = useState(0);
  const [expandedTraceId, setExpandedTraceId] = useState(null);
  const [growerLookupId, setGrowerLookupId] = useState("");
  const [growerLookupState, setGrowerLookupState] = useState({
    loading: false,
    error: "",
    data: null,
  });
  const [supplierTraceState, setSupplierTraceState] = useState({
    loading: true,
    error: "",
    traces: [],
    operatingAreas: [],
  });

  const supplierUserId = Number(user?.user_id || user?.id);
  const mine = batches.filter((b) => Number(b.supplierId) === supplierUserId);
  const minePackingIds = mine.flatMap((b) => b.packingIds || []);
  const traces = supplierTraceState.traces;
  const available = traces.filter(
    (trace) =>
      trace.workflowComplete &&
      !trace.assignedPatchId &&
      !minePackingIds.includes(trace.packingId),
  );
  const selectedTraces = available.filter((trace) =>
    selected.includes(trace.packingId),
  );
  const total = selectedTraces.reduce(
    (sum, trace) => sum + (Number(trace.netWeight) || 0),
    0,
  );
  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const selectTrace = (trace) => {
    const isSelected = selected.includes(trace.packingId);
    toggle(trace.packingId);
    toast(isSelected ? "Trace removed from batch" : "Trace selected", "success");
    if (!isSelected) {
      window.requestAnimationFrame(() => {
        workbenchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const removeTrace = async (trace) => {
    const label = trace.plantationName || trace.cropName || "this trace";
    const ok = await confirm(`Delete ${label}? This will remove the packing record.`);
    if (!ok) return;

    try {
      await traceabilityApi.deletePacking(trace.packingId);
      setSupplierTraceState((prev) => ({
        ...prev,
        traces: prev.traces.filter((item) => item.packingId !== trace.packingId),
      }));
      setSelected((current) => current.filter((id) => id !== trace.packingId));
      toast("Trace deleted successfully", "success");
    } catch (error) {
      toast(getTraceabilityErrorMessage(error) || "Unable to delete this trace", "error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    setSupplierTraceState((prev) => ({
      ...prev,
      loading: true,
      error: "",
    }));

    traceabilityApi
      .listSupplierFarmTraces()
      .then((response) => {
        if (cancelled) return;

        setSupplierTraceState({
          loading: false,
          error: "",
          traces: Array.isArray(response?.traces) ? response.traces : [],
          operatingAreas: Array.isArray(response?.operatingAreas)
            ? response.operatingAreas
            : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setSupplierTraceState({
          loading: false,
          error:
            getTraceabilityErrorMessage(error) ||
            "Failed to load supplier farm traces.",
          traces: [],
          operatingAreas: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const regionLabels = supplierTraceState.operatingAreas
    .map((area) =>
      [area?.village, area?.district, area?.state, area?.pincode]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean);
  const lookupData = growerLookupState.data;
  const lookupTraces = Array.isArray(lookupData?.traces) ? lookupData.traces : [];
  const lookupPlantations = Array.isArray(lookupData?.plantations) ? lookupData.plantations : [];
  const lookupBatches = Array.isArray(lookupData?.batches) ? lookupData.batches : [];

  const fetchGrowerRecords = async (event) => {
    event.preventDefault();
    const id = growerLookupId.trim();

    if (!id) {
      toast("Enter a grower ID", "error");
      return;
    }

    setGrowerLookupState({ loading: true, error: "", data: null });

    try {
      const response = await traceabilityApi.getSupplierGrowerRecords(id);
      const responseTraces = Array.isArray(response?.traces) ? response.traces : [];
      const normalizedResponse = {
        ...response,
        traces: responseTraces,
        plantations: Array.isArray(response?.plantations) ? response.plantations : [],
        batches: Array.isArray(response?.batches) ? response.batches : [],
      };

      setGrowerLookupState({
        loading: false,
        error: "",
        data: normalizedResponse,
      });

      if (responseTraces.length > 0) {
        setSupplierTraceState((prev) => {
          const byPackingId = new Map(
            prev.traces.map((trace) => [Number(trace.packingId), trace]),
          );

          responseTraces.forEach((trace) => {
            const key = Number(trace.packingId);
            byPackingId.set(key, { ...(byPackingId.get(key) || {}), ...trace });
          });

          return {
            ...prev,
            traces: Array.from(byPackingId.values()),
          };
        });
      }

      toast(`Loaded grower ${response?.grower?.growerUserId || id}`, "success");
    } catch (error) {
      setGrowerLookupState({
        loading: false,
        error:
          getTraceabilityErrorMessage(error) ||
          "Unable to fetch grower records.",
        data: null,
      });
    }
  };

  const create = () => {
    if (!selectedTraces.length) {
      toast("Select at least one completed farm trace", "error");
      return;
    }

    setBatchCreating(true);
    const id = `PATCH-${Date.now().toString(36).toUpperCase()}`;
    const batch = {
      id,
      supplierId: user.id,
      packingIds: selectedTraces.map((trace) => trace.packingId),
      description: desc,
      totalWeight: total,
      createdAt: TODAY,
      items: selectedTraces.map((trace) => ({
        packing_id: trace.packingId,
        harvest_id: trace.harvestId,
        crop_id: trace.cropId,
        plantation_id: trace.plantationId,
      })),
    };

    void Promise.all([addBatch(batch), delay(600)])
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setSupplierTraceState((prev) => ({
            ...prev,
            traces: prev.traces.map((trace) =>
              batch.packingIds.includes(trace.packingId)
                ? { ...trace, assignedPatchId: id }
                : trace,
            ),
          }));
          setBatchModal(batch);
          setSelected([]);
          setDesc("");
          toast("Batch created!", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"))
      .finally(() => setBatchCreating(false));
  };

  return (
    <div className="page-container supplier-dashboard-shell">
      {dialog}
      <div className="dashboard-hero supplier-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Supplier Workspace</div>
          <h1>All Farm Traces</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name}. Review grower traces from your
            operating locations, shortlist packings, and turn them into
            supplier-side traceable batches.
          </p>
          {regionLabels.length > 0 && (
            <div className="supplier-region-row">
              {regionLabels.map((label) => (
                <span key={label} className="supplier-region-chip">
                  <FiMapPin />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="supplier-hero-panel">
          <div className="supplier-hero-label">Matched Coverage</div>
          <div className="supplier-hero-value">{traces.length}</div>
          <div className="supplier-hero-foot">
            farm trace{traces.length === 1 ? "" : "s"} aligned with your
            supplier profile
          </div>
        </div>
      </div>

      <div className="stats-row">
        <StatCard
          icon={<FiGrid />}
          label="Farm Traces"
          value={traces.length}
          color="blue"
        />
        <StatCard
          icon={<FiPackage />}
          label="Available Packings"
          value={available.length}
          color="green"
        />
        <StatCard
          icon={<FiBarChart2 />}
          label="Batches Created"
          value={mine.length}
          color="purple"
        />
      </div>

      {supplierTraceState.error && (
        <div className="inline-alert error">{supplierTraceState.error}</div>
      )}

      <div className="supplier-actions-grid">
        <div className="card supplier-lookup-card">
          <div className="card-title">
            <FiUser /> Find Producer Records
          </div>
          <form className="supplier-lookup-form" onSubmit={fetchGrowerRecords}>
            <input
              className="input"
              value={growerLookupId}
              onChange={(event) => setGrowerLookupId(event.target.value)}
              placeholder="Enter Producer ID shown on the production dashboard"
              inputMode="numeric"
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={growerLookupState.loading}
            >
              {growerLookupState.loading ? "Fetching..." : "Fetch"}
            </button>
          </form>

          {growerLookupState.error && (
            <div className="inline-alert error">{growerLookupState.error}</div>
          )}

          {lookupData && (
            <div className="supplier-lookup-result">
              <div className="supplier-lookup-grower">
                <span>Producer</span>
                <strong>{lookupData.grower?.growerName || "Grower"}</strong>
                <code>ID: {lookupData.grower?.growerUserId || growerLookupId}</code>
              </div>

              <div className="supplier-lookup-counts">
                <div>
                  <span>Production Units</span>
                  <strong>{lookupPlantations.length}</strong>
                </div>
                <div>
                  <span>Packings</span>
                  <strong>{lookupTraces.length}</strong>
                </div>
                <div>
                  <span>Batches</span>
                  <strong>{lookupBatches.length}</strong>
                </div>
              </div>

              {lookupPlantations.length > 0 && (
                <div className="supplier-lookup-section">
                  <span className="supplier-lookup-label">Production Units</span>
                  {lookupPlantations.slice(0, 3).map((plantation) => (
                    <div key={plantation.plantationId} className="supplier-lookup-item">
                      <div>
                        <strong>{plantation.plantationName}</strong>
                        <p>{plantation.location || "Location not available"}</p>
                      </div>
                      <span className={`workflow-chip ${plantation.workflowComplete ? "complete" : "pending"}`}>
                        {plantation.workflowComplete ? "Completed" : `Pending ${plantation.pendingStage || "Workflow"}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {lookupTraces.length > 0 && (
                <div className="supplier-lookup-section">
                  <span className="supplier-lookup-label">Packings</span>
                  {lookupTraces.slice(0, 4).map((trace) => {
                    const isSelected = selected.includes(trace.packingId);
                    const isUnavailable = Boolean(trace.assignedPatchId) || !trace.workflowComplete;

                    return (
                      <div key={trace.packingId} className="supplier-lookup-item action">
                        <div>
                          <strong>{trace.plantationName}</strong>
                          <p>
                            Packing #{trace.packingId} - {trace.cropName || "Crop"} - {trace.netWeight} kg
                          </p>
                          <span className={`workflow-chip ${trace.workflowComplete ? "complete" : "pending"}`}>
                            {trace.workflowComplete ? "Completed" : `Pending ${trace.pendingStage || "Workflow"}`}
                          </span>
                        </div>
                        <button
                          className={`btn ${isSelected ? "btn-outline" : "btn-primary"}`}
                          disabled={isUnavailable}
                           onClick={() => selectTrace(trace)}
                          type="button"
                        >
                          {trace.assignedPatchId
                            ? "Batched"
                            : !trace.workflowComplete
                              ? "Pending"
                              : isSelected
                                ? "Selected"
                                : "Select"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {lookupBatches.length > 0 && (
                <div className="supplier-lookup-section">
                  <span className="supplier-lookup-label">Supplier batches</span>
                  {lookupBatches.slice(0, 3).map((batch) => (
                    <div key={batch.patchId} className="supplier-lookup-item action">
                      <div>
                        <strong>{batch.patchId}</strong>
                        <p>{batch.totalWeight || 0} {batch.unit || "kg"} - {batch.createdAt || "Date pending"}</p>
                      </div>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/patch/${batch.patchId}`)}
                        type="button"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

         <div className="card supplier-workbench" ref={workbenchRef}>
          <div className="card-title">
            <FiPackage /> Create Supplier Batch
          </div>
          <div className="supplier-workbench-summary">
            <div>
              <span>Selected traces</span>
              <strong>{selectedTraces.length}</strong>
            </div>
            <div>
              <span>Total weight</span>
              <strong>{total} kg</strong>
            </div>
          </div>

          <div className="field-wrap">
            <label className="field-label">Batch Description</label>
            <textarea
              className="input supplier-notes"
              placeholder="e.g. Premium tomato route for North 24 Parganas stores"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
            />
          </div>

          {selectedTraces.length === 0 ? (
            <div className="empty-state small">
              <p>
                Select trace cards from the feed to prepare a supplier batch.
              </p>
            </div>
          ) : (
            <div className="supplier-selection-list">
              {selectedTraces.map((trace) => (
                <div key={trace.packingId} className="supplier-selection-item">
                  <div>
                    <strong>{trace.plantationName}</strong>
                    <p>
                      {trace.cropName} &#8226; {trace.netWeight} kg &#8226; {trace.packingDate || "Packing date pending"}
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                     onClick={() => selectTrace(trace)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary full-width"
            onClick={create}
            disabled={!selectedTraces.length || batchCreating}
          >
            {batchCreating ? <LoadingIndicator label="Creating batch..." /> : <><FiPlus /> Create Batch ({selectedTraces.length})</>}
          </button>
        </div>
      </div>

      <div className="card supplier-feed-card">
        <div className="card-title">
          <FiMapPin /> Farm Trace Feed
        </div>

        {supplierTraceState.loading ? (
          <div className="empty-state small">
            <p>Loading farm traces from your supplier coverage...</p>
          </div>
        ) : traces.length === 0 ? (
          <div className="empty-state small">
            <p>
              No grower traces are available for your registered operating
              areas yet.
            </p>
          </div>
        ) : (
          <>
          <div className="supplier-trace-carousel-controls">
            <button type="button" className="supplier-carousel-arrow" onClick={() => { setTraceIndex((index) => Math.max(0, index - 1)); setExpandedTraceId(null); }} disabled={traceIndex === 0} aria-label="Show newer trace"><ArrowLeft aria-hidden="true" /></button>
            <span>{traceIndex + 1} / {traces.length}</span>
            <button type="button" className="supplier-carousel-arrow" onClick={() => { setTraceIndex((index) => Math.min(traces.length - 1, index + 1)); setExpandedTraceId(null); }} disabled={traceIndex >= traces.length - 1} aria-label="Show older trace"><ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="supplier-trace-grid supplier-trace-carousel">
             {traces.slice(traceIndex, traceIndex + 1).map((trace) => {
              const isSelected = selected.includes(trace.packingId);
              const myBatch = mine.find((batch) =>
                batch.packingIds?.includes(trace.packingId),
              );
              const locationLine =
                [
                  trace.packingCity,
                  trace.packingState,
                  trace.packingPincode,
                ]
                  .filter(Boolean)
                  .join(", ") || trace.originLocation;
              const statusLabel = myBatch
                ? "In Your Batch"
                : trace.assignedPatchId
                  ? "Already Batched"
                  : trace.workflowComplete
                    ? "Ready for Batch"
                    : `Pending ${trace.pendingStage || "Workflow"}`;
              const varietyLabel = formatVarietyText(trace.cropVariety);
              const harvestLabel = toISODate(trace.harvestDate) || "Pending";
              const sowingLabel = toISODate(trace.sowingDate) || "N/A";
              const packingLabel = toISODate(trace.packingDate) || "N/A";

              return (
                <div
                  key={trace.packingId}
                  className={`supplier-trace-card ${isSelected ? "selected" : ""} ${expandedTraceId === trace.packingId ? "expanded" : ""}`}
                >
                  <div className="supplier-trace-top">
                    <div>
                      <div className="supplier-trace-kicker">
                        {trace.cropName || "Farm Trace"}
                      </div>
                      <h3>{trace.plantationName}</h3>
                    </div>
                     <div className="supplier-trace-top-actions">
                     <span
                      className={`supplier-trace-status ${
                        myBatch
                          ? "mine"
                          : trace.assignedPatchId
                            ? "batched"
                            : trace.workflowComplete
                              ? "ready"
                              : "pending"
                       }`}
                    >
                      {statusLabel}
                    </span>
                     <button
                       className="supplier-trace-delete"
                       type="button"
                       title="Delete trace"
                       aria-label={`Delete ${trace.plantationName || "trace"}`}
                       onClick={() => removeTrace(trace)}
                     >
                       <Trash2 aria-hidden="true" />
                     </button>
                     </div>
                  </div>

                   <div className="supplier-trace-scroll">
                   <div className="supplier-trace-meta">
                    <div className="supplier-trace-meta-item">
                      <FiUser />
                      <div>
                        <span>Grower</span>
                        <strong>{trace.growerName}</strong>
                        <small>ID: {trace.growerUserId}</small>
                      </div>
                    </div>
                    <div className="supplier-trace-meta-item">
                      <FiMapPin />
                      <div>
                        <span>Origin</span>
                        <strong>{trace.originLocation || "Location not available"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="supplier-trace-metrics">
                    <div>
                      <span>Variety</span>
                      <strong className="supplier-trace-variety" title={varietyLabel}>
                        {varietyLabel}
                      </strong>
                    </div>
                    <div>
                      <span>Weight</span>
                      <strong>{trace.netWeight} kg</strong>
                    </div>
                    <div>
                      <span>Packages</span>
                      <strong>
                        {trace.numPackages} x {trace.packingSize || "-"}
                      </strong>
                    </div>
                    <div>
                      <span>Harvest</span>
                      <strong>{harvestLabel}</strong>
                    </div>
                  </div>

                  <div className="supplier-trace-timeline">
                    <span>
                      <FiCalendar />
                      Sown {sowingLabel}
                    </span>
                    <span>
                      <FiCalendar />
                      Packed {packingLabel}
                    </span>
                  </div>

                  <div className="supplier-trace-footer">
                    <div className="supplier-trace-location">
                      <FiMapPin />
                      <span>{locationLine || "Location not available"}</span>
                    </div>
                    {trace.matchedArea && (
                      <span className="supplier-match-chip">
                        Match: {trace.matchedArea}
                      </span>
                    )}
                  </div>
                   </div>

                  <div className="supplier-trace-actions">
                     <button
                       className="btn btn-ghost supplier-more-info"
                       type="button"
                       onClick={() => setExpandedTraceId((id) => id === trace.packingId ? null : trace.packingId)}
                     >
                       {expandedTraceId === trace.packingId ? "Less info" : "More info"}
                     </button>
                    {myBatch ? (
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/patch/${myBatch.id}`)}
                      >
                        View Trace Page <FiArrowRight />
                      </button>
                    ) : trace.assignedPatchId ? (
                      <button className="btn btn-ghost" disabled>
                        Already assigned
                      </button>
                    ) : !trace.workflowComplete ? (
                      <button className="btn btn-ghost" disabled>
                        Pending {trace.pendingStage || "workflow"}
                      </button>
                    ) : (
                      <button
                        className={`btn ${isSelected ? "btn-outline" : "btn-primary"}`}
                        onClick={() => selectTrace(trace)}
                      >
                        {isSelected ? "Selected for Batch" : "Select Trace"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {batchModal && <SupplierBatchModal batch={batchModal} onClose={() => setBatchModal(null)} navigate={navigate} />}
    </div>
  );
}

function ReportsPage({ Page = ReportsAnalyticsPage }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { plantations, crops, harvests, verification, loading, backendError } = useData();
  return (
    <Page
      navigate={navigate}
      userRole={user?.role}
      plantations={plantations}
      crops={crops}
      harvests={harvests}
      verification={verification}
      loading={loading}
      backendError={backendError}
      productionTypes={PRODUCTION_TYPES}
      getProductionTypeConfig={getProductionTypeConfig}
      normalizeProductionType={normalizeProductionType}
      getCompactCropSummary={getCompactCropSummary}
    />
  );
}

function ProcessGalleryPage({ toast }) {
  const { user, videoBusy, videoProgress, generateVideo } = useAuth();
  const { plantations, processImages, updateProcessImage, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [activeGalleryStage, setActiveGalleryStage] = useState(TRACE_STAGES[0]);
  const [recapturingImage, setRecapturingImage] = useState(null);
  const [recaptureSaving, setRecaptureSaving] = useState(false);
  const [reuploadingImage, setReuploadingImage] = useState(null);
  const reuploadFileInputRef = useRef(null);
  const currentUserId = Number(user?.user_id || user?.id);
  const mine = plantations.filter((plantation) => Number(plantation.userId) === currentUserId);
  const mineIdSet = new Set(mine.map((plantation) => Number(plantation.id)));
  const mineImages = processImages.filter((image) => mineIdSet.has(Number(image.plantationId)));
  const stages = getTraceStagesForPlantations(mine);
  const visibleGalleryStage = stages.includes(activeGalleryStage) ? activeGalleryStage : stages[0];
  const activeStageImages = mineImages.filter((image) => image.stage === visibleGalleryStage);
  const plantationById = new Map(mine.map((plantation) => [Number(plantation.id), plantation]));
  const allStagePhotosCaptured = stages.length > 0 && stages.every((stage) => (
    mineImages.some((image) => image.stage === stage && image.imageUrl && !isPdfUrl(image.imageUrl))
  ));
  const recapturePlantation = recapturingImage
    ? plantationById.get(Number(recapturingImage.plantationId))
    : null;
  const recaptureConfig = getProductionTypeConfig(recapturePlantation?.type || "kotpad_handloom");
  const recaptureStampGi = isGiLogoProduction(recaptureConfig.mode);

  const removeImage = async (id) => {
    const ok = await confirm("Delete this entry?");
    if (ok) delProcessImage(id);
  };

  const recaptureImage = async (imageUrl) => {
    if (!recapturingImage || recaptureSaving || !imageUrl) return;
    setRecaptureSaving(true);
    try {
      const uploaded = await traceabilityApi.uploadTraceabilityImage({
        data_url: imageUrl,
        plantation_id: recapturingImage.plantationId,
        stage: recapturingImage.stage,
      });
      if (!uploaded?.url) throw new Error("Upload failed");
      await updateProcessImage(recapturingImage.id, {
        plantationId: recapturingImage.plantationId,
        stage: recapturingImage.stage,
        name: recapturingImage.name || "Process Capture",
        imageUrl: uploaded.url,
      });
      setRecapturingImage(null);
      toast("Photo recaptured", "success");
    } catch (error) {
      toast(getTraceabilityErrorMessage(error), "error");
    } finally {
      setRecaptureSaving(false);
    }
  };

  const handleReuploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !reuploadingImage) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.", "error");
      event.target.value = "";
      return;
    }

    setRecaptureSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const targetPlantation = plantationById.get(Number(reuploadingImage.plantationId));
      const targetConfig = getProductionTypeConfig(targetPlantation?.type || "kotpad_handloom");
      const finalImageUrl = isGiLogoProduction(targetConfig.mode)
        ? await addGiCertificateStampToImage(dataUrl, targetConfig.badge || "GI TAGGED")
        : dataUrl;
      const uploaded = await traceabilityApi.uploadTraceabilityImage({
        data_url: finalImageUrl,
        plantation_id: reuploadingImage.plantationId,
        stage: reuploadingImage.stage,
      });
      if (!uploaded?.url) throw new Error("Upload failed");
      await updateProcessImage(reuploadingImage.id, {
        plantationId: reuploadingImage.plantationId,
        stage: reuploadingImage.stage,
        name: reuploadingImage.name || "Process Capture",
        imageUrl: uploaded.url,
      });
      toast("Photo re-uploaded", "success");
    } catch (error) {
      toast(getTraceabilityErrorMessage(error), "error");
    } finally {
      setRecaptureSaving(false);
      setReuploadingImage(null);
      event.target.value = "";
    }
  };

  const generateGalleryVideo = async () => {
    if (!allStagePhotosCaptured || videoBusy) return;
    try {
      toast("Preparing saved images for video...", "success");
      const productionName = mine.length === 1
        ? getProductionTypeConfig(mine[0].type)?.label
        : "TraceConnect-Multi-Production";
      await generateVideo(mineImages, stages, "A", productionName);
      toast("Video generated and saved to profile successfully.", "success");
    } catch (error) {
      toast(error?.message || "Video service unavailable right now.", "error");
    }
  };

  return (
    <div className="page-container process-gallery-page">
      {dialog}
      <GeoCameraModal
        open={Boolean(recapturingImage)}
        name={recapturingImage?.name || "Process Capture"}
        title="Recapture Process Photo"
        subtitle="The new photo will replace this saved process image."
        captureLabel="Recapture"
        useLabel="Update Photo"
        stampGi={recaptureStampGi}
        giProductLabel={recaptureConfig.badge || "GI TAGGED"}
        stage={recapturingImage?.stage}
        onClose={() => {
          if (!recaptureSaving) setRecapturingImage(null);
        }}
        saving={recaptureSaving}
        onUse={recaptureImage}
        toast={toast}
      />
      <div className="page-header process-gallery-heading">
        <div>
          <h1><FiCamera /> Process Image Gallery</h1>
          <p className="page-subtitle">Captured process photos, organized by production stage.</p>
        </div>
      </div>
      <div className="card stage-gallery-card">
        <div className="stage-gallery-tabs">
          {stages.map((stage) => {
            const count = mineImages.filter((image) => image.stage === stage).length;
            return (
              <button
                key={stage}
                type="button"
                className={`stage-gallery-tab ${visibleGalleryStage === stage ? "active" : ""}`}
                onClick={() => setActiveGalleryStage(stage)}
              >
                <span>{stage}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
        <div className="gallery-group">
          <div className="gallery-stage-label">{visibleGalleryStage} Images</div>
          <input
            ref={reuploadFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReuploadImage}
            style={{ display: "none" }}
          />
          {activeStageImages.length > 0 ? (
            <div className="record-list process-entry-list">
              {activeStageImages.map((image) => {
                const plantation = plantationById.get(Number(image.plantationId));
                return (
                  <div key={image.id} className="process-entry-card">
                    <div className="process-entry-main">
                      {image.imageUrl && (
                        isPdfUrl(image.imageUrl)
                          ? <div className="tc-thumb process-entry-thumb process-entry-doc-thumb"><FiAward /></div>
                          : <img className="tc-thumb process-entry-thumb" src={image.imageUrl} alt={`${visibleGalleryStage} ${image.name}`} />
                      )}
                      <div className="process-entry-copy">
                        <div className="process-entry-title">{image.name}</div>
                        <div className="process-entry-date">{image.date}</div>
                        {plantation && (
                          <div className="process-entry-plantation">
                            <FiMapPin /> {plantation.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="process-entry-actions">
                      {image.imageUrl && (
                        <a className="process-entry-link" href={image.imageUrl} target="_blank" rel="noreferrer">
                          <FiExternalLink /> View
                        </a>
                      )}
                      {!isPdfUrl(image.imageUrl) && (
                        <>
                          <button className="process-entry-link" onClick={() => setRecapturingImage(image)} type="button">
                            <FiCamera /> Recapture
                          </button>
                          <button
                            className="process-entry-link"
                            onClick={() => {
                              setReuploadingImage(image);
                              setTimeout(() => reuploadFileInputRef.current?.click(), 50);
                            }}
                            type="button"
                          >
                            <FiUpload /> Re-upload
                          </button>
                        </>
                      )}
                      <button className="process-entry-delete" onClick={() => removeImage(image.id)} type="button">
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-gallery-box">
              <FiCamera />
              <p>No images stored for this stage yet.</p>
              <span>Captured photos from this stage will appear here.</span>
            </div>
          )}
        </div>
        {allStagePhotosCaptured && (
          <div className="profile-video-action">
            {user?.video_url && user?.video_locked ? (
              <button className="btn" disabled type="button">
                <FiCheckCircle /> Video Already Generated
              </button>
            ) : (
              <button className="btn btn-primary" onClick={generateGalleryVideo} disabled={videoBusy} type="button">
                {videoBusy ? <LoadingIndicator label={videoProgress || "Generating..."} /> : <><FiVideo /> Generate Video</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TraceCapturesPage() {
  const { user } = useAuth();
  const { plantations } = useData();
  const currentUserId = Number(user?.user_id || user?.id);
  const mine = plantations.filter((plantation) => Number(plantation.userId) === currentUserId);
  const productionName = mine.length === 1
    ? getProductionTypeConfig(mine[0].type)?.label
    : "TraceConnect-Multi-Production";

  const downloadVideo = async () => {
    try {
      const response = await fetch(user.video_url);
      if (!response.ok) throw new Error("Unable to download trace capture.");
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${String(productionName || "TraceConnect").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-traceability-${new Date().toISOString().slice(0, 10)}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(user.video_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="page-container trace-captures-page">
      <div className="page-header">
        <div>
          <h1><FiVideo /> Trace Captures</h1>
          <p className="page-subtitle">Generated videos from your captured process images.</p>
        </div>
      </div>
      {user?.video_url ? (
        <div className="card profile-video-card">
          <div className="card-title"><FiVideo /> Your Traceability Video</div>
          <p className="muted">
            Lifecycle video generated from your stage photos and saved to your account.
            {user?.video_locked && (
              <span className="trace-capture-lock">
                &#128274; Locked - add or update a stage photo to re-generate.
              </span>
            )}
          </p>
          <div className="profile-video-player trace-capture-player">
            <video src={user.video_url} controls />
          </div>
          <div className="trace-capture-actions">
            <a href={user.video_url} target="_blank" rel="noreferrer" className="btn btn-outline">
              <FiExternalLink /> Open Video
            </a>
            <button className="btn btn-primary" onClick={downloadVideo} type="button">
              <FiDownload /> Download Video
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-gallery-box">
          <FiVideo />
          <p>No trace captures generated yet.</p>
          <span>Generated traceability videos will appear here.</span>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ toast }) {
  const { navigate } = useRouter();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [logo, setLogo] = useState(user?.company_logo || "");
  const [name, setName] = useState(user?.name || "");

  const handleCompanyLogoEdit = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result || ""));
      toast("Company logo uploaded", "success");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      const updated = await authApi.updateProfile({ name, company_logo: logo });
      updateUser(updated);
      setEditing(false);
      toast("Profile updated successfully", "success");
    } catch {
      toast("Failed to update profile", "error");
    }
  };

  return (
    <div className="page-container profile-page">
      <section className="profile-settings-card" aria-label="Profile settings">
        <aside className="profile-identity">
          <div className="profile-identity-avatar">
            {user?.profile_image ? <img src={user.profile_image} alt="" /> : <FiUser />}
          </div>
          <h2>{name || "Your profile"}</h2>
          <p>{user?.email?.toLowerCase() || "Email not provided"}</p>
        </aside>

        <div className="profile-information">
          <div className="profile-information-heading">
            <h2><span><FiUser /></span> Profile Information</h2>
            {!editing && (
              <button className="btn btn-outline profile-edit-action" onClick={() => setEditing(true)} type="button">
                <FiEdit2 /> Edit Profile
              </button>
            )}
          </div>

          <div className="profile-fields">
            <label className="profile-field">
              <span><FiUser /> Full Name</span>
              {editing ? (
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
              ) : (
                <strong>{name || "Not provided"}</strong>
              )}
            </label>
            <div className="profile-field">
              <span><FiMail /> Email Address</span>
              <strong>{user?.email?.toLowerCase() || "Not provided"}</strong>
            </div>
            <div className="profile-field">
              <span><FiShield /> Role</span>
              <strong className="capitalize">{user?.role || "Not provided"}</strong>
            </div>
            <div className="profile-field">
              <span><FiMapPin /> Location</span>
              <strong>{user?.profile_location || "Not provided"}</strong>
            </div>
             <div className="profile-field">
              <span><FiCheck /> Account Status</span>
               <strong className={`profile-status ${user?.verification_status || "pending"}`}>{user?.verification_status === "approved" ? "Approved" : user?.verification_status === "rejected" ? "Rejected" : "Pending review"}</strong>
            </div>
             {user?.verification_status === "pending" && (
               <div className="profile-review-note"><FiInfo /><span><strong>Profile submitted successfully.</strong> Your documents are under review and verification usually takes 2–3 days. Check your profile status here.</span></div>
             )}
            {editing && (
              <div className="profile-edit-actions">
                <button className="btn btn-primary" onClick={saveProfile} type="button"><FiCheck /> Save changes</button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setName(user?.name || "");
                    setLogo(user?.company_logo || "");
                    setEditing(false);
                  }}
                  type="button"
                >
                  <FiX /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

function TracePage({ patchId }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [activePhotoModal, setActivePhotoModal] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: "", data: null });
    traceabilityApi
      .getTrace(patchId)
      .then((data) => {
        if (cancelled) return;
        setState({ loading: false, error: "", data });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ loading: false, error: err?.message || "Failed to load trace", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [patchId]);

  if (state.loading) {
    return (
      <div className="trace-page trace-public">
        <header className="public-trace-header">
          <button className="btn-back-minimal" onClick={() => { if (user) { navigate(user.role === "supplier" ? "/supplier" : "/grower"); } else { navigate("/"); } }}>
            <FiArrowLeft /> {user ? "Back to Dashboard" : "Back to Home"}
          </button>
          <button className="public-brand-btn" onClick={() => navigate("/")}>
            <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="Logo" /></span>
          <span className="brand-text">TRACECONNECT</span>
          </button>
        </header>
        <div className="trace-card" style={{ textAlign: "center", padding: 36 }}>
          <h2>Loading trace...</h2>
          <p className="muted">Batch ID: <code>{patchId}</code></p>
        </div>
      </div>
    );
  }

  const patch = state.data?.patch ?? null;
  const items = patch ? safeJson(patch.items, []) : [];
  const packingIdsFromItems = Array.isArray(items)
    ? items
        .map((it) => it?.packing_id ?? it?.packingId)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    : [];

  const packings = patch ? (state.data?.packings || []).map(fromDbPacking) : [];
  const harvests = patch ? (state.data?.harvests || []).map(fromDbHarvest) : [];
  const crops = patch ? (state.data?.crops || []).map(fromDbCrop) : [];
  const plantations = patch ? (state.data?.plantations || []).map(fromDbPlantation) : [];
  const processImages = patch ? (state.data?.process_images || []).map(fromDbProcessImage) : [];
  const growers = state.data?.growers || [];

  const batch = patch
    ? {
        id: patch.patch_id,
        description: patch.description || "",
        totalWeight: Number(patch.total_weight) || 0,
        createdAt: toISODate(patch.created_at),
        packingIds: packingIdsFromItems.length ? packingIdsFromItems : packings.map((p) => p.id),
      }
    : null;

  if (!batch) {
    return (
      <div className="trace-page trace-public">
        <header className="public-trace-header">
          <button className="btn-back-minimal" onClick={() => { if (user) { navigate(user.role === "supplier" ? "/supplier" : "/grower"); } else { navigate("/"); } }}>
            <FiArrowLeft /> {user ? "Back to Dashboard" : "Back to Home"}
          </button>
          <button className="public-brand-btn" onClick={() => navigate("/")}>
            <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="Logo" /></span>
          <span className="brand-text">TRACECONNECT</span>
          </button>
        </header>
        <div className="trace-card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 40 }}><FiAlertTriangle /></div>
          <h2>Batch Not Found</h2>
          <p className="muted">Batch ID: <code>{patchId}</code> does not exist.</p>
        </div>
      </div>
    );
  }

  const firstPacking = packings.find((p) => p.id === batch.packingIds[0]);
  const harvestRecord = firstPacking ? harvests.find((h) => h.id === firstPacking.harvestId) : null;
  const cropRecord = harvestRecord ? crops.find((c) => c.id === harvestRecord.cropId) : null;
  const plantation = firstPacking ? plantations.find((p) => p.id === firstPacking.plantationId) : null;
  const productionType = normalizeProductionType(plantation?.type || plantation?.productionType);
  const traceSectionFields = productionType === "kancheepuram_silk"
    ? KANCHEEPURAM_SECTION_FIELDS
    : productionType === "mobile_refurbishable"
      ? MOBILE_REFURBISHABLE_SECTION_FIELDS
      : null;
  const traceDetails = parseDetailsText(cropRecord?.variety).details;
  const productionSections = traceSectionFields
    ? traceSectionFields.map(([name, fields]) => ({
      name,
      rows: fields.map(([label, key]) => [label, traceDetails.get(key)]).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    })).filter((section) => section.rows.length)
    : [{ name: `${getProductionTypeConfig(productionType)?.label || "Production"} Details`, rows: Array.from(traceDetails.entries()).map(([key, value]) => [formatStatusKey(key), value]) }].filter((section) => section.rows.length);
  const isShrimp = productionType === "shrimp";

  const growerRecord = plantation ? growers.find((g) => g.id === plantation.userId) : null;
  const growerProcessImages = plantation
    ? processImages.filter((img) => img.userId === plantation.userId || img.plantationId === plantation.id)
    : [];

  const imagesByStage = {};
  growerProcessImages.forEach((img) => {
    const stageName = img.stage || "Other";
    if (!imagesByStage[stageName]) {
      imagesByStage[stageName] = [];
    }
    imagesByStage[stageName].push(img);
  });

  const cropKey = (cropRecord?.name || "").toLowerCase();
  const xfactorMap = {
    tomato: [{ label: "Fruit Firmness", val: "7.2 N" }, { label: "Brix Sweetness", val: "4.8 deg Bx" }, { label: "Lycopene", val: "85 mg/kg" }, { label: "Pest Resistance", val: "0.89" }],
    brinjal: [{ label: "Glossiness", val: "92%" }, { label: "Anthocyanin", val: "120 mg/kg" }, { label: "Pest Resistance", val: "0.82" }],
    spinach: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    palak: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    "green gram": [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    moong: [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    lettuce: [{ label: "Crispness", val: "8.4 N" }, { label: "Nutrient Efficiency", val: "92%" }, { label: "Chlorophyll", val: "42 SPAD" }],
    cabbage: [{ label: "Head Density", val: "1.05 g/cm3" }, { label: "Compactness", val: "88%" }, { label: "Vitamin C", val: "36 mg/100g" }],
    cauliflower: [{ label: "Curd Compactness", val: "91%" }, { label: "Whiteness", val: "85" }, { label: "Vitamin C", val: "48 mg/100g" }],
    carrot: [{ label: "Beta Carotene", val: "8.3 mg/100g" }, { label: "Root Length", val: "18 cm" }, { label: "Sugar", val: "6.2 deg Bx" }],
    beetroot: [{ label: "Betanin", val: "95 mg/100g" }, { label: "Diameter", val: "7.5 cm" }, { label: "Sugar", val: "8.1 deg Bx" }],
    okra: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    bhindi: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    "french beans": [{ label: "Pod Length", val: "14 cm" }, { label: "Protein", val: "7.1 g/100g" }, { label: "Fiber", val: "3.4 g/100g" }],
    coriander: [{ label: "Essential Oil", val: "0.8%" }, { label: "Aroma", val: "8.5/10" }, { label: "Chlorophyll", val: "45 SPAD" }],
    fenugreek: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    methi: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    capsicum: [{ label: "Capsanthin", val: "125 mg/kg" }, { label: "Thickness", val: "6.5 mm" }, { label: "Vitamin C", val: "128 mg/100g" }],
    default: [{ label: "Quality Score", val: "A+" }, { label: "Pest Resistance", val: "0.85" }],
  };
  const xfactor = isShrimp ? [{ label: "Avg Size", val: "30-40 count/kg" }, { label: "FCR", val: "1.4:1" }, { label: "Culture Period", val: "90-120 days" }, { label: "Survival Rate", val: "80-85%" }] : (xfactorMap[cropKey] || xfactorMap.default);

  const retailSizes = {
    tomato: 1, spinach: 0.5, palak: 0.5, coriander: 0.25, lettuce: 0.3, cabbage: 1, cauliflower: 1,
    carrot: 0.5, beetroot: 0.5, capsicum: 0.5, okra: 0.5, bhindi: 0.5, brinjal: 0.5, "french beans": 0.5,
    "green gram": 1, moong: 1, shrimp: 1,
  };
  const retailSize = isShrimp ? 1 : (retailSizes[cropKey] || 1);
  const totalRetail = Math.floor((batch.totalWeight || 0) / retailSize);

  const timeline = [
    { label: "Crop Planted", date: cropRecord?.sowingDate, done: !!cropRecord },
    { label: "Harvested", date: harvestRecord?.harvestDate, done: !!harvestRecord },
    { label: "Bulk Packed", date: firstPacking?.packingDate, done: !!firstPacking },
    { label: "Supplier Packing", date: batch.createdAt, done: true },
    { label: "Transported", date: batch.createdAt, done: true },
    { label: "Delivered", date: null, done: false },
  ];
  const packingLocation = firstPacking
    ? [firstPacking.city, firstPacking.state, firstPacking.pincode].filter(Boolean).join(", ")
    : "";

  return (
    <div className="trace-page trace-public">
      <header className="public-trace-header">
        <button className="btn-back-minimal" onClick={() => { if (user) { navigate(user.role === "supplier" ? "/supplier" : "/grower"); } else { navigate("/"); } }}>
          <FiArrowLeft /> {user ? "Back to Dashboard" : "Back to Home"}
        </button>
        <button className="public-brand-btn" onClick={() => navigate("/")}>
          <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="Logo" /></span>
          <span className="brand-text">TRACECONNECT</span>
        </button>
      </header>
      <div className="trace-hero">
        <div className="trace-hero-img">
          <div className="trace-hero-overlay">
            <div className="trace-verified-pill"><FiShield /> TraceConnect Verified Batch</div>
            <h2 className="trace-product-name">{cropRecord?.name || getProductionTypeConfig(productionType)?.label || "Traceable Product"}</h2>
            <p className="trace-product-subtitle">{productionType === "mobile_refurbishable" ? "Mobile digital product passport" : productionType === "kancheepuram_silk" ? "Kancheepuram Silk Saree traceability record" : "Production to batch traceability record"}</p>
          </div>
          <div className="trace-info-bar">
            <div className="trace-info-item"><span className="amber-dot">&#8226;</span><span>Variety</span><strong>{formatVarietyText(cropRecord?.variety)}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">&#8226;</span><span>Harvested</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">&#8226;</span><span>Origin</span><strong>{plantation?.location || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">&#8226;</span><span>Batch ID</span><strong className="mono">{batch.id}</strong></div>
          </div>
        </div>
      </div>

      <div className="trace-card trace-farmer-card">
        <div className="trace-section-header">Producer Information</div>
        <div className="farmer-row">
          <div className="farmer-avatar">{isShrimp ? "AQ" : "FM"}</div>
          <div>
            <div className="farmer-name">{plantation?.name || "Unknown Farm"}</div>
            <div className="farmer-sub">{getProductionTypeConfig(productionType)?.label || "Traceable Producer"}</div>
            <div className="farmer-badges">
              <span className="badge badge-green">{isShrimp ? "MPEDA Registered" : "Certified Organic Farmer"}</span>
              <span className="badge badge-blue">{isShrimp ? "Aquaculture Expert" : "Experienced Farmer"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trace-card trace-location-card">
        <div className="trace-section-header">Production Location</div>
        <div className="location-row">
          <div>
            <div className="location-name">{plantation?.location || "-"}</div>
            <div className="location-meta">Area: 2.5 hectares - <span className="badge badge-green">Active</span></div>
          </div>
        </div>
        <div style={{ padding: "0 16px 14px" }}>
          <button className="btn btn-dark"><FiVideo /> View Farm Media</button>
        </div>
      </div>

      <div className="trace-card trace-sustainability-card">
        <div className="trace-section-header" style={{ background: isShrimp ? "#1a5276" : "#2d6a2e" }}>
          {isShrimp ? "Water & Environment Data" : "Sustainability Data"}
        </div>
        {isShrimp ? (
          <div className="sustain-grid">
            {[{ l: "Water Quality", v: "pH 7.5-8.5" }, { l: "Water Temp", v: "28-32Â°C" }, { l: "Dissolved O2", v: ">= 5 mg/L" }, { l: "Ammonia", v: "< 0.1 mg/L" }, { l: "Antibiotic Test", v: "Passed" }, { l: "Salinity", v: "15-25 ppt" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        ) : (
          <div className="sustain-grid">
            {[{ l: "Water Used", v: "1100 L/kg" }, { l: "Soil Health", v: "pH 6.8" }, { l: "Organic Carbon", v: "1.2%" }, { l: "NPK", v: "N:45 P:30 K:35 kg/ha" }, { l: "NDVI Score", v: "0.78" }, { l: "CO2 Footprint", v: "0.4 kg CO2e" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        )}
      </div>

      <div className="trace-card trace-quality-card">
        <div className="trace-section-header">{isShrimp ? "Shrimp Product Details" : "Crop-Specific Quality X-Factor"}</div>
        <div className="xfactor-grid">
          {xfactor.map((x) => (
            <div key={x.label} className="xfactor-item">
              <span className="star">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <div className="xfactor-label">{x.label}</div>
              <div className="xfactor-val">{x.val}</div>
            </div>
          ))}
        </div>
      </div>

      {productionSections.length > 0 && (
        <div className="trace-card trace-production-details-card">
          <div className="trace-section-header">{getProductionTypeConfig(productionType)?.label || "Production"} Traceability Details</div>
          {productionSections.map((section) => (
            <div className="trace-production-section" key={section.name}>
              <h3>{section.name}</h3>
              <div className="stage-response-table">
                {section.rows.map(([label, value]) => (
                  <div className="stage-response-table-row" key={label}>
                    <span>{label}</span>
                    <strong>{formatStatusValue(value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="trace-card trace-cert-card">
        <div className="trace-section-header">Certifications</div>
        <div className="cert-row">
          <span className="cert-badge">CERT</span>
          <div>
            <div style={{ fontWeight: 600 }}>{isShrimp ? "MPEDA / BAP Certified" : "India Organic Certified"}</div>
            <div style={{ fontSize: 13 }} className="muted">Valid Until: Dec 2025</div>
          </div>
        </div>
      </div>

      <div className="trace-card trace-chain-card">
        <div className="trace-section-header">Harvest & Supply Chain</div>
        <div className="supply-chain">
          {["Harvested", "Bulk Packed", "Supplier Packing", "Transported", "At Store"].map((s, i) => (
            <div key={s} className="chain-item">
              <div className={`chain-dot ${i < 4 ? "chain-active" : "chain-inactive"}`}>{i < 4 ? <>&#10003;</> : <>&#9675;</>}</div>
              <div className={`chain-label ${i < 4 ? "" : "muted"}`}>{s}</div>
              {i < 4 && <div className="chain-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card trace-harvest-card">
        <div className="trace-section-header">Harvest Data</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Harvest Date</span><strong>{toISODate(harvestRecord?.harvestDate) || "-"}</strong></div>
          <div className="kv-item"><span>Total Quantity</span><strong>{harvestRecord?.total || 0} {harvestRecord?.unit || "kg"}</strong></div>
          <div className="kv-item"><span>Accepted</span><strong style={{ color: "#2d6a2e" }}>{harvestRecord?.accepted || 0} {harvestRecord?.unit || "kg"}</strong></div>
          {harvestRecord?.rejected > 0 && <div className="kv-item"><span>Rejected</span><strong style={{ color: "#e53935" }}>{harvestRecord.rejected} {harvestRecord.unit}</strong></div>}
        </div>
      </div>

      <div className="trace-card trace-packing-card">
        <div className="trace-section-header">Bulk Packing Details</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Packed On</span><strong>{toISODate(firstPacking?.packingDate) || "-"}</strong></div>
          <div className="kv-item"><span>Packages</span><strong>{firstPacking?.numPackages || 0} x {firstPacking?.packingSize || "-"}</strong></div>
          <div className="kv-item"><span>Net Weight</span><strong>{firstPacking?.netWeight || 0} kg</strong></div>
          <div className="kv-item"><span>Warehouse</span><strong>{firstPacking?.warehouse || "-"}</strong></div>
          <div className="kv-item"><span>Location</span><strong>{packingLocation || "-"}</strong></div>
        </div>
      </div>

      <div className="trace-card trace-retail-card">
        <div className="trace-section-header" style={{ background: "linear-gradient(90deg, #1a5276, #2980b9)" }}>Supplier Packing (Retail)</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Bulk Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Retail Packet Size</span><strong>{retailSize} kg</strong></div>
          <div className="kv-item"><span>Total Retail Packets</span><strong>{totalRetail} pcs</strong></div>
          <div className="kv-item"><span>Packaging Type</span><strong>{isShrimp ? "IQF / Frozen Pack" : "Consumer Ready"}</strong></div>
          <div className="kv-item"><span>QC Status</span><strong style={{ color: "#2d6a2e" }}>Passed</strong></div>
        </div>
      </div>

      <div className="trace-card trace-timeline-card">
        <div className="trace-section-header">Traceability Timeline</div>
        <div className="v-timeline">
          {timeline.map((t, i) => (
            <div key={t.label} className="v-tl-item">
              <div className={`v-tl-dot ${t.done ? "v-tl-done" : "v-tl-pending"}`} />
              {i < timeline.length - 1 && <div className={`v-tl-line ${t.done ? "v-tl-line-done" : ""}`} />}
              <div className="v-tl-content">
                <span className="v-tl-label">{t.label}</span>
                <span className="v-tl-date">{toISODate(t.date) || "Pending"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card trace-summary-card">
        <div className="trace-section-header">Batch Summary</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Description</span><strong>{batch.description || "-"}</strong></div>
          <div className="kv-item"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-item"><span>Items</span><strong>{batch.packingIds.length}</strong></div>
        </div>
      </div>

      <div className="trace-card trace-verification-card">
        <div className="trace-section-header">Data Verification</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Verified By</span><strong>TRACECONNECT System</strong></div>
          <div className="kv-item"><span>Last Updated</span><strong>{new Date().toLocaleString()}</strong></div>
          <div className="kv-item"><span>Status</span><strong style={{ color: "#2d6a2e" }}>Verified</strong></div>
        </div>
      </div>

      <div className="trace-actions">
        <button className="btn btn-primary" onClick={() => setActivePhotoModal(true)}><FiCamera /> View Harvest Photos</button>
        <button className="btn btn-outline" onClick={() => setActiveVideoModal(true)}><FiVideo /> Watch Farmer Story</button>
      </div>

      <div className="trace-footer">Powered by <strong>TRACECONNECT</strong></div>

      {/* Photo Stage-Wise Lifecycle Modal */}
      {activePhotoModal && (
        <div className="modal-overlay" onClick={() => setActivePhotoModal(false)}>
          <div className="trace-modal-card trace-photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trace-modal-header">
              <h3><FiCamera style={{ color: "var(--theme-primary)" }} /> Lifecycle Process Photos</h3>
              <button className="trace-modal-close" onClick={() => setActivePhotoModal(false)}><LucideX aria-hidden="true" /></button>
            </div>
            <div className="trace-modal-body">
              {growerProcessImages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--neutral-500)" }}>
                  <FiAlertTriangle style={{ fontSize: 32, marginBottom: 12, color: "var(--amber-500)" }} />
                  <p>No lifecycle photos have been uploaded or captured by the grower yet.</p>
                </div>
              ) : (
                <div>
                  {Object.entries(imagesByStage).map(([stageName, imgs]) => (
                    <section key={stageName} className="trace-modal-stage-section">
                      <div className="trace-modal-stage-title">
                        <strong>{stageName.charAt(0).toUpperCase() + stageName.slice(1)} Stage</strong>
                        <span>{imgs.length} {imgs.length === 1 ? "photo" : "photos"}</span>
                      </div>
                      <div className="trace-modal-photos-grid">
                        {imgs.map((img) => (
                          <div key={img.id} className="trace-modal-photo-card">
                            <div className="trace-modal-photo-img-wrap">
                              <img src={img.imageUrl} alt={img.processName || `${stageName} stage`} />
                            </div>
                            <div className="trace-modal-photo-info">
                              <strong>{img.processName || "Process entry"}</strong>
                              <span>{img.createdAt || "Date unknown"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Watch Farmer Story Video Modal */}
      {activeVideoModal && (
        <div className="modal-overlay" onClick={() => setActiveVideoModal(false)}>
          <div className="trace-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="trace-modal-header">
              <h3><FiVideo style={{ color: "var(--theme-primary)" }} /> Watch Farmer Story</h3>
              <button className="trace-modal-close" onClick={() => setActiveVideoModal(false)}><LucideX aria-hidden="true" /></button>
            </div>
            <div className="trace-modal-body">
              {growerRecord?.video_url ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                    This is the lifecycle video generated by the grower (<strong>{growerRecord.name || "Farmer"}</strong>) from their process images.
                  </p>
                  <div className="profile-video-player" style={{ position: "relative", borderRadius: 8, overflow: "hidden", backgroundColor: "#000", aspectRatio: "16/9", width: "100%" }}>
                    <video src={growerRecord.video_url} controls autoPlay style={{ width: "100%", height: "100%" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <a href={growerRecord.video_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, width: "auto" }}>
                      <FiExternalLink /> Open In New Tab
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--neutral-500)" }}>
                  <FiAlertTriangle style={{ fontSize: 32, marginBottom: 12, color: "var(--amber-500)" }} />
                  <p>The grower has not generated their Farmer Story video yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AppShell() {
  const { user, loading, videoBusy, videoProgress, videoProgressPercent, cancelVideoGeneration } = useAuth();
  const { loading: dataLoading, pendingRequests, backendError, batches, delBatch } = useData();
  const { confirm, dialog } = useConfirm();
  const { route, navigate } = useRouter();
  const { toast, toasts } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const plantationMatch = route.match(/^\/plantation\/(.+)$/);
  const patchMatch = route.match(/^\/patch\/(.+)$/);
   const dashboardRoute = user?.role === "admin" ? "/admin" : user?.role === "supplier" ? "/supplier" : "/grower";
  const appBusy = loading || dataLoading || pendingRequests > 0;
  const removeSupplierBatch = async (id) => {
    if (!await confirm("Delete this batch?")) return;

    try {
      await delBatch(id);
      toast("Deleted", "success");
    } catch (error) {
      toast(getTraceabilityErrorMessage(error) || "Unable to delete this batch.", "error");
    }
  };
  const busyLabel = loading
    ? "Checking session..."
    : dataLoading
      ? "Loading records..."
      : "Saving changes...";

  const getThemeClass = () => {
    if (patchMatch) return "theme-grower";
    if (plantationMatch) return "theme-grower";
    if (route === "/grower") return "theme-grower";
    if (route === "/supplier" || route === "/batches") return "theme-supplier";
    if (route === "/reports") return "theme-reports";
     if (route === "/profile") return "theme-profile";
     if (route === "/admin") return "theme-profile";
    if (route === "/process-gallery") return "theme-grower";
    if (route === "/trace-captures") return user?.role === "grower" ? "theme-grower" : "theme-supplier";
    if (route === "/auth" && user) return user.role === "grower" ? "theme-grower" : "theme-supplier";
    if (user) return user.role === "grower" ? "theme-grower" : "theme-supplier";
    return "";
  };

  useEffect(() => {
    if (loading) return;
    if (!user && route === "/auth") {
      setAuthModalOpen(true);
      navigate("/");
    }
    if (user) setAuthModalOpen(false);
  }, [user, loading, route, patchMatch, navigate]);

  let page = null;
  if (patchMatch) page = <div className="theme-grower"><TracePage patchId={patchMatch[1]} /></div>;
  else if (route === "/") page = (
    <Home
      onStartMonitoring={() => (user ? navigate(dashboardRoute) : setAuthModalOpen(true))}
      onGoToDashboard={user ? () => navigate(dashboardRoute) : undefined}
    />
  );
  else if (loading) page = <PageSkeleton title="Checking session..." />;
   else if (route === "/auth" && user) page = user.role === "admin" ? <AdminDashboard toast={toast} /> : user.role === "grower" ? <div className="theme-grower"><GrowerDashboard navigate={navigate} toast={toast} /></div> : <div className="theme-supplier"><SupplierDashboard navigate={navigate} toast={toast} /></div>;
  else if (!user) page = (
    <Home
      onStartMonitoring={() => setAuthModalOpen(true)}
      onGoToDashboard={undefined}
    />
  );
  else if (plantationMatch) page = <div className="theme-grower"><PlantationDetail plantationId={plantationMatch[1]} toast={toast} /></div>;
  else if (route === "/grower") page = user.role === "grower" ? <div className="theme-grower"><GrowerDashboard navigate={navigate} toast={toast} /></div> : <div className="page-container">Access denied</div>;
   else if (route === "/supplier") page = user.role === "supplier" ? <div className="theme-supplier"><SupplierDashboard navigate={navigate} toast={toast} /></div> : <div className="page-container">Access denied</div>;
   else if (route === "/batches") page = user.role === "supplier" ? <div className="theme-supplier"><SupplierBatches batches={batches} supplierId={user.user_id || user.id} navigate={navigate} removeBatch={removeSupplierBatch} dialog={dialog} /></div> : <div className="page-container">Access denied</div>;
   else if (route === "/admin") page = user.role === "admin" ? <AdminDashboard toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/reports") page = <div className="theme-reports"><ReportsPage Page={user.role === "supplier" ? SupplierReports : ReportsAnalyticsPage} /></div>;
  else if (route === "/profile") page = <div className="theme-profile"><ProfilePage toast={toast} /></div>;
  else if (route === "/process-gallery") page = user.role === "grower" ? <div className="theme-grower"><ProcessGalleryPage toast={toast} /></div> : <div className="page-container">Access denied</div>;
  else if (route === "/trace-captures") page = <div className={user.role === "grower" ? "theme-grower" : "theme-supplier"}><TraceCapturesPage /></div>;
  else page = user.role === "grower" ? <div className="theme-grower"><GrowerDashboard navigate={navigate} toast={toast} /></div> : <div className="theme-supplier"><SupplierDashboard navigate={navigate} toast={toast} /></div>;

  return (
    <div className="app-root">
      <AppBusyBar active={appBusy} label={busyLabel} />
      <GlobalVideoProgressBar active={videoBusy} progress={videoProgress} progressPercent={videoProgressPercent} onCancel={cancelVideoGeneration} />
      <Toasts toasts={toasts} themeClass={getThemeClass()} />
       {user && !patchMatch && <Header route={route} navigate={navigate} toast={toast} />}
       {!user && !patchMatch && <PublicHeader onLogin={() => { setAuthMode("login"); setAuthModalOpen(true); }} onSignup={() => { setAuthMode("signup"); setAuthModalOpen(true); }} />}
      <main className={`${(route === "/" || !user) ? "main-fluid" : ""} ${appBusy ? "is-busy" : ""}`}>
        {backendError && user && !patchMatch && <DataStatusBanner error={backendError} />}
        {page}
      </main>
      {!user && authModalOpen && (
        <div className="auth-popup-overlay" onClick={() => setAuthModalOpen(false)} role="dialog" aria-modal="true" aria-label="Login or signup">
           <div className="theme-auth" onClick={(e) => e.stopPropagation()} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
             <AuthEntryPage toast={toast} modal initialMode={authMode} onClose={() => setAuthModalOpen(false)} />
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

export default function TraceConnect() {
  useEffect(() => {
    const rootEl = typeof document !== "undefined" ? document.getElementById("root") : null;
    if (typeof document !== "undefined") {
      document.body.classList.add("traceconnect-body");
    }
    if (rootEl) {
      rootEl.classList.add("traceconnect-root-host");
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("traceconnect-body");
      }
      if (rootEl) {
        rootEl.classList.remove("traceconnect-root-host");
      }
    };
  }, []);

  return (
    <div className="tc-root">
      <AuthProvider>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </AuthProvider>
    </div>
  );
}
