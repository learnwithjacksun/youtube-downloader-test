import { threads } from "btch-downloader";
import { createPlatformController } from "../lib/create-controller.js";

export const { preview, download } = createPlatformController("threads", threads);
