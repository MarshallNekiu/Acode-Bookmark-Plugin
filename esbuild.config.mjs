import * as esbuild from "esbuild";
import { exec } from "child_process";
import {sassPlugin} from 'esbuild-sass-plugin';
import fs from 'fs';

const isServe = process.argv.includes("--serve");

// Function to pack the ZIP file
function packZip() {
  exec("node .vscode/pack-zip.js", (err, stdout, stderr) => {
    if (err) {
      console.error("Error packing zip:", err);
      return;
    }
    console.log(stdout.trim());
  });
}

// Custom plugin to pack ZIP after build or rebuild
const zipPlugin = {
  name: "zip-plugin",
  setup(build) {
    build.onEnd(() => {
      packZip();
    });
  },
};

// Base build configuration
let buildConfig = {
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  logLevel: "info",
  color: true,
  outdir: "dist",
  plugins: [
  	zipPlugin,
  	sassPlugin({
      type: 'css-text',
      async transform(source) {
        const svgRegex = /url\(['"]?([^'"\)]+\.svg)['"]?\)/g;
        let transformedSource = source;

        // Find all SVG URLs
        const matches = [...source.matchAll(svgRegex)];
        for (const match of matches) {
          const svgPath = match[1];
          const svgContent = await fs.promises.readFile(`src/${svgPath}`, 'utf8');
          const encodedSVG = encodeURIComponent(svgContent)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
          const dataURL = `url('data:image/svg+xml;utf8,${encodedSVG}')`;
          transformedSource = transformedSource.replace(match[0], dataURL);
        }
        return transformedSource;
      },
    }),
  	sassPlugin(
  		{
  			type: 'css-text'
  		})],
};

// Main function to handle both serve and production builds
(async function () {
  if (isServe) {
    console.log("Starting development server...");

    // Watch and Serve Mode
    const ctx = await esbuild.context(buildConfig);

    await ctx.watch();
    const { host, port } = await ctx.serve({
      servedir: ".",
      port: 3000,
    });

  } else {
    console.log("Building for production...");
    await esbuild.build(buildConfig);
    console.log("Production build complete.");
  }
})();
