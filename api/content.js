const { callRpc } = require("./_supabase");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const content = await callRpc("get_public_site_content", {});
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=300");
    res.status(200).json({ ok: true, ...content });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not load site content" });
  }
};
