# Logic language specification

## Lexical rules

Identifiers match `[A-Za-z_][A-Za-z_0-9]*`. Keywords are uppercase and reserved. Names are case-sensitive. The only numeric literals are `0` and `1`. Whitespace and `//` comments through end of line are skipped. Tokens retain source offsets, line, and column. `EOF` is an explicit end marker. Invalid characters are lexical errors; `10` is two BIT tokens and is subsequently rejected by the parser where a single expression is required.

## Grammar (EBNF)

```text
program     = { declaration }, { assignment }, EOF ;
declaration = ( "INPUT" | "WIRE" | "OUTPUT" ), identifier,
              { ",", identifier }, ";" ;
assignment  = identifier, "=", expression, ";" ;
expression  = xor_expr, { ( "OR" | "NOR" ), xor_expr } ;
xor_expr    = and_expr, { ( "XOR" | "XNOR" ), and_expr } ;
and_expr    = unary, { ( "AND" | "NAND" ), unary } ;
unary       = "NOT", unary | "(", expression, ")" | identifier | "0" | "1" ;
```

Precedence is NOT, AND/NAND, XOR/XNOR, OR/NOR (highest first). Each binary tier is left-associative; `a NAND b NAND c` means `(a NAND b) NAND c`, which is not generally equivalent to `a NAND (b NAND c)`.

## Semantic rules

Declare at least one output. All declarations precede assignments. Names are unique across all declaration kinds. Inputs cannot be assigned. Every declared wire and output has exactly one assignment. Every referenced signal must be declared. A wire or output may depend on a later assignment: the dependency graph is topologically sorted. Any cycle, including a self-reference, is invalid. Unused inputs and wires are permitted; dead internal computation may be eliminated, but public ports stay present.

Example with forward reference:

```text
INPUT a;
WIRE inverted;
OUTPUT out;
out = inverted;
inverted = NOT a;
```

Invalid examples:

```text
INPUT a; OUTPUT out; out = a & 1;  // lexical: & is unsupported
OUTPUT out; out = (1;              // syntax: missing )
INPUT a; OUTPUT out; out = b;      // semantic: b is undefined
OUTPUT out; out = 1; out = 0;      // semantic: duplicate assignment
WIRE w; OUTPUT out; w = out; out = w; // semantic: cycle
```

## Resource limits and positions

20,480 UTF-8 bytes; 12 inputs; 200 declared signals; 64 levels of recursive syntax or AST height. The AST height rule also bounds long left-associated chains. Positions count Unicode code points in Python; identifiers themselves are ASCII. The frontend converts offsets to UTF-16 positions for CodeMirror. Empty/comment-only programs fail semantic analysis because no output is declared. A constant-only output is valid and has one truth-table row.

## Targets

Verilog consists of a `logic_circuit` module, input/output ports, internal wires, standard gate primitives, and continuous assignments for copies. All names are mapped to safe `sN` identifiers, with an explicit port map. Outputs and inputs precede internal wires in the name allocation. Simulation uses the structural netlist, without timing delays.
