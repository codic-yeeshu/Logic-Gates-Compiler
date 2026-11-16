# Optimization

Assigned owner: **ritikraj2425**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/optimizer.py`
- Entry point: `optimize(ir)`
- Input: Original IR.
- Output: Optimized IR and a before/after rewrite log.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Resolve known aliases before each instruction. Fold all-constant gates, simplify selected Boolean identities, remove double NOT, and value-number expressions. Canonicalize binary operand order because supported binary gates are commutative. Restore public output copies and sweep backward from outputs to remove dead computation.

## Worked example

```text
out = (a AND b) OR (b AND a);
```

Expected structure:

```text
One AND temporary, then COPY to out.
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase optimization
.venv/bin/python -m pytest backend/tests/test_optimizer.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why can we sort NAND operands but not freely regroup NAND chains?** NAND is commutative but not associative. CSE changes operand order within a binary instruction, never the parse grouping.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
