# markdownlint-rule-single-line-paragraphs

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule that
requires each prose paragraph to use one source line.

The rule applies to paragraphs at the document root and inside lists or
blockquotes. It permits explicit Markdown hard breaks created by two or more
trailing spaces or an unescaped trailing backslash. It does not apply to
headings, code blocks, tables, HTML blocks, front matter, or definitions.

## Usage

Load the exported rule through markdownlint's `customRules` option and enable
`single-line-paragraphs`:

```javascript
const rule = require("markdownlint-rule-single-line-paragraphs");
const options = {
  "customRules": [ rule ],
  "config": {
    "single-line-paragraphs": true
  }
};
```

The alias `no-hard-wrap` is also available.

The rule reports one issue per soft-wrapped paragraph on its first continuation
line. It does not provide an automatic fix.
