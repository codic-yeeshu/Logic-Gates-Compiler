# Lexical analysis

Assigned owner: **Dibya-z**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/lexer.py`
- Entry point: `tokenize(source)`
- Input: Source text.
- Output: List of Token records, including EOF.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

The scanner repeatedly matches a comment, whitespace, identifier, bit, or punctuation at the current offset. It classifies complete identifiers as keywords only after matching, then advances line and column. A nonmatching character raises INVALID_CHARACTER. Whitespace containing CRLF, LF, or a lone CR advances the line number once per line break; columns count code points and a tab counts as one column.

## Worked example

```text
INPUT a;
```

Expected structure:

```text
INPUT("INPUT"), IDENT("a"), SEMI(";"), EOF
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase lexical
.venv/bin/python -m pytest backend/tests/test_lexer.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why does ANDY remain an identifier?** Keyword lookup happens after matching the whole identifier, so AND is not taken as a prefix.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
