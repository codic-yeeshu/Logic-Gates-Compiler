# Code generation

Assigned owner: **codic-yeeshu**. Initial implementation is AI-assisted; member review is recorded separately.

## Contract

- Implementation: `backend/compiler/codegen.py`
- Entry point: `generate(ir)`
- Input: Optimized or original IR.
- Output: Netlist, Verilog source, and port map.
- Viewer: select this phase, then Input / Output / Explanation / JSON.

## Algorithm

Allocate safe Verilog names for ports before internal destinations. Emit a gate primitive for each Boolean operation and continuous assign for COPY. Preserve the original logical names and source spans in the JSON netlist. Every primitive reads previously defined signals.

## Worked example

```text
out = NOT a;
```

Expected structure:

```text
not g0 (internal,a_port); assign out_port = internal;
```

## How to inspect and test

```sh
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase codegen
.venv/bin/python -m pytest backend/tests/test_codegen.py -q
```

The CLI shows the exact serialized boundary of this module. Tests may exercise upstream phases to construct valid inputs. The compiler module itself has no dependency on the HTTP server or React.

## Viva questions

**Is code generation a compiler phase?** Yes. It translates IR into target-specific syntax and representation, handling names, ports, wires, and operation lowering.

**What comes before and after this phase?** Refer to the pipeline in the README and describe the concrete records crossing each boundary.

**How do errors propagate?** Lexical, syntax, and semantic failures produce a positioned diagnostic. The orchestrator preserves earlier outputs and blocks later phases. IR, optimization, code generation, and simulation assume validated contracts; an internal programming error is not disguised as a user syntax error.

**What should I demonstrate?** Run the worked example, inspect the phase input and output, identify the responsible function, and explain an edge case covered by the named tests. Review your module before claiming personal implementation or testing.
