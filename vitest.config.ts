import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    env: {
      SKIP_ENV_VALIDATION: "true",
      DATABASE_URL: "postgresql://test:test@localhost/test",
      NODE_ENV: "test",
    },
  },
});
