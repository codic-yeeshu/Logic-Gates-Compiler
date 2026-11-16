# End-to-end walkthrough

Run `examples/intro.logic`. The source declares a, b, c as inputs, intermediate as a wire, and out as an output.

## 1. Lexical analysis

`intermediate = a AND b;` becomes IDENT, EQUAL, IDENT, AND, IDENT, SEMI, each with the original lexeme and location. Comments and whitespace do not become tokens. EOF terminates the stream.

## 2. Syntax analysis

The first assignment contains an AND node with reference children a and b. The output assignment contains an OR node whose left child references intermediate and whose right child is a NOT node referencing c. Parentheses influence grouping without requiring a separate AST node.

## 3. Semantic analysis

The symbol table contains five declarations. Dependencies are `intermediate → [a,b]` and `out → [intermediate,c]`. The topological assignment order is intermediate, out. All references exist, all non-inputs are assigned once, and there is no cycle.

## 4. IR

```text
%0 ← AND a, b
intermediate ← COPY %0
%2 ← NOT c
%3 ← OR intermediate, %2
out ← COPY %3
```

Temporary numbering uses instruction count, so gaps are expected. It is not a count of source variables.

## 5. Optimization

Propagate the intermediate copy, retaining `%0`, `%2`, `%3`, and the public output copy. The OR now reads `%0` directly. The output name must survive because it is part of the public circuit interface. The optimized IR contains four instructions rather than five. This does not mean the design has four physical Boolean gates: COPY is wiring/buffering in the visualization and a continuous assignment in Verilog.

## 6. Code generation

Inputs a,b,c map to s0,s1,s2 and output out to s3. The generator emits AND, NOT, and OR primitives plus an output assignment. The gate netlist retains source names and spans for visualization. Verilog names are mapped so a source signal named `module` cannot break Verilog syntax.

## 7. Simulation

The simulator enumerates 000,001,010,011,100,101,110,111 in declaration order. Output values are 1,0,1,0,1,0,1,1. With c=0, NOT c makes the output 1. With c=1, the output is a AND b.

## How to demonstrate a failure

Replace c with missing. Lexical and syntax analysis still complete; semantic analysis reports UNDEFINED_SIGNAL at the reference. IR and all later phases remain blocked. Click the diagnostic to select the reference, correct it, and compile again. Editing marks existing output stale instead of pretending it represents the new source.
