# Verification record

Executed by the AI coding assistant on November 16, 2026. These checks are not represented as individual student work.

## Automated checks

- `.venv/bin/python -m pytest -q`: **73 passed, 0 skipped** (re-run on November 16, 2026 with Icarus Verilog 13.0 installed).
- The external Verilog equivalence tests (optimization enabled and disabled) now run and pass: the generated Verilog, simulated by `iverilog`/`vvp`, matches the compiler's own truth table.
- Generated equivalence cases: 150 deterministic programs × 8 input vectors. Each compares independent AST interpretation against original IR, optimized IR, and netlist evaluation for two outputs.
- Coverage includes every gate, constants, precedence, associativity, nested and long expressions, lexical positions, semantic diagnostics, cycles, forward dependencies, public-output aliases, resource bounds, full/half adders, multiplexers, and strict API request validation.
- Maximum supported truth-table size: 4096 rows checked.
- `npm --prefix frontend run build`: TypeScript and Vite production build pass. Vite notes a JavaScript bundle slightly above 500 KB before gzip; this is a size advisory, not a failed check.
- Dependency installation: Python requirements and frontend lockfile installed successfully. npm reported no dependency vulnerabilities at installation time.

## Observed browser behavior

- Introduction compiles with all seven phases complete and positioned tokens visible.
- Expandable AST correctly shows AND, OR, and NOT structure.
- Code-generation view shows the gate netlist and corresponding Verilog.
- Toggling c from 0 to 1 when a=b=0 changes out from 1 to 0.
- A Verilog download completed and was saved by the browser.
- Undefined-signal example fails at semantic analysis and blocks later phases.
- Clicking the diagnostic selects `missing` in the source editor.
- Optimization example displays 9 original instructions, 2 optimized instructions, and 8 rewrite events.
- Full-adder example displays its eight correct truth-table rows.
- At a 390-pixel viewport, document width remains 390 pixels and panels stack.
- The production static build at port 4173 successfully compiles against the separately running Python API and displays generated Verilog/circuit output.
- No browser console errors were recorded in the final production preview.
- `preview.png` captures the production frontend.

## Explicit limitations

- SVG, JSON, and CSV export controls are implemented; their individual downloaded files were not inspected in this browser pass.
- Keyboard shortcut, resize interaction, pagination beyond 32 rows, and network failure display are implemented but not individually exercised in this browser pass.
- The report uses IEEEtran. Local command-line LaTeX is unavailable; built-in compilation was attempted and its outcome is recorded separately below.
- Team name, full report author names, institution, member review, and submission remain pending. The GitHub repository has since been created and pushed.

## Report compilation outcome

The built-in LaTeX compiler timed out while downloading and initializing its TeX format dependencies. It did not produce a confirmed PDF compilation result. No report PDF or visual PDF QA is claimed. The complete IEEEtran source and two-pass build instructions are provided in `report/`; compile it with a ready TeX installation or import it into Overleaf before submission.

## Clean-checkout verification

A fresh local clone was created outside the workspace. Its own virtual environment and frontend dependencies were installed from the committed dependency files. Running its test suite produced **62 passed, 2 skipped**, and its production frontend build passed with Node 24.22.1. The check did not use the workspace's node_modules or virtual environment. The host's default npm path changed after an interruption, so the installed Node 24 bin directory was explicitly placed first in PATH for the final build.

## Circuit discoverability and schematic update

The Code generation navigation label is now Circuit, and a successful compilation opens it automatically. The netlist renderer uses AND/OR/XOR/NOT outlines, inversion bubbles for NAND/NOR/XNOR, orthogonal wires, and named input/output signals. COPY is drawn as wiring rather than a Boolean gate. Fit and actual-size views are available. Added an All gates example.

Browser verification confirmed all seven gate outputs at input vectors 00, 11, and 10, automatic opening of the generated circuit, and fit/actual-size switching. Restored the Introduction example afterward. Production TypeScript/build checks pass. No browser recording was created for this update.

## Final IEEE report

The earlier PDF compilation limitation is resolved. Tectonic 0.17.0 compiled the revised five-page IEEEtran report successfully. All five rendered pages were inspected; after adding Team ABC, the supplied member names, CS & AI, and Rishihood University, the affected title and contribution pages were checked again. There are no overfull-box warnings. One underfull paragraph spacing warning remains. The report includes methodology, phase contracts, worked source/IR/Verilog examples, a vector circuit diagram, truth table, error cases, results, honest assigned contributions, AI disclosure, and future scope. The PDF and editable source are included in docs/report/.

## Error examples, editor underlines, and frontend end-to-end pass

Added `examples/lexical-error.logic`, `syntax-error.logic`, and `cycle-error.logic` (also in the example menu). `test_examples` now asserts that each failing example is reported by the expected phase. The editor underlines the span of every diagnostic and clears the underline as soon as the text changes. An API request containing an unpaired surrogate now gets HTTP 422 instead of a server error.

Browser pass against the dev servers (all observed, not assumed):

- All 10 examples compile; success examples show seven complete phases, error examples stop at lexical, syntax, or semantic with later phases blocked, the correct diagnostic and line/column, and an underline on the exact offending text.
- Every phase's Output, Input, Explanation, and JSON tabs render. Full adder circuit toggling gives the correct sum and carry (1+1+0 and 1+1+1).
- A 12-input program yields 4,096 rows over 128 pages; Previous/Next work and the last row is correct.
- Optimize toggle marks results OUTDATED and recompiling shows 0 rewrites when disabled.
- Cmd+Enter compiles. A missing final semicolon (zero-width end-of-source span) underlines the last character. An error after an emoji comment underlines and selects the correct character (code-point to UTF-16 conversion).
- Editing after a failed compile clears the underline, disables the stale diagnostic, and shows OUTDATED.
- With the API stopped, the UI shows the "Could not reach the compiler API" message and recovers on the next compile once the API is back.
- At a 375 px viewport the page has no horizontal overflow.

## Phase-by-phase deep review (November 16, 2026)

- 3,000 randomly generated programs (up to 6 inputs, expression depth 6, forward references, constants, 1 to 3 outputs), each compiled with optimization on and off, matched an independent evaluator on every truth-table row. Every IR and optimized IR was also checked for single definition, define-before-use, correct arity, one definition per output, and that no dead instruction survives.
- 240 generated Verilog modules (120 programs, both modes) were compiled with `iverilog -Wall` and simulated against an exhaustive testbench; every output matched.
- All ten optimizer rules were triggered by a minimal program each, and the optimization example reduces 9 instructions to 2 with 8 recorded rewrites.
- Lexer, parser, and semantic boundaries were probed (nesting limits of 63/64 NOTs and 63/64 chained operators, 20 KB byte limit, 12/13 inputs, 200/201 signals, CRLF and lone CR, BOM in files, non-ASCII input).
- Fixes found by the review: undefined names are reported leftmost-first and dependencies are listed in source order; cycle messages show the path; limit errors are positioned; a lone carriage return advances the line; parser messages read `Expected ';'` instead of `Expected SEMI`; the CLI reports an unreadable file cleanly and accepts a UTF-8 BOM.
- Frontend downloads (Verilog, netlist JSON, circuit SVG, truth-table CSV) were captured in the browser and their contents checked against the displayed results.
