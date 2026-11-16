# Syntax analysis

Assigned owner: **rhythm8877**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/parser.py`
- Entry point: `parse(tokens)`
- Input: Positioned tokens.
- Output: AST with declarations and assignments, plus a parsing trace.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Recursive descent recognizes declarations and assignments. Precedence climbing parses binary operators; a higher minimum precedence on the right makes binary tiers left-associative. NOT recurses at the highest tier. Parentheses restart at the lowest tier. AST height and recursive depth are checked.

## Worked example

```text
out = a OR b AND NOT c;
```

Expected structure:

```text
OR(reference a, AND(reference b, NOT(reference c)))
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase syntax
.venv/bin/python -m pytest backend/tests/test_parser.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why is an AST smaller than a parse tree?** The AST keeps meaningful operators and operands, removing punctuation and intermediate grammar productions.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
