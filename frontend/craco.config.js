// craco.config.js
const path = require("path");

module.exports = {
  style: {
    postcss: {
      plugins: [require("@tailwindcss/postcss"), require("autoprefixer")],
    },
  },
  webpack: {
    configure: (config) => {
      // allow ESM subpath imports without explicit .js
      config.module.rules.push({ test: /\.m?js$/, resolve: { fullySpecified: false } });

      // clean aliases (remove any old reactbits/gsap stubs)
      config.resolve.alias = { ...(config.resolve.alias || {}) };

      // quiet noisy third-party sourcemap warnings
      const smRule = config.module.rules.find(
        (r) => r.enforce === "pre" && r.use?.some((u) => String(u.loader || "").includes("source-map-loader"))
      );
      if (smRule) {
        const prev = Array.isArray(smRule.exclude) ? smRule.exclude : smRule.exclude ? [smRule.exclude] : [];
        smRule.exclude = [...prev, /@mediapipe[\\/]tasks-vision/];
      }
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        (w) =>
          String(w.message || "").includes("Failed to parse source map") &&
          /node_modules/.test(String(w.module?.resource || "")),
      ];

      return config;
    },
  },
};

