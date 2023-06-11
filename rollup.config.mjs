import ts from "@rollup/plugin-typescript";

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.cjs",
            format: "cjs",
            sourcemap: true
        },
        {
            file: "dist/index.mjs",
            format: "es",
            sourcemap: true
        },
    ],
    plugins: [ts({ tsconfig: "./tsconfig.json" })]
};