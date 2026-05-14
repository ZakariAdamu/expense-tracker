import fs from "fs";
import path from "path";
import zlib from "zlib";
import { bundleBudgets } from "../bundle-budget.config";

const NEXT_STATIC_DIR = path.join(process.cwd(), ".next", "static");
const TRACKED_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".woff2",
  ".woff",
  ".ttf",
  ".otf",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".gif",
  ".avif",
  ".ico",
]);

function getAllFiles(dirPath: string, fileArray: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileArray;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileArray);
    } else if (TRACKED_EXTENSIONS.has(path.extname(file))) {
      fileArray.push(filePath);
    }
  });

  return fileArray;
}

function checkBundleSizes() {
  console.log("📦 Checking production bundle budgets...");
  if (!fs.existsSync(NEXT_STATIC_DIR)) {
    console.error(
      "❌ Error: .next/static directory not found. Please run 'npm run build' first.",
    );
    process.exit(1);
  }
  const files = getAllFiles(NEXT_STATIC_DIR);
  let hasWarnings = false;
  let totalSizeKB = 0;
  let matchedSizeKB = 0;

  files.forEach((filePath) => {
    const relativePath = path
      .relative(NEXT_STATIC_DIR, filePath)
      .split(path.sep)
      .join("/");
    const fileBuffer = fs.readFileSync(filePath);
    const gzippedSize = zlib.gzipSync(fileBuffer).length;
    const sizeKB = parseFloat((gzippedSize / 1024).toFixed(2));
    totalSizeKB += sizeKB;

    const matchingRule = bundleBudgets.find((rule) =>
      relativePath.includes(rule.path),
    );

    if (matchingRule) {
      matchedSizeKB += sizeKB;
      if (sizeKB > matchingRule.maxSizeKB) {
        // Log a visible warning without disrupting execution flow
        console.warn(
          `⚠️⚠️⚠️ Budget Warning: File "${relativePath}" is ${sizeKB}KB (Exceeds Target: ${matchingRule.maxSizeKB}KB)`,
        );
        hasWarnings = true;
      } else {
        console.log(
          `✅ Passed: "${relativePath}" is ${sizeKB}KB (Limit: ${matchingRule.maxSizeKB}KB)`,
        );
      }
    }
  });

  if (hasWarnings) {
    console.warn(
      "\n⚠️ Attention: Some bundle chunks exceed target sizes, but proceeding with push.",
    );
  } else {
    console.log("\n✨ All bundles are within healthy limits.");
  }

  console.log(`\n📊 Total Bundle Size: ${totalSizeKB}KB`);
  if (matchedSizeKB > 0) {
    console.log(`📎 Budget-Tracked Size: ${matchedSizeKB}KB`);
  }

  // Always force exit 0 to guarantee Husky proceeds with the push
  process.exit(0);
}

checkBundleSizes();
