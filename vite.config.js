import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 3000,
    host: true,
    headers: {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self' https://appssdk.zoom.us https://*.zoom.us; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appssdk.zoom.us https://*.zoom.us; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://appssdk.zoom.us wss://appssdk.zoom.us https://*.zoom.us wss://*.zoom.us; frame-ancestors 'self' https://*.zoom.us;",
      "Referrer-Policy": "same-origin",
    },
  },
});
