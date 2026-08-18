import { yts } from "btch-downloader";
import { createPlatformController } from "../lib/create-controller.js";

export const { preview, download } = createPlatformController("yts", yts, {
  resolveYts: true,
});
