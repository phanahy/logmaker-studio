import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];

  return {
    root: "pages",
    base: repository ? `/${repository}/` : "/",
    plugins: [react()],
    publicDir: "../public",
    build: {
      outDir: "../github-dist",
      emptyOutDir: true,
    },
  };
});
