import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL;

  if (command === "build" && !apiUrl?.trim()) {
    throw new Error(
      "VITE_API_URL is required for builds. Set it to /api in the Vercel frontend project.",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
