import { STRINGS } from "../strings";
import type { AppId } from "./types";

export interface App {
  name: string;
  color: string;
}

export const APPS: Record<AppId, App> = {
  dating: { name: STRINGS.apps.dating, color: "#ff1a1a" },
  wechat: { name: STRINGS.apps.wechat, color: "#1aff1a" },
  signal: { name: STRINGS.apps.signal, color: "#1a4dff" },
};

export const APP_ORDER: AppId[] = ["dating", "wechat", "signal"];
