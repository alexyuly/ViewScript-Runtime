import assert from "assert";
import fs from "fs";
import path from "path";

const indentationSpacing = 3;

function main() {
    const filename = process.argv[2];
    assert(!!filename, "You must provide the path to a file.");

    const fileContent = fs.readFileSync(path.resolve(filename), "utf8");
    console.log("fileContent:")
    console.log(fileContent);
    console.log();

    const fileLines = fileContent.split("\n");
    console.log("fileLines:");
    console.log(JSON.stringify(fileLines, null, 2));
    console.log();

    const fileSplitLines = fileLines.map(line => line.split(" "));
    console.log("fileSplitLines:");
    console.log(JSON.stringify(fileSplitLines, null, 2));
    console.log();

    for (const line of fileSplitLines) {
        let consecutiveEmptyWords = 0;
        let isInsideString = false;

        for (const word of line) {
            if (word === " ") {
                consecutiveEmptyWords++;
            } else {
                if (consecutiveEmptyWords > 0) {
                    if (consecutiveEmptyWords % indentationSpacing === 0) {
                        const indentationLevel = consecutiveEmptyWords / indentationSpacing;
                        // TODO splice in a node with indentation level in place of empty words
                    } else {
                        // Invalid indentation detected
                        // TODO throw error
                    }
                }

                // TODO process strings
            }
        }
    }
}

main();
