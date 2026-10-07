import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { applyFixes } from "markdownlint";
import { lint } from "markdownlint/sync";

const require = createRequire(import.meta.url);
const rule = require("../index.cjs");

function lintContent(content) {
  const result = lint({
    "strings": { content },
    "customRules": [ rule ],
    "config": {
      "default": false,
      "enabled": true
    }
  });
  return result.content;
}

function errorsFor(content) {
  return lintContent(content).map(({ lineNumber }) => lineNumber);
}

function fixedContent(content) {
  return applyFixes(content, lintContent(content));
}

test("reports every line in each soft-wrapped paragraph", () => {
  const content = [
    "This is one paragraph",
    "with two continuation",
    "lines.",
    "",
    "This is another",
    "wrapped paragraph."
  ].join("\n");
  assert.deepEqual(errorsFor(content), [ 1, 2, 3, 5, 6 ]);
  assert.equal(
    fixedContent(content),
    [
      "This is one paragraph with two continuation lines.",
      "",
      "This is another wrapped paragraph."
    ].join("\n")
  );
});

test("checks paragraphs in lists and blockquotes", () => {
  const content = [
    "- A list item",
    "  with a continuation.",
    "",
    "  - A nested item",
    "    with a continuation.",
    "",
    "> A blockquote",
    "> with a continuation."
  ].join("\n");
  assert.deepEqual(errorsFor(content), [ 1, 2, 4, 5, 7, 8 ]);
  assert.equal(
    fixedContent(content),
    [
      "- A list item with a continuation.",
      "",
      "  - A nested item with a continuation.",
      "",
      "> A blockquote with a continuation."
    ].join("\n")
  );
});

test("allows explicit hard breaks", () => {
  const content = [
    "Trailing spaces create a hard break.  ",
    "This remains the same paragraph.",
    "",
    "A backslash creates a hard break.\\",
    "This remains the same paragraph.",
    "",
    "Two backslashes do not create a hard break.\\\\",
    "This is a soft continuation."
  ].join("\n");
  assert.deepEqual(errorsFor(content), [ 7, 8 ]);
  assert.equal(
    fixedContent(content),
    [
      "Trailing spaces create a hard break.  ",
      "This remains the same paragraph.",
      "",
      "A backslash creates a hard break.\\",
      "This remains the same paragraph.",
      "",
      "Two backslashes do not create a hard break.\\\\ This is a soft continuation."
    ].join("\n")
  );
});

test("checks paragraphs containing inline markup", () => {
  const content = [
    "A paragraph with *emphasis* and",
    "a [link](https://example.com) plus `code`."
  ].join("\n");
  assert.deepEqual(errorsFor(content), [ 1, 2 ]);
  assert.equal(
    fixedContent(content),
    "A paragraph with *emphasis* and a [link](https://example.com) plus `code`."
  );
});

test("fixes soft wrapping after an explicit hard break", () => {
  const content = [
    "An explicit hard break remains.  ",
    "This line is softly",
    "wrapped."
  ].join("\n");
  assert.deepEqual(errorsFor(content), [ 2, 3 ]);
  assert.equal(
    fixedContent(content),
    [
      "An explicit hard break remains.  ",
      "This line is softly wrapped."
    ].join("\n")
  );
});

test("ignores non-paragraph block constructs", () => {
  const content = [
    "---",
    "title: Example",
    "---",
    "",
    "# ATX heading",
    "",
    "Setext heading",
    "==============",
    "",
    "```text",
    "wrapped code",
    "is allowed",
    "```",
    "",
    "    Indented code",
    "    is allowed",
    "",
    "| Header |",
    "| ------ |",
    "| Value  |",
    "",
    "<div>",
    "HTML block content",
    "</div>",
    "",
    "[reference]: https://example.com"
  ].join("\n");
  assert.deepEqual(errorsFor(content), []);
});

test("allows long single-line paragraphs", () => {
  const content = "This paragraph is intentionally much longer than a typical configured line-length limit but remains on one source line.";
  assert.deepEqual(errorsFor(content), []);
});
