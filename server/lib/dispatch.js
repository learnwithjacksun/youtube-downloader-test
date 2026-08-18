import { detectPlatform } from "./detect-platform.js";
import * as youtube from "../controllers/youtube.js";
import * as instagram from "../controllers/instagram.js";
import * as tiktok from "../controllers/tiktok.js";
import * as facebook from "../controllers/facebook.js";
import * as twitter from "../controllers/twitter.js";
import * as pinterest from "../controllers/pinterest.js";
import * as threads from "../controllers/threads.js";
import * as douyin from "../controllers/douyin.js";
import * as xiaohongshu from "../controllers/xiaohongshu.js";
import * as xiaohongshuProfile from "../controllers/xiaohongshu-profile.js";
import * as snackvideo from "../controllers/snackvideo.js";
import * as cocofun from "../controllers/cocofun.js";
import * as kuaishou from "../controllers/kuaishou.js";
import * as capcut from "../controllers/capcut.js";
import * as gdrive from "../controllers/gdrive.js";
import * as mediafire from "../controllers/mediafire.js";
import * as spotify from "../controllers/spotify.js";
import * as soundcloud from "../controllers/soundcloud.js";

const controllers = {
  youtube,
  instagram,
  tiktok,
  facebook,
  twitter,
  pinterest,
  threads,
  douyin,
  xiaohongshu,
  "xiaohongshu-profile": xiaohongshuProfile,
  snackvideo,
  cocofun,
  kuaishou,
  capcut,
  gdrive,
  mediafire,
  spotify,
  soundcloud,
};

function handler(action) {
  return async (req, res) => {
    try {
      const query = req.query.url;
      const hint = req.query.platform;
      const platform = detectPlatform(query, hint);
      const controller = controllers[platform];
      if (!controller?.[action]) {
        return res.status(400).json({ message: "Unsupported platform" });
      }
      req.detectedPlatform = platform;
      return controller[action](req, res);
    } catch (error) {
      console.error(error);
      res.status(error.status || 500).json({
        message: error.status ? error.message : "Internal server error",
      });
    }
  };
}

export const preview = handler("preview");
export const download = handler("download");
