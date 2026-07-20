import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Standard TanStack Start + Cloudflare (nitro) build. Nitro only participates in the
// production build; in dev it's skipped so the dev server stays light. Vite exposes
// VITE_* env vars on import.meta.env natively, so no manual `define` is needed.
export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect the bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      // Fail the build if server-only code leaks into a client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
  ];

  // Cloudflare deploy target — build-only.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  return {
    // Match the build's CSS pipeline in dev so the preview stays honest — Vite uses
    // PostCSS in dev and Lightning CSS only at build otherwise, which can hide
    // build-time CSS transforms that break the static output.
    css: { transformer: "lightningcss" as const },
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    // Pre-bundle the always-present client deps and tolerate stale requests, so a
    // dep re-optimization doesn't 504 tabs holding the previous optimized-dep hash.
    // React core only — pulling @tanstack/react-start here would drag its
    // node:async_hooks server entry into the client bundle and crash hydration.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: { host: "::", port: 8080 },
    plugins,
  };
});
