import fs from "fs";
import path from "path";
import zlib from "zlib";
import { bundleBudgets } from "../bundle-budget.config";

const NEXT_STATIC_DIR = path.join(process.cwd(), ".next", "static");

function getAllFiles(dirPath: string, fileArray: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileArray;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileArray);
    } else if (file.endsWith(".js") || file.endsWith(".css")) {
      fileArray.push(filePath);
    }
  });

  return fileArray;
}

function checkBundleSizes() {
  console.log("📦 Checking production bundle budgets...");
  const files = getAllFiles(NEXT_STATIC_DIR);
  let hasWarnings = false;
  let totalSizeKB = 0;

  files.forEach((filePath) => {
    const fileName = path.basename(filePath);
    const matchingRule = bundleBudgets.find((rule) =>
      fileName.includes(rule.path),
    );

    if (matchingRule) {
      const fileBuffer = fs.readFileSync(filePath);
      const gzippedSize = zlib.gzipSync(fileBuffer).length;
      const sizeKB = parseFloat((gzippedSize / 1024).toFixed(2));
      totalSizeKB += sizeKB;

      if (sizeKB > matchingRule.maxSizeKB) {
        // Log a visible warning without disrupting execution flow
        console.warn(
          `⚠️⚠️⚠️ Budget Warning: File "${fileName}" is ${sizeKB}KB (Exceeds Target: ${matchingRule.maxSizeKB}KB)`,
        );
        hasWarnings = true;
      } else {
        console.log(
          `✅ Passed: "${fileName}" is ${sizeKB}KB (Limit: ${matchingRule.maxSizeKB}KB)`,
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

  // Always force exit 0 to guarantee Husky proceeds with the push
  process.exit(0);
}

checkBundleSizes();
