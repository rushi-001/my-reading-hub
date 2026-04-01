import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_BASE_URL?.trim() || "http://localhost:8484";
  const isWsl =
    Boolean(process.env.WSL_DISTRO_NAME) || Boolean(process.env.WSL_INTEROP);

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      hmr: {
        overlay: false,
      },
      watch: isWsl
        ? {
            usePolling: true,
            interval: 150,
          }
        : undefined,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
