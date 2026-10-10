const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const source = path.join(root, "index.html");
const target = path.join(output, "index.html");
const heicConverter = path.join(root, "node_modules", "heic2any", "dist", "heic2any.min.js");
const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL must be set by the Convex static-hosting deploy command.");
}

const parsedUrl = new URL(convexUrl);
if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".convex.cloud")) {
  throw new Error("VITE_CONVEX_URL must be an HTTPS Convex deployment URL.");
}

const html = fs.readFileSync(source, "utf8");
const productionUrl = "https://earnest-rhinoceros-454.convex.cloud";
if (!html.includes(productionUrl)) {
  throw new Error("Could not find the Convex URL in index.html to inject the deployment URL.");
}

fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(target, html.replaceAll(productionUrl, convexUrl), "utf8");
fs.copyFileSync(heicConverter, path.join(output, "heic2any.min.js"));
fs.copyFileSync(path.join(root, "node_modules", "heic2any", "LICENSE.md"), path.join(output, "heic2any.LICENSE.md"));
console.log(`Built ${path.relative(root, target)} for ${parsedUrl.hostname}`);
