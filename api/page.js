const { callRpc } = require("./_supabase");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";

  if (!slug) {
    res.status(400).json({ ok: false, error: "Missing slug" });
    return;
  }

  try {
    const rows = await callRpc("get_public_page", { p_slug: slug });
    const page = rows[0];

    if (!page) {
      res.status(404).json({ ok: false, error: "Page not found" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=300");
    res.status(200).json({
      ok: true,
      page: {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        body: page.body,
        imageUrl: page.image_url,
      },
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Could not load page" });
  }
};
