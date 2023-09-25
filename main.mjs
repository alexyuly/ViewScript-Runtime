import assert from "assert";
import fs from "fs";
import path from "path";

const indentationSpacing = 3;

function makeTree(tokens) {
  const tree = {
    members: {},
  };

  let cursor = [];

  for (let L = 0; L < tokens.length; L++) {
    const line = tokens[L];

    if (line.length === 0) {
      continue;
    }

    if (cursor.length === 0) {
      if (line[0] === "View") {
        const procedureName = line[1];

        assert(
          isNaN(procedureName),
          `Invalid procedure name on line ${L}: Must not be a number.`
        );

        assert(
          !(
            !!procedureName &&
            typeof procedureName === "object" &&
            "text" in procedureName
          ),
          `Invalid procedure name on line ${L}: Must not be literal text.`
        );

        assert(
          !(procedureName in tree.members),
          `Invalid procedure name on line ${L}: Must be unique.`
        );

        assert(
          line[2] === "{",
          `Invalid syntax on line ${L}: Expected an opening brace after the procedure name.`
        );

        const procedure = {
          procedure: "View",
          body: [],
        };

        tree.members[procedureName] = procedure;
        cursor.push(procedure);
      }
    } else if (cursor[0]?.procedure === "View") {
      if (line[0] === "}") {
        assert(
          line.length === 1,
          `Invalid syntax on line ${L}: Expected a new line after the closing brace.`
        );

        cursor = [];
      } else if (
        cursor.length === 1 ||
        (cursor.length === 2 && line[0].indent === 1)
      ) {
        assert(
          line[0].indent === 1,
          `Invalid indentation on line ${L}: Expected 3 spaces.`
        );

        const object = {
          object: line[1],
          properties: {},
        };

        cursor[0].body.push(object);

        if (cursor.length === 2) {
          cursor.pop();
        }

        cursor.push(object);
      } else if (cursor.length === 2) {
        assert(
          line[0].indent === 2,
          `Invalid indentation on line ${L}: Expected 6 spaces.`
        );

        const propertyName = line[1];

        assert(
          isNaN(propertyName),
          `Invalid property name on line ${L}: Must not be a number.`
        );

        assert(
          !(
            !!propertyName &&
            typeof propertyName === "object" &&
            "text" in propertyName
          ),
          `Invalid property name on line ${L}: Must not be literal text.`
        );

        assert(
          !(propertyName in cursor[1].properties),
          `Invalid property name on line ${L}: Must be unique.`
        );

        assert(
          line[2] === "=",
          `Invalid syntax on line ${L}: Expected an equals sign after the property name.`
        );

        const propertyValue = line.slice(3);

        if (
          !!propertyValue[0] &&
          typeof propertyValue[0] === "object" &&
          "text" in propertyValue[0]
        ) {
          assert(
            propertyValue.length === 1,
            `Invalid syntax on line ${L}: Expected a new line after the closing quote.`
          );

          cursor[1].properties[propertyName] = propertyValue[0];
        } else {
          throw new Error(`Invalid property value on line ${L}`);
          // TODO Handle all possible types of values.
        }
      }
    }
  }

  console.log("\n💧 \x1b[32m TREE \x1b[0m \n\n");
  console.log(JSON.stringify(tree, null, 2));

  return tree;
}

function makeTokens(fileContent) {
  const fileLines = fileContent.split("\n");
  const tokens = fileLines.map((line) => line.split(" "));

  for (let L = 0; L < tokens.length; L++) {
    const line = tokens[L];

    let consecutiveEmptyWords = 0;
    let consecutiveTextParts = 0;

    for (let W = 0; W < line.length; W++) {
      const word = line[W];

      let wordIndexOffset = 0;

      if (word === "") {
        if (line.length === 1) {
          tokens.splice(L, 1, []);
        } else {
          consecutiveEmptyWords++;
        }
      } else {
        if (consecutiveEmptyWords > 0) {
          assert(
            consecutiveEmptyWords % indentationSpacing === 0,
            `Invalid indentation on line ${L}: Expected a multiple of 3 spaces.`
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
            `Invalid syntax on line ${L}: Expected a space after the closing quote.`
          );
        } else if (
          word[word.length - 1] === '"' &&
          word[word.length - 2] !== "\\"
        ) {
          assert(
            consecutiveTextParts > 0,
            `Invalid syntax on line ${L}: Expected a space before the opening quote.`
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
  console.log(JSON.stringify(tokens, null, 2));

  return tokens;
}

function main() {
  console.log("\x1b[1mWelcome to ViewScript v0.0.0. \x1b[0m \n");

  const filename = process.argv[2];
  assert(!!filename, "You must provide the path to a file");

  console.log(`file =\x1b[33m ${filename} \x1b[0m`);
  console.log("\x1b[36mCompiling HTML and JavaScript... \x1b[0m\n");

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");

  console.log("\n💧 \x1b[32m SOURCE \x1b[0m \n\n");
  console.log(fileContent);

  const tokens = makeTokens(fileContent);
  const tree = makeTree(tokens);

  // TODO Create a new file which imports the runtime and the above tree
  // TODO Use webpack or similar to generate HTML and JS for production
}

main();
