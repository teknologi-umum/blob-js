import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        useAtomics: true,
        testTimeout: 10_000, // 10 seconds
        teardownTimeout: 30_000, // 30 seconds
        isolate: true,
        threads: false,
        singleThread: true
    }
});