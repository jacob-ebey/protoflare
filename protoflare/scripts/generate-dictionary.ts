import { writeFileSync } from "node:fs";
import { join } from "path";

const DICTIONARY_URL =
  "https://github.com/bluesky-social/jetstream/raw/refs/heads/main/pkg/models/zstd_dictionary";
const OUTPUT_PATH = join(process.cwd(), "src", "decompress-dict.ts");

async function downloadDictionary(): Promise<Uint8Array> {
  console.log("Downloading zstd dictionary from Jetstream...");

  const response = await fetch(DICTIONARY_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to download dictionary: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function generateTypeScriptFile(dictionary: Uint8Array): string {
  const values = Array.from(dictionary).join(", ");

  return `// Auto-generated file - do not edit manually
// Generated from: ${DICTIONARY_URL}
// Generated at: ${new Date().toISOString()}

export const decompressDict = new Uint8Array([${values}]);
`;
}

const dictionary = await downloadDictionary();
console.log(`Downloaded dictionary: ${dictionary.length} bytes`);

const tsContent = generateTypeScriptFile(dictionary);
writeFileSync(OUTPUT_PATH, tsContent, "utf8");

console.log(`Generated TypeScript file: ${OUTPUT_PATH}`);
console.log("Dictionary generation complete!");
