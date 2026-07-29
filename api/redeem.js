const { callRpc } = require("./_supabase");

const GUIDE_FILE = { label: "Shipping Guide", url: "assets/downloads/shipping-guide.pdf" };
const BOOK_FILE = { label: "Shipping Book", url: "assets/downloads/shipping-book.pdf" };

const PRODUCT_FILES = {
  "shipping-guide": [GUIDE_FILE],
  "shipping-book": [BOOK_FILE],
  "shipping-bundle": [GUIDE_FILE, BOOK_FILE],
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { productId, code } = req.body || {};

  if (!Object.prototype.hasOwnProperty.call(PRODUCT_FILES, productId) || typeof code !== "string" || !code.trim()) {
    res.status(400).json({ ok: false, error: "Missing productId or code" });
    return;
  }

  try {
    const valid = await callRpc("redeem_download_code", {
      p_product_id: productId,
      p_code: code.trim(),
    });

    if (!valid) {
      res.status(200).json({ ok: false, error: "Invalid, used, or expired code" });
      return;
    }

    res.status(200).json({ ok: true, files: PRODUCT_FILES[productId] });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Lookup failed" });
  }
};
