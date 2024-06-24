import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/db.ts",
  dialect: "postgresql",
  out: "./drizzle",
})
