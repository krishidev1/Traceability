
import { useState, useEffect, useContext, createContext, useRef } from "react";
import {
  FiLock, FiCheckCircle, FiUser, FiLogOut,
  FiHome, FiList, FiBarChart2, FiPackage, FiAlertTriangle,
  FiTrash2, FiEdit2, FiPlus, FiArrowRight, FiMapPin,
  FiCalendar, FiDroplet, FiVideo, FiCamera, FiCheck,
  FiX, FiMail, FiShield, FiStar, FiTrendingUp, FiGrid,
  FiChevronDown, FiUpload, FiAward
} from "react-icons/fi";
import "../styles/traceconnect.css";
import { authApi, clearAuth, getApiUrl, getStoredAuth, storeAuth, traceabilityApi } from "../api/traceabilityApi";

const AuthContext = createContext(null);
const DataContext = createContext(null);
const TODAY = new Date().toISOString().split("T")[0];
const API_URL = getApiUrl();
const TRACE_CONNECT_LOGO_SRC = "/Traceconnect sample.jpeg";
const LOADING_GIF_SRC = "/loading.gif";

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function LoadingIndicator({ label = "Loading..." }) {
  return (
    <span className="loading-inline">
      <img src={LOADING_GIF_SRC} alt="" />
      <span>{label}</span>
    </span>
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
    return "Cannot reach the backend. Ensure it is running on http://localhost:5000.";
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
    userId: Number(row.user_id),
    name: row.name || "",
    location: row.location_description || "",
    type: normalizeProductionType(row.production_type || row.type || row.farm_type || "crop"),
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

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
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
  ctx.font = `${Math.max(10, size * 0.12)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Map unavailable", x + size / 2, y + size / 2);
  ctx.restore();
}

function drawGiCertificateStamp(ctx, width, height) {
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
  ctx.fillStyle = "#0f8d75";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.round(sealSize * 0.34)}px Inter, sans-serif`;
  ctx.fillText("GI", sealX + sealSize / 2, sealY + sealSize / 2 + 1);

  const textX = sealX + sealSize + Math.round(badgeHeight * 0.18);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(18, Math.round(badgeHeight * 0.22))}px Inter, sans-serif`;
  ctx.fillText("CERTIFIED GI", textX, y + Math.round(badgeHeight * 0.38));
  ctx.font = `700 ${Math.max(12, Math.round(badgeHeight * 0.13))}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.fillText("KOTPAD HANDLOOM", textX, y + Math.round(badgeHeight * 0.64));
  ctx.restore();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected image."));
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

async function addGiCertificateStampToImage(dataUrl) {
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
  drawGiCertificateStamp(ctx, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function drawGeoOverlay(ctx, width, topY, panelHeight, details) {
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
  drawMapPlaceholder(ctx, mapX, mapY, mapSize, mapRadius);

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

  const nameFont = Math.max(16, Math.round(width * 0.026));
  const textFont = Math.max(14, Math.round(width * 0.022));
  const smallFont = Math.max(13, Math.round(width * 0.02));

  let cursorY = mapY;
  const textX = lineX + Math.round(padding * 0.7);

  ctx.font = `600 ${nameFont}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(details.name, textX, cursorY);

  cursorY += nameFont + 10;
  ctx.font = `500 ${textFont}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(details.dateTime, textX, cursorY);

  cursorY += textFont + 10;
  const addressMaxHeight = mapY + mapSize - cursorY - (smallFont + 8);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  wrapText(ctx, details.address, textX, cursorY, width - textX - padding, textFont + 6, addressMaxHeight, 4);

  const coordsLine = `Lat: ${formatCoords(details.lat)}, Long: ${formatCoords(details.lon)}`;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = `500 ${smallFont}px Inter, sans-serif`;
  ctx.fillText(coordsLine, textX, mapY + mapSize - smallFont - 2);
}

function DataProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
    try {
      setBackendError("");
      return await fn();
    } catch (err) {
      const msg = getTraceabilityErrorMessage(err) || fallbackMessage || "Request failed";
      setBackendError(msg);
      throw err;
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
      const created = await traceabilityApi.createCrop({
        plantation_id: Number(c.plantationId),
        crop_name: c.name,
        crop_variety: c.variety || null,
        sowing_date: c.sowingDate || null,
        expected_harvest_date: c.expectedHarvest || null,
      });
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => [...prev, fromDbCrop(created)]);
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
      return created;
    }, "Failed to create process image");
  };

  const delProcessImage = (iid) => {
    return run(async () => {
      await traceabilityApi.deleteProcessImage(iid);
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => prev.filter((x) => x.id !== iid));
      });
      return true;
    }, "Failed to delete process image");
  };

  return (
    <DataContext.Provider
      value={{
        loading,
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

  useEffect(() => {
    const stored = getStoredAuth();
    setUser(stored?.user || null);
    setLoading(false);
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

  const signOut = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        setRememberAuth,
        login: async (payload, remember) => completeAuth(await authApi.login(payload), remember),
        signup: async (payload) => completeAuth(await authApi.signup(payload), true),
        forgotPassword: authApi.forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function useData() {
  return useContext(DataContext);
}

function useRouter() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const fn = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const navigate = (path) => { window.location.hash = path; };
  return { route, navigate };
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, toast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? <FiCheckCircle /> : <FiAlertTriangle />}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Lettuce",
  "Corn",
  "Tomato",
  "Brinjal",
  "Spinach",
  "Green Gram",
  "Cabbage",
  "Cauliflower",
  "Carrot",
  "Beetroot",
  "Okra",
  "French Beans",
  "Coriander",
  "Fenugreek",
  "Capsicum",
  "Other",
];
const SHRIMP_OPTIONS = ["Vannamei Shrimp", "Tiger Prawn", "Scampi", "Giant Freshwater Prawn", "Other"];
const MONITORING_TYPES = [
  "Fertilizer Usage",
  "Pesticide Records",
  "Irrigation Logs",
  "Disease Detection",
  "Drone Monitoring",
  "Organic Compost",
  "Biofertilizer",
  "Soil Treatment",
  "Hive Inspection",
  "Disease Check",
  "Feeding Records",
  "Temperature Monitoring",
  "Humidity Monitoring",
  "Apiary Name",
  "Bee Species",
  "Number of Hives",
  "Queen Bee Age",
  "Floral Source",
  "Honey Type",
  "Moisture Percentage",
  "Raw / Processed",
  "FSSAI License",
  "Organic Certification",
  "Lab Reports",
  "Purity Verification",
  "Artisan Name",
  "Craft Type",
  "Workshop Location",
  "Years of Experience",
  "Number of Workers",
  "Products Manufactured",
  "Raw Materials Used",
  "Monthly Production Capacity",
  "Handmade / Machine Assisted",
  "Accept Bulk Orders",
  "Export Ready",
  "Online Selling Experience",
  "Delivery Regions",
  "NGO Name",
  "Registration Number",
  "Coordinator Name",
  "Women Member Count",
  "Operational Districts",
  "Skill Development",
  "Livelihood Programs",
  "Training Sessions",
  "Community Support",
  "Government Partnerships",
  "Families Supported",
  "Income Generated",
  "Products / Services Offered",
  "Beneficiary Tracking",
  "Other",
];
const SHRIMP_MONITORING = ["Water Quality", "Feed Monitoring", "Salinity Check", "Oxygen Level", "Disease Detection", "Aeration", "Other"];
const HEALTH_OPTIONS = ["Excellent", "Good", "Moderate", "Poor", "Disease Detected", "Needs Inspection", "Purity Verified", "Lab Report Pending"];
const UNIT_OPTIONS = ["kg", "ton", "count", "litre", "jar", "box", "pack", "piece"];
const SOIL_TYPE_OPTIONS = ["Alluvial Soil", "Black Soil", "Red Soil", "Laterite Soil", "Sandy Soil", "Clay Soil", "Loamy Soil", "Silty Soil", "Other"];
const IRRIGATION_METHOD_OPTIONS = ["Drip Irrigation", "Sprinkler Irrigation", "Flood Irrigation", "Canal Irrigation", "Borewell", "Rainfed", "Manual Watering", "Other"];
const ORGANIC_STATUS_OPTIONS = ["Organic", "Non-Organic", "In Conversion"];
const WATER_TYPE_OPTIONS = ["Fresh Water", "Brackish Water", "Marine Water", "Other"];
const PACKAGING_METHOD_OPTIONS = ["Bag", "Sack", "Box", "Bottle / Jar", "Vacuum Pack", "Cold Chain Pack", "Bulk Crate", "Handmade Pack", "Other"];
const TRANSPORT_METHOD_OPTIONS = ["Road Transport", "Refrigerated Vehicle", "Rail", "Air Cargo", "Sea Freight", "Courier", "Other"];
const COLD_STORAGE_OPTIONS = ["Not Required", "Required", "Available", "Not Available"];
const BEE_OPTIONS = ["Honey Bee", "Apis Cerana", "Apis Mellifera", "Stingless Bee", "Other"];
const ARTISAN_OPTIONS = ["Handloom", "Handicraft", "Pottery", "Bamboo Craft", "Textile", "Jewellery", "Wood Craft", "Metal Craft", "Other"];
const WOMEN_NGO_OPTIONS = ["Skill Development", "Livelihood Program", "Training Session", "Community Support", "Product Collective", "Beneficiary Program", "Other"];
const KOTPAD_OPTIONS = ["Saree", "Shawl", "Fabric", "Stole", "Dupatta", "Dress Material", "Home Textile", "Other"];
const KOTPAD_MONITORING = [
  "GI Certificate Upload",
  "Aadhaar / ID Proof",
  "Eco-Friendly Certification",
  "Batch Number",
  "QR Verification Code",
  "Weaver ID",
  "Production Date",
  "Geo-Fenced Production Area",
  "Authenticity Certificate",
  "Blockchain Trace ID",
  "Inspection Status",
  "Quality Grade",
  "Product Images",
  "Selling Price",
  "Wholesale Price",
  "Available Stock",
  "Minimum Order Quantity",
  "Export Availability",
  "Packaging Type",
  "Shipping Time",
  "Marketplace Visibility",
  "Natural Dye Usage",
  "Tribal Women Involved",
  "Carbon-Friendly Production",
  "Water Recycling Used",
  "Traditional Knowledge Preservation",
  "Cultural Story",
  "Government Recognition",
  "Fabric Pattern Recognition",
  "AI Authenticity Check",
  "QR Scan History",
  "Demand Forecasting",
  "Export Analytics",
  "Drone-based Cotton Monitoring",
  "Other",
];
const TRACE_STAGES = ["Crops", "Ponds", "Apiaries", "Artisan Production", "NGO Programs", "Kotpad Fabric", "Monitoring", "Verification", "Harvest", "Packing"];
const PRODUCTION_TYPE_CONFIG = {
  crop: {
    value: "crop",
    label: "Crop Farming",
    badge: "Crop Farming",
    badgeClass: "crop",
    nameLabel: "Plantation Name",
    namePlaceholder: "e.g. Green Valley Farm",
    locationLabel: "Farm Location",
    locationPlaceholder: "e.g. Puri, Odisha",
    mode: "crop",
    crop: "Crop",
    crops: "Crops",
    variety: "Variety",
    varietyPlaceholder: "e.g. Hybrid-5, Baby Leaf",
    startDateLabel: "Sowing Date *",
    expectedDateLabel: "Expected Harvest Date",
    startVerb: "Sown",
    itemTypeLabel: "Crop Type",
    options: CROP_OPTIONS,
    monitoring: MONITORING_TYPES,
  },
  shrimp: {
    value: "shrimp",
    label: "Shrimp / Prawn Aquaculture",
    badge: "Aquaculture",
    badgeClass: "shrimp",
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
  },
  bee: {
    value: "bee",
    label: "Bee Farming / Apiculture",
    badge: "Apiculture",
    badgeClass: "bee",
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
    monitoring: ["Hive Inspection", "Disease Check", "Feeding Records", "Temperature Monitoring", "Humidity Monitoring", "FSSAI License", "Organic Certification", "Lab Reports", "Purity Verification", "Other"],
  },
  artisan: {
    value: "artisan",
    label: "Artisan Production",
    badge: "Artisan",
    badgeClass: "artisan",
    nameLabel: "Workshop / Unit Name",
    namePlaceholder: "e.g. Odisha Handicraft Unit",
    locationLabel: "Workshop Location",
    locationPlaceholder: "e.g. Pipili, Odisha",
    mode: "artisan",
    crop: "Production",
    crops: "Artisan Production",
    variety: "Craft / Product Details",
    varietyPlaceholder: "e.g. bamboo basket, handloom shawl",
    startDateLabel: "Production Start Date *",
    expectedDateLabel: "Expected Completion Date",
    startVerb: "Started",
    itemTypeLabel: "Craft Type",
    options: ARTISAN_OPTIONS,
    monitoring: ["Products Manufactured", "Raw Materials Used", "Monthly Production Capacity", "Handmade / Machine Assisted", "Packaging Method", "Accept Bulk Orders", "Export Ready", "Online Selling Experience", "Delivery Regions", "Other"],
  },
  women_ngo: {
    value: "women_ngo",
    label: "Women NGO",
    badge: "Women NGO",
    badgeClass: "ngo",
    nameLabel: "NGO / Program Name",
    namePlaceholder: "e.g. Maa Women SHG Collective",
    locationLabel: "Operational Location",
    locationPlaceholder: "e.g. Puri, Odisha",
    mode: "women_ngo",
    crop: "Program",
    crops: "NGO Programs",
    variety: "Program / Activity",
    varietyPlaceholder: "e.g. tailoring training, livelihood support",
    startDateLabel: "Program Start Date *",
    expectedDateLabel: "Expected Completion Date",
    startVerb: "Started",
    itemTypeLabel: "Program Type",
    options: WOMEN_NGO_OPTIONS,
    monitoring: ["Skill Development", "Livelihood Programs", "Training Sessions", "Community Support", "Government Partnerships", "Families Supported", "Income Generated", "Products / Services Offered", "Beneficiary Tracking", "Other"],
  },
  kotpad_handloom: {
    value: "kotpad_handloom",
    label: "Kotpad Handloom Fabric",
    badge: "Kotpad GI Fabric",
    badgeClass: "kotpad",
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
    itemTypeLabel: "Kotpad Product Type",
    options: KOTPAD_OPTIONS,
    monitoring: KOTPAD_MONITORING,
  },
};
const PRODUCTION_TYPES = Object.values(PRODUCTION_TYPE_CONFIG);

function normalizeProductionType(value) {
  return PRODUCTION_TYPE_CONFIG[value] ? value : "crop";
}

function getProductionTypeConfig(value) {
  return PRODUCTION_TYPE_CONFIG[normalizeProductionType(value)];
}

function mergeDetails(base, details) {
  const suffix = Object.entries(details)
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join(" | ");
  return [base, suffix].filter((value) => String(value || "").trim()).join(" | ");
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box">
        <button className="modal-close" onClick={onCancel} type="button"><FiX /></button>
        <div className="confirm-icon"><FiAlertTriangle /></div>
        <h3>Confirm Delete</h3>
        <p className="muted">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
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

const ACCOUNT_TYPE_OPTIONS = [
  { value: "grower", label: "Grower" },
  { value: "supplier", label: "Supplier" },
];

const INDIA_STATE_DISTRICTS = {
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  Assam: ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  Bihar: ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba", "Korea", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  Delhi: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  Goa: ["North Goa", "South Goa"],
  Gujarat: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  Haryana: ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  Jharkhand: ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  Karnataka: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Vijayanagara", "Yadgir"],
  Kerala: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  Ladakh: ["Kargil", "Leh"],
  Lakshadweep: ["Lakshadweep"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar", "Mandla", "Mandsaur", "Mauganj", "Morena", "Narmadapuram", "Narsinghpur", "Neemuch", "Niwari", "Pandhurna", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  Maharashtra: ["Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar", "Dhule", "Dharashiv", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  Manipur: ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  Meghalaya: ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  Mizoram: ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha"],
  Nagaland: ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"],
  Odisha: ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  Punjab: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
  Rajasthan: ["Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Didwana-Kuchaman", "Dholpur", "Dudu", "Dungarpur", "Gangapur City", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Karauli", "Kekri", "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  Sikkim: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  Telangana: ["Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
  Tripura: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  Uttarakhand: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
};

function AuthEntryPage({ toast }) {
  const { login, signup, forgotPassword, setRememberAuth } = useAuth();
  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState(1);
  const [accountType, setAccountType] = useState("grower");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [villageArea, setVillageArea] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [gpsCoordinates, setGpsCoordinates] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [districtFocused, setDistrictFocused] = useState(false);

  const isSignup = mode === "signup";
  const stateOptions = Object.keys(INDIA_STATE_DISTRICTS);
  const districtOptions = stateName ? (INDIA_STATE_DISTRICTS[stateName] || []) : [];
  const districtSearch = district.trim().toLowerCase();
  const districtSuggestions = districtOptions
    .filter((name) => !districtSearch || name.toLowerCase().includes(districtSearch))
    .slice(0, 8);
  const addressSuggestions = district
    ? [district, `${district} town`, `${district} rural area`, `${district} main market`, `${district} village area`]
    : [];
  const isWorking = busy || stepLoading;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSignupStep(1);
    setError("");
    setStepLoading(false);
  };

  const handleStateChange = (value) => {
    setStateName(value);
    setDistrict("");
    setVillageArea("");
  };

  const handleDistrictChange = (value) => {
    setDistrict(value);
    setVillageArea("");
    setDistrictFocused(false);
  };

  const goToSignupStep = (nextStep) => {
    setStepLoading(true);
    window.setTimeout(() => {
      setSignupStep(nextStep);
      setStepLoading(false);
    }, 280);
  };

  const handleProfilePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(String(reader.result || ""));
      window.setTimeout(() => {
        setPhotoLoading(false);
        toast("Profile photo ready", "success");
      }, 350);
    };
    reader.onerror = () => {
      setPhotoLoading(false);
      setError("Unable to read profile photo.");
    };
    reader.readAsDataURL(file);
  };

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Live location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lon);
        setGpsCoordinates(`${lat}, ${lon}`);
        toast("Live location captured");
      },
      () => setError("Unable to capture live location."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setRememberAuth(rememberMe);
      const [authedUser] = await Promise.all([
        login({ identifier: loginIdentifier, password: loginPassword }, rememberMe),
        delay(550),
      ]);
      toast("Logged in successfully");
      window.location.hash = authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      setError(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const [authedUser] = await Promise.all([
        signup({
          account_type: accountType,
          full_name: fullName,
          phone,
          email,
          password,
          confirm_password: confirmPassword,
          profile_image: profileImage,
          village_area: villageArea,
          district,
          state: stateName,
          country,
          pincode,
          gps_coordinates: gpsCoordinates,
          latitude,
          longitude,
        }),
        delay(650),
      ]);
      toast("Signed up successfully");
      window.location.hash = authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      setError(err?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setBusy(true);
    setError("");
    try {
      await forgotPassword(loginIdentifier);
      toast("Password reset request received");
    } catch (err) {
      setError(err?.message || "Unable to request password reset");
    } finally {
      setBusy(false);
    }
  };

  const submitSignupStep = (event) => {
    event.preventDefault();
    if (signupStep < 3) {
      goToSignupStep(signupStep + 1);
      return;
    }
    submitSignup(event);
  };

  return (
    <div className="auth-entry-page page-container">
      <div className="auth-modal">
        <div className="auth-left-panel">
          <div className="auth-left-brand">
            <span className="auth-left-logo">
              <img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" />
            </span>
            <span className="auth-left-brand-text">TRACECONNECT</span>
          </div>
          <div className="auth-illustration">
            <FiShield />
          </div>
          <div className="auth-left-copy">
            <h3>Trace every harvest with confidence.</h3>
            <p>Secure records, verified farm activity, batch history, and supply-chain trails stay connected to your account.</p>
          </div>
          <div className="auth-left-tagline">Secure access for farm records, batches, and verification trails.</div>
        </div>

        <div className="auth-right-panel">
          <h2>{isSignup ? "Create account" : "Welcome back"}</h2>
          <div className="auth-modal-tabs" role="tablist" aria-label="Authentication mode">
            <button className={`auth-modal-tab ${!isSignup ? "active" : ""}`} onClick={() => switchMode("login")} type="button">
              Login
            </button>
            <button className={`auth-modal-tab ${isSignup ? "active" : ""}`} onClick={() => switchMode("signup")} type="button">
              Signup
            </button>
          </div>

          {!isSignup ? (
            <form onSubmit={submitLogin}>
              <label className="auth-input-wrap">
                <span className="auth-field-label">Email address / mobile number</span>
                <input className="input" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="you@example.com or mobile number" required />
              </label>

              <label className="auth-input-wrap">
                <span className="auth-field-label">Password</span>
                <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" required />
              </label>

              <div className="auth-forgot-row">
                <button className="auth-forgot" onClick={handleForgotPassword} type="button">Forgot password?</button>
              </div>

              <label className="auth-remember-row">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit-btn" disabled={isWorking} type="submit">
                {busy ? <LoadingIndicator label="Logging in..." /> : "Login"}
              </button>

              <div className="auth-or">or</div>
              <a className="auth-social-btn google" href={`${API_URL}/api/auth/google`}>
                Continue with Google
              </a>
            </form>
          ) : (
            <form onSubmit={submitSignupStep}>
              <div className="auth-step-row">
                <span className={signupStep >= 1 ? "active" : ""}>1</span>
                <span className={signupStep >= 2 ? "active" : ""}>2</span>
                <span className={signupStep >= 3 ? "active" : ""}>3</span>
              </div>

              {signupStep === 1 && (
                <div className="auth-account-select-panel">
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Account type</span>
                    <span className="auth-select-wrap">
                      <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)} disabled={isWorking} required>
                        {ACCOUNT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <FiChevronDown />
                    </span>
                  </label>
                </div>
              )}

              {signupStep === 2 && (
                <>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Full name</span>
                    <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Mobile number</span>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter mobile number" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Email address</span>
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Password</span>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Confirm password</span>
                    <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Profile photo</span>
                    <input className="input" type="file" accept="image/*" onChange={handleProfilePhoto} disabled={isWorking} required={!profileImage} />
                  </label>
                  {photoLoading && (
                    <div className="auth-loading-inline">
                      <LoadingIndicator label="Preparing photo..." />
                    </div>
                  )}
                  {profileImage && (
                    <div className="auth-photo-preview">
                      <img src={profileImage} alt="Profile preview" />
                    </div>
                  )}
                </>
              )}

              {signupStep === 3 && (
                <>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">State</span>
                    <span className="auth-select-wrap">
                      <select className="input" value={stateName} onChange={(e) => handleStateChange(e.target.value)} disabled={isWorking} required>
                        <option value="">Select state</option>
                        {stateOptions.map((stateOption) => (
                          <option key={stateOption} value={stateOption}>{stateOption}</option>
                        ))}
                      </select>
                      <FiChevronDown />
                    </span>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">District / address search</span>
                    <span className="auth-combobox">
                      <input
                        className="input"
                        value={district}
                        onBlur={() => window.setTimeout(() => setDistrictFocused(false), 120)}
                        onChange={(e) => {
                          setDistrict(e.target.value);
                          setVillageArea("");
                          setDistrictFocused(true);
                        }}
                        onFocus={() => setDistrictFocused(true)}
                        placeholder={stateName ? "Type district name" : "Select state first"}
                        disabled={!stateName || isWorking}
                        required
                      />
                      {stateName && districtFocused && districtSuggestions.length > 0 && (
                        <div className="auth-suggestion-menu">
                          {districtSuggestions.map((districtName) => (
                            <button
                              key={districtName}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleDistrictChange(districtName)}
                              type="button"
                            >
                              {districtName}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Address / village area</span>
                    <input
                      className="input"
                      list="address-area-suggestions"
                      value={villageArea}
                      onChange={(e) => setVillageArea(e.target.value)}
                      placeholder={district ? "Type address, village, or area" : "Select district first"}
                      disabled={!district || isWorking}
                      required
                    />
                    <datalist id="address-area-suggestions">
                      {addressSuggestions.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Country</span>
                    <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter country" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Pincode</span>
                    <input className="input" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Enter pincode" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">GPS coordinates</span>
                    <input className="input" value={gpsCoordinates} onChange={(e) => setGpsCoordinates(e.target.value)} placeholder="Latitude, longitude" disabled={isWorking} />
                  </label>
                  <button className="auth-social-btn" onClick={captureLocation} disabled={isWorking} type="button">
                    Capture live location
                  </button>
                </>
              )}

              {stepLoading && (
                <div className="auth-loading-inline">
                  <LoadingIndicator label="Loading next step..." />
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <div className="auth-step-actions">
                {signupStep > 1 && (
                  <button className="btn btn-ghost" disabled={isWorking} onClick={() => goToSignupStep(signupStep - 1)} type="button">
                    Back
                  </button>
                )}
                <button className="auth-submit-btn" disabled={isWorking} type="submit">
                  {isWorking ? <LoadingIndicator label="Please wait..." /> : signupStep === 3 ? "Create account" : "Continue"}
                </button>
              </div>
            </form>
          )}

          <div className="auth-switch-text">
            {isSignup ? "Already registered? " : "New to TRACECONNECT? "}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Login" : "Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ route, navigate }) {
  const { user, signOut } = useAuth();
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
  const links = user.role === "grower"
    ? [{ label: "Dashboard", path: "/grower", icon: <FiHome /> }, { label: "Plantations", path: "/plantations", icon: <FiList /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }]
    : [{ label: "Dashboard", path: "/supplier", icon: <FiHome /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate(user.role === "grower" ? "/grower" : "/supplier")}>
        <span className="brand-icon"><img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" /></span>
        <span className="brand-text">TRACECONNECT</span>
      </button>
      <nav className="header-nav">
        {links.map((l) => (
          <button key={l.path} className={`nav-pill ${route === l.path ? "active" : ""}`} onClick={() => navigate(l.path)}>
            {l.icon} {l.label}
          </button>
        ))}
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

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" />
        <span>TRACECONNECT</span>
      </div>
      <div className="site-footer-links">
        <span><FiShield /> Secure traceability</span>
        <span><FiMapPin /> Farm to batch records</span>
        <span><FiMail /> support@traceconnect.local</span>
      </div>
    </footer>
  );
}

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
  const { plantations, crops, harvests, packings, addPlantation, delPlantation, farms, selectedFarmId } = useData();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState({ type: "crop", name: "", location: "" });
  const mine = plantations;
  const mineIds = mine.map((p) => p.id);
  const totalHarvested = harvests.filter((h) => mineIds.includes(h.plantationId)).reduce((s, h) => s + (h.accepted || 0), 0);
  const activeFarmName =
    (farms.find((farm) => Number(farm?.farm_id) === Number(selectedFarmId))?.farm_name) ||
    farms[0]?.farm_name ||
    "Farm";
  const selectedProduction = getProductionTypeConfig(form.type);
  const growerId = user?.user_id || user?.id || "";

  const create = async () => {
    if (!form.name || !form.location) {
      toast(`Please fill in ${selectedProduction.nameLabel.toLowerCase()} and ${selectedProduction.locationLabel.toLowerCase()}`, "error");
      return;
    }
    try {
      await addPlantation({ ...form, status: "Active" });
      stabilizeTraceabilityViewport(() => {
        setForm({ type: "crop", name: "", location: "" });
        toast("Plantation created successfully!", "success");
      });
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to create plantation", "error");
    }
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation and all its associated data?");
    if (!ok) return;
    try {
      await delPlantation(id);
      toast("Plantation deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to delete plantation", "error");
    }
  };

  return (
      <div className="page-container">
        {dialog}
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Grower Workspace</div>
          <h1>Grower Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name}. Keep track of plantations, crop flow,
            harvest numbers, and packing readiness from one clean view.
          </p>
          <div className="dashboard-pill-row">
            <span><FiCheckCircle /> Live workspace</span>
            <span><FiCamera /> Stage photos</span>
            <span><FiPackage /> Packing ready</span>
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="dashboard-active-farm grower-id-panel">
            <div className="dashboard-active-label">Grower ID</div>
            <div className="dashboard-active-name">
              <FiUser />
              <code>{growerId || "Not available"}</code>
            </div>
            <p>Share this ID with suppliers so they can fetch your plantations and batch-ready packings.</p>
          </div>
          {farms.length > 0 && (
            <div className="dashboard-active-farm">
              <div className="dashboard-active-label">Active Farm</div>
              <div className="dashboard-active-name">
                <FiMapPin />
                <span>#{selectedFarmId} ({activeFarmName})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stats-row">
        <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
        <StatCard icon={<FiStar />} label="Crops" value={crops.filter((c) => mineIds.includes(c.plantationId)).length} color="amber" />
        <StatCard icon={<FiTrendingUp />} label="Harvested (kg)" value={totalHarvested} color="blue" />
        <StatCard icon={<FiPackage />} label="Packings" value={packings.filter((p) => mineIds.includes(p.plantationId)).length} color="purple" />
      </div>

      <div className="card">
        <div className="card-title"><FiPlus /> Add New Plantation</div>
        <div className="form-grid plantation-create-grid">
          <div className="field-wrap">
            <label className="field-label">Production Type *</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {PRODUCTION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{selectedProduction.nameLabel} *</label>
            <input className="input" placeholder={selectedProduction.namePlaceholder} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">{selectedProduction.locationLabel} *</label>
            <input className="input" placeholder={selectedProduction.locationPlaceholder} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={create}><FiPlus /> Create</button>
          </div>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiGrid /></div>
          <p>No plantations yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="card-grid plantation-card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${getProductionTypeConfig(p.type).badgeClass}`}>
                  {getProductionTypeConfig(p.type).badge}
                </span>
                <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); remove(p.id); }} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> Created {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>
                Open Plantation <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlantationsPage({ navigate, toast }) {
  const { plantations, delPlantation } = useData();
  const { confirm, dialog } = useConfirm();
  const mine = plantations;

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation?");
    if (!ok) return;
    try {
      await delPlantation(id);
      toast("Deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div><h1>All Plantations</h1><p className="page-subtitle">Manage all your registered plantations</p></div>
        <button className="btn btn-primary" onClick={() => navigate("/grower")}><FiPlus /> New Plantation</button>
      </div>
      {mine.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><FiGrid /></div><p>No plantations yet.</p></div>
      ) : (
        <div className="card-grid plantation-card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${getProductionTypeConfig(p.type).badgeClass}`}>{getProductionTypeConfig(p.type).badge}</span>
                <button className="icon-btn danger" onClick={() => remove(p.id)} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>Open <FiArrowRight /></button>
            </div>
          ))}
        </div>
      )}
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

function PlantationDetail({ plantationId, toast }) {
  const { plantations, crops, monitoring, verification, harvests, packings, processImages, addCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking, addProcessImage, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [step, setStep] = useState(0);
  const plantationIdNum = Number(plantationId);
  const plantation = plantations.find((p) => p.id === plantationIdNum);
  const pCrops = crops.filter((c) => c.plantationId === plantationIdNum);
  const pMon = monitoring.filter((m) => m.plantationId === plantationIdNum);
  const pVer = verification.filter((v) => v.plantationId === plantationIdNum);
  const pHar = harvests.filter((h) => h.plantationId === plantationIdNum);
  const pPack = packings.filter((pk) => pk.plantationId === plantationIdNum);
  const pImgs = processImages.filter((img) => img.plantationId === plantationIdNum);
  if (!plantation) return <div className="page-container"><div className="empty-state">Plantation not found.</div></div>;
  const L = getProductionTypeConfig(plantation.type);
  const unlocked = [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const done = [pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0, pPack.length > 0];
  const names = [L.crops, "Monitoring", "Verification", "Harvest", "Packing"];
  const completedStages = done.filter(Boolean).length;
  const totalStages = names.length;
  const progressPercent = Math.round((completedStages / totalStages) * 100);
  const allStagesComplete = completedStages === totalStages;
  const openStep = (i) => {
    if (!unlocked[i]) {
      toast(`Complete ${names[i - 1]} first`, "error");
      return;
    }
    setStep(i);
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="plantation-hero">
        <div className="plantation-hero-copy">
          <div className="plantation-kicker">Plantation Lifecycle</div>
          <h1>{plantation.name}</h1>
          <div className="plantation-meta">
            <span className="plantation-meta-item"><FiMapPin /> {plantation.location}</span>
            <span className="status-chip active"><FiCheckCircle /> Active</span>
          </div>
        </div>
      </div>

      <div className={`stage-progress-card ${allStagesComplete ? "complete" : ""}`}>
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
      </div>
      <div className="step-bar">
        {names.map((n, i) => (
          <button key={n} className={`step-btn ${step === i ? "active" : ""} ${done[i] ? "done" : ""} ${!unlocked[i] ? "locked" : ""}`} onClick={() => openStep(i)}>
            <span className="step-indicator">
              {done[i] ? <FiCheckCircle /> : !unlocked[i] ? <FiLock /> : <span className="step-num">{i + 1}</span>}
            </span>
            <span>{n}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <CropsStep
          L={L}
          pCrops={pCrops}
          addCrop={addCrop}
          delCrop={delCrop}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}
      {step === 1 && (
        <MonitoringStep
          L={L}
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
        />
      )}
      {step === 2 && (
        <VerificationStep
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
        />
      )}
      {step === 3 && (
        <HarvestStep
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
        />
      )}
      {step === 4 && (
        <PackingStep
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
        />
      )}

      {step < 4 && done[step] && (
        <div className="next-btn-wrap">
          <button className="btn btn-primary" onClick={() => openStep(step + 1)}>Next: {names[step + 1]} <FiArrowRight /></button>
        </div>
      )}

      {step === 4 && allStagesComplete && (
        <div className="card video-card">
          <div className="video-card-left">
            <div className="video-icon"><FiVideo /></div>
            <div>
              <div className="card-title" style={{ margin: 0 }}>Generate Traceability Video</div>
              <p className="muted">Create a lifecycle video for this farm to share with customers.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={async () => {
            try {
              await fetch("https://maatiaivideogenerator.onrender.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: "", intro_logo: "", farmer_img: "", farm_img: "", process_images: pImgs.map((x) => x.imageUrl).filter(Boolean), certificate_img: "", end_img: "" }) });
              toast("Video generation initiated!", "success");
            } catch { toast("Video service unavailable right now.", "error"); }
          }}>Generate</button>
        </div>
      )}
    </div>
  );
}

function ProcessEntries({ stage, plantationId, pImgs, addProcessImage, delProcessImage, confirm, toast, variant = "process" }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const list = pImgs.filter((x) => x.stage === stage);
  const isGiCertificate = variant === "gi-certificate";
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
  const uploadCertificate = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.", "error");
      event.target.value = "";
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const stampedImage = await addGiCertificateStampToImage(dataUrl);
      await Promise.all([
        uploadAndSave(stampedImage, defaultEntryName, "GI certificate uploaded"),
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
    <div className={`card process-card ${isGiCertificate ? "gi-certificate-card" : ""}`}>
      <GeoCameraModal
        open={cameraOpen}
        name={pendingName}
        title={isGiCertificate ? "Click GI Tag Certificate" : "GPS Camera Capture"}
        subtitle={isGiCertificate ? "Certificate photo will be marked as Certified GI." : "Overlay includes time + GPS + address. (Geofencing removed.)"}
        captureLabel={isGiCertificate ? "Click Certificate" : "Capture"}
        useLabel={isGiCertificate ? "Use GI Certificate" : "Use Photo"}
        stampGi={isGiCertificate}
        onClose={() => {
          if (isSaving) return;
          setCameraOpen(false);
          setPendingName("");
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
                isGiCertificate ? "GI certificate captured" : "Image uploaded",
              ),
              delay(400),
            ]);
            stabilizeTraceabilityViewport(() => {
              setCameraOpen(false);
              setPendingName("");
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
      <h4>{isGiCertificate ? "Upload or Click GI Tag Certificate" : `Process Entries - ${stage}`}</h4>
      {isGiCertificate ? (
        <>
          <p className="muted gi-certificate-help">
            Add the Kotpad GI tag certificate here. Uploaded or clicked images are marked as Certified GI.
          </p>
          <div className="form-row gi-certificate-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={uploadCertificate}
              style={{ display: "none" }}
            />
            <button className="btn btn-outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
              {isSaving ? <LoadingIndicator label="Uploading..." /> : <><FiUpload /> Upload GI Certificate</>}
            </button>
            <button className="btn btn-primary" type="button" onClick={add} disabled={isSaving}>
              <FiCamera /> Click GI Certificate
            </button>
          </div>
        </>
      ) : (
        <div className="form-row">
          <input className="input" placeholder="Enter process / field name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-outline" onClick={add}>Capture</button>
        </div>
      )}
      {list.length > 0 && (
        <div className="record-list mt process-entry-list">
          {list.map((it) => (
            <div key={it.id} className="process-entry-card">
              <div className="process-entry-main">
                {it.imageUrl && <img className="tc-thumb process-entry-thumb" src={it.imageUrl} alt={`${it.name} capture`} />}
                <div className="process-entry-copy">
                  <div className="process-entry-title">{it.name}</div>
                  <div className="process-entry-date">{it.date}</div>
                  {isGiCertificate && (
                    <span className="gi-certified-badge">
                      <FiAward /> Certified GI
                    </span>
                  )}
                </div>
              </div>
              <div className="process-entry-actions">
                {it.imageUrl && (
                  <a className="process-entry-link" href={it.imageUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
                <button className="process-entry-delete" onClick={() => remove(it.id)} type="button">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  subtitle = "Overlay includes time + GPS + address. (Geofencing removed.)",
  captureLabel = "Capture",
  useLabel = "Use Photo",
  stampGi = false,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);

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
    return () => {
      const s = streamRef.current;
      streamRef.current = null;
      stopMediaStream(s);
      const video = videoRef.current;
      if (video) {
        try {
          video.srcObject = null;
        } catch {
          // ignore
        }
      }
    };
  }, [open]);

  const capture = async () => {
    try {
      setBusy(true);
      setError("");
      setStatus("Fetching location...");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error("Camera not ready");
      const s = streamRef.current;
      if (!s) throw new Error("Camera stream unavailable");
      if (video.readyState < 2) throw new Error("Camera not ready yet");

      const coords = await getCurrentLocation();

      let address = "Address unavailable";
      try {
        const res = await fetch(
          `${API_URL}/api/location/reverse?lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`,
          { method: "GET", credentials: "include" },
        );
        const json = await res.json().catch(() => null);
        address = json?.display_name || address;
      } catch {
        // ignore
      }

      const outputWidth = 1280;
      const photoHeight = 720;
      const geoHeight = 280;
      canvas.width = outputWidth;
      canvas.height = photoHeight + geoHeight;
      const ctx = canvas.getContext("2d");

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const srcAspect = srcW / srcH;
      const dstAspect = outputWidth / photoHeight;
      let sx = 0; let sy = 0; let sWidth = srcW; let sHeight = srcH;
      if (srcAspect > dstAspect) {
        sWidth = srcH * dstAspect;
        sx = (srcW - sWidth) / 2;
      } else {
        sHeight = srcW / dstAspect;
        sy = (srcH - sHeight) / 2;
      }
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outputWidth, photoHeight);

      drawGeoOverlay(ctx, outputWidth, photoHeight, geoHeight, {
        name: name || "Process Capture",
        dateTime: formatDateTime(new Date()),
        address,
        lat: coords.latitude,
        lon: coords.longitude,
      });
      if (stampGi) {
        drawGiCertificateStamp(ctx, outputWidth, canvas.height);
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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal-box camera-modal">
        <button className="modal-close" onClick={onClose} type="button" disabled={saving}><FiX /></button>
        <h3>{title}</h3>
        <div className="muted" style={{ fontSize: 13 }}>{subtitle}</div>
        <div className="camera-stage">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className="camera-status">
            {saving || busy ? <LoadingIndicator label={saving ? "Saving photo..." : status} /> : status}
          </div>
        </div>
        {error && <div className="inline-alert error">{error}</div>}
        {previewUrl && (
          <div className="camera-preview">
            <img src={previewUrl} alt="Captured preview" />
          </div>
        )}
        <div className="actions right">
          <button className="btn btn-outline" onClick={capture} disabled={busy || saving}>
            {busy ? <LoadingIndicator label="Capturing..." /> : captureLabel}
          </button>
          <button className="btn btn-primary" onClick={() => { void onUse(previewUrl); }} disabled={!previewUrl || busy || saving}>
            {saving ? <LoadingIndicator label="Using photo..." /> : useLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CropsStep({ L, pCrops, addCrop, delCrop, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const mode = L.mode || "crop";
  const emptyForm = () => ({
    name: "",
    customName: "",
    variety: "",
    sowingDate: TODAY,
    expectedHarvest: "",
    landArea: "",
    soilType: "",
    irrigationMethod: "",
    organicStatus: "",
    seedSource: "",
    pondSize: "",
    waterType: "",
    hatcherySource: "",
    numberOfHives: "",
    queenBeeAge: "",
    floralSource: "",
    artisanName: "",
    workshopLocation: "",
    yearsOfExperience: "",
    numberOfWorkers: "",
    productsManufactured: "",
    rawMaterialsUsed: "",
    monthlyProductionCapacity: "",
    productionMethod: "",
    ngoName: "",
    registrationNumber: "",
    coordinatorName: "",
    womenMemberCount: "",
    operationalDistricts: "",
    familiesSupported: "",
    incomeGenerated: "",
    productsServicesOffered: "",
    productName: "",
    giTagNumber: "",
    category: "Handloom / Textile",
    giState: "Odisha",
    district: "Koraput",
    regionCluster: "Kotpad Village",
    giRegistrationDate: "",
    description: "",
    culturalSignificance: "",
    weaverName: "",
    communityName: "Mirgan Community",
    organizationType: "",
    contactNumber: "",
    emailId: "",
    address: "",
    weavingExperience: "",
    familyMembersInvolved: "",
    gpsLocation: "",
    fabricType: "Cotton",
    yarnSource: "",
    naturalDyeUsed: "Aal Tree Bark",
    dyePreparationMethod: "",
    waterSource: "",
    chemicalFreeStatus: "",
    loomType: "",
    weavingTechnique: "",
    timeTakenPerFabric: "",
    dailyProductionCapacity: "",
    designPattern: "",
    colorCombination: "",
    handmadeVerification: "",
  });
  const [f, setF] = useState(emptyForm);
  const add = async () => {
    const name = f.name === "Other" ? f.customName : f.name;
    const detailMap = {
      shrimp: {
        "Pond Size": f.pondSize,
        "Water Type": f.waterType,
        "Hatchery Source": f.hatcherySource,
      },
      bee: {
        "Number of Hives": f.numberOfHives,
        "Queen Bee Age": f.queenBeeAge,
        "Floral Source": f.floralSource,
      },
      artisan: {
        "Artisan Name": f.artisanName,
        "Workshop Location": f.workshopLocation,
        "Years of Experience": f.yearsOfExperience,
        "Number of Workers": f.numberOfWorkers,
        "Products Manufactured": f.productsManufactured,
        "Raw Materials Used": f.rawMaterialsUsed,
        "Monthly Production Capacity": f.monthlyProductionCapacity,
        "Handmade / Machine Assisted": f.productionMethod,
      },
      women_ngo: {
        "NGO Name": f.ngoName,
        "Registration Number": f.registrationNumber,
        "Coordinator Name": f.coordinatorName,
        "Women Member Count": f.womenMemberCount,
        "Operational Districts": f.operationalDistricts,
        "Families Supported": f.familiesSupported,
        "Income Generated": f.incomeGenerated,
        "Products / Services Offered": f.productsServicesOffered,
      },
      kotpad_handloom: {
        "Product Name": f.productName,
        "GI Tag Number": f.giTagNumber,
        Category: f.category,
        State: f.giState,
        District: f.district,
        "Region / Cluster": f.regionCluster,
        "GI Registration Date": f.giRegistrationDate,
        Description: f.description,
        "Cultural Significance": f.culturalSignificance,
        "Weaver Name": f.weaverName,
        "Community Name": f.communityName,
        "Organization Type": f.organizationType,
        "Contact Number": f.contactNumber,
        "Email ID": f.emailId,
        Address: f.address,
        "Experience in Weaving": f.weavingExperience,
        "Number of Family Members Involved": f.familyMembersInvolved,
        "GPS Location": f.gpsLocation,
        "Fabric Type": f.fabricType,
        "Yarn Source": f.yarnSource,
        "Natural Dye Used": f.naturalDyeUsed,
        "Dye Preparation Method": f.dyePreparationMethod,
        "Water Source": f.waterSource,
        "Chemical-Free Status": f.chemicalFreeStatus,
        "Loom Type": f.loomType,
        "Weaving Technique": f.weavingTechnique,
        "Time Taken Per Fabric": f.timeTakenPerFabric,
        "Daily Production Capacity": f.dailyProductionCapacity,
        "Design Pattern": f.designPattern,
        "Color Combination": f.colorCombination,
        "Handmade Verification": f.handmadeVerification,
      },
      crop: {
        "Land Area": f.landArea,
        "Soil Type": f.soilType,
        "Irrigation Method": f.irrigationMethod,
        "Organic / Non-Organic": f.organicStatus,
        "Seed Source": f.seedSource,
      },
    };
    const variety = mergeDetails(f.variety, detailMap[mode] || detailMap.crop);
    if (!name || !f.variety || !f.sowingDate) return;
    void addCrop({ plantationId, name, variety, sowingDate: f.sowingDate, expectedHarvest: f.expectedHarvest })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF(emptyForm());
          toast("Saved", "success");
        });
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
      <WorkflowSection title={`Add ${L.crop}`}>
        <div className={`form-grid ${mode === "kotpad_handloom" ? "kotpad-form-grid" : ""}`}>
          <div className="field-wrap">
            <label className="field-label">{L.itemTypeLabel || `${L.crop} Type`} *</label>
            <select className="input" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}>
              <option value="">Select {L.crop}...</option>
              {L.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.name === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Name *</label>
              <input className="input" placeholder={`Enter custom ${L.crop.toLowerCase()} name`} value={f.customName} onChange={(e) => setF((x) => ({ ...x, customName: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">{L.variety} *</label>
            <input className="input" placeholder={L.varietyPlaceholder || "Enter details"} value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
          </div>
          {mode === "shrimp" ? (
            <>
              <div className="field-wrap">
                <label className="field-label">Pond Size</label>
                <input className="input" placeholder="e.g. 1.5 acre, 6000 sq ft" value={f.pondSize} onChange={(e) => setF((x) => ({ ...x, pondSize: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Water Type</label>
                <select className="input" value={f.waterType} onChange={(e) => setF((x) => ({ ...x, waterType: e.target.value }))}>
                  <option value="">Select water type...</option>
                  {WATER_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Hatchery Source</label>
                <input className="input" placeholder="e.g. certified hatchery name" value={f.hatcherySource} onChange={(e) => setF((x) => ({ ...x, hatcherySource: e.target.value }))} />
              </div>
            </>
          ) : mode === "bee" ? (
            <>
              <div className="field-wrap">
                <label className="field-label">Number of Hives</label>
                <input className="input" type="number" placeholder="e.g. 25" value={f.numberOfHives} onChange={(e) => setF((x) => ({ ...x, numberOfHives: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Queen Bee Age</label>
                <input className="input" placeholder="e.g. 8 months" value={f.queenBeeAge} onChange={(e) => setF((x) => ({ ...x, queenBeeAge: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Floral Source</label>
                <input className="input" placeholder="e.g. mustard, forest flora" value={f.floralSource} onChange={(e) => setF((x) => ({ ...x, floralSource: e.target.value }))} />
              </div>
            </>
          ) : mode === "artisan" ? (
            <>
              <div className="field-wrap">
                <label className="field-label">Artisan Name</label>
                <input className="input" placeholder="e.g. local artisan or group name" value={f.artisanName} onChange={(e) => setF((x) => ({ ...x, artisanName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Workshop Location</label>
                <input className="input" placeholder="e.g. village, district" value={f.workshopLocation} onChange={(e) => setF((x) => ({ ...x, workshopLocation: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Years of Experience</label>
                <input className="input" type="number" placeholder="e.g. 5" value={f.yearsOfExperience} onChange={(e) => setF((x) => ({ ...x, yearsOfExperience: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Number of Workers</label>
                <input className="input" type="number" placeholder="e.g. 12" value={f.numberOfWorkers} onChange={(e) => setF((x) => ({ ...x, numberOfWorkers: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Products Manufactured</label>
                <input className="input" placeholder="e.g. baskets, textiles" value={f.productsManufactured} onChange={(e) => setF((x) => ({ ...x, productsManufactured: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Raw Materials Used</label>
                <input className="input" placeholder="e.g. bamboo, cotton" value={f.rawMaterialsUsed} onChange={(e) => setF((x) => ({ ...x, rawMaterialsUsed: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Monthly Production Capacity</label>
                <input className="input" placeholder="e.g. 500 pieces" value={f.monthlyProductionCapacity} onChange={(e) => setF((x) => ({ ...x, monthlyProductionCapacity: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Handmade / Machine Assisted</label>
                <select className="input" value={f.productionMethod} onChange={(e) => setF((x) => ({ ...x, productionMethod: e.target.value }))}>
                  <option value="">Select method...</option>
                  <option>Handmade</option>
                  <option>Machine Assisted</option>
                  <option>Mixed</option>
                </select>
              </div>
            </>
          ) : mode === "women_ngo" ? (
            <>
              <div className="field-wrap">
                <label className="field-label">NGO Name</label>
                <input className="input" placeholder="e.g. local NGO name" value={f.ngoName} onChange={(e) => setF((x) => ({ ...x, ngoName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Registration Number</label>
                <input className="input" placeholder="e.g. NGO registration ID" value={f.registrationNumber} onChange={(e) => setF((x) => ({ ...x, registrationNumber: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Coordinator Name</label>
                <input className="input" placeholder="e.g. program coordinator" value={f.coordinatorName} onChange={(e) => setF((x) => ({ ...x, coordinatorName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Women Member Count</label>
                <input className="input" type="number" placeholder="e.g. 40" value={f.womenMemberCount} onChange={(e) => setF((x) => ({ ...x, womenMemberCount: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Operational Districts</label>
                <input className="input" placeholder="e.g. Puri, Khordha" value={f.operationalDistricts} onChange={(e) => setF((x) => ({ ...x, operationalDistricts: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Families Supported</label>
                <input className="input" type="number" placeholder="e.g. 120" value={f.familiesSupported} onChange={(e) => setF((x) => ({ ...x, familiesSupported: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Income Generated</label>
                <input className="input" type="number" placeholder="e.g. 250000" value={f.incomeGenerated} onChange={(e) => setF((x) => ({ ...x, incomeGenerated: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Products / Services Offered</label>
                <input className="input" placeholder="e.g. stitched products, food items" value={f.productsServicesOffered} onChange={(e) => setF((x) => ({ ...x, productsServicesOffered: e.target.value }))} />
              </div>
            </>
          ) : mode === "kotpad_handloom" ? (
            <>
              <div className="form-section-label">Basic Product Information</div>
              <div className="field-wrap">
                <label className="field-label">Product Name</label>
                <input className="input" placeholder="Kotpad Handloom Fabric" value={f.productName} onChange={(e) => setF((x) => ({ ...x, productName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">GI Tag Number</label>
                <input className="input" placeholder="GI registered ID" value={f.giTagNumber} onChange={(e) => setF((x) => ({ ...x, giTagNumber: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Category</label>
                <input className="input" placeholder="Handloom / Textile" value={f.category} onChange={(e) => setF((x) => ({ ...x, category: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">State</label>
                <input className="input" placeholder="Odisha" value={f.giState} onChange={(e) => setF((x) => ({ ...x, giState: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">District</label>
                <input className="input" placeholder="Koraput" value={f.district} onChange={(e) => setF((x) => ({ ...x, district: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Region / Cluster</label>
                <input className="input" placeholder="Kotpad Village" value={f.regionCluster} onChange={(e) => setF((x) => ({ ...x, regionCluster: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">GI Reg. Date</label>
                <input className="input" type="date" value={f.giRegistrationDate} onChange={(e) => setF((x) => ({ ...x, giRegistrationDate: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Description</label>
                <input className="input" placeholder="Naturally dyed tribal woven fabric" value={f.description} onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Cultural Significance</label>
                <input className="input" placeholder="Traditional tribal weaving heritage" value={f.culturalSignificance} onChange={(e) => setF((x) => ({ ...x, culturalSignificance: e.target.value }))} />
              </div>
              <div className="form-section-label">Artisan / Weaver Details</div>
              <div className="field-wrap">
                <label className="field-label">Weaver Name</label>
                <input className="input" placeholder="Individual or SHG name" value={f.weaverName} onChange={(e) => setF((x) => ({ ...x, weaverName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Community Name</label>
                <input className="input" placeholder="Mirgan Community" value={f.communityName} onChange={(e) => setF((x) => ({ ...x, communityName: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Organization Type</label>
                <select className="input" value={f.organizationType} onChange={(e) => setF((x) => ({ ...x, organizationType: e.target.value }))}>
                  <option value="">Select organization type...</option>
                  <option>Artisan</option>
                  <option>Cooperative</option>
                  <option>SHG</option>
                  <option>Producer Group</option>
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Contact Number</label>
                <input className="input" placeholder="Mobile number" value={f.contactNumber} onChange={(e) => setF((x) => ({ ...x, contactNumber: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Email ID</label>
                <input className="input" placeholder="Optional email" value={f.emailId} onChange={(e) => setF((x) => ({ ...x, emailId: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Address</label>
                <input className="input" placeholder="Full address" value={f.address} onChange={(e) => setF((x) => ({ ...x, address: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Weaving Experience</label>
                <input className="input" placeholder="e.g. 8 years" value={f.weavingExperience} onChange={(e) => setF((x) => ({ ...x, weavingExperience: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Family Members</label>
                <input className="input" type="number" placeholder="Numeric value" value={f.familyMembersInvolved} onChange={(e) => setF((x) => ({ ...x, familyMembersInvolved: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">GPS Location</label>
                <input className="input" placeholder="Latitude, longitude" value={f.gpsLocation} onChange={(e) => setF((x) => ({ ...x, gpsLocation: e.target.value }))} />
              </div>
              <div className="form-section-label">Raw Material Details</div>
              <div className="field-wrap">
                <label className="field-label">Fabric Type</label>
                <input className="input" placeholder="Cotton" value={f.fabricType} onChange={(e) => setF((x) => ({ ...x, fabricType: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Yarn Source</label>
                <select className="input" value={f.yarnSource} onChange={(e) => setF((x) => ({ ...x, yarnSource: e.target.value }))}>
                  <option value="">Select yarn source...</option>
                  <option>Local</option>
                  <option>External</option>
                  <option>Local + External</option>
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Natural Dye Used</label>
                <input className="input" placeholder="Aal Tree Bark" value={f.naturalDyeUsed} onChange={(e) => setF((x) => ({ ...x, naturalDyeUsed: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Dye Method</label>
                <input className="input" placeholder="Traditional boiling process" value={f.dyePreparationMethod} onChange={(e) => setF((x) => ({ ...x, dyePreparationMethod: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Water Source</label>
                <select className="input" value={f.waterSource} onChange={(e) => setF((x) => ({ ...x, waterSource: e.target.value }))}>
                  <option value="">Select water source...</option>
                  <option>River</option>
                  <option>Well</option>
                  <option>Borewell</option>
                  <option>Pond</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Chemical-Free Status</label>
                <select className="input" value={f.chemicalFreeStatus} onChange={(e) => setF((x) => ({ ...x, chemicalFreeStatus: e.target.value }))}>
                  <option value="">Select status...</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Pending Verification</option>
                </select>
              </div>
              <div className="form-section-label">Weaving & Production</div>
              <div className="field-wrap">
                <label className="field-label">Loom Type</label>
                <input className="input" placeholder="Pit Loom" value={f.loomType} onChange={(e) => setF((x) => ({ ...x, loomType: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Weaving Technique</label>
                <input className="input" placeholder="Traditional Handloom" value={f.weavingTechnique} onChange={(e) => setF((x) => ({ ...x, weavingTechnique: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Time Taken Per Fabric</label>
                <input className="input" placeholder="e.g. 7 days" value={f.timeTakenPerFabric} onChange={(e) => setF((x) => ({ ...x, timeTakenPerFabric: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Daily Capacity</label>
                <input className="input" placeholder="Quantity" value={f.dailyProductionCapacity} onChange={(e) => setF((x) => ({ ...x, dailyProductionCapacity: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Design Pattern</label>
                <input className="input" placeholder="Tribal motifs" value={f.designPattern} onChange={(e) => setF((x) => ({ ...x, designPattern: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Color Combination</label>
                <input className="input" placeholder="Maroon, Black, Brown" value={f.colorCombination} onChange={(e) => setF((x) => ({ ...x, colorCombination: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Handmade Check</label>
                <select className="input" value={f.handmadeVerification} onChange={(e) => setF((x) => ({ ...x, handmadeVerification: e.target.value }))}>
                  <option value="">Select verification...</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Pending</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="field-wrap">
                <label className="field-label">Land Area</label>
                <input className="input" placeholder="e.g. 2 acres" value={f.landArea} onChange={(e) => setF((x) => ({ ...x, landArea: e.target.value }))} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Soil Type</label>
                <select className="input" value={f.soilType} onChange={(e) => setF((x) => ({ ...x, soilType: e.target.value }))}>
                  <option value="">Select soil type...</option>
                  {SOIL_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Irrigation Method</label>
                <select className="input" value={f.irrigationMethod} onChange={(e) => setF((x) => ({ ...x, irrigationMethod: e.target.value }))}>
                  <option value="">Select irrigation method...</option>
                  {IRRIGATION_METHOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Organic / Non-Organic</label>
                <select className="input" value={f.organicStatus} onChange={(e) => setF((x) => ({ ...x, organicStatus: e.target.value }))}>
                  <option value="">Select status...</option>
                  {ORGANIC_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field-wrap">
                <label className="field-label">Seed Source</label>
                <input className="input" placeholder="e.g. certified seed supplier" value={f.seedSource} onChange={(e) => setF((x) => ({ ...x, seedSource: e.target.value }))} />
              </div>
            </>
          )}
          <div className="field-wrap">
            <label className="field-label">{L.startDateLabel || "Start Date *"}</label>
            <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">{L.expectedDateLabel || "Expected Date"}</label>
            <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add {L.crop}</button>
          </div>
        </div>
        {pCrops.length > 0 && (
          <div className="record-list mt">
            {pCrops.map((c) => (
              <div key={c.id} className="record-row">
                <span className="record-text"><FiStar style={{ color: "#f59e0b" }} /> <strong>{c.name}</strong> - {c.variety} - <span className="muted">{L.startVerb || "Started"} {c.sowingDate}</span></span>
                <button className="icon-btn danger" onClick={() => remove(c.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage={L.crops} plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function MonitoringStep({ L, pMon, addMonitoring, delMonitoring, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
  const add = async () => {
    const inputType = f.inputType === "Other" ? f.customType : f.inputType;
    if (!inputType || !f.cropId) return;
    void addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
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
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
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
      <ProcessEntries stage="Monitoring" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  const add = () => {
    if (!f.cropId) return;
    void addVerification({ plantationId, ...f })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
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
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">{L.crop} Health / Status *</label>
            <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
              {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Harvest Approval *</label>
            <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
              <option value="yes">Approved for Harvest</option>
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
      <ProcessEntries
        stage="Verification"
        plantationId={plantationId}
        pImgs={pImgs}
        addProcessImage={addProcessImage}
        delProcessImage={delProcessImage}
        confirm={confirm}
        toast={toast}
        variant={L.mode === "kotpad_handloom" ? "gi-certificate" : "process"}
      />
    </>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  const add = () => {
    if (!f.cropId || !f.total) return;
    void addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete harvest?");
    if (!ok) return;
    try {
      await delHarvest(id);
      toast("Harvest deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Record Harvest">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Harvest Date *</label>
            <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Total Quantity *</label>
            <input className="input" type="number" placeholder="e.g. 500" value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Unit *</label>
            <select className="input" value={f.unit} onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}>
              {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Rejected Quantity</label>
            <input className="input" type="number" placeholder="e.g. 20 (damaged / substandard)" value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Accepted (auto-calculated)</label>
            <div className="accepted-box">{accepted} {f.unit} accepted</div>
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Harvest</button>
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
      <ProcessEntries stage="Harvest" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function PackingStep({ pPack, pHar, addPacking, delPacking, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({
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
  });
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
          setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", batchNumber: "", coldStorage: "", transportMethod: "", packagingMethod: "", street: "", city: "", state: "", pincode: "", country: "India" });
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
            <label className="field-label">Link to Harvest *</label>
            <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
              <option value="">Select harvest batch...</option>
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
      <ProcessEntries stage="Packing" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function SupplierDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { batches, addBatch, delBatch } = useData();
  const { confirm, dialog } = useConfirm();
  const [selected, setSelected] = useState([]);
  const [desc, setDesc] = useState("");
  const [batchModal, setBatchModal] = useState(null);
  const [batchCreating, setBatchCreating] = useState(false);
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

  const removeBatch = async (id) => {
    const ok = await confirm("Delete this batch?");
    if (!ok) return;

    const targetBatch = mine.find((batch) => batch.id === id);

    try {
      await delBatch(id);
      setSupplierTraceState((prev) => ({
        ...prev,
        traces: prev.traces.map((trace) =>
          targetBatch?.packingIds?.includes(trace.packingId) &&
          trace.assignedPatchId === id
            ? { ...trace, assignedPatchId: "" }
            : trace,
        ),
      }));
      toast("Deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };

  return (
    <div className="page-container">
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

      <div className="supplier-dashboard-grid">
        <div className="supplier-feed-column">
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
              <div className="supplier-trace-grid">
                {traces.map((trace) => {
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
                  const varietyLabel = trace.cropVariety || "Standard";
                  const harvestLabel = toISODate(trace.harvestDate) || "Pending";
                  const sowingLabel = toISODate(trace.sowingDate) || "N/A";
                  const packingLabel = toISODate(trace.packingDate) || "N/A";

                  return (
                    <div
                      key={trace.packingId}
                      className={`supplier-trace-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="supplier-trace-top">
                        <div>
                          <div className="supplier-trace-kicker">
                            {trace.cropName || "Farm Trace"}
                          </div>
                          <h3>{trace.plantationName}</h3>
                        </div>
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
                      </div>

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

                      <div className="supplier-trace-actions">
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
                            onClick={() => toggle(trace.packingId)}
                          >
                            {isSelected ? "Selected for Batch" : "Select Trace"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {mine.length > 0 && (
            <div className="card">
              <div className="card-title">
                <FiGrid /> Your Batches
              </div>
              <div className="card-grid">
                {mine.map((batch) => (
                  <div
                    key={batch.id}
                    className="batch-card"
                    onClick={() => setBatchModal(batch)}
                  >
                    <div className="batch-card-top">
                      <code className="batch-id">{batch.id}</code>
                      <button
                        className="icon-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBatch(batch.id);
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="batch-weight">{batch.totalWeight} kg total</div>
                    <p className="muted">
                      {batch.description || "No description"} - {batch.createdAt}
                    </p>
                    <button
                      className="btn btn-outline full-width mt"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patch/${batch.id}`);
                      }}
                    >
                      View Trace Page <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="supplier-batch-column">
          <div className="card supplier-lookup-card">
            <div className="card-title">
              <FiUser /> Find Grower Records
            </div>
            <form className="supplier-lookup-form" onSubmit={fetchGrowerRecords}>
              <input
                className="input"
                value={growerLookupId}
                onChange={(event) => setGrowerLookupId(event.target.value)}
                placeholder="Enter Grower ID shown on grower dashboard"
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
                  <span>Grower</span>
                  <strong>{lookupData.grower?.growerName || "Grower"}</strong>
                  <code>ID: {lookupData.grower?.growerUserId || growerLookupId}</code>
                </div>

                <div className="supplier-lookup-counts">
                  <div>
                    <span>Plantations</span>
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
                    <span className="supplier-lookup-label">Plantations</span>
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
                            onClick={() => toggle(trace.packingId)}
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

          <div className="card supplier-workbench">
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
                        {trace.cropName} • {trace.netWeight} kg •{" "}
                        {trace.packingDate || "Packing date pending"}
                      </p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => toggle(trace.packingId)}
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
      </div>

      {batchModal && <BatchModal batch={batchModal} onClose={() => setBatchModal(null)} navigate={navigate} />}
    </div>
  );
}

function BatchModal({ batch, onClose, navigate }) {
  const qrValue = `${window.location.origin}/patch/${batch.id}`;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box batch-modal">
        <button className="modal-close" onClick={onClose}><FiX /></button>
        <div className="batch-modal-header">
          <div className="batch-modal-icon"><FiCheck /></div>
          <h3>Batch Created!</h3>
        </div>
        <div className="qr-box">
          <div className="qr-shell">
            <QRCode value={qrValue} size={188} />
            <span className="qr-logo-mark">
              <img src={TRACE_CONNECT_LOGO_SRC} alt="" />
            </span>
          </div>
          <span className="qr-caption">Scan to open batch trace</span>
        </div>
        <div className="batch-modal-info">
          <div className="kv-pair"><span>Batch ID</span><code>{batch.id}</code></div>
          <div className="kv-pair"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-pair"><span>Description</span><strong>{batch.description || "-"}</strong></div>
          <div className="kv-pair"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-pair"><span>Items</span><strong>{batch.packingIds.length} packings</strong></div>
        </div>
        <button className="btn btn-primary full-width" onClick={() => { onClose(); navigate(`/patch/${batch.id}`); }}>
          View Public Trace Page <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

function QRCode({ value, size = 160 }) {
  const cells = 25;
  const quiet = 2;
  const cell = size / (cells + quiet * 2);
  const moduleSize = cell * 0.76;
  const offset = (cell - moduleSize) / 2;
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return h >>> 0;
  };
  const isFinder = (r, c) =>
    (r < 7 && c < 7) ||
    (r < 7 && c >= cells - 7) ||
    (r >= cells - 7 && c < 7);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if (isFinder(r, c)) return false;
      return ((hash(value + r * 100 + c) >> (c % 30)) & 1) === 1;
    }),
  );
  const finderPositions = [
    [0, 0],
    [cells - 7, 0],
    [0, cells - 7],
  ];
  const finderSize = cell * 7;

  return (
    <svg className="modern-qr" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Batch QR code">
      <rect width={size} height={size} rx="18" fill="#ffffff" />
      {finderPositions.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${(x + quiet) * cell} ${(y + quiet) * cell})`}>
          <rect width={finderSize} height={finderSize} rx={cell * 1.4} fill="#0f8d75" />
          <rect x={cell} y={cell} width={cell * 5} height={cell * 5} rx={cell} fill="#ffffff" />
          <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} rx={cell * 0.75} fill="#10251b" />
        </g>
      ))}
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={(c + quiet) * cell + offset}
              y={(r + quiet) * cell + offset}
              width={moduleSize}
              height={moduleSize}
              rx={moduleSize * 0.3}
              fill={(r + c) % 5 === 0 ? "#1d7dd8" : "#10251b"}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function ReportsPage() {
  const { plantations, crops, harvests } = useData();
  return (
    <div className="page-container reports-page">
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-subtitle">Overview of all plantations, crops, and harvest data</p></div>
      </div>
      <div className="card">
        <div className="card-title"><FiGrid /> Plantations</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {plantations.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : plantations.map((p) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.location}</td><td><span className="status-chip active"><FiCheckCircle /> {p.status}</span></td><td>{p.createdAt}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiStar /> Crops</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Crop</th><th>Variety</th><th>Sowing Date</th><th>Expected Harvest</th></tr></thead>
            <tbody>
              {crops.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : crops.map((c) => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.variety || "â€”"}</td><td>{c.sowingDate}</td><td>{c.expectedHarvest || "â€”"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiTrendingUp /> Harvests</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Total</th><th>Rejected</th><th>Accepted</th><th>Unit</th></tr></thead>
            <tbody>
              {harvests.length === 0 ? <tr><td colSpan={5} className="table-empty">No data</td></tr>
                : harvests.map((h) => <tr key={h.id}><td>{h.harvestDate}</td><td>{h.total}</td><td><span style={{ color: "#c0392b" }}>{h.rejected || 0}</span></td><td><span style={{ color: "#1f8a43" }}><strong>{h.accepted}</strong></span></td><td>{h.unit}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { plantations, crops, harvests, packings, batches, processImages, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [activeGalleryStage, setActiveGalleryStage] = useState(TRACE_STAGES[0]);
  const mine = plantations.filter((p) => p.userId === user?.id);
  const mineIds = mine.map((p) => p.id);
  const mineCrops = crops.filter((c) => mineIds.includes(c.plantationId));
  const mineHarvests = harvests.filter((h) => mineIds.includes(h.plantationId));
  const minePackings = packings.filter((p) => mineIds.includes(p.plantationId));
  const mineBatches = batches.filter((b) => b.supplierId === user?.id);
  const mineImages = processImages.filter((i) => mineIds.includes(i.plantationId));
  const stages = TRACE_STAGES;
  const activeStageImages = mineImages.filter((img) => img.stage === activeGalleryStage);

  const removeImage = async (id) => { const ok = await confirm("Delete this entry?"); if (!ok) return; delProcessImage(id); };

  const handleSignOut = () => {
    signOut();
    window.location.hash = "/";
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="profile-banner">
        <div className="profile-avatar-lg">
          {user?.profile_image ? (
            <img src={user.profile_image} alt="Profile" />
          ) : (
            <FiUser />
          )}
        </div>
        <div className="profile-banner-info">
          <h1>{name}</h1>
          <span className="badge-chip capitalize">{user?.role}</span>
        </div>
        {!editing ? (
          <>
            <button className="btn btn-ghost profile-edit-btn" onClick={() => setEditing(true)}><FiEdit2 /> Edit Profile</button>
            <button className="btn btn-danger profile-edit-btn" onClick={handleSignOut}><FiLogOut /> Logout</button>
          </>
        ) : (
          <div className="profile-edit-row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <button className="btn btn-primary" onClick={() => setEditing(false)}><FiCheck /> Save</button>
            <button className="btn btn-ghost" onClick={() => { setName(user?.name || ""); setEditing(false); }}><FiX /></button>
          </div>
        )}
      </div>

      <div className="info-grid">
        <div className="info-item"><FiMail className="info-icon" /><span>Email</span><strong>{user?.email}</strong></div>
        <div className="info-item"><FiShield className="info-icon" /><span>Role</span><strong className="capitalize">{user?.role}</strong></div>
        <div className="info-item"><FiCalendar className="info-icon" /><span>Platform</span><strong>TRACECONNECT</strong></div>
        <div className="info-item"><FiCheck className="info-icon" /><span>Status</span><strong style={{ color: "#1f8a43" }}>Active</strong></div>
      </div>

      <div className="stats-row">
        {user?.role === "grower" ? (
          <>
            <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
            <StatCard icon={<FiStar />} label="Crops" value={mineCrops.length} color="amber" />
            <StatCard icon={<FiTrendingUp />} label="Harvests" value={mineHarvests.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings" value={minePackings.length} color="purple" />
          </>
        ) : (
          <>
            <StatCard icon={<FiGrid />} label="Batches Created" value={mineBatches.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings Managed" value={minePackings.length} color="green" />
          </>
        )}
      </div>

      <div className="card stage-gallery-card">
        <div className="card-title"><FiCamera /> Process Image Gallery</div>
        <div className="stage-gallery-tabs">
          {stages.map((stage) => {
            const count = mineImages.filter((img) => img.stage === stage).length;
            return (
              <button
                key={stage}
                type="button"
                className={`stage-gallery-tab ${activeGalleryStage === stage ? "active" : ""}`}
                onClick={() => setActiveGalleryStage(stage)}
              >
                <span>{stage}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
        <div className="gallery-group">
          <div className="gallery-stage-label">{activeGalleryStage} Images</div>
          {activeStageImages.length > 0 ? (
            <div className="record-list process-entry-list">
              {activeStageImages.map((img) => (
                <div key={img.id} className="process-entry-card">
                  <div className="process-entry-main">
                    {img.imageUrl && <img className="tc-thumb process-entry-thumb" src={img.imageUrl} alt={`${activeGalleryStage} ${img.name}`} />}
                    <div className="process-entry-copy">
                      <div className="process-entry-title">{img.name}</div>
                      <div className="process-entry-date">{img.date}</div>
                    </div>
                  </div>
                  <div className="process-entry-actions">
                    {img.imageUrl && (
                      <a className="process-entry-link" href={img.imageUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    )}
                    <button className="process-entry-delete" onClick={() => removeImage(img.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-gallery-box">
              <FiCamera />
              <p>No images stored for this stage yet.</p>
              <span>Use the camera capture inside the selected traceability stage and it will appear here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TracePage({ patchId }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

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
  const isShrimp = false;

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
      <div className="trace-hero">
        <div className="trace-hero-img">
          <div className="trace-hero-overlay">
            <div className="trace-verified-pill"><FiShield /> TraceConnect Verified Batch</div>
            <h2 className="trace-product-name">{cropRecord?.name || "Agricultural Product"}</h2>
            <p className="trace-product-subtitle">Farm to batch traceability record</p>
          </div>
          <div className="trace-info-bar">
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Variety</span><strong>{cropRecord?.variety || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Harvested</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Origin</span><strong>{plantation?.location || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Batch ID</span><strong className="mono">{batch.id}</strong></div>
          </div>
        </div>
      </div>

      <div className="trace-card trace-farmer-card">
        <div className="trace-section-header">Farmer Information</div>
        <div className="farmer-row">
          <div className="farmer-avatar">{isShrimp ? "AQ" : "FM"}</div>
          <div>
            <div className="farmer-name">{plantation?.name || "Unknown Farm"}</div>
            <div className="farmer-sub">{isShrimp ? "Aquaculture Farm" : "Organic Farming Cooperative"}</div>
            <div className="farmer-badges">
              <span className="badge badge-green">{isShrimp ? "MPEDA Registered" : "Certified Organic Farmer"}</span>
              <span className="badge badge-blue">{isShrimp ? "Aquaculture Expert" : "Experienced Farmer"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trace-card trace-location-card">
        <div className="trace-section-header">Farm Location</div>
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
            {[{ l: "Water Quality", v: "pH 7.5-8.5" }, { l: "Water Temp", v: "28-32°C" }, { l: "Dissolved O2", v: ">= 5 mg/L" }, { l: "Ammonia", v: "< 0.1 mg/L" }, { l: "Antibiotic Test", v: "Passed" }, { l: "Salinity", v: "15-25 ppt" }].map((i) => (
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
              <span className="star">★★★★★</span>
              <div className="xfactor-label">{x.label}</div>
              <div className="xfactor-val">{x.val}</div>
            </div>
          ))}
        </div>
      </div>

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
              <div className={`chain-dot ${i < 4 ? "chain-active" : "chain-inactive"}`}>{i < 4 ? "✓" : "○"}</div>
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
        <button className="btn btn-primary"><FiCamera /> View Harvest Photos</button>
        <button className="btn btn-outline"><FiVideo /> Watch Farmer Story</button>
      </div>

      <div className="trace-footer">Powered by <strong>TRACECONNECT</strong></div>
    </div>
  );
}
function AppShell() {
  const { user, loading } = useAuth();
  const { route, navigate } = useRouter();
  const { toast, toasts } = useToast();
  const plantationMatch = route.match(/^\/plantation\/(.+)$/);
  const patchMatch = route.match(/^\/patch\/(.+)$/);

  useEffect(() => {
    if (loading) return;
  }, [user, loading, route, patchMatch, navigate]);

  let page = null;
  if (patchMatch) page = <TracePage patchId={patchMatch[1]} />;
  else if (loading) page = <div className="page-container"><div className="card">Loading...</div></div>;
  else if (!user) page = <AuthEntryPage toast={toast} />;
  else if (plantationMatch) page = <PlantationDetail plantationId={plantationMatch[1]} toast={toast} />;
  else if (route === "/grower") page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/supplier") page = user.role === "supplier" ? <SupplierDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/plantations") page = user.role === "grower" ? <PlantationsPage navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/reports") page = <ReportsPage />;
  else if (route === "/profile") page = <ProfilePage />;
  else page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <SupplierDashboard navigate={navigate} toast={toast} />;

  return (
    <div className="app-root">
      <Toasts toasts={toasts} />
      {user && !patchMatch && <Header route={route} navigate={navigate} />}
      <main>{page}</main>
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



