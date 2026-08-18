import { cocofun } from "btch-downloader";
import { createPlatformController } from "../lib/create-controller.js";

export const { preview, download } = createPlatformController("cocofun", cocofun);
