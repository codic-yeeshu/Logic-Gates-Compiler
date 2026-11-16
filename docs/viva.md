# Viva preparation

## Shared questions every member must answer

**Why is this a compiler rather than only a calculator?** It translates a declared source language into a distinct executable hardware description (Verilog) through lexical, syntax, semantic, IR, optimization, and code-generation phases. Netlist simulation validates the result.

**Tokens versus AST?** Tokens describe the lexical sequence and positions. The AST describes grammatical structure and precedence, omitting punctuation that no longer affects meaning.

**Syntax versus semantic errors?** `out = AND a;` is grammatically invalid. `out = a AND missing;` is grammatical but refers to an undeclared signal.

**Why IR?** It separates language parsing from optimization and target generation. Each instruction has one destination and a small number of operands.

**What proves optimization is correct?** Exhaustive enumeration of inputs for bounded generated programs compares an independent AST evaluator against original IR, optimized IR, and netlist outputs. This is empirical verification over the tested set, not a mathematical proof for all programs.

**Why topological sorting?** Forward references are allowed, but a signal must be evaluated after its dependencies. DFS detects cycles with an active recursion set and produces dependency-first order.

**Why preserve unused inputs?** They are declared public ports. Removing internal computation is different from changing a module's interface.

**Is the diagram target code?** The netlist is a structural target representation. Verilog is the textual hardware-description target; the diagram is its interactive visualization.

**What is the time complexity?** Lexing is linear in source length. Parsing is approximately linear in token count. Semantic dependency traversal is O(V+E). Local optimization scans IR with dictionary lookup, though alias-chain resolution can add work. Truth-table evaluation is O(2^n × instructions), motivating the 12-input cap.

**What does AI do at runtime?** Nothing. AI assisted development; the shipped compiler is ordinary deterministic Python.

## Five-minute demo

1. Compile Introduction; explain each phase's input and output.
2. Open AST and show OR above NOT c; explain precedence.
3. Show symbols and dependency ordering.
4. Compare original and optimized IR; explain copy propagation.
5. Toggle circuit inputs and compare the truth table.
6. Download Verilog and identify ports, wires, gates, and assignments.
7. Compile Optimization to show common-expression sharing and dead code.
8. Compile Error: lexical, Error: syntax, and Error: cycle (or Find the error). Each stops at a different phase; point at the underlined span and explain why later phases are blocked.

## Member preparation

Each owner should run their phase's tests, trace a normal case and an error case, explain one implementation tradeoff, and honestly describe what they reviewed or changed. The code-generation owner should explain name mangling, gate primitives, COPY-to-assign lowering, output preservation, and netlist simulation. These are core compiler contributions.

## Limits to acknowledge

No sequential logic, global Boolean minimization, timing analysis, or multi-error parser recovery. AST visualization is provided rather than a full concrete parse tree. The current resource limits keep evaluation and display bounded. Do not claim external Verilog or PDF checks were performed unless verification.md records them.
