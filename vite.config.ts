import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "pwa-512.png"],
      manifest: {
        name: "Chichi Drop Go",
        short_name: "Chichi Drop",
        description: "Premium second-hand streetwear drops.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1a1816",
        background_color: "#1a1816",
        icons: [
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            // Using the same source for broad compatibility.
            // Browsers can downscale as needed.
            src: "/pwa-512.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"] ,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin.includes("images.unsplash.com"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent "Invalid hook call" / "Cannot read properties of null (reading 'useEffect')"
    // by ensuring Vite bundles a single React instance.
    dedupe: ["react", "react-dom"],
  },
}));
