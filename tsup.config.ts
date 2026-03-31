import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/api/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "api",
  external: ["@prisma/client", "@prisma/client-runtime-utils", "pg-native"],
  clean: true,
});
