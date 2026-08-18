import { Readable } from "node:stream";
import { ClientType, Innertube, Platform } from "youtubei.js";

Platform.shim.eval = (data) => new Function(data.output)();

const YOUTUBE_CLIENT = "ANDROID";
let youtube;

async function getYoutube() {
  if (!youtube) {
    youtube = await Innertube.create({ client_type: ClientType.ANDROID });
  }
  return youtube;
}

function getVideoId(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function safeFilename(title) {
  return (
    title
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .slice(0, 80) || "video"
  );
}

function containerFromMime(mimeType) {
  const subtype = mimeType?.split(";")[0]?.split("/")[1]?.toLowerCase();
  if (subtype === "webm") return "webm";
  if (subtype === "mp4") return "mp4";
  return subtype || "mp4";
}

function formatSize(bytes) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${mb.toFixed(1)} MB`;
}

function mapFormat(format) {
  const container = containerFromMime(format.mime_type);
  const kind =
    format.has_video && format.has_audio
      ? "video"
      : format.has_audio
        ? "audio"
        : "video-only";
  const quality =
    format.quality_label || format.audio_quality || format.quality || "unknown";
  const size = formatSize(format.content_length);
  const extension = kind === "audio" && container === "mp4" ? "m4a" : container;
  const label = [
    extension.toUpperCase(),
    quality.replace(/^AUDIO_QUALITY_/, "").toLowerCase(),
    kind === "audio" ? "audio" : null,
    format.fps ? `${format.fps}fps` : null,
    size,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    itag: format.itag,
    kind,
    quality,
    container,
    extension,
    mimeType: format.mime_type?.split(";")[0] || `video/${container}`,
    fps: format.fps || null,
    size,
    label,
  };
}

function listFormats(info) {
  const all = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ];
  const seen = new Set();

  return all
    .filter((format) => {
      if (format.has_video && format.has_audio) return true;
      if (!format.has_audio || format.has_video) return false;
      return /MEDIUM/i.test(format.audio_quality || "");
    })
    .map(mapFormat)
    .filter((format) => {
      if (seen.has(format.itag)) return false;
      seen.add(format.itag);
      return true;
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "video" ? -1 : 1;
      return (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0);
    });
}

function findFormat(info, itag) {
  const all = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ];
  return all.find((format) => format.itag === Number(itag));
}

async function loadInfo(url) {
  if (!url) {
    const error = new Error("URL is required");
    error.status = 400;
    throw error;
  }

  const videoId = getVideoId(url);
  if (!videoId) {
    const error = new Error("Invalid YouTube URL");
    error.status = 400;
    throw error;
  }

  const yt = await getYoutube();
  const info = await yt.getBasicInfo(videoId, { client: YOUTUBE_CLIENT });
  return { videoId, info };
}

export const preview = async (req, res) => {
  try {
    const { videoId, info } = await loadInfo(req.query.url);
    const thumbnails = info.basic_info.thumbnail || [];
    const thumbnail =
      thumbnails.at(-1)?.url ||
      thumbnails[0]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    res.json({
      videoId,
      title: info.basic_info.title || "Untitled",
      author: info.basic_info.author || "",
      duration: info.basic_info.duration || 0,
      thumbnail,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      formats: listFormats(info),
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.status ? error.message : "Internal server error",
    });
  }
};

export const download = async (req, res) => {
  try {
    const { url, itag } = req.query;
    const { info } = await loadInfo(url);
    const selected = itag ? findFormat(info, itag) : null;
    const mapped = selected ? mapFormat(selected) : null;
    const title = safeFilename(info.basic_info.title || "video");
    const extension = mapped?.extension || "mp4";
    const mimeType = mapped?.mimeType || "video/mp4";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title}.${extension}"`,
    );
    res.setHeader("Content-Type", mimeType);

    const webStream = await info.download({
      client: YOUTUBE_CLIENT,
      ...(mapped
        ? { itag: mapped.itag }
        : { type: "video+audio", quality: "best", format: "mp4" }),
    });
    const nodeStream = Readable.fromWeb(webStream);

    nodeStream.on("error", (error) => {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
      } else {
        res.destroy(error);
      }
    });

    nodeStream.pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({
        message: error.status ? error.message : "Internal server error",
      });
    }
  }
};
