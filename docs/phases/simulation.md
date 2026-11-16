# Simulation and truth tables

Assigned owner: **codic-yeeshu**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/simulation.py`
- Entry point: `simulate(netlist)`
- Input: Ordered generated netlist.
- Output: Columns, binary rows, and row_count.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Enumerate binary input tuples in declaration order. Initialize constants and inputs, then execute gates in order and extract outputs. A constant-only circuit has a single empty input tuple. The frontend repeats gate evaluation for live switches; the exhaustive table is produced by Python.

## Worked example

```text
INPUT a; OUTPUT out; out=NOT a;
```

Expected structure:

```text
columns=[a,out], rows=[[0,1],[1,0]]
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase simulation
.venv/bin/python -m pytest backend/tests/test_codegen.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Why cap inputs at 12?** Truth-table size doubles per added input: 12 inputs produce 4096 rows. Complexity is exponential even though one circuit evaluation is linear in its gates.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
