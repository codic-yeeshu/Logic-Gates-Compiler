# Semantic analysis

Assigned owner: **prince0906**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/semantic.py`
- Entry point: `analyze(ast)`
- Input: AST.
- Output: Symbols, dependencies, input/output lists, and ordered assignments.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Build a single symbol table, check declarations and assignments, collect expression references, and verify every non-input is assigned. DFS uses active and done sets: revisiting an active signal detects a cycle; finishing a signal appends it after its dependencies.

## Worked example

```text
INPUT a; WIRE w; OUTPUT out; out=w; w=NOT a;
```

Expected structure:

```text
order=[w,out], dependencies={out:[w],w:[a]}
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase semantic
.venv/bin/python -m pytest backend/tests/test_semantic.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why does the parser not reject an undeclared name?** An identifier is grammatically valid. Resolving it against declarations requires semantic context.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
