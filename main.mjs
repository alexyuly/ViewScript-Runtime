import assert from "assert";
import fs from "fs";
import path from "path";

const indentationSpacing = 3;

function main() {
  const filename = process.argv[2];
  assert(!!filename, "You must provide the path to a file");

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");
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
          file.splice(L, 1, {
            empty: true,
          });
        } else {
          consecutiveEmptyWords++;
        }
      } else {
        if (consecutiveEmptyWords > 0) {
          assert(
            consecutiveEmptyWords % indentationSpacing === 0,
            `Invalid indentation is at line ${L}. Indentation must be in multiples of 3 spaces.`
          );

          const indentation = consecutiveEmptyWords / indentationSpacing;

          line.splice(W - consecutiveEmptyWords, consecutiveEmptyWords, {
            indentation,
          });

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
            `Invalid character detected at line ${L}, word ${W}. Space must come before opening quote of text.`
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

  console.log(JSON.stringify(file, null, 2));
}

main();
