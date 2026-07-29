const { callRpc } = require("../_supabase");
const { checkPassword } = require("../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password, id } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  if (!id) {
    res.status(400).json({ ok: false, error: "Missing id" });
    return;
  }

  try {
    await callRpc("revoke_download_code", { p_id: id });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not revoke code" });
  }
};
