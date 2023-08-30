import assert from "assert";
import fs from "fs";
import path from "path";

/**
 * Main entry point for the Compendium Core library via CLI
 */
(function main() {
  const filename = process.argv[2];
  assert(!!filename, "You must provide the path to a file");

  // TODO Convert to async reading line by line?
  const file_content = fs.readFileSync(path.resolve(filename), "utf8");
  console.log("fileContent", file_content);

  const file_lines = file_content.split("\n");
  // TODO Continue !!!
})();
