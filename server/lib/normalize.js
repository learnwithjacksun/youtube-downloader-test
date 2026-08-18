function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function guessKind(url, hint) {
  if (hint) return hint;
  const lower = String(url).toLowerCase();
  if (/\.(mp3|m4a|aac|wav|ogg|opus)(\?|$)/i.test(lower)) return "audio";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(lower)) return "image";
  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(lower)) return "video";
  return "file";
}

function mimeFor(kind, url = "") {
  if (kind === "audio") return /\.m4a/i.test(url) ? "audio/mp4" : "audio/mpeg";
  if (kind === "image") return "image/jpeg";
  if (kind === "video") return "video/mp4";
  return "application/octet-stream";
}

function formatItem(id, label, url, kindHint) {
  const kind = guessKind(url, kindHint);
  return {
    id: String(id),
    label,
    kind,
    mimeType: mimeFor(kind, url),
    url,
  };
}

function pack(platform, raw, fields) {
  const formats = (fields.formats || []).filter((item) => item?.url);
  const preview =
    formats.find((item) => item.kind === fields.previewType) || formats[0];

  return {
    platform,
    title: fields.title || "Untitled",
    author: fields.author || "",
    thumbnail: fields.thumbnail || "",
    previewType: fields.previewType || preview?.kind || "file",
    previewUrl: fields.previewUrl || preview?.url || "",
    formats,
  };
}

