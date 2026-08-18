import { Readable } from "node:stream";
import { ClientType, Innertube, Platform } from "youtubei.js";

Platform.shim.eval = (data) => new Function(data.output)();

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

export const download = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const videoId = getVideoId(url);
    if (!videoId) {
      return res.status(400).json({ message: "Invalid YouTube URL" });
    }

    const yt = await getYoutube();
    const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });
    const title =
      (info.basic_info.title || "video")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .slice(0, 80) || "video";

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    const webStream = await info.download({
      type: "video+audio",
      quality: "best",
      format: "mp4",
      client: "ANDROID",
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
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
