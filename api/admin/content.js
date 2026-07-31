const { callRpc } = require("../_supabase");
const { checkPassword } = require("../_auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { password, action, payload } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "Incorrect password" });
    return;
  }

  try {
    switch (action) {
      case "get": {
        const content = await callRpc("admin_get_site_content", {});
        res.status(200).json({ ok: true, ...content });
        return;
      }

      case "update-settings": {
        const settings = await callRpc("update_site_settings", { p_settings: payload || {} });
        res.status(200).json({ ok: true, settings });
        return;
      }

      case "upsert-nav": {
        const nav = payload || {};
        const row = await callRpc("upsert_nav_link", {
          p_id: nav.id || null,
          p_label: nav.label,
          p_href: nav.href,
          p_open_new_tab: Boolean(nav.openNewTab),
          p_position: Number.isFinite(nav.position) ? nav.position : 0,
          p_is_active: nav.isActive !== false,
        });
        res.status(200).json({ ok: true, navLink: row });
        return;
      }

      case "delete-nav": {
        await callRpc("delete_nav_link", { p_id: (payload || {}).id });
        res.status(200).json({ ok: true });
        return;
      }

      case "upsert-video": {
        const video = payload || {};
        const row = await callRpc("upsert_youtube_video", {
          p_id: video.id || null,
          p_video_id: video.videoId,
          p_title: video.title,
          p_short_label: video.shortLabel || "",
          p_position: Number.isFinite(video.position) ? video.position : 0,
          p_is_active: video.isActive !== false,
        });
        res.status(200).json({ ok: true, video: row });
        return;
      }

      case "delete-video": {
        await callRpc("delete_youtube_video", { p_id: (payload || {}).id });
        res.status(200).json({ ok: true });
        return;
      }

      case "upsert-page": {
        const page = payload || {};
        const row = await callRpc("upsert_custom_page", {
          p_id: page.id || null,
          p_slug: page.slug,
          p_title: page.title,
          p_subtitle: page.subtitle || "",
          p_body: page.body || "",
          p_image_url: page.imageUrl || null,
          p_is_published: page.isPublished !== false,
        });
        res.status(200).json({ ok: true, page: row });
        return;
      }

      case "delete-page": {
        await callRpc("delete_custom_page", { p_id: (payload || {}).id });
        res.status(200).json({ ok: true });
        return;
      }

      default:
        res.status(400).json({ ok: false, error: "Unknown action" });
    }
  } catch (error) {
    const message = String(error && error.message || "");
    if (message.includes("duplicate key")) {
      res.status(409).json({ ok: false, error: "That slug is already in use. Choose a different one." });
      return;
    }
    res.status(502).json({ ok: false, error: "Could not save changes" });
  }
};
