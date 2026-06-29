const crypto = require("crypto");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`Missing env var: ${name}`);
    err.status = 500;
    throw err;
  }
  return value;
}

function sign(params, apiSecret) {
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort();

  const toSign = keys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

exports.uploadDataUrl = async ({
  dataUrl,
  folder,
  publicId,
  tags,
} = {}) => {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");

  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    const err = new Error("Invalid image data. Expected data URL (data:image/...)");
    err.status = 400;
    throw err;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const signedParams = {
    folder: folder || "maati_ai/traceability",
    public_id: publicId || undefined,
    tags: Array.isArray(tags) ? tags.join(",") : tags || undefined,
    timestamp,
  };

  const signature = sign(signedParams, apiSecret);

  const body = new URLSearchParams({
    ...signedParams,
    api_key: apiKey,
    signature,
    file: dataUrl,
  }).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || "Cloudinary upload failed");
    err.status = res.status;
    throw err;
  }

  return {
    url: data?.secure_url || data?.url,
    public_id: data?.public_id,
    bytes: data?.bytes,
    format: data?.format,
    width: data?.width,
    height: data?.height,
  };
};

