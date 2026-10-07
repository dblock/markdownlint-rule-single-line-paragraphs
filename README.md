# markdownlint-rule-single-line-paragraphs

[![CI](https://github.com/dblock/markdownlint-rule-single-line-paragraphs/actions/workflows/ci.yml/badge.svg)](https://github.com/dblock/markdownlint-rule-single-line-paragraphs/actions/workflows/ci.yml)

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule that requires each prose paragraph to use one source line.

The rule applies to paragraphs at the document root and inside lists or blockquotes. It permits explicit Markdown hard breaks created by two or more trailing spaces or an unescaped trailing backslash. It does not apply to headings, code blocks, tables, HTML blocks, front matter, or definitions.

## Motivation

[To Wrap or Not to Wrap in Markdown?](https://code.dblock.org/2021/06/07/to-wrap-or-not-to-wrap-in-markdown.html) explains the motivation for keeping each paragraph on one source line. Soft line breaks do not affect rendered Markdown, but wrapping and reflowing prose can turn a small wording edit into changes across several lines. Keeping a paragraph on one line produces cleaner diffs and lets GitHub highlight the words that actually changed.

## Usage

Load the exported rule through markdownlint's `customRules` option and enable it with the `enabled` rule name:

```javascript
const rule = require("markdownlint-rule-single-line-paragraphs");
const options = {
  "customRules": [ rule ],
  "config": {
    "enabled": true
  }
};
```

The rule reports one issue on the first line of each soft-wrapped paragraph segment and one issue on every continuation line. This coordinated set of diagnostics lets markdownlint's fix mode append the continuation text to the first line and delete the original continuation lines.

## Violations

This paragraph is soft-wrapped across two source lines:

```markdown
A quick brown fox jumps
over the lazy dog.
```

The rule reports a violation on both lines. The first violation identifies the line that should absorb the continuation text, and the second identifies the continuation line that should be removed.

A paragraph on one source line is valid, regardless of its length:

```markdown
A quick brown fox jumps over the lazy dog.
```

Explicit Markdown hard breaks remain valid:

```markdown
This line ends with a hard break.  
This line remains separate.
```

## Fixing

When the markdownlint integration supports fixes, applying them converts the soft-wrapped example into:

```markdown
A quick brown fox jumps over the lazy dog.
```

The fix attached to the first violation appends the continuation text. The fix attached to each continuation-line violation deletes that original line. For paragraphs spanning more than two lines, all continuation text is appended in order and every continuation line is removed.

Fixing preserves explicit hard breaks and their following lines. It also removes list indentation and blockquote prefixes from continuation lines when joining their text:

```markdown
- A list item
  continued on another line.

> A blockquote
> continued on another line.
```

becomes:

```markdown
- A list item continued on another line.

> A blockquote continued on another line.
```
