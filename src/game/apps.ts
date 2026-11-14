import { STRINGS } from "../strings";
import type { AppId } from "./types";

export interface App {
  name: string;
  color: string;
  icon: string;
}

export const APPS: Record<AppId, App> = {
  dating: { name: STRINGS.apps.dating, color: "#ff1a1a", icon: "/images/apps/dating.png" },
  wechat: { name: STRINGS.apps.wechat, color: "#1aff1a", icon: "/images/apps/wechat.png" },
  signal: { name: STRINGS.apps.signal, color: "#1a4dff", icon: "/images/apps/signal.png" },
};

export const APP_ORDER: AppId[] = ["dating", "wechat", "signal"];
