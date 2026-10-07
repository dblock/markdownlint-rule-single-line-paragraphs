"use strict";

const excludedAncestorTypes = new Set([
  "atxHeading",
  "htmlFlow",
  "setextHeading"
]);

function getParagraphs(tokens, ancestors = [], paragraphs = []) {
  for (const token of tokens) {
    if (
      (token.type === "paragraph") &&
      !ancestors.some((ancestor) => excludedAncestorTypes.has(ancestor.type))
    ) {
      paragraphs.push(token);
    }
    getParagraphs(token.children || [], [ ...ancestors, token ], paragraphs);
  }
  return paragraphs;
}

function isHardBreak(line) {
  const trailingSpaces = line.length - line.trimEnd().length;
  if (trailingSpaces >= 2) {
    return true;
  }
  if (trailingSpaces > 0) {
    return false;
  }
  let backslashes = 0;
  for (let index = line.length - 1; (index >= 0) && (line[index] === "\\"); index--) {
    backslashes++;
  }
  return (backslashes % 2) === 1;
}

/** @type {import("markdownlint").Rule} */
const rule = {
  "names": [ "enabled" ],
  "description": "Prose paragraphs should each use a single source line",
  "tags": [ "line_length" ],
  "parser": "micromark",
  "function": (params, onError) => {
    const paragraphs = getParagraphs(params.parsers.micromark.tokens);
    for (const paragraph of paragraphs) {
      for (let lineNumber = paragraph.startLine; lineNumber < paragraph.endLine; lineNumber++) {
        if (!isHardBreak(params.lines[lineNumber - 1])) {
          onError({
            "lineNumber": lineNumber + 1,
            "detail": "Expected paragraph on a single source line.",
            "context": params.lines[lineNumber]
          });
          break;
        }
      }
    }
  }
};

module.exports = rule;
