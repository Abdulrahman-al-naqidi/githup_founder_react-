import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Content-Security-Policy is injected only in the production build:
// Vite's dev server uses inline scripts (HMR) that a strict CSP would block.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https://avatars.githubusercontent.com",
  "connect-src https://api.github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

const injectCsp = () => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace("</title>", `</title>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
});

export default defineConfig({
  plugins: [react(), tailwindcss(), injectCsp()],
});