export function normalize(platform, raw) {
  const data = raw?.result && typeof raw.result === "object" && !Array.isArray(raw.result)
    ? { ...raw, ...raw.result }
    : raw || {};

  switch (platform) {
    case "youtube":
      return pack(platform, raw, {
        title: firstString(data.title),
        author: firstString(data.author),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: [
          data.mp4 && formatItem("mp4", "MP4 · video", data.mp4, "video"),
          data.mp3 && formatItem("mp3", "MP3 · audio", data.mp3, "audio"),
        ].filter(Boolean),
      });

    case "instagram": {
      const items = asArray(raw?.result);
      return pack(platform, raw, {
        title: firstString(data.title, "Instagram media"),
        thumbnail: firstString(items[0]?.thumbnail),
        previewType: guessKind(items[0]?.url, "video"),
        formats: items.map((item, index) =>
          formatItem(
            `media-${index}`,
            `Media ${index + 1}`,
            item.url,
            guessKind(item.url, "video"),
          ),
        ),
      });
    }

    case "tiktok":
      return pack(platform, raw, {
        title: firstString(data.title, data.title_audio),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: [
          ...asArray(data.video).map((url, index) =>
            formatItem(`video-${index}`, `Video ${index + 1}`, url, "video"),
          ),
          ...asArray(data.audio).map((url, index) =>
            formatItem(`audio-${index}`, `Audio ${index + 1}`, url, "audio"),
          ),
        ],
      });

    case "facebook":
      return pack(platform, raw, {
        title: firstString(data.title, "Facebook video"),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: [
          data.HD && formatItem("hd", "MP4 · HD", data.HD, "video"),
          data.Normal_video &&
            formatItem("sd", "MP4 · SD", data.Normal_video, "video"),
        ].filter(Boolean),
      });

    case "twitter":
      return pack(platform, raw, {
        title: firstString(data.title, "Twitter video"),
        previewType: "video",
        formats: [
          data.url && formatItem("video", "MP4 · video", data.url, "video"),
        ].filter(Boolean),
      });

    case "pinterest": {
      const pin = data;
      const pins = asArray(pin.result).filter((item) => item?.image_url || item?.image);
      if (pins.length) {
        return pack(platform, raw, {
          title: firstString(pin.query, "Pinterest results"),
          thumbnail: firstString(pins[0].image_url, pins[0].image),
          previewType: pins[0].is_video ? "video" : "image",
          formats: pins.flatMap((item, index) => {
            const out = [];
            if (item.video_url) {
              out.push(
                formatItem(`pin-${index}-video`, `${item.title || "Pin"} · video`, item.video_url, "video"),
              );
            }
            if (item.image_url || item.images?.original) {
              out.push(
                formatItem(
                  `pin-${index}-image`,
                  `${item.title || "Pin"} · image`,
                  item.image_url || item.images.original,
                  "image",
                ),
              );
            }
            return out;
          }),
        });
      }
      const videos = Object.values(pin.videos || {})
        .map((item) => item?.url)
        .filter(Boolean);
      return pack(platform, raw, {
        title: firstString(pin.title, pin.description, "Pinterest pin"),
        author: firstString(pin.user?.full_name, pin.user?.username),
        thumbnail: firstString(pin.image, pin.images?.orig?.url),
        previewType: pin.is_video || videos.length ? "video" : "image",
        formats: [
          ...videos.map((url, index) =>
            formatItem(`video-${index}`, `Video ${index + 1}`, url, "video"),
          ),
          pin.video_url && formatItem("video", "Video", pin.video_url, "video"),
          pin.image && formatItem("image", "Image", pin.image, "image"),
        ].filter(Boolean),
      });
    }

    case "threads":
      return pack(platform, raw, {
        title: firstString(data.title, "Threads post"),
        thumbnail: firstString(data.image),
        previewType: data.type === "image" ? "image" : "video",
        formats: [
          data.video && formatItem("video", "Video", data.video, "video"),
          data.image && formatItem("image", "Image", data.image, "image"),
        ].filter(Boolean),
      });

    case "douyin":
      return pack(platform, raw, {
        title: firstString(data.title, "Douyin video"),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: asArray(data.links).map((item, index) =>
          formatItem(
            `link-${index}`,
            item.quality || `Download ${index + 1}`,
            item.url,
            guessKind(item.url, "video"),
          ),
        ),
      });

    case "xiaohongshu":
      return pack(platform, raw, {
        title: firstString(data.title, data.desc, "Xiaohongshu post"),
        author: firstString(data.author?.nickname),
        thumbnail: firstString(data.images?.[0], data.author?.avatar),
        previewType: data.downloads?.length ? "video" : "image",
        formats: [
          ...asArray(data.downloads).map((item, index) =>
            formatItem(
              `download-${index}`,
              item.quality || `Video ${index + 1}`,
              item.url,
              "video",
            ),
          ),
          ...asArray(data.images).map((url, index) =>
            formatItem(`image-${index}`, `Image ${index + 1}`, url, "image"),
          ),
        ],
      });

    case "xiaohongshu-profile": {
      const notes = asArray(data.notes);
      return pack(platform, raw, {
        title: firstString(data.user?.nickname, "Xiaohongshu profile"),
        author: firstString(data.user?.redId),
        thumbnail: firstString(data.user?.avatar),
        previewType: "image",
        previewUrl: firstString(data.user?.avatar),
        formats: [
          data.user?.avatar &&
            formatItem("avatar", "Profile photo", data.user.avatar, "image"),
          ...notes
            .map((note, index) =>
              note.cover
                ? formatItem(
                    `note-${index}`,
                    note.title || `Note ${index + 1}`,
                    note.cover,
                    "image",
                  )
                : null,
            )
            .filter(Boolean),
        ].filter(Boolean),
      });
    }

    case "snackvideo":
      return pack(platform, raw, {
        title: firstString(data.title, data.description, "SnackVideo"),
        author: firstString(data.creator?.name),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: [
          data.videoUrl && formatItem("video", "MP4 · video", data.videoUrl, "video"),
        ].filter(Boolean),
      });

    case "cocofun":
      return pack(platform, raw, {
        title: firstString(data.caption, data.topic, "Cocofun video"),
        thumbnail: firstString(data.thumbnail),
        previewType: "video",
        formats: [
          data.no_watermark &&
            formatItem("nowm", "MP4 · no watermark", data.no_watermark, "video"),
          data.watermark &&
            formatItem("wm", "MP4 · watermark", data.watermark, "video"),
        ].filter(Boolean),
      });

    case "kuaishou":
      return pack(platform, raw, {
        title: firstString(data.title, "Kuaishou video"),
        author: firstString(data.author, data.username),
        previewType: "video",
        formats: [
          data.videoUrl && formatItem("video", "MP4 · video", data.videoUrl, "video"),
        ].filter(Boolean),
      });

    case "capcut":
      return pack(platform, raw, {
        title: firstString(data.title, "CapCut template"),
        author: firstString(data.authorName),
        thumbnail: firstString(data.coverUrl),
        previewType: "video",
        formats: [
          data.originalVideoUrl &&
            formatItem("video", "MP4 · template", data.originalVideoUrl, "video"),
        ].filter(Boolean),
      });

    case "gdrive":
      return pack(platform, raw, {
        title: firstString(data.filename, "Google Drive file"),
        previewType: "file",
        formats: [
          data.downloadUrl &&
            formatItem("file", data.filename || "Download", data.downloadUrl, "file"),
        ].filter(Boolean),
      });

    case "mediafire":
      return pack(platform, raw, {
        title: firstString(data.filename, "MediaFire file"),
        author: firstString(data.owner),
        previewType: "file",
        formats: [
          data.url && formatItem("file", data.filename || "Download", data.url, "file"),
        ].filter(Boolean),
      });

    case "spotify":
      return pack(platform, raw, {
        title: firstString(data.title, "Spotify track"),
        thumbnail: firstString(data.thumbnail),
        previewType: "audio",
        formats: asArray(data.formats).map((item, index) =>
          formatItem(
            `audio-${index}`,
            `${item.quality || item.ext || "Audio"} ${item.filesize ? `· ${item.filesize}` : ""}`.trim(),
            item.url,
            "audio",
          ),
        ),
      });

    case "soundcloud":
      return pack(platform, raw, {
        title: firstString(data.title, "SoundCloud track"),
        thumbnail: firstString(data.thumbnail),
        previewType: "audio",
        formats: [
          data.downloadMp3 && formatItem("mp3", "MP3", data.downloadMp3, "audio"),
          data.audio && formatItem("audio", "Audio stream", data.audio, "audio"),
          data.downloadArtwork &&
            formatItem("art", "Artwork", data.downloadArtwork, "image"),
        ].filter(Boolean),
      });

    default:
      return pack(platform, raw, { title: "Unknown", formats: [] });
  }
}
