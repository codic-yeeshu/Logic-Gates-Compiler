# Intermediate representation

Assigned owner: **ritikraj2425**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/ir.py`
- Entry point: `generate_ir(program)`
- Input: Semantically validated program.
- Output: Ordered three-address instructions with input/output names.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Walk each expression in iterative postorder. Leaves already denote an operand; each operator emits a temporary. Emit COPY from the expression result to the assignment target. Assignment order comes from semantic analysis. Temporary names begin with %, which source identifiers cannot contain.

## Worked example

```text
out = a AND NOT b;
```

Expected structure:

```text
%0 = NOT b; %1 = AND a,%0; out = COPY %1
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase ir
.venv/bin/python -m pytest backend/tests/test_optimizer.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why are temporary numbers not consecutive across expressions?** The allocator uses total emitted instruction count, including COPY instructions. Gaps do not affect meaning.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
