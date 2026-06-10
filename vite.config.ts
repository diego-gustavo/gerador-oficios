import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite serve o React na porta fixa que o Tauri espera em tauri.conf.json.
export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
