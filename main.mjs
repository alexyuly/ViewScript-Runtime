import assert from "assert";
import fs from "fs";
import path from "path";

const indentationSpacing = 3;

function main() {
  const filename = process.argv[2];
  assert(!!filename, "You must provide the path to a file");

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");
  console.log("fileContent:");
  console.log(fileContent);
  console.log();

  const fileLines = fileContent.split("\n");
  console.log("fileLines:");
  console.log(JSON.stringify(fileLines, null, 2));
  console.log();

  const fileSplitLines = fileLines.map((line) => line.split(" "));
  console.log("fileSplitLines:");
  console.log(JSON.stringify(fileSplitLines, null, 2));
  console.log();

  for (let i = 0; i < fileSplitLines.length; i++) {
    const line = fileSplitLines[i];

    let consecutiveEmptyWords = 0;
    let isInsideString = false;

    for (let j = 0; j < line.length; j++) {
      const word = line[j];

      if (word === "") {
        if (line.length === 1) {
          // This is an empty line.
          fileSplitLines.splice(i, 1, { empty: true });
        } else {
          consecutiveEmptyWords++;
        }
      } else {
        if (consecutiveEmptyWords > 0) {
          assert(
            consecutiveEmptyWords % indentationSpacing === 0,
            `Invalid indentation detected at line ${i}. Indentation must be in multiples of 3 spaces.`
          );

          const indentationLevel = consecutiveEmptyWords / indentationSpacing;

          line.splice(j - consecutiveEmptyWords, consecutiveEmptyWords, {
            indentationLevel,
          });
        }

        // TODO process strings
      }
    }
  }

  console.log("fileSplitLines:");
  console.log(JSON.stringify(fileSplitLines, null, 2));
  console.log();
}

main();
