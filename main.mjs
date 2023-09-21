import assert from "assert";
import fs from "fs";
import path from "path";

function concrete(ast) {
  // TODO
}

function abstract(tokens) {
  // TODO
}

const indentationSpacing = 3;

function tokenize(fileContent) {
  const fileLines = fileContent.split("\n");
  const file = fileLines.map((line) => line.split(" "));

  for (let L = 0; L < file.length; L++) {
    const line = file[L];

    let consecutiveEmptyWords = 0;
    let consecutiveTextParts = 0;

    for (let W = 0; W < line.length; W++) {
      const word = line[W];

      let wordIndexOffset = 0;

      if (word === "") {
        if (line.length === 1) {
          file.splice(L, 1, []);
        } else {
          consecutiveEmptyWords++;
        }
      } else {
        if (consecutiveEmptyWords > 0) {
          assert(
            consecutiveEmptyWords % indentationSpacing === 0,
            `Invalid indent is at line ${L}, word ${W}. Indentation must be a multiple of 3 spaces.`
          );

          const indentObject = {
            indent: consecutiveEmptyWords / indentationSpacing,
          };

          const listItem = word === "--";

          if (listItem) {
            indentObject.indent = indentObject.indent + 1;
            indentObject.listItem = true;
          }

          line.splice(
            W - consecutiveEmptyWords,
            consecutiveEmptyWords + (listItem ? 1 : 0),
            indentObject
          );

          wordIndexOffset += consecutiveEmptyWords - 1;

          consecutiveEmptyWords = 0;
        }

        if (word[0] === '"') {
          assert(
            consecutiveTextParts === 0 || word.length === 1,
            `Invalid character is at line ${L}, word ${W}. Space must come after closing quote of text.`
          );
        } else if (
          word[word.length - 1] === '"' &&
          word[word.length - 2] !== "\\"
        ) {
          assert(
            consecutiveTextParts > 0,
            `Invalid character is at line ${L}, word ${W}. Space must come before opening quote of text.`
          );
        }

        if (word[0] === '"' && consecutiveTextParts === 0) {
          if (word[word.length - 1] === '"' && word[word.length - 2] !== "\\") {
            line.splice(W - consecutiveTextParts, consecutiveTextParts + 1, {
              text: word.slice(1, word.length - 1),
            });
          } else {
            consecutiveTextParts++;
          }
        } else if (word[0] === '"' || word[word.length - 1] === '"') {
          line.splice(W - consecutiveTextParts, consecutiveTextParts + 1, {
            text: line
              .slice(W - consecutiveTextParts, W + 1)
              .reduce(
                (r, x, i, a) =>
                  r +
                  (i === 0
                    ? x.slice(1) + " "
                    : i === a.length - 1
                    ? x.slice(0, x.length - 1)
                    : x + " "),
                ""
              ),
          });

          wordIndexOffset += consecutiveTextParts - 1;

          consecutiveTextParts = 0;
        } else if (consecutiveTextParts > 0) {
          consecutiveTextParts++;
        }
      }

      W -= wordIndexOffset;
    }
  }

  console.log("\n💧 \x1b[32m TOKENS \x1b[0m \n\n");
  console.log(JSON.stringify(file, null, 2));

  return file;
}

function main() {
  console.log("\x1b[1mWelcome to ViewScript 0.0.0 \x1b[0m \n");

  const filename = process.argv[2];
  assert(!!filename, "You must provide the path to a file");

  console.log(`File: ${filename}`);
  console.log("Compiling HTML and JavaScript...\n");

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");

  console.log("\n💧 \x1b[32m SOURCE \x1b[0m \n\n");
  console.log(fileContent);

  const tokens = tokenize(fileContent);
  // TODO tokens -> AST
  // TODO AST -> CST
}

main();
