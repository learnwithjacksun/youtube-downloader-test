import { proxyDownload, safeFilename } from "./proxy-download.js";
import { normalize } from "./normalize.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function createPlatformController(platform, fetchFn) {
  async function loadInfo(query) {
    if (!query) throw httpError(400, "URL is required");
    const raw = await fetchFn(query);
    if (raw && (raw.status === false || raw.status === "false")) {
      throw httpError(502, raw.message || "Could not fetch media");
    }
    const info = normalize(platform, raw);
    info.formats = info.formats.filter((item) => item.url);
    return info;
  }

  async function resolveFormat(id, info) {
    const format = info.formats.find((item) => String(item.id) === String(id)) || info.formats[0];
    if (!format) throw httpError(400, "No downloadable formats found");
    return { info, format };
  }

  return {
    preview: async (req, res) => {
      try {
        const query = req.query.url;
        const info = await loadInfo(query);
        if (!info.formats.length) {
          return res.status(404).json({ message: "No downloadable formats found" });
        }
        res.json(info);
      } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({
          message: error.status ? error.message : "Internal server error",
        });
      }
    },

    download: async (req, res) => {
      try {
        const query = req.query.url;
        const id = req.query.id;
        const info = await loadInfo(query);
        const resolved = await resolveFormat(id, info);
        const extension =
          resolved.format.kind === "audio"
            ? "mp3"
            : resolved.format.kind === "image"
              ? "jpg"
              : resolved.format.kind === "video"
                ? "mp4"
                : "bin";
        const filename = `${safeFilename(resolved.info.title)}.${extension}`;
        await proxyDownload(res, resolved.format.url, filename, resolved.format.mimeType);
      } catch (error) {
        console.error(error);
        if (!res.headersSent) {
          res.status(error.status || 500).json({
            message: error.status ? error.message : "Internal server error",
          });
        } else {
          res.destroy(error);
        }
      }
    },
  };
}
