const cloudinary = require("../services/cloudinaryService");

function safeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

exports.uploadTraceabilityImage = async (req, res) => {
  try {
    const { data_url, plantation_id, stage } = req.body || {};
    if (!data_url || !plantation_id || !stage) {
      return res.status(400).json({
        error: "data_url, plantation_id, and stage are required",
      });
    }

    const userId = req.user?.user_id;
    const plId = Number(plantation_id);
    if (!Number.isInteger(plId)) {
      return res.status(400).json({ error: "Invalid plantation_id" });
    }

    const stageKey = safeSegment(stage) || "stage";
    const folder = `maati_ai/traceability/user_${userId}/plantation_${plId}/${stageKey}`;
    const publicId = `capture_${Date.now()}`;

    const uploaded = await cloudinary.uploadDataUrl({
      dataUrl: data_url,
      folder,
      publicId,
      tags: ["traceability", `user_${userId}`, `plantation_${plId}`, stageKey],
    });

    if (!uploaded.url) {
      return res.status(500).json({ error: "Cloudinary upload failed" });
    }

    res.json({ url: uploaded.url, public_id: uploaded.public_id });
  } catch (err) {
    const status = err?.status || 500;
    res.status(status).json({ error: err.message || "Upload failed" });
  }
};

