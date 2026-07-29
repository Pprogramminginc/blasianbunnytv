const { callRpc } = require("../_supabase");
const { checkPassword } = require("../_auth");

const ALLOWED_PRODUCTS = ["shipping-guide", "shipping-book", "shipping-bundle"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password, productId } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  if (!ALLOWED_PRODUCTS.includes(productId)) {
    res.status(400).json({ ok: false, error: "Invalid product" });
    return;
  }

  try {
    const rows = await callRpc("generate_download_code", { p_product_id: productId });
    const row = rows[0];
    res.status(200).json({ ok: true, code: row.code, expiresAt: row.expires_at });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not generate code" });
  }
};
