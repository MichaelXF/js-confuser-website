import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build"
  },
  resolve: {
    alias: {
      "js-confuser": path.resolve(__dirname, "./js-confuser"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: [
      "@babel/types",
      "@babel/parser",
      "@babel/traverse",
      "@babel/generator",
      "prettier",
      "acorn",
      "acorn-typescript",
      "escodegen",
    ],
  },
});
