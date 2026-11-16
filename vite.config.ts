import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// Vercel sets VERCEL=1 during builds; skip the Cloudflare plugin there so
// output goes to dist/. Other deployments (Cloudflare) are unchanged.
const onVercel = !!process.env.VERCEL;

export default defineConfig({
	base: "./",
	plugins: onVercel ? [] : [cloudflare()],
});
