const { checkPassword } = require("../_auth");

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password, contentType, dataBase64 } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  const extension = ALLOWED_TYPES[contentType];

  if (!extension) {
    res.status(400).json({ ok: false, error: "Unsupported image type" });
    return;
  }

  if (typeof dataBase64 !== "string" || !dataBase64) {
    res.status(400).json({ ok: false, error: "Missing image data" });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, "base64");
  } catch (error) {
    res.status(400).json({ ok: false, error: "Invalid image data" });
    return;
  }

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    res.status(400).json({ ok: false, error: "Image must be under 4MB" });
    return;
  }

  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/site-assets/${path}`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/site-assets/${path}`;
    res.status(200).json({ ok: true, url: publicUrl });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not upload image" });
  }
};
