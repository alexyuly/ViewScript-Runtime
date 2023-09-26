import fs from "fs";
import path from "path";
import { countPlacesOfPositiveInteger } from "./util/countPlacesOfPositiveInteger.mjs";

const viewScriptVersion = "0.0.0";

const indentationSpacing = 3;

const reservedWords = [
  "action",
  "catch",
  "collection",
  "condition",
  "else",
  "empty",
  "false",
  "if",
  "import",
  "model",
  "number",
  "optional",
  "output",
  "task",
  "text",
  "then",
  "true",
  "view",
  "window",
];

class ViewScriptCompileError extends Error {}

function printSource(fileLines, focusedLineNumber) {
  const fileLineNumberPlacesMax = countPlacesOfPositiveInteger(
    fileLines.length
  );

  console.log(
    `\n 🌱 \x1b[32m\x1b[1m SOURCE\n\n\x1b[0m${fileLines
      .map(
        (line, L) =>
          `${new Array(
            fileLineNumberPlacesMax - countPlacesOfPositiveInteger(L + 1)
          )
            .fill(" ")
            .join("")}${L === focusedLineNumber ? "\x1b[31m" : "\x1b[36m"}${
            L + 1
          }\x1b[0m\  ${L === focusedLineNumber ? "\x1b[33m" : ""}${line}\x1b[0m`
      )
      .join("\n")}\n`
  );
}

function check(condition, message, lineNumber, lines) {
  if (!condition) {
    printSource(lines, lineNumber);

    console.log(
      `\n 📣 \x1b[33m\x1b[1m ERROR \x1b[0m\n\n\x1b[31m There is an error on line ${
        lineNumber + 1
      }:\n\x1b[33m${lines[lineNumber]}\n\n\x1b[31m ${message}\n\x1b[0m`
    );
    process.exitCode = 1;
    throw new ViewScriptCompileError(message);
  }
}

function checkName(name, qualifier, lineNumber, lines) {
  check(
    typeof name === "string",
    `Invalid ${qualifier} name: Must not be literal text.`,
    lineNumber,
    lines
  );

  check(
    /^([\w-])+$/.test(name),
    `Invalid ${qualifier} name: Must contain only alphanumeric, underscore, and hyphen characters.`
  );

  check(
    isNaN(name),
    `Invalid ${qualifier} name: Must not be a number.`,
    lineNumber,
    lines
  );

  check(
    !reservedWords.includes(name.toLowerCase()),
    `Invalid ${qualifier} name: Must not be a reserved word.`,
    lineNumber,
    lines
  );
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

        checkName(procedureName, "view", L, fileLines);

        check(
          !tree.members.some((member) => member.name === procedureName),
          `Invalid syntax: Expected a unique name.`,
          L,
          fileLines
        );

        check(
          line[2] === "{",
          `Invalid syntax: Expected an opening brace after the view name.`,
          L,
          fileLines
        );

        const procedure = {
          source: {
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
          checkName(statement[0], "class", L, fileLines);

          const object = {
            source: {
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
          checkName(statement[0], "model", L, fileLines);

          checkName(statement[1], "field", L, fileLines);

          const field = {
            source: {
              line: L + 1,
            },
            field: statement[1],
            model: statement[0],
          };

          if (statement[2] === "=") {
            check(
              statement[3] === "false" ||
                statement[3] === "true" ||
                (!!statement[3] &&
                  typeof statement[3] === "object" &&
                  "text" in statement[3]),
              `Invalid syntax: Expected a literal value after the equals sign.`,
              L,
              fileLines
            );

            field.value = statement[3];
          }

          cursor[0].body.push(field);
        }
      } else if (cursor.length === 2) {
        check(
          line[0].indent === 2,
          `Invalid indentation: Expected 6 spaces.`,
          L,
          fileLines
        );

        const propertyName = line[1];

        checkName(propertyName, "property", L, fileLines);

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

        let value;

        if (propertyValue[0] === "if") {
          // TODO ...

          check(
            propertyValue[2] === "then",
            `Invalid syntax: Expected \`then\` after conditional expression.`,
            L,
            fileLines
          );

          // if (propertyValue[4] === "else") {
          // }
        } else if (propertyValue.length === 1) {
          if (typeof propertyValue[0] !== "object") {
            checkName(propertyValue[0], "callable", L, fileLines);
          }

          value =
            typeof propertyValue[0] === "object"
              ? propertyValue[0]
              : { callable: propertyValue[0] };
        } else if (propertyValue.length === 2) {
          // TODO fix this ....
          checkName(propertyValue[0], "callable", L, fileLines);

          const argument = propertyValue.slice(1);

          if (argument.length === 1) {
            if (typeof propertyValue[0] !== "object") {
              checkName(propertyValue[0], "callable", L, fileLines);
            }

            value = {
              callable: propertyValue[0],
              argument:
                typeof argument === "object"
                  ? argument
                  : { callable: argument },
            };
          }
        } else {
          check(false, `Invalid property value.`, L, fileLines);
        }

        cursor[1].properties[propertyName] = {
          source: {
            line: L + 1,
          },
          value,
        };
      }
    }
  }

  check(
    tree.members[tree.members.length - 1].kind === "View",
    `Invalid class declaration: Expected a view declaration.`,
    tree.members[tree.members.length - 1].source.line + 1,
    fileLines
  );

  console.log(
    `\n 🌳 \x1b[32m\x1b[1m TREE \x1b[0m\n\n${JSON.stringify(
      tree,
      null,
      2
    )}\n\n\n 🌿 \x1b[32m\x1b[1m TOKENS \x1b[0m\n\n${JSON.stringify(
      tokens,
      null,
      2
    )}\n`
  );

  return tree;
}

function main() {
  console.log(
    `\x1b[1m\x1b[36mWelcome to ViewScript v${viewScriptVersion}.\n\x1b[0m`
  );

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
    `\x1b[36m 💬  Compiling HTML and JavaScript from ${filename}\n\x1b[0m`
  );

  const fileContent = fs.readFileSync(path.resolve(filename), "utf8");
  const fileLines = fileContent.split("\n");

  const tree = makeTree(fileLines);

  printSource(fileLines);

  // TODO Add a type-checking step.
  // TODO Create a new file which imports the runtime and the tree.
  // TODO Generate HTML and JS for production using webpack.
  // TODO Log the total elapsed time.
}

main();
