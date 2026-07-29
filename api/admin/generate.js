const { callRpc } = require("../_supabase");
const { checkPassword } = require("../_auth");

const ALLOWED_PRODUCTS = ["shipping-guide", "shipping-book", "shipping-bundle"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password, productId, hours } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  if (!ALLOWED_PRODUCTS.includes(productId)) {
    res.status(400).json({ ok: false, error: "Invalid product" });
    return;
  }

  // hours: a positive number, or null for "no expiration". Omitted defaults to 24 (handled by the DB function).
  if (hours !== null && hours !== undefined && (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0)) {
    res.status(400).json({ ok: false, error: "Invalid expiration" });
    return;
  }

  try {
    const params = { p_product_id: productId };
    if (hours !== undefined) {
      params.p_hours = hours;
    }
    const rows = await callRpc("generate_download_code", params);
    const row = rows[0];
    res.status(200).json({ ok: true, code: row.code, expiresAt: row.expires_at });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not generate code" });
  }
};
