import fs from "fs";
import path from "path";
import { countPlacesOfPositiveInteger } from "./util/countPlacesOfPositiveInteger.mjs";

const indentationSpacing = 3;

class ViewScriptCompileError extends Error {}

function printSource(fileLines) {
  const fileLineNumberPlacesMax = countPlacesOfPositiveInteger(
    fileLines.length
  );

  console.log(
    `\n 💧 \x1b[32m\x1b[1m SOURCE\n\n\x1b[0m${fileLines
      .map(
        (line, L) =>
          `\x1b[36m${new Array(
            fileLineNumberPlacesMax - countPlacesOfPositiveInteger(L + 1)
          )
            .fill(" ")
            .join("")}${L + 1}\x1b[0m\  ${line}`
      )
      .join("\n")}\n`
  );
}

function check(condition, message, lineNumber, lines) {
  if (!condition) {
    printSource(lines);

    console.log(
      `\n ⛔️ \x1b[31m\x1b[1m ERROR \x1b[0m\n\n\x1b[31m There is an error on line ${
        lineNumber + 1
      }:\n\x1b[33m${lines[lineNumber]}\n\n\x1b[31m ${message}\n\x1b[0m`
    );
    process.exitCode = 1;
    throw new ViewScriptCompileError(message);
  }
}

function makeTokens(fileLines) {
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
          check(
            consecutiveEmptyWords % indentationSpacing === 0,
            `Invalid indentation: Expected a multiple of 3 spaces.`,
            L,
            fileLines
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
          check(
            consecutiveTextParts === 0 || word.length === 1,
            `Invalid syntax: Expected a space after the closing quote.`,
            L,
            fileLines
          );
        } else if (
          word[word.length - 1] === '"' &&
          word[word.length - 2] !== "\\"
        ) {
          check(
            consecutiveTextParts > 0,
            `Invalid syntax: Expected a space before the opening quote.`,
            L,
            fileLines
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

  return tokens;
}

function makeTree(fileLines) {
  const tokens = makeTokens(fileLines);

  const tree = {
    members: [],
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

        check(
          isNaN(procedureName),
          `Invalid class name: Must not be a number.`,
          L,
          fileLines
        );

        check(
          !(
            !!procedureName &&
            typeof procedureName === "object" &&
            "text" in procedureName
          ),
          `Invalid class name: Must not be literal text.`,
          L,
          fileLines
        );

        check(
          !tree.members.some((member) => member.name === procedureName),
          `Invalid class name: Must be unique.`,
          L,
          fileLines
        );

        check(
          line[2] === "{",
          `Invalid syntax: Expected an opening brace after the class name.`,
          L,
          fileLines
        );

        const procedure = {
          compiler: {
            line: L + 1,
          },
          name: procedureName,
          kind: "View",
          body: [],
        };

        tree.members.push(procedure);
        cursor.push(procedure);
      }
    } else if (cursor[0]?.kind === "View") {
      if (line[0] === "}") {
        check(
          line.length === 1,
          `Invalid syntax: Expected a new line after the closing brace.`,
          L,
          fileLines
        );

        cursor = [];
      } else if (
        cursor.length === 1 ||
        (cursor.length === 2 && line[0].indent === 1)
      ) {
        check(
          line[0].indent === 1,
          `Invalid indentation: Expected 3 spaces.`,
          L,
          fileLines
        );

        const statement = line.slice(1);

        if (statement.length === 1) {
          check(
            isNaN(statement[0]),
            `Invalid class name: Must not be a number.`,
            L,
            fileLines
          );

          check(
            !(
              !!statement[0] &&
              typeof statement[0] === "object" &&
              "text" in statement[0]
            ),
            `Invalid class name: Must not be literal text.`,
            L,
            fileLines
          );

          const object = {
            compiler: {
              line: L + 1,
            },
            class: statement[0],
            properties: {},
          };

          cursor[0].body.push(object);

          if (cursor.length === 2) {
            cursor.pop();
          }

          cursor.push(object);
        } else {
          check(false, `Invalid statement.`, L, fileLines);
          // TODO Handle all possible types of statements.
        }
      } else if (cursor.length === 2) {
        check(
          line[0].indent === 2,
          `Invalid indentation: Expected 6 spaces.`,
          L,
          fileLines
        );

        const propertyName = line[1];

        check(
          isNaN(propertyName),
          `Invalid property name: Must not be a number.`,
          L,
          fileLines
        );

        check(
          !(
            !!propertyName &&
            typeof propertyName === "object" &&
            "text" in propertyName
          ),
          `Invalid property name: Must not be literal text.`,
          L,
          fileLines
        );

        check(
          !(propertyName in cursor[1].properties),
          `Invalid property name: Must be unique.`,
          L,
          fileLines
        );

        check(
          line[2] === "=",
          `Invalid syntax: Expected an equals sign after the property name.`,
          L,
          fileLines
        );

        const propertyValue = line.slice(3);

        if (
          !!propertyValue[0] &&
          typeof propertyValue[0] === "object" &&
          "text" in propertyValue[0]
        ) {
          check(
            propertyValue.length === 1,
            `Invalid syntax: Expected a new line after the closing quote.`,
            L,
            fileLines
          );

          cursor[1].properties[propertyName] = {
            compiler: {
              line: L + 1,
            },
            value: propertyValue[0],
          };
        } else if (typeof propertyValue[0] === "string") {
          const callArgument = propertyValue.slice(1);

          if (
            !!callArgument[0] &&
            typeof callArgument[0] === "object" &&
            "text" in callArgument[0]
          ) {
            check(
              callArgument.length === 1,
              `Invalid syntax: Expected a new line after the closing quote.`,
              L,
              fileLines
            );

            cursor[1].properties[propertyName] = {
              compiler: {
                line: L + 1,
              },
              value: {
                call: propertyValue[0],
                argument: propertyValue[1],
              },
            };
          } else {
            check(false, `Invalid call argument.`, L, fileLines);
            // TODO Handle all possible types of call arguments.
          }
        } else {
          check(false, `Invalid property value.`, L, fileLines);
          // TODO Handle all possible types of property values.
        }
      }
    }
  }

  check(
    tree.members[tree.members.length - 1].kind === "View",
    `Invalid class declaration: Expected a view declaration.`,
    tree.members[tree.members.length - 1].compiler.line + 1,
    fileLines
  );

  console.log(
    `\n 💧 \x1b[33m\x1b[1m TREE \x1b[0m\n\n${JSON.stringify(
      tree,
      null,
      2
    )}\n\n\n 💧 \x1b[33m\x1b[1m TOKENS \x1b[0m\n\n${JSON.stringify(
      tokens,
      null,
      2
    )}\n`
  );

  return tree;
}

function main() {
  console.log(`\x1b[1mWelcome to ViewScript v0.0.0.\n\x1b[0m`);

  const filename = process.argv[2];

  if (!filename) {
    const message = "You must provide the path to a file.";
    console.log(
      `\n ⛔️ \x1b[31m\x1b[1m ERROR\n\n\x1b[0m\x1b[31m ${message}\n\x1b[0m`
    );
    process.exitCode = 1;
    throw new ViewScriptCompileError(message);
  }

  console.log(
    `file =\x1b[33m ${filename} \x1b[0m\x1b[36mCompiling HTML and JavaScript...\n\x1b[0m`
  );

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");
  const fileLines = fileContent.split("\n");

  const tree = makeTree(fileLines);

  printSource(fileLines);

  // TODO Add a type-checking step.
  // TODO Create a new file which imports the runtime and the above tree.
  // TODO Use webpack or similar to generate HTML and JS for production.
}

main();

// TODO Replace indentation spaces in error messages with this character: ・
