export const PLATFORMS = [
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "pinterest",
  "threads",
  "douyin",
  "xiaohongshu-profile",
  "xiaohongshu",
  "snackvideo",
  "cocofun",
  "kuaishou",
  "capcut",
  "gdrive",
  "mediafire",
  "spotify",
  "soundcloud",
];

const MATCHERS = [
  ["instagram", /instagram\.com/i],
  ["tiktok", /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i],
  ["facebook", /(facebook\.com|fb\.watch|fb\.com)/i],
  ["twitter", /(twitter\.com|x\.com)\//i],
  ["youtube", /(youtube\.com|youtu\.be|youtube-nocookie\.com)/i],
  ["mediafire", /mediafire\.com/i],
  ["capcut", /capcut\.com/i],
  ["gdrive", /drive\.google\.com/i],
  ["pinterest", /(pinterest\.com|pin\.it)/i],
  ["douyin", /(douyin\.com|iesdouyin\.com)/i],
  ["xiaohongshu-profile", /xiaohongshu\.com\/user\/profile\//i],
  ["xiaohongshu", /(xiaohongshu\.com|xhslink\.com)/i],
  ["snackvideo", /snackvideo\.com/i],
  ["cocofun", /(icocofun|cocofun)\.com/i],
  ["spotify", /(open\.spotify\.com|spotify\.link)/i],
  ["soundcloud", /soundcloud\.com/i],
  ["threads", /threads\.(net|com)/i],
  ["kuaishou", /kuaishou\.com/i],
];

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function detectFromInput(input, hint) {
  if (!input) return null;
  if (!isHttpUrl(input)) {
    if (hint === "pinterest") return "pinterest";
    return null;
  }

  for (const [platform, pattern] of MATCHERS) {
    if (pattern.test(input)) return platform;
  }
  return null;
}

export function detectPlatform(input, hint) {
  const detected = detectFromInput(input, hint);
  if (detected) return detected;
  if (hint && PLATFORMS.includes(hint)) return hint;

  const error = new Error("Unsupported URL or platform");
  error.status = 400;
  throw error;
}
