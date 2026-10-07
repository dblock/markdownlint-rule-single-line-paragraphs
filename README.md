# markdownlint-rule-single-line-paragraphs

[![CI](https://github.com/dblock/markdownlint-rule-single-line-paragraphs/actions/workflows/ci.yml/badge.svg)](https://github.com/dblock/markdownlint-rule-single-line-paragraphs/actions/workflows/ci.yml)

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule that requires each prose paragraph to use one source line.

The rule applies to paragraphs at the document root and inside lists or blockquotes. It permits explicit Markdown hard breaks created by two or more trailing spaces or an unescaped trailing backslash. It does not apply to headings, code blocks, tables, HTML blocks, front matter, or definitions.

## Motivation

[To Wrap or Not to Wrap in Markdown?](https://code.dblock.org/2021/06/07/to-wrap-or-not-to-wrap-in-markdown.html) explains the motivation for keeping each paragraph on one source line. Soft line breaks do not affect rendered Markdown, but wrapping and reflowing prose can turn a small wording edit into changes across several lines. Keeping a paragraph on one line produces cleaner diffs and lets GitHub highlight the words that actually changed.

## Usage

Load the exported rule through markdownlint's `customRules` option and enable it with the `enable` rule name:

```javascript
const rule = require("markdownlint-rule-single-line-paragraphs");
const options = {
  "customRules": [ rule ],
  "config": {
    "enable": true
  }
};
```

The rule reports one issue per soft-wrapped paragraph on its first continuation line. It does not provide an automatic fix.
