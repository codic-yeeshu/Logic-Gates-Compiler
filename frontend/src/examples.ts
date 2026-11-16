export const examples: Record<string, string> = {
  "All gates": `INPUT a, b;\nOUTPUT and_out, nand_out, or_out, nor_out, xor_out, xnor_out, not_out;\nand_out = a AND b;\nnand_out = a NAND b;\nor_out = a OR b;\nnor_out = a NOR b;\nxor_out = a XOR b;\nxnor_out = a XNOR b;\nnot_out = NOT a;`,
  Introduction: `// Combine three inputs into one output\nINPUT a, b, c;\nWIRE intermediate;\nOUTPUT out;\n\nintermediate = a AND b;\nout = intermediate OR NOT c;`,
  "Full adder": `INPUT a, b, carry_in;\nWIRE partial;\nOUTPUT sum, carry_out;\n\npartial = a XOR b;\nsum = partial XOR carry_in;\ncarry_out = (a AND b) OR (partial AND carry_in);`,
  "Half adder": `INPUT a, b;\nOUTPUT sum, carry;\nsum = a XOR b;\ncarry = a AND b;`,
  Multiplexer: `// select = 0 passes a through; select = 1 passes b through\nINPUT a, b, select;\nOUTPUT out;\nout = (a AND NOT select) OR (b AND select);`,
  Optimization: `INPUT a, b;\nWIRE first, second, unused;\nOUTPUT out;\nfirst = a AND b;\nsecond = b AND a;\nunused = a OR b;\nout = (first OR second) AND 1;`,
  "Error: lexical": `// Lexical error: & is not a valid token\nINPUT a, b;\nOUTPUT out;\nout = a & b;`,
  "Error: syntax": `// Syntax error: the closing parenthesis is missing\nINPUT a, b;\nOUTPUT out;\nout = (a AND b;`,
  "Error: cycle": `// Semantic error: out and w depend on each other\nWIRE w;\nOUTPUT out;\nw = out;\nout = w;`,
  "Find the error": `INPUT a;\nOUTPUT out;\nout = a AND missing;`,
};
