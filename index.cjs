"use strict";

const excludedAncestorTypes = new Set([
  "atxHeading",
  "htmlFlow",
  "setextHeading"
]);

const excludedContentTypes = new Set([
  "blockQuoteMarker",
  "blockQuotePrefix",
  "blockQuotePrefixWhitespace",
  "lineEnding",
  "lineEndingBlank",
  "linePrefix",
  "listItemIndent",
  "listItemMarker",
  "listItemPrefix",
  "listItemPrefixWhitespace"
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

function getContentStartColumns(paragraph) {
  const columns = new Map();
  function visit(tokens) {
    for (const token of tokens) {
      if (
        !excludedContentTypes.has(token.type) &&
        token.text &&
        (token.startLine === token.endLine)
      ) {
        const column = columns.get(token.startLine);
        if ((column === undefined) || (token.startColumn < column)) {
          columns.set(token.startLine, token.startColumn);
        }
      }
      visit(token.children || []);
    }
  }
  visit(paragraph.children || []);
  return columns;
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

function hasHtmlBreakAtEnd(line) {
  return /<br\s*\/?>\s*$/iu.test(line);
}

function hasHtmlBreakAtStart(line) {
  const content = line.replace(/^(?:(?: {0,3}>[ \t]?)|[ \t])*/u, "");
  return /^<br\s*\/?>/iu.test(content);
}

function isHardBoundary(line, nextLine) {
  return isHardBreak(line) ||
    hasHtmlBreakAtEnd(line) ||
    hasHtmlBreakAtStart(nextLine);
}

function getContinuationText(line, lineNumber, columns) {
  const fallbackColumn = (line.match(/^(?:(?: {0,3}>[ \t]?)|[ \t])*/u) || [ "" ])[0].length + 1;
  const column = columns.get(lineNumber) || fallbackColumn;
  const text = line.slice(column - 1);
  return (isHardBreak(line) || hasHtmlBreakAtEnd(line)) ? text : text.trimEnd();
}

function reportSoftWrap(params, onError, paragraph, baseLineNumber, continuationLineNumbers) {
  if (continuationLineNumbers.length === 0) {
    return;
  }
  const columns = getContentStartColumns(paragraph);
  const baseLine = params.lines[baseLineNumber - 1];
  const trailingSpaces = baseLine.length - baseLine.trimEnd().length;
  const continuation = continuationLineNumbers
    .map((lineNumber) =>
      getContinuationText(params.lines[lineNumber - 1], lineNumber, columns))
    .join(" ");
  onError({
    "lineNumber": baseLineNumber,
    "detail": "Join paragraph continuation line(s).",
    "context": baseLine,
    "fixInfo": {
      "editColumn": baseLine.length - trailingSpaces + 1,
      "deleteCount": trailingSpaces,
      "insertText": " " + continuation
    }
  });
  for (const lineNumber of continuationLineNumbers) {
    onError({
      lineNumber,
      "detail": "Delete paragraph continuation after joining it with the first line.",
      "context": params.lines[lineNumber - 1],
      "fixInfo": {
        "deleteCount": -1
      }
    });
  }
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
      let baseLineNumber = paragraph.startLine;
      let continuationLineNumbers = [];
      for (let lineNumber = paragraph.startLine; lineNumber < paragraph.endLine; lineNumber++) {
        if (isHardBoundary(
          params.lines[lineNumber - 1],
          params.lines[lineNumber]
        )) {
          reportSoftWrap(
            params,
            onError,
            paragraph,
            baseLineNumber,
            continuationLineNumbers
          );
          baseLineNumber = lineNumber + 1;
          continuationLineNumbers = [];
        } else {
          continuationLineNumbers.push(lineNumber + 1);
        }
      }
      reportSoftWrap(
        params,
        onError,
        paragraph,
        baseLineNumber,
        continuationLineNumbers
      );
    }
  }
};

module.exports = rule;
