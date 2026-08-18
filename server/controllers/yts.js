import { yts } from "btch-downloader";

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function mapVideo(item) {
  const videoId = item.videoId || "";
  return {
    type: item.type || "video",
    videoId,
    url: item.url || (videoId ? `https://youtube.com/watch?v=${videoId}` : ""),
    title: item.title || "",
    description: item.description || "",
    thumbnail: item.thumbnail || item.image || "",
    seconds: item.seconds ?? item.duration?.seconds ?? 0,
    timestamp: item.timestamp || item.duration?.timestamp || "",
    ago: item.ago || "",
    views: Number(item.views) || 0,
    author: {
      name: String(item.author?.name || "").trim(),
      url: item.author?.url || "",
    },
  };
}

function pickLists(raw) {
  const nested =
    raw?.result && typeof raw.result === "object" && !Array.isArray(raw.result)
      ? raw.result
      : raw || {};
  const fromArray = Array.isArray(raw?.result) ? raw.result : [];
  const videos = (
    asList(nested.videos).length
      ? asList(nested.videos)
      : asList(nested.all).length
        ? asList(nested.all)
        : fromArray
  ).filter((item) => item && (item.videoId || item.url) && item.type !== "channel");

  return {
    videos: videos.map(mapVideo).filter((item) => item.url),
    live: asList(nested.live).map(mapVideo),
    playlists: asList(nested.playlists).concat(asList(nested.lists)),
    channels: asList(nested.channels).concat(asList(nested.accounts)),
  };
}

export async function search(req, res) {
  try {
    const query = String(req.query.q || req.query.query || req.query.url || "").trim();
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const raw = await yts(query);
    if (raw && (raw.status === false || raw.status === "false")) {
      return res.status(502).json({
        message: raw.message || "Could not search YouTube",
      });
    }

    const lists = pickLists(raw);
    if (!lists.videos.length) {
      return res.status(404).json({ message: "No videos found" });
    }

    res.json({
      platform: "yts",
      query,
      ...lists,
    });
  } catch (error) {
    console.error(error);
    const network = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(
      error.message || "",
    );
    res.status(error.status || (network ? 502 : 500)).json({
      message:
        error.status || network
          ? error.message || "Could not search YouTube"
          : "Internal server error",
    });
  }
}
