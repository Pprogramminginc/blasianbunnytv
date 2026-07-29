const { callRpc } = require("../_supabase");
const { checkPassword } = require("../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  try {
    const codes = await callRpc("list_download_codes", {});
    res.status(200).json({ ok: true, codes });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not load codes" });
  }
};
