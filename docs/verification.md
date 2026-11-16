# Verification record

Executed by the AI coding assistant on November 16, 2026. These checks are not represented as individual student work.

## Automated checks

- `.venv/bin/python -m pytest -q`: **62 passed, 2 skipped**.
- Skips: external Verilog simulator tests with optimization enabled/disabled, because `iverilog` and `vvp` are not installed.
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

- External Verilog simulation remains unverified until Icarus Verilog is installed and the two tests pass.
- SVG, JSON, and CSV export controls are implemented; their individual downloaded files were not inspected in this browser pass.
- Keyboard shortcut, resize interaction, pagination beyond 32 rows, and network failure display are implemented but not individually exercised in this browser pass.
- The report uses IEEEtran. Local command-line LaTeX is unavailable; built-in compilation was attempted and its outcome is recorded separately below.
- Team name, full report author names, institution, member review, remote repository, and submission remain pending.

## Report compilation outcome

The built-in LaTeX compiler timed out while downloading and initializing its TeX format dependencies. It did not produce a confirmed PDF compilation result. No report PDF or visual PDF QA is claimed. The complete IEEEtran source and two-pass build instructions are provided in `report/`; compile it with a ready TeX installation or import it into Overleaf before submission.
